const { DataTypes, Model } = require("sequelize");

class BankDetail extends Model {
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
        bankName: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        accountNumber: {
          type: DataTypes.BIGINT,
          allowNull: true,
        },
        routingNumber: {
          type: DataTypes.STRING,
          allowNull: true,
          // Individual/Joint/IRA etc.
        },
       
      },
      {
        sequelize,
        timestamps: true,
      }
    );
  }
}

module.exports = BankDetail;
