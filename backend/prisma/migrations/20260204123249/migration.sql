-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "googleId" TEXT,
    "awsId" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verificationToken" TEXT,
    "verificationTokenExpiry" TIMESTAMP(3),
    "passwordResetToken" TEXT,
    "passwordResetTokenExpiry" TIMESTAMP(3),
    "tokenBalance" BIGINT NOT NULL DEFAULT 100000000,
    "stripeCustomerId" TEXT,
    "monthlyBudgetLimit" DECIMAL(65,30),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_keys" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "keyPrefix" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "requestsPerMinute" INTEGER NOT NULL DEFAULT 10,
    "tokensPerMonth" BIGINT NOT NULL DEFAULT 10000,
    "tokensUsedThisMonth" BIGINT NOT NULL DEFAULT 0,
    "monthResetDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_usage" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "apiKeyId" INTEGER NOT NULL,
    "endpoint" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "tokensUsed" INTEGER NOT NULL DEFAULT 0,
    "latencyMs" INTEGER,
    "inputSize" INTEGER,
    "outputSize" INTEGER,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "errorCode" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_usage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credit_transactions" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "amount" BIGINT NOT NULL,
    "cost" DECIMAL(65,30),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "paymentProvider" TEXT,
    "paymentId" TEXT,
    "paymentStatus" TEXT,
    "description" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "credit_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shopify_shops" (
    "id" SERIAL NOT NULL,
    "shopDomain" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "installedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shopify_shops_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shopify_products" (
    "id" SERIAL NOT NULL,
    "shopifyProductId" TEXT NOT NULL,
    "shopId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "vendor" TEXT,
    "productType" TEXT,
    "handle" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "publishedAt" TIMESTAMP(3),
    "shopifyCreatedAt" TIMESTAMP(3),
    "shopifyUpdatedAt" TIMESTAMP(3),
    "tags" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shopify_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shopify_product_variants" (
    "id" SERIAL NOT NULL,
    "shopifyVariantId" TEXT NOT NULL,
    "productId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "sku" TEXT,
    "barcode" TEXT,
    "price" TEXT NOT NULL,
    "compareAtPrice" TEXT,
    "inventoryQuantity" INTEGER,
    "inventoryPolicy" TEXT,
    "weight" DOUBLE PRECISION,
    "weightUnit" TEXT,
    "position" INTEGER NOT NULL DEFAULT 1,
    "requiresShipping" BOOLEAN NOT NULL DEFAULT true,
    "taxable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shopify_product_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shopify_product_images" (
    "id" SERIAL NOT NULL,
    "shopifyImageId" TEXT NOT NULL,
    "productId" INTEGER NOT NULL,
    "src" TEXT NOT NULL,
    "alt" TEXT,
    "position" INTEGER NOT NULL DEFAULT 1,
    "width" INTEGER,
    "height" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shopify_product_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shopify_product_options" (
    "id" SERIAL NOT NULL,
    "shopifyOptionId" TEXT NOT NULL,
    "productId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 1,
    "values" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shopify_product_options_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_googleId_key" ON "users"("googleId");

-- CreateIndex
CREATE UNIQUE INDEX "users_awsId_key" ON "users"("awsId");

-- CreateIndex
CREATE UNIQUE INDEX "users_verificationToken_key" ON "users"("verificationToken");

-- CreateIndex
CREATE UNIQUE INDEX "users_passwordResetToken_key" ON "users"("passwordResetToken");

-- CreateIndex
CREATE UNIQUE INDEX "users_stripeCustomerId_key" ON "users"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_keyHash_key" ON "api_keys"("keyHash");

-- CreateIndex
CREATE INDEX "api_keys_userId_idx" ON "api_keys"("userId");

-- CreateIndex
CREATE INDEX "api_keys_keyHash_idx" ON "api_keys"("keyHash");

-- CreateIndex
CREATE INDEX "api_usage_userId_idx" ON "api_usage"("userId");

-- CreateIndex
CREATE INDEX "api_usage_apiKeyId_idx" ON "api_usage"("apiKeyId");

-- CreateIndex
CREATE INDEX "api_usage_timestamp_idx" ON "api_usage"("timestamp");

-- CreateIndex
CREATE INDEX "api_usage_endpoint_idx" ON "api_usage"("endpoint");

-- CreateIndex
CREATE INDEX "credit_transactions_userId_idx" ON "credit_transactions"("userId");

-- CreateIndex
CREATE INDEX "credit_transactions_type_idx" ON "credit_transactions"("type");

-- CreateIndex
CREATE INDEX "credit_transactions_paymentStatus_idx" ON "credit_transactions"("paymentStatus");

-- CreateIndex
CREATE INDEX "credit_transactions_createdAt_idx" ON "credit_transactions"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "shopify_shops_shopDomain_key" ON "shopify_shops"("shopDomain");

-- CreateIndex
CREATE INDEX "shopify_products_shopId_idx" ON "shopify_products"("shopId");

-- CreateIndex
CREATE INDEX "shopify_products_shopifyProductId_idx" ON "shopify_products"("shopifyProductId");

-- CreateIndex
CREATE INDEX "shopify_products_status_idx" ON "shopify_products"("status");

-- CreateIndex
CREATE INDEX "shopify_products_vendor_idx" ON "shopify_products"("vendor");

-- CreateIndex
CREATE INDEX "shopify_products_productType_idx" ON "shopify_products"("productType");

-- CreateIndex
CREATE UNIQUE INDEX "shopify_products_shopId_shopifyProductId_key" ON "shopify_products"("shopId", "shopifyProductId");

-- CreateIndex
CREATE INDEX "shopify_product_variants_productId_idx" ON "shopify_product_variants"("productId");

-- CreateIndex
CREATE INDEX "shopify_product_variants_sku_idx" ON "shopify_product_variants"("sku");

-- CreateIndex
CREATE INDEX "shopify_product_variants_barcode_idx" ON "shopify_product_variants"("barcode");

-- CreateIndex
CREATE UNIQUE INDEX "shopify_product_variants_productId_shopifyVariantId_key" ON "shopify_product_variants"("productId", "shopifyVariantId");

-- CreateIndex
CREATE INDEX "shopify_product_images_productId_idx" ON "shopify_product_images"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "shopify_product_images_productId_shopifyImageId_key" ON "shopify_product_images"("productId", "shopifyImageId");

-- CreateIndex
CREATE INDEX "shopify_product_options_productId_idx" ON "shopify_product_options"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "shopify_product_options_productId_shopifyOptionId_key" ON "shopify_product_options"("productId", "shopifyOptionId");

-- AddForeignKey
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_usage" ADD CONSTRAINT "api_usage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_usage" ADD CONSTRAINT "api_usage_apiKeyId_fkey" FOREIGN KEY ("apiKeyId") REFERENCES "api_keys"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shopify_products" ADD CONSTRAINT "shopify_products_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "shopify_shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shopify_product_variants" ADD CONSTRAINT "shopify_product_variants_productId_fkey" FOREIGN KEY ("productId") REFERENCES "shopify_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shopify_product_images" ADD CONSTRAINT "shopify_product_images_productId_fkey" FOREIGN KEY ("productId") REFERENCES "shopify_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shopify_product_options" ADD CONSTRAINT "shopify_product_options_productId_fkey" FOREIGN KEY ("productId") REFERENCES "shopify_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
