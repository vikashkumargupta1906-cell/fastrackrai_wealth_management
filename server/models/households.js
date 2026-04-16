const {DataTypes, Model} = require("sequelize");

class Household extends Model{
  static init(sequelize){
    super.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        name: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        annualIncome: {
          type: DataTypes.DECIMAL(15, 2),
          allowNull: true,
        },
        netWorth: {
          type: DataTypes.DECIMAL(15, 2),
          allowNull: true,
        },
        liquidNetWorth: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: true,
        },
        expenseRange: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        taxBracket: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        riskTolerance: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        timeHorizon: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        audioNotes: {
            type: DataTypes.TEXT,
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

module.exports = Household;