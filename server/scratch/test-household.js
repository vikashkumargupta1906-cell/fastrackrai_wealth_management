const { sequelize, Household } = require("../models");

async function test() {
  try {
    console.log("Starting verification...");
    
    // Attempt to connect and sync
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });
    
    // Create a dummy household
    console.log("Creating test record...");
    const testHousehold = await Household.create({
      name: "Test Household",
      annualIncome: 150000.00,
      netWorth: 1000000.00,
      liquidNetWorth: 250000.00,
      expenseRange: "$5k-$10k",
      taxBracket: "24%",
      riskTolerance: "Moderate",
      timeHorizon: "20 years",
      audioNotes: "Processed raw data from voice recording."
    });
    
    console.log("Successfully created household with ID:", testHousehold.id);
    
    // Clean up
    await testHousehold.destroy();
    console.log("Cleanup: Record deleted.");
    
    console.log("Verification successful!");
    process.exit(0);
  } catch (error) {
    console.error("Verification failed:", error);
    process.exit(1);
  }
}

test();
