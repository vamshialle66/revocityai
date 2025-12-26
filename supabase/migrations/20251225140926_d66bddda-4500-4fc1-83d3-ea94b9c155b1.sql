-- Create users table to track all registered users
CREATE TABLE public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firebase_uid text UNIQUE NOT NULL,
  email text,
  display_name text,
  last_login timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read users (admins need this)
CREATE POLICY "Anyone can read users"
  ON public.users
  FOR SELECT
  USING (true);

-- Allow inserts via edge function (service role)
CREATE POLICY "Service role can insert users"
  ON public.users
  FOR INSERT
  WITH CHECK (true);

-- Allow updates via edge function (service role)
CREATE POLICY "Service role can update users"
  ON public.users
  FOR UPDATE
  USING (true);