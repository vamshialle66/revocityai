-- Fix function search path security issue
CREATE OR REPLACE FUNCTION generate_complaint_id()
RETURNS trigger 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.complaint_id := 'CC-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || SUBSTRING(NEW.id::text, 1, 6);
  RETURN NEW;
END;
$$;