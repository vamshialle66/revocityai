import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { firebaseUid, email, displayName } = await req.json();

    if (!firebaseUid) {
      return new Response(
        JSON.stringify({ error: "Firebase UID required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Check if user exists
    const { data: existing } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("firebase_uid", firebaseUid)
      .maybeSingle();

    if (existing) {
      // Update last login
      const { error } = await supabaseAdmin
        .from("users")
        .update({ 
          last_login: new Date().toISOString(),
          email: email || undefined,
          display_name: displayName || undefined
        })
        .eq("firebase_uid", firebaseUid);

      if (error) {
        console.error("Error updating user:", error);
      } else {
        console.log(`Updated last_login for user ${firebaseUid}`);
      }
    } else {
      // Insert new user
      const { error: userError } = await supabaseAdmin
        .from("users")
        .insert({
          firebase_uid: firebaseUid,
          email: email || null,
          display_name: displayName || null,
          last_login: new Date().toISOString(),
        });

      if (userError) {
        console.error("Error inserting user:", userError);
      } else {
        console.log(`Registered new user ${firebaseUid} (${email})`);
        
        // Auto-assign default "user" role
        const { error: roleError } = await supabaseAdmin
          .from("user_roles")
          .insert({
            user_id: firebaseUid,
            role: "user",
          });
        
        if (roleError) {
          console.error("Error assigning default role:", roleError);
        } else {
          console.log(`Assigned default 'user' role to ${firebaseUid}`);
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("Register user error:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
