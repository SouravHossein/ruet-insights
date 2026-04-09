-- Drop overly permissive policies
DROP POLICY "Allow insert students" ON public.students;
DROP POLICY "Allow update unlocked students" ON public.students;

-- More restrictive insert: only authenticated users
CREATE POLICY "Authenticated users can insert students"
  ON public.students FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- More restrictive update: only authenticated + unlocked
CREATE POLICY "Authenticated users can update unlocked students"
  ON public.students FOR UPDATE
  TO authenticated
  USING (is_locked = false)
  WITH CHECK (is_locked = false);