-- Create scan_history table for storing bin analyses that were NOT reported as complaints
CREATE TABLE public.scan_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_firebase_uid TEXT NOT NULL,
  fill_level INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'empty',
  recommendation TEXT,
  ai_confidence INTEGER DEFAULT 0,
  image_url TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  address TEXT,
  area_name TEXT,
  hygiene_risk TEXT DEFAULT 'low',
  odor_risk TEXT DEFAULT 'low',
  disease_risk TEXT DEFAULT 'low',
  mosquito_risk TEXT DEFAULT 'low',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.scan_history ENABLE ROW LEVEL SECURITY;

-- Users can view their own scans
CREATE POLICY "Users can view their own scans"
ON public.scan_history
FOR SELECT
USING (true);

-- Users can insert their own scans
CREATE POLICY "Users can insert scans"
ON public.scan_history
FOR INSERT
WITH CHECK (true);

-- Enable realtime for scan_history
ALTER PUBLICATION supabase_realtime ADD TABLE public.scan_history;