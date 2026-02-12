import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function revertMonthlyLimits() {
  try {
    console.log("🔄 Reverting monthly limit back to 50,000...");
    
    // Find all billing records with monthlyLimit = 1000
    const recordsToUpdate = await prisma.shopBilling.findMany({
      where: {
        monthlyLimit: 1000,
      },
    });

    console.log(`📊 Found ${recordsToUpdate.length} records to revert`);

    if (recordsToUpdate.length === 0) {
      console.log("✅ No records need reverting.");
      return;
    }

    // Show what will be updated
    console.log("\n📋 Records to be reverted:");
    recordsToUpdate.forEach((record) => {
      console.log(`  - Shop: ${record.shop}, Current Limit: ${record.monthlyLimit}, Credits: ${record.remainingCredits}`);
    });

    // Update all records back to 50000
    const result = await prisma.shopBilling.updateMany({
      where: {
        monthlyLimit: 1000,
      },
      data: {
        monthlyLimit: 50000,
      },
    });

    console.log(`\n✅ Successfully reverted ${result.count} records`);
    console.log("📝 All monthly limits have been changed back from 1,000 to 50,000");

  } catch (error) {
    console.error("❌ Error reverting monthly limits:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
revertMonthlyLimits()
  .then(() => {
    console.log("\n🎉 Revert completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Revert failed:", error);
    process.exit(1);
  });


