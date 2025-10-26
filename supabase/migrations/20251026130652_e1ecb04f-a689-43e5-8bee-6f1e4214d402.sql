-- Create table for schedule overrides (vacations, custom working/non-working days)
CREATE TABLE public.schedule_overrides (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date_from DATE NOT NULL,
  date_to DATE NOT NULL,
  is_working BOOLEAN NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT valid_date_range CHECK (date_to >= date_from)
);

-- Enable RLS
ALTER TABLE public.schedule_overrides ENABLE ROW LEVEL SECURITY;

-- Anyone can view schedule overrides (needed for booking page)
CREATE POLICY "Anyone can view schedule overrides"
ON public.schedule_overrides
FOR SELECT
USING (true);

-- Only admins can manage schedule overrides
CREATE POLICY "Admins can manage schedule overrides"
ON public.schedule_overrides
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for better performance on date queries
CREATE INDEX idx_schedule_overrides_dates ON public.schedule_overrides(date_from, date_to);

COMMENT ON TABLE public.schedule_overrides IS 'Stores schedule overrides: vacations, custom working days, and blocked days';
COMMENT ON COLUMN public.schedule_overrides.is_working IS 'true = working day (override non-working), false = non-working day (vacation/day off)';
COMMENT ON COLUMN public.schedule_overrides.reason IS 'Optional reason: vacation, personal day, etc.';