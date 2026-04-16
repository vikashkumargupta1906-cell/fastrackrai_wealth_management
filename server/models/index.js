const { sequelize } = require("../config/database");
const Household = require("./households");
const Member = require("./members");
const Account = require("./accounts");
const BankDetail = require("./bankdetails");

// Initialize models
Household.init(sequelize);
Member.init(sequelize);
Account.init(sequelize);
BankDetail.init(sequelize);

// Define associations
// Household -> Members
Household.hasMany(Member, { foreignKey: "householdId", as: "members" });
Member.belongsTo(Household, { foreignKey: "householdId", as: "household" });
Household.hasMany(BankDetail, { foreignKey: "householdId", as: "bankDetails" });
BankDetail.belongsTo(Household, { foreignKey: "householdId", as: "household" });

// Household -> Accounts
Household.hasMany(Account, { foreignKey: "householdId", as: "accounts" });
Account.belongsTo(Household, { foreignKey: "householdId", as: "household" });

module.exports = {
  sequelize,
  Household,
  Member,
  Account,
  BankDetail,
};
