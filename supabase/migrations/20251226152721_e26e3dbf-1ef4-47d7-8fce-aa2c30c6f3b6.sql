-- Add health risk columns to complaints table
ALTER TABLE public.complaints 
ADD COLUMN IF NOT EXISTS mosquito_risk text DEFAULT 'low',
ADD COLUMN IF NOT EXISTS odor_risk text DEFAULT 'low',
ADD COLUMN IF NOT EXISTS disease_risk text DEFAULT 'low',
ADD COLUMN IF NOT EXISTS public_hygiene_impact text DEFAULT 'low',
ADD COLUMN IF NOT EXISTS is_high_risk_area boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS overflow_frequency integer DEFAULT 0;

-- Create user_rewards table for citizen gamification
CREATE TABLE public.user_rewards (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  firebase_uid text NOT NULL,
  points integer NOT NULL DEFAULT 0,
  badges text[] DEFAULT '{}',
  total_reports integer DEFAULT 0,
  valid_critical_reports integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(firebase_uid)
);

-- Enable RLS
ALTER TABLE public.user_rewards ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_rewards
CREATE POLICY "Users can view all rewards for leaderboard"
ON public.user_rewards FOR SELECT
USING (true);

CREATE POLICY "Service role can insert rewards"
ON public.user_rewards FOR INSERT
WITH CHECK (true);

CREATE POLICY "Service role can update rewards"
ON public.user_rewards FOR UPDATE
USING (true);

-- Create area_statistics table for tracking repeat problems
CREATE TABLE public.area_statistics (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  area_name text NOT NULL,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  total_complaints integer DEFAULT 0,
  overflow_count integer DEFAULT 0,
  avg_fill_level integer DEFAULT 0,
  risk_level text DEFAULT 'low',
  last_complaint_at timestamp with time zone,
  predicted_next_overflow timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(area_name)
);

-- Enable RLS
ALTER TABLE public.area_statistics ENABLE ROW LEVEL SECURITY;

-- RLS policies for area_statistics
CREATE POLICY "Anyone can view area statistics"
ON public.area_statistics FOR SELECT
USING (true);

CREATE POLICY "Service role can manage area statistics"
ON public.area_statistics FOR ALL
USING (true);

-- Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_rewards;
ALTER PUBLICATION supabase_realtime ADD TABLE public.area_statistics;