const { sequelize, Household, Account } = require("../models");

async function test() {
  try {
    console.log("Starting Account verification...");
    
    // Attempt to connect and sync
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });
    
    // 1. Create a Household
    console.log("Creating test Household...");
    const hh = await Household.create({
      name: "The Miller Household"
    });
    
    // 2. Create an Account
    console.log("Creating test Account...");
    const account = await Account.create({
      householdId: hh.id,
      accountNumber: "987654321",
      custodian: "Vanguard",
      accountType: "Roth IRA",
      value: 50250.75,
      ownershipPercent: 100.00
    });
    
    console.log("Successfully created account:", account.accountNumber, "at", account.custodian);
    console.log("Account Value:", account.value);
    
    // 3. Test Association (Fetch household from account)
    const accWithHouse = await Account.findByPk(account.id, {
        include: [{ model: Household, as: 'household' }]
    });
    console.log("Association Check (Account -> Household):", accWithHouse.household.name);

    // 4. Test Association (Fetch accounts from household)
    const houseWithAccounts = await Household.findByPk(hh.id, {
        include: [{ model: Account, as: 'accounts' }]
    });
    console.log("Association Check (Household -> Accounts count):", houseWithAccounts.accounts.length);
    
    // Clean up
    await account.destroy();
    await hh.destroy();
    console.log("Cleanup: Records deleted.");
    
    console.log("Verification successful!");
    process.exit(0);
  } catch (error) {
    console.error("Verification failed:", error);
    process.exit(1);
  }
}

test();
