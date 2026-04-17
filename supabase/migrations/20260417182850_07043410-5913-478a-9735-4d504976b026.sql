
CREATE TABLE IF NOT EXISTS public.student_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  auth_provider text NOT NULL DEFAULT 'authenticated',
  contact_hint text,
  ip_hash text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id),
  UNIQUE (student_id)
);

CREATE INDEX IF NOT EXISTS student_verifications_ip_hash_idx
  ON public.student_verifications (ip_hash);

ALTER TABLE public.student_verifications ENABLE ROW LEVEL SECURITY;

-- No client-side access; only service role (used by edge function) can read/write.
