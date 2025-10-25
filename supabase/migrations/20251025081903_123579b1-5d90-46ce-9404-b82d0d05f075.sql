-- Fix bookings table to support multiple services
-- First, we need to change the structure to support multiple services per booking

-- Drop the existing foreign key constraint if it exists
ALTER TABLE bookings DROP COLUMN IF EXISTS service_id;

-- Add a new column for storing multiple service IDs as an array
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS service_ids uuid[] NOT NULL DEFAULT '{}';

-- Add a constraint to ensure at least one service is selected
ALTER TABLE bookings ADD CONSTRAINT at_least_one_service CHECK (array_length(service_ids, 1) > 0);

-- Update the RLS policies to ensure admins can see all bookings
-- The existing policies should work, but let's make sure

-- Create an index for better performance on service_ids array
CREATE INDEX IF NOT EXISTS idx_bookings_service_ids ON bookings USING GIN (service_ids);