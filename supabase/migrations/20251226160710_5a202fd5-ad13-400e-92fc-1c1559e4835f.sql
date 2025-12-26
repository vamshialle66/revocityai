-- Add escalation and department tracking to complaints
ALTER TABLE public.complaints 
ADD COLUMN IF NOT EXISTS escalation_level INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS escalated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS assigned_department TEXT DEFAULT 'sanitation',
ADD COLUMN IF NOT EXISTS sla_hours INTEGER DEFAULT 24;

-- Add citizen trust fields to user_rewards
ALTER TABLE public.user_rewards
ADD COLUMN IF NOT EXISTS trust_score INTEGER DEFAULT 50,
ADD COLUMN IF NOT EXISTS flagged_reports INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS verified_contributor BOOLEAN DEFAULT false;

-- Create escalation levels type comment for reference
COMMENT ON COLUMN public.complaints.escalation_level IS '0=Normal, 1=Escalated to Supervisor, 2=Escalated to Department Head, 3=Escalated to Commissioner';

-- Create departments enum for reference
COMMENT ON COLUMN public.complaints.assigned_department IS 'sanitation, health, environment, municipal_commissioner';