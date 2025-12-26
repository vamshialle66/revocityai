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
    const { imageBase64 } = await req.json();

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

    console.log('Validating image authenticity...');

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
            content: `You are an AI image authenticity validator for a municipal waste management system. Your job is to detect fake, irrelevant, or spam images submitted as garbage bin complaints.

Analyze the image and determine:
1. Is this a genuine photo of a garbage bin or waste area?
2. Are there signs of image manipulation or AI generation?
3. Is the image relevant to waste management complaints?
4. Is this a real outdoor/indoor photo or stock/internet image?
5. Any signs of spam or abuse?

Respond ONLY with a valid JSON object in this exact format:
{
  "is_valid": true/false,
  "is_garbage_bin_related": true/false,
  "authenticity_score": 0-100,
  "manipulation_detected": true/false,
  "is_stock_image": true/false,
  "is_ai_generated": true/false,
  "content_type": "garbage_bin" | "waste_area" | "irrelevant" | "spam" | "unclear",
  "trust_impact": -10 to +10,
  "flags": ["list of any concerns"],
  "confidence": 0-100,
  "reason": "Brief explanation of validation result"
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
                text: 'Validate if this is a genuine garbage bin complaint image. Check for authenticity, relevance, and any signs of manipulation or spam.'
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
      // Default to valid to avoid blocking genuine reports
      result = {
        is_valid: true,
        is_garbage_bin_related: true,
        authenticity_score: 70,
        manipulation_detected: false,
        is_stock_image: false,
        is_ai_generated: false,
        content_type: 'unclear',
        trust_impact: 0,
        flags: ['Could not fully validate'],
        confidence: 50,
        reason: 'Unable to fully analyze, defaulting to accept'
      };
    }

    console.log('Image validation result:', result);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Validation error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Validation failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});