import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function updateMonthlyLimits() {
  try {
    console.log("🔄 Starting monthly limit update...");
    
    // Find all billing records with monthlyLimit = 50000
    const recordsToUpdate = await prisma.shopBilling.findMany({
      where: {
        monthlyLimit: 50000,
      },
    });

    console.log(`📊 Found ${recordsToUpdate.length} records to update`);

    if (recordsToUpdate.length === 0) {
      console.log("✅ No records need updating. All records already have monthlyLimit = 1000");
      return;
    }

    // Show what will be updated
    console.log("\n📋 Records to be updated:");
    recordsToUpdate.forEach((record) => {
      console.log(`  - Shop: ${record.shop}, Current Limit: ${record.monthlyLimit}, Credits: ${record.remainingCredits}`);
    });

    // Update all records
    const result = await prisma.shopBilling.updateMany({
      where: {
        monthlyLimit: 50000,
      },
      data: {
        monthlyLimit: 1000,
      },
    });

    console.log(`\n✅ Successfully updated ${result.count} records`);
    console.log("📝 All monthly limits have been changed from 50,000 to 1,000");

    // Verify the update
    const updatedRecords = await prisma.shopBilling.findMany({
      where: {
        monthlyLimit: 1000,
      },
    });
    console.log(`\n✅ Verification: ${updatedRecords.length} records now have monthlyLimit = 1000`);

  } catch (error) {
    console.error("❌ Error updating monthly limits:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
updateMonthlyLimits()
  .then(() => {
    console.log("\n🎉 Script completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Script failed:", error);
    process.exit(1);
  });


