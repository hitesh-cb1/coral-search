-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ShopBilling" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "remainingCredits" INTEGER NOT NULL DEFAULT 0,
    "totalSearches" INTEGER NOT NULL DEFAULT 0,
    "monthlyLimit" INTEGER NOT NULL DEFAULT 1000,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_ShopBilling" ("createdAt", "id", "monthlyLimit", "remainingCredits", "shop", "totalSearches", "updatedAt") SELECT "createdAt", "id", "monthlyLimit", "remainingCredits", "shop", "totalSearches", "updatedAt" FROM "ShopBilling";
DROP TABLE "ShopBilling";
ALTER TABLE "new_ShopBilling" RENAME TO "ShopBilling";
CREATE UNIQUE INDEX "ShopBilling_shop_key" ON "ShopBilling"("shop");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
