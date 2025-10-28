-- Add time fields to schedule_overrides for blocking specific time intervals
ALTER TABLE public.schedule_overrides 
  ADD COLUMN time_from TIME,
  ADD COLUMN time_to TIME;

-- Add a comment to explain the logic
COMMENT ON COLUMN public.schedule_overrides.time_from IS 'Start time for partial day blocking. If NULL, the entire day is affected.';
COMMENT ON COLUMN public.schedule_overrides.time_to IS 'End time for partial day blocking. If NULL, the entire day is affected.';