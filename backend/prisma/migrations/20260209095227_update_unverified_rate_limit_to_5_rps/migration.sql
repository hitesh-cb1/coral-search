-- Update default value for new API keys (working with requestsPerMinute before rename)
-- Note: This migration runs before the rename migration, so we work with requestsPerMinute
-- The rename migration will convert these values appropriately

-- Update existing API keys with 10 RPM (unverified tier) to 300 RPM (which becomes 5 RPS after conversion)
-- 300 RPM / 60 = 5 RPS
UPDATE "api_keys" SET "requestsPerMinute" = 300 WHERE "requestsPerMinute" = 10;

-- Note: Default value update will be handled by the rename migration
