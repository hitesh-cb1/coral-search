-- AlterTable: Rename requestsPerMinute to requestsPerSecond
-- Note: Converting values: 10 RPM -> 1 RPS, 300 RPM -> 5 RPS, 600 RPM -> 10 RPS, 3000 RPM -> 50 RPS
ALTER TABLE "api_keys" RENAME COLUMN "requestsPerMinute" TO "requestsPerSecond";

-- Update existing values to convert from per-minute to per-second
-- Default conversion: divide by 60, but we'll use specific mappings
UPDATE "api_keys" SET "requestsPerSecond" = CASE
  WHEN "requestsPerSecond" = 10 THEN 1
  WHEN "requestsPerSecond" = 300 THEN 5  -- Unverified tier: 5 RPS
  WHEN "requestsPerSecond" = 600 THEN 10
  WHEN "requestsPerSecond" = 3000 THEN 50
  ELSE GREATEST(1, "requestsPerSecond" / 60)
END;

-- Set default value for new rows (unverified tier: 5 RPS)
ALTER TABLE "api_keys" ALTER COLUMN "requestsPerSecond" SET DEFAULT 5;
