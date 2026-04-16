const { DataTypes, Model } = require("sequelize");

class Member extends Model {
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
            model: "Households", // Table name
            key: "id",
          },
        },
        firstName: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        lastName: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        dob: {
          type: DataTypes.DATEONLY, // Using DATEONLY for birthday
          allowNull: true,
        },
        email: {
          type: DataTypes.STRING,
          allowNull: true,
          validate: {
            isEmail: true,
          },
        },
        phone: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        relationship: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        street: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        city: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        state: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        zip: {
          type: DataTypes.STRING,
          allowNull: true,
        },
      },
      {
        sequelize,
        timestamps: true,
      }
    );
  }
}

module.exports = Member;
