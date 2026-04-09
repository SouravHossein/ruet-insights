CREATE TABLE public.student_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ip_hash TEXT NOT NULL,
  auth_provider TEXT,
  contact_hint TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_student_verifications_student_id
  ON public.student_verifications (student_id);

CREATE UNIQUE INDEX idx_student_verifications_user_id
  ON public.student_verifications (user_id);

CREATE INDEX idx_student_verifications_ip_hash
  ON public.student_verifications (ip_hash);

ALTER TABLE public.student_verifications ENABLE ROW LEVEL SECURITY;
