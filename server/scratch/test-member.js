const { sequelize, Household, Member } = require("../models");

async function test() {
  try {
    console.log("Starting Member verification...");
    
    // Attempt to connect and sync
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });
    
    // 1. Create a Household
    console.log("Creating test Household...");
    const hh = await Household.create({
      name: "The Smith Family"
    });
    
    // 2. Create a Member
    console.log("Creating test Member...");
    const member = await Member.create({
      householdId: hh.id,
      name: "John Smith",
      dob: "1990-05-15",
      email: "john@example.com",
      relationship: "Head",
      city: "New York",
      state: "NY"
    });
    
    console.log("Successfully created member:", member.name, "attached to household:", hh.name);
    
    // 3. Test Association (Fetch household from member)
    const memberWithHouse = await Member.findByPk(member.id, {
        include: [{ model: Household, as: 'household' }]
    });
    console.log("Association Check (Member -> Household):", memberWithHouse.household.name);

    // 4. Test Association (Fetch members from household)
    const houseWithMembers = await Household.findByPk(hh.id, {
        include: [{ model: Member, as: 'members' }]
    });
    console.log("Association Check (Household -> Members count):", houseWithMembers.members.length);
    
    // Clean up
    await member.destroy();
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
