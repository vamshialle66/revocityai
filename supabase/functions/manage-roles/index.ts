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
    const { action, adminFirebaseUid, targetUserId, role } = await req.json();

    if (!adminFirebaseUid) {
      return new Response(
        JSON.stringify({ error: "Admin ID required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Verify caller is admin
    const { data: adminCheck } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", adminFirebaseUid)
      .eq("role", "admin")
      .maybeSingle();

    if (!adminCheck) {
      console.log(`Unauthorized: ${adminFirebaseUid} is not an admin`);
      return new Response(
        JSON.stringify({ error: "Unauthorized - admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Handle different actions
    switch (action) {
      case "list": {
        // Fetch all users with their roles (LEFT JOIN)
        const { data: users, error: usersError } = await supabaseAdmin
          .from("users")
          .select("*")
          .order("last_login", { ascending: false });

        if (usersError) throw usersError;

        const { data: roles, error: rolesError } = await supabaseAdmin
          .from("user_roles")
          .select("*");

        if (rolesError) throw rolesError;

        // Merge users with their roles
        const usersWithRoles = (users || []).map(user => {
          const userRole = roles?.find(r => r.user_id === user.firebase_uid);
          return {
            ...user,
            role: userRole?.role || null,
            role_id: userRole?.id || null,
            role_created_at: userRole?.created_at || null,
          };
        });

        console.log(`Listed ${usersWithRoles.length} users`);
        return new Response(
          JSON.stringify({ users: usersWithRoles }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "add": {
        if (!targetUserId || !role) {
          return new Response(
            JSON.stringify({ error: "User ID and role required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Check if user already has a role
        const { data: existing } = await supabaseAdmin
          .from("user_roles")
          .select("id")
          .eq("user_id", targetUserId)
          .maybeSingle();

        if (existing) {
          // Update existing role
          const { error } = await supabaseAdmin
            .from("user_roles")
            .update({ role })
            .eq("user_id", targetUserId);

          if (error) throw error;
          console.log(`Updated role for ${targetUserId} to ${role}`);
        } else {
          // Insert new role
          const { error } = await supabaseAdmin
            .from("user_roles")
            .insert({ user_id: targetUserId, role });

          if (error) throw error;
          console.log(`Added role ${role} for ${targetUserId}`);
        }

        return new Response(
          JSON.stringify({ success: true, message: `Role ${role} assigned` }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "remove": {
        if (!targetUserId) {
          return new Response(
            JSON.stringify({ error: "User ID required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Prevent removing own admin role
        if (targetUserId === adminFirebaseUid) {
          return new Response(
            JSON.stringify({ error: "Cannot remove your own admin role" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { error } = await supabaseAdmin
          .from("user_roles")
          .delete()
          .eq("user_id", targetUserId);

        if (error) throw error;
        console.log(`Removed role for ${targetUserId}`);

        return new Response(
          JSON.stringify({ success: true, message: "Role removed" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: "Invalid action" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("Manage roles error:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
