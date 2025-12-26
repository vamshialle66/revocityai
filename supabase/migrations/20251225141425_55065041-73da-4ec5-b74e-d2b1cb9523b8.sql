-- Create complaints table for tracking citizen reports
CREATE TABLE public.complaints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id text UNIQUE NOT NULL,
  reporter_firebase_uid text NOT NULL,
  reporter_email text,
  
  -- Location data
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  address text,
  area_name text,
  
  -- AI Analysis results
  image_url text,
  status text NOT NULL DEFAULT 'overflowing',
  fill_level integer NOT NULL DEFAULT 0,
  priority text NOT NULL DEFAULT 'medium',
  hygiene_risk text DEFAULT 'medium',
  ai_recommendations text[],
  ai_confidence integer DEFAULT 0,
  
  -- Tracking
  complaint_status text NOT NULL DEFAULT 'pending',
  assigned_to text,
  admin_notes text,
  
  -- Timestamps
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  resolved_at timestamp with time zone,
  
  -- Cleanup verification
  cleanup_image_url text,
  cleanup_verified boolean DEFAULT false
);

-- Enable RLS
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;

-- Anyone can read complaints (for map display)
CREATE POLICY "Anyone can read complaints"
  ON public.complaints
  FOR SELECT
  USING (true);

-- Authenticated users can insert their own complaints
CREATE POLICY "Users can insert complaints"
  ON public.complaints
  FOR INSERT
  WITH CHECK (true);

-- Service role can update complaints (via edge function)
CREATE POLICY "Service role can update complaints"
  ON public.complaints
  FOR UPDATE
  USING (true);

-- Create index for faster queries
CREATE INDEX idx_complaints_status ON public.complaints(complaint_status);
CREATE INDEX idx_complaints_priority ON public.complaints(priority);
CREATE INDEX idx_complaints_location ON public.complaints(latitude, longitude);

-- Function to generate unique complaint ID
CREATE OR REPLACE FUNCTION generate_complaint_id()
RETURNS trigger AS $$
BEGIN
  NEW.complaint_id := 'CC-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || SUBSTRING(NEW.id::text, 1, 6);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate complaint ID
CREATE TRIGGER set_complaint_id
  BEFORE INSERT ON public.complaints
  FOR EACH ROW
  EXECUTE FUNCTION generate_complaint_id();

-- Enable realtime for complaints table
ALTER PUBLICATION supabase_realtime ADD TABLE public.complaints;