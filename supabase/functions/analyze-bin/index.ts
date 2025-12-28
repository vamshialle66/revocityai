import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64, userFirebaseUid } = await req.json();
    
    if (!imageBase64) {
      throw new Error('No image provided');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Ensure the image has proper data URI prefix
    let formattedImage = imageBase64;
    if (!imageBase64.startsWith('data:')) {
      // Detect image type from base64 header
      let mimeType = 'image/jpeg';
      if (imageBase64.startsWith('/9j/')) {
        mimeType = 'image/jpeg';
      } else if (imageBase64.startsWith('iVBOR')) {
        mimeType = 'image/png';
      } else if (imageBase64.startsWith('R0lGOD')) {
        mimeType = 'image/gif';
      } else if (imageBase64.startsWith('UklGR')) {
        mimeType = 'image/webp';
      }
      formattedImage = `data:${mimeType};base64,${imageBase64}`;
    }

    console.log('Analyzing bin image with Google Gemini...');

    // Call Lovable AI Gateway with Google Gemini for image analysis
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are an expert AI waste management, public health, and environmental safety analyst. Analyze images of garbage bins and provide a comprehensive assessment.

You must respond with ONLY valid JSON in this exact format (no markdown, no code blocks):
{
  "bin_status": {
    "status": "empty" | "partial" | "full" | "overflowing" | "hazardous",
    "fill_percentage": <number 0-100>,
    "condition_clarity": "clear" | "partially_visible" | "low_confidence"
  },
  "hygiene_assessment": {
    "odor_risk": "low" | "medium" | "high",
    "pest_risk": "none" | "low" | "medium" | "high",
    "public_health_threat": "low" | "medium" | "severe",
    "surrounding_cleanliness": "clean" | "litter_present" | "dirty"
  },
  "environmental_impact": {
    "pollution_chance": "low" | "medium" | "high",
    "litter_spread_risk": "low" | "medium" | "high",
    "impact_level": "minor" | "concerning" | "dangerous"
  },
  "priority_urgency": {
    "priority_level": "low" | "medium" | "high" | "critical",
    "urgency_hours": <number>,
    "urgency_message": "<e.g., 'Should be cleaned within 12 hours'>"
  },
  "suggested_actions": ["<action1>", "<action2>"],
  "confidence": {
    "score": <number 0-100>,
    "quality_note": "<note about image quality if low confidence>"
  },
  "smart_insights": ["<insight1>", "<insight2>"],
  "recommendation": "<primary actionable recommendation>",
  "details": "<brief visual description>"
}

ASSESSMENT GUIDELINES:

Bin Status:
- empty: 0-25% full
- partial: 26-50% full
- full: 51-90% full
- overflowing: 90%+ or garbage spilling out
- hazardous: contains dangerous/medical/chemical waste

Hygiene Assessment:
- Odor Risk: Based on organic waste, decay signs, open containers
- Pest Risk: Consider exposed food, stagnant water, organic matter
- Public Health Threat: Evaluate disease vectors, contamination potential
- Surrounding Area: Check for scattered litter, spillage

Environmental Impact:
- Pollution Chance: Liquid waste, chemical containers, runoff potential
- Litter Spread: Wind exposure, unsecured waste, overflow
- Impact Level: Combined environmental threat assessment

Priority & Urgency:
- Critical: Immediate action (0-2 hours) - hazardous, severe health risk
- High: Same day action (2-12 hours) - overflowing, health concerns
- Medium: Next day (12-48 hours) - nearly full, minor issues
- Low: Scheduled pickup okay (48+ hours) - normal operation

Suggested Actions (pick applicable):
- "No action needed"
- "Schedule regular pickup"
- "Priority pickup required"
- "Immediate cleanup required"
- "Needs disinfection"
- "Needs lid repair"
- "Container replacement recommended"
- "Area cleanup needed"
- "Pest control advised"

Smart Insights (if applicable):
- Frequency patterns
- Infrastructure needs
- Area-specific recommendations
- Prevention suggestions

Be accurate, professional, and provide actionable intelligence.`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this garbage bin image comprehensively. Provide complete health, safety, environmental, and operational assessment."
              },
              {
                type: "image_url",
                image_url: {
                  url: formattedImage
                }
              }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Usage limit reached. Please add credits.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`AI analysis failed: ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    console.log('Raw AI response:', content);

    // Parse the JSON response from Gemini
    let analysisResult;
    try {
      // Clean up the response if it has markdown code blocks
      let cleanContent = content.trim();
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.slice(7);
      }
      if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.slice(3);
      }
      if (cleanContent.endsWith('```')) {
        cleanContent = cleanContent.slice(0, -3);
      }
      
      analysisResult = JSON.parse(cleanContent.trim());
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      // Fallback response
      analysisResult = {
        status: "half-filled",
        percentage: 50,
        recommendation: "Unable to fully analyze the image. Please try again with a clearer image.",
        details: content
      };
    }

    console.log('Analysis result:', analysisResult);

    // Save scan to database using service role (bypasses RLS)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Determine status and data from analysis result
    const statusMap: Record<string, string> = {
      'empty': 'empty',
      'partial': 'half-filled',
      'full': 'overflowing',
      'overflowing': 'overflowing',
      'hazardous': 'overflowing',
      'half-filled': 'half-filled'
    };

    const binStatus = analysisResult.bin_status?.status || analysisResult.status || 'half-filled';
    const firestoreStatus = statusMap[binStatus] || 'half-filled';
    const fillLevel = analysisResult.bin_status?.fill_percentage || analysisResult.percentage || 50;
    const recommendation = analysisResult.recommendation || analysisResult.suggested_actions?.[0] || '';
    const confidence = analysisResult.confidence?.score || analysisResult.ai_confidence || 80;
    const hygieneRisk = analysisResult.hygiene_assessment?.public_health_threat || 'low';
    const odorRisk = analysisResult.hygiene_assessment?.odor_risk || 'low';
    const diseaseRisk = analysisResult.hygiene_assessment?.pest_risk || 'low';
    const mosquitoRisk = analysisResult.hygiene_assessment?.pest_risk || 'low';

    const { error: insertError } = await supabaseAdmin.from('scan_history').insert({
      user_firebase_uid: userFirebaseUid,
      fill_level: fillLevel,
      status: firestoreStatus,
      recommendation: recommendation,
      ai_confidence: confidence,
      hygiene_risk: hygieneRisk,
      odor_risk: odorRisk,
      disease_risk: diseaseRisk,
      mosquito_risk: mosquitoRisk,
    });

    if (insertError) {
      console.error('Failed to save scan history:', insertError);
    } else {
      console.log('Scan history saved for user:', userFirebaseUid);
    }

    return new Response(JSON.stringify(analysisResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-bin function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
