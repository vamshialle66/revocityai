-- Add reporter_notes column for user comments/messages
ALTER TABLE public.complaints 
ADD COLUMN IF NOT EXISTS reporter_notes TEXT;