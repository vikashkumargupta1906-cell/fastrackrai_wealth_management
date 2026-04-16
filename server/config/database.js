const { Sequelize } = require("sequelize");
require("dotenv").config();

const dbConfig = {
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  dialect: "postgres",
  pool: {
    max: 10,
    min: 2,
    acquire: 2000,
    idle: 5000,
  },
};

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    dialect: dbConfig.dialect,
    pool: dbConfig.pool,
    define: {
      timestamps: true,
    },
    logging: false, // Set to console.log to see SQL queries
  }
);

module.exports = { sequelize };