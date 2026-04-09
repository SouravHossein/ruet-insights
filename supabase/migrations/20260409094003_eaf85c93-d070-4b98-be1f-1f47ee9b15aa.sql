-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'student');

-- Universities table
CREATE TABLE public.universities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.universities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Universities are viewable by everyone"
  ON public.universities FOR SELECT
  USING (true);

-- Insert RUET as default university
INSERT INTO public.universities (name, code) VALUES ('Rajshahi University of Engineering & Technology', 'RUET');

-- Districts table
CREATE TABLE public.districts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  division TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE
);

ALTER TABLE public.districts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Districts are viewable by everyone"
  ON public.districts FOR SELECT
  USING (true);

-- Insert all 64 Bangladesh districts
INSERT INTO public.districts (name, division, code) VALUES
  ('Bagerhat','Khulna','BAG'),('Bandarban','Chattogram','BAN'),('Barguna','Barishal','BAR'),
  ('Barishal','Barishal','BRS'),('Bhola','Barishal','BHO'),('Bogura','Rajshahi','BOG'),
  ('Brahmanbaria','Chattogram','BRA'),('Chandpur','Chattogram','CHA'),('Chapainawabganj','Rajshahi','CPG'),
  ('Chattogram','Chattogram','CTG'),('Chuadanga','Khulna','CHU'),('Comilla','Chattogram','COM'),
  ('Cox''s Bazar','Chattogram','COX'),('Dhaka','Dhaka','DHK'),('Dinajpur','Rangpur','DIN'),
  ('Faridpur','Dhaka','FAR'),('Feni','Chattogram','FEN'),('Gaibandha','Rangpur','GAI'),
  ('Gazipur','Dhaka','GAZ'),('Gopalganj','Dhaka','GOP'),('Habiganj','Sylhet','HAB'),
  ('Jamalpur','Mymensingh','JAM'),('Jashore','Khulna','JAS'),('Jhalokati','Barishal','JHA'),
  ('Jhenaidah','Khulna','JHE'),('Joypurhat','Rajshahi','JOY'),('Khagrachhari','Chattogram','KHA'),
  ('Khulna','Khulna','KHU'),('Kishoreganj','Dhaka','KIS'),('Kurigram','Rangpur','KUR'),
  ('Kushtia','Khulna','KUS'),('Lakshmipur','Chattogram','LAK'),('Lalmonirhat','Rangpur','LAL'),
  ('Madaripur','Dhaka','MAD'),('Magura','Khulna','MAG'),('Manikganj','Dhaka','MAN'),
  ('Meherpur','Khulna','MEH'),('Moulvibazar','Sylhet','MOU'),('Munshiganj','Dhaka','MUN'),
  ('Mymensingh','Mymensingh','MYM'),('Naogaon','Rajshahi','NAO'),('Narail','Khulna','NAR'),
  ('Narayanganj','Dhaka','NRG'),('Narsingdi','Dhaka','NRS'),('Natore','Rajshahi','NAT'),
  ('Nawabganj','Rajshahi','NAW'),('Netrokona','Mymensingh','NET'),('Nilphamari','Rangpur','NIL'),
  ('Noakhali','Chattogram','NOA'),('Pabna','Rajshahi','PAB'),('Panchagarh','Rangpur','PAN'),
  ('Patuakhali','Barishal','PAT'),('Pirojpur','Barishal','PIR'),('Rajbari','Dhaka','RAJ'),
  ('Rajshahi','Rajshahi','RJS'),('Rangamati','Chattogram','RNG'),('Rangpur','Rangpur','RGP'),
  ('Satkhira','Khulna','SAT'),('Shariatpur','Dhaka','SHA'),('Sherpur','Mymensingh','SHE'),
  ('Sirajganj','Rajshahi','SIR'),('Sunamganj','Sylhet','SUN'),('Sylhet','Sylhet','SYL'),
  ('Tangail','Dhaka','TAN'),('Thakurgaon','Rangpur','THA');

-- Students table
CREATE TABLE public.students (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  merit_rank INTEGER NOT NULL,
  admission_roll TEXT NOT NULL UNIQUE,
  application_id TEXT,
  department TEXT NOT NULL,
  university_id UUID REFERENCES public.universities(id),
  district TEXT,
  verification_status TEXT NOT NULL DEFAULT 'unverified',
  is_locked BOOLEAN NOT NULL DEFAULT false,
  verified_at TIMESTAMP WITH TIME ZONE,
  ip_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_students_merit_university ON public.students (merit_rank, university_id);

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read student data"
  ON public.students FOR SELECT
  USING (true);

CREATE POLICY "Allow insert students"
  ON public.students FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow update unlocked students"
  ON public.students FOR UPDATE
  USING (is_locked = false);

-- User roles table
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Update trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_students_updated_at
  BEFORE UPDATE ON public.students
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();