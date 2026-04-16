const { Sequelize } = require("sequelize");
require("dotenv").config();

let sequelize;

// Check if we have a Render DATABASE_URL (Production/Cloud)
if (process.env.DATABASE_URL) {
  
  // 🚀 CLOUD CONFIGURATION (Render)
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: "postgres",
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false, // This is strictly required for Render Postgres
      },
    },
    pool: {
      max: 10,
      min: 2,
      acquire: 20000, // Slightly increased to handle cloud connection latency
      idle: 5000,
    },
    define: {
      timestamps: true,
    },
    logging: false, 
  });

} else {
  
  // 💻 LOCAL CONFIGURATION (Your original code)
  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST,
      dialect: "postgres",
      pool: {
        max: 10,
        min: 2,
        acquire: 20000,
        idle: 5000,
      },
      define: {
        timestamps: true,
      },
      logging: false, 
    }
  );
}

module.exports = { sequelize };