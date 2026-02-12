-- CreateTable
CREATE TABLE "ShopBilling" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "remainingCredits" INTEGER NOT NULL DEFAULT 0,
    "totalSearches" INTEGER NOT NULL DEFAULT 0,
    "monthlyLimit" INTEGER NOT NULL DEFAULT 50000,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "BillingTransaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shopBillingId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "credits" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "stripeSessionId" TEXT,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BillingTransaction_shopBillingId_fkey" FOREIGN KEY ("shopBillingId") REFERENCES "ShopBilling" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "ShopBilling_shop_key" ON "ShopBilling"("shop");
