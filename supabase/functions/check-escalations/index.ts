import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Escalation rules based on priority and time
const ESCALATION_RULES = {
  critical: { level1Hours: 4, level2Hours: 8, level3Hours: 12 },
  high: { level1Hours: 12, level2Hours: 24, level3Hours: 48 },
  medium: { level1Hours: 24, level2Hours: 48, level3Hours: 72 },
  low: { level1Hours: 48, level2Hours: 96, level3Hours: 168 },
};

const DEPARTMENTS = {
  0: 'sanitation',
  1: 'sanitation_supervisor',
  2: 'health_department',
  3: 'municipal_commissioner',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Checking for complaints that need escalation...');

    // Get all unresolved complaints
    const { data: complaints, error } = await supabase
      .from('complaints')
      .select('*')
      .neq('complaint_status', 'resolved')
      .lt('escalation_level', 3);

    if (error) {
      console.error('Error fetching complaints:', error);
      throw error;
    }

    console.log(`Found ${complaints?.length || 0} unresolved complaints to check`);

    const now = new Date();
    const escalatedComplaints: string[] = [];

    for (const complaint of complaints || []) {
      const createdAt = new Date(complaint.created_at);
      const hoursElapsed = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
      
      const priority = complaint.priority as keyof typeof ESCALATION_RULES;
      const rules = ESCALATION_RULES[priority] || ESCALATION_RULES.medium;
      
      let newLevel = complaint.escalation_level || 0;
      
      // Check escalation thresholds
      if (hoursElapsed >= rules.level3Hours && newLevel < 3) {
        newLevel = 3;
      } else if (hoursElapsed >= rules.level2Hours && newLevel < 2) {
        newLevel = 2;
      } else if (hoursElapsed >= rules.level1Hours && newLevel < 1) {
        newLevel = 1;
      }

      // Update if escalation needed
      if (newLevel > (complaint.escalation_level || 0)) {
        const { error: updateError } = await supabase
          .from('complaints')
          .update({
            escalation_level: newLevel,
            escalated_at: now.toISOString(),
            assigned_department: DEPARTMENTS[newLevel as keyof typeof DEPARTMENTS],
            complaint_status: 'escalated',
          })
          .eq('id', complaint.id);

        if (updateError) {
          console.error(`Error escalating complaint ${complaint.complaint_id}:`, updateError);
        } else {
          console.log(`Escalated ${complaint.complaint_id} to level ${newLevel}`);
          escalatedComplaints.push(complaint.complaint_id);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        checked: complaints?.length || 0,
        escalated: escalatedComplaints.length,
        escalatedComplaints,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Escalation check error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Escalation check failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});