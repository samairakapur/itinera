-- Add IATA airport codes, flight status, and terminal information to flight_details
ALTER TABLE flight_details
  ADD COLUMN IF NOT EXISTS departure_airport_iata varchar(3),
  ADD COLUMN IF NOT EXISTS arrival_airport_iata varchar(3),
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'delayed', 'cancelled', 'landed')),
  ADD COLUMN IF NOT EXISTS departure_terminal text,
  ADD COLUMN IF NOT EXISTS arrival_terminal text;

-- Add comment documenting the new columns
COMMENT ON COLUMN flight_details.departure_airport_iata IS 'IATA 3-letter airport code for departure (e.g. LHR, JFK, NRT)';
COMMENT ON COLUMN flight_details.arrival_airport_iata IS 'IATA 3-letter airport code for arrival';
COMMENT ON COLUMN flight_details.status IS 'Flight status: scheduled, delayed, cancelled, or landed';
COMMENT ON COLUMN flight_details.departure_terminal IS 'Departure terminal identifier (e.g. T1, T2, South)';
COMMENT ON COLUMN flight_details.arrival_terminal IS 'Arrival terminal identifier';
