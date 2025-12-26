import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("VITE_FIREBASE_API_KEY");
    const authDomain = Deno.env.get("VITE_FIREBASE_AUTH_DOMAIN");
    const projectId = Deno.env.get("VITE_FIREBASE_PROJECT_ID");
    const storageBucket = Deno.env.get("VITE_FIREBASE_STORAGE_BUCKET");
    const messagingSenderId = Deno.env.get("VITE_FIREBASE_MESSAGING_SENDER_ID");
    const appId = Deno.env.get("VITE_FIREBASE_APP_ID");

    if (!apiKey || !authDomain || !projectId || !storageBucket || !messagingSenderId || !appId) {
      return new Response(
        JSON.stringify({
          error:
            "Firebase config is not fully configured. Please ensure all VITE_FIREBASE_* secrets are set.",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        apiKey,
        authDomain,
        projectId,
        storageBucket,
        messagingSenderId,
        appId,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
