import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64, complaintId } = await req.json();

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: 'No image provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Clean up base64 data
    const base64Data = imageBase64.includes('base64,') 
      ? imageBase64.split('base64,')[1] 
      : imageBase64;

    console.log(`Verifying cleanup for complaint ${complaintId}...`);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are an AI cleanup verification expert for municipal waste management. Your job is to verify if a garbage bin area has been properly cleaned.

Analyze the uploaded "after cleanup" image and determine:
1. Is the bin area visibly clean?
2. Is the surrounding area free of litter?
3. Is there any evidence of remaining waste or spillage?
4. Does this look like a genuine cleanup vs a fake/staged photo?

Respond ONLY with a valid JSON object in this exact format:
{
  "verified": true/false,
  "cleanliness_score": 0-100,
  "bin_status": "clean" | "partially_clean" | "still_dirty",
  "surrounding_cleanliness": "clean" | "needs_attention" | "dirty",
  "issues_found": ["list of any issues"],
  "confidence": 0-100,
  "recommendation": "approve" | "reject" | "needs_reinspection",
  "rejection_reason": "reason if rejected, empty if approved",
  "summary": "Brief verification summary"
}`
          },
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${base64Data}`
                }
              },
              {
                type: 'text',
                text: 'Please verify if this cleanup image shows a properly cleaned bin area. Check for genuine cleanliness and any signs of fake/staged photos.'
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
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No response from AI');
    }

    // Parse JSON response
    let result;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Parse error:', parseError);
      // Fallback result
      result = {
        verified: false,
        cleanliness_score: 50,
        bin_status: 'partially_clean',
        surrounding_cleanliness: 'needs_attention',
        issues_found: ['Could not fully analyze image'],
        confidence: 50,
        recommendation: 'needs_reinspection',
        rejection_reason: 'Unable to fully verify cleanup',
        summary: 'Manual inspection recommended'
      };
    }

    console.log('Cleanup verification result:', result);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Verification error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Verification failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});