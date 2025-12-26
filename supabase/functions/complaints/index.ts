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
    const { action, ...params } = await req.json();

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    switch (action) {
      case "submit": {
        const {
          firebaseUid,
          email,
          latitude,
          longitude,
          address,
          areaName,
          imageUrl,
          status,
          fillLevel,
          priority,
          hygieneRisk,
          recommendations,
          confidence,
          healthRisks,
          reporterNotes,
        } = params;

        if (!firebaseUid || !latitude || !longitude) {
          return new Response(
            JSON.stringify({ error: "Missing required fields" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Insert the complaint with health risk data
        const { data, error } = await supabaseAdmin
          .from("complaints")
          .insert({
            reporter_firebase_uid: firebaseUid,
            reporter_email: email,
            latitude,
            longitude,
            address,
            area_name: areaName,
            image_url: imageUrl,
            status: status || "overflowing",
            fill_level: fillLevel || 0,
            priority: priority || "medium",
            hygiene_risk: hygieneRisk || "medium",
            ai_recommendations: recommendations || [],
            ai_confidence: confidence || 0,
            mosquito_risk: healthRisks?.mosquito_risk || "low",
            odor_risk: healthRisks?.odor_risk || "low",
            disease_risk: healthRisks?.disease_risk || "low",
            public_hygiene_impact: healthRisks?.public_hygiene_impact || "low",
            reporter_notes: reporterNotes || null,
          })
          .select()
          .single();

        if (error) throw error;

        // Award points to citizen for reporting
        const points = priority === "critical" ? 50 : priority === "high" ? 30 : 10;
        const isValidCritical = priority === "critical" || priority === "high";
        
        // Upsert user rewards
        const { data: existingReward } = await supabaseAdmin
          .from("user_rewards")
          .select("*")
          .eq("firebase_uid", firebaseUid)
          .maybeSingle();

        if (existingReward) {
          const newPoints = existingReward.points + points;
          const newTotalReports = existingReward.total_reports + 1;
          const newValidCritical = existingReward.valid_critical_reports + (isValidCritical ? 1 : 0);
          
          // Calculate badges
          const badges = [...(existingReward.badges || [])];
          if (newTotalReports >= 1 && !badges.includes("First Reporter")) badges.push("First Reporter");
          if (newTotalReports >= 10 && !badges.includes("Active Citizen")) badges.push("Active Citizen");
          if (newTotalReports >= 25 && !badges.includes("City Guardian")) badges.push("City Guardian");
          if (newValidCritical >= 5 && !badges.includes("Clean Hero")) badges.push("Clean Hero");
          if (newPoints >= 500 && !badges.includes("Eco Champion")) badges.push("Eco Champion");

          await supabaseAdmin
            .from("user_rewards")
            .update({
              points: newPoints,
              total_reports: newTotalReports,
              valid_critical_reports: newValidCritical,
              badges,
              updated_at: new Date().toISOString(),
            })
            .eq("firebase_uid", firebaseUid);
        } else {
          const badges = ["First Reporter"];
          await supabaseAdmin
            .from("user_rewards")
            .insert({
              firebase_uid: firebaseUid,
              points,
              total_reports: 1,
              valid_critical_reports: isValidCritical ? 1 : 0,
              badges,
            });
        }

        // Update area statistics for repeat problem detection
        const areaKey = areaName || `${latitude.toFixed(3)},${longitude.toFixed(3)}`;
        const isOverflow = fillLevel >= 75;

        const { data: existingArea } = await supabaseAdmin
          .from("area_statistics")
          .select("*")
          .eq("area_name", areaKey)
          .maybeSingle();

        if (existingArea) {
          const newOverflowCount = existingArea.overflow_count + (isOverflow ? 1 : 0);
          const newTotalComplaints = existingArea.total_complaints + 1;
          const newAvgFill = Math.round(
            (existingArea.avg_fill_level * existingArea.total_complaints + fillLevel) / newTotalComplaints
          );
          
          // Determine risk level based on patterns
          let riskLevel = "low";
          if (newOverflowCount >= 10) riskLevel = "critical";
          else if (newOverflowCount >= 5) riskLevel = "high";
          else if (newOverflowCount >= 3) riskLevel = "medium";

          // Simple prediction: if overflow happens frequently, predict next one
          const predictedNext = newOverflowCount >= 3 
            ? new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days
            : null;

          await supabaseAdmin
            .from("area_statistics")
            .update({
              total_complaints: newTotalComplaints,
              overflow_count: newOverflowCount,
              avg_fill_level: newAvgFill,
              risk_level: riskLevel,
              last_complaint_at: new Date().toISOString(),
              predicted_next_overflow: predictedNext,
              updated_at: new Date().toISOString(),
            })
            .eq("area_name", areaKey);

          // Mark complaint as high risk area if applicable
          if (riskLevel === "high" || riskLevel === "critical") {
            await supabaseAdmin
              .from("complaints")
              .update({ is_high_risk_area: true, overflow_frequency: newOverflowCount })
              .eq("id", data.id);
          }
        } else {
          await supabaseAdmin
            .from("area_statistics")
            .insert({
              area_name: areaKey,
              latitude,
              longitude,
              total_complaints: 1,
              overflow_count: isOverflow ? 1 : 0,
              avg_fill_level: fillLevel,
              risk_level: "low",
              last_complaint_at: new Date().toISOString(),
            });
        }

        console.log(`New complaint submitted: ${data.complaint_id}, awarded ${points} points`);
        return new Response(
          JSON.stringify({ success: true, complaint: data, pointsAwarded: points }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "list": {
        const { status: filterStatus, priority: filterPriority, limit = 100 } = params;

        let query = supabaseAdmin
          .from("complaints")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(limit);

        if (filterStatus) {
          query = query.eq("complaint_status", filterStatus);
        }
        if (filterPriority) {
          query = query.eq("priority", filterPriority);
        }

        const { data, error } = await query;
        if (error) throw error;

        return new Response(
          JSON.stringify({ complaints: data || [] }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "update": {
        const { complaintId, adminFirebaseUid, updates } = params;

        if (!complaintId || !adminFirebaseUid) {
          return new Response(
            JSON.stringify({ error: "Missing complaint ID or admin ID" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Verify admin
        const { data: adminCheck } = await supabaseAdmin
          .from("user_roles")
          .select("role")
          .eq("user_id", adminFirebaseUid)
          .eq("role", "admin")
          .maybeSingle();

        if (!adminCheck) {
          return new Response(
            JSON.stringify({ error: "Unauthorized - admin access required" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const updateData: Record<string, unknown> = {
          updated_at: new Date().toISOString(),
        };

        if (updates.complaintStatus) updateData.complaint_status = updates.complaintStatus;
        if (updates.assignedTo !== undefined) updateData.assigned_to = updates.assignedTo;
        if (updates.adminNotes !== undefined) updateData.admin_notes = updates.adminNotes;
        if (updates.complaintStatus === "resolved") {
          updateData.resolved_at = new Date().toISOString();
        }
        if (updates.cleanupImageUrl) updateData.cleanup_image_url = updates.cleanupImageUrl;
        if (updates.cleanupVerified !== undefined) updateData.cleanup_verified = updates.cleanupVerified;

        const { data, error } = await supabaseAdmin
          .from("complaints")
          .update(updateData)
          .eq("id", complaintId)
          .select()
          .single();

        if (error) throw error;

        console.log(`Complaint ${data.complaint_id} updated by admin ${adminFirebaseUid}`);
        return new Response(
          JSON.stringify({ success: true, complaint: data }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "stats": {
        const { data: complaints, error } = await supabaseAdmin
          .from("complaints")
          .select("complaint_status, priority, area_name, created_at, resolved_at");

        if (error) throw error;

        const stats = {
          total: complaints?.length || 0,
          pending: complaints?.filter((c) => c.complaint_status === "pending").length || 0,
          inProgress: complaints?.filter((c) => c.complaint_status === "in_progress").length || 0,
          resolved: complaints?.filter((c) => c.complaint_status === "resolved").length || 0,
          critical: complaints?.filter((c) => c.priority === "critical").length || 0,
          high: complaints?.filter((c) => c.priority === "high").length || 0,
          medium: complaints?.filter((c) => c.priority === "medium").length || 0,
          low: complaints?.filter((c) => c.priority === "low").length || 0,
          areaStats: {} as Record<string, number>,
        };

        // Count by area
        complaints?.forEach((c) => {
          if (c.area_name) {
            stats.areaStats[c.area_name] = (stats.areaStats[c.area_name] || 0) + 1;
          }
        });

        return new Response(
          JSON.stringify({ stats }),
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
    console.error("Complaints error:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
