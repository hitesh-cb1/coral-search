-- AlterTable: Add daily budget limit to users
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "dailyBudgetLimit" DECIMAL(65,30);
