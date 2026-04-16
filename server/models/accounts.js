const { DataTypes, Model } = require("sequelize");

class Account extends Model {
  static init(sequelize) {
    super.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        householdId: {
          type: DataTypes.UUID,
          allowNull: false,
          references: {
            model: "Households",
            key: "id",
          },
        },
        accountNumber: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        custodian: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        accountType: {
          type: DataTypes.STRING,
          allowNull: true,
          // Individual/Joint/IRA etc.
        },
        value: {
          type: DataTypes.DECIMAL(15, 2),
          allowNull: true,
          defaultValue: 0.00,
        },
        ownershipPercent: {
          type: DataTypes.DECIMAL(5, 2), // e.g., 100.00
          allowNull: true,
          defaultValue: 100.00,
        },
      },
      {
        sequelize,
        timestamps: true,
      }
    );
  }
}

module.exports = Account;
