require('dotenv').config();

module.exports = {
  development: {
    username: process.env.DB_USER || "in_tax_db_ijil_user",
    password: process.env.DB_PASS || "29Jx5YgqiEXRhK3J30rL8AWNIk0Mz7cc",
    database: process.env.DB_NAME || "in_tax_db_ijil",
    host: process.env.DB_HOST || "dpg-d45fpo3uibrs73f4kr40-a.singapore-postgres.render.com",
    port: process.env.DB_PORT || 5432,
    dialect: "postgres",
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  },
  test: {},
  production: {
    username: process.env.DB_USER || "in_tax_db_ijil_user",
    password: process.env.DB_PASS || "29Jx5YgqiEXRhK3J30rL8AWNIk0Mz7cc",
    database: process.env.DB_NAME || "in_tax_db_ijil",
    host: process.env.DB_HOST || "dpg-d45fpo3uibrs73f4kr40-a.singapore-postgres.render.com",
    port: process.env.DB_PORT || 5432,
    dialect: "postgres",
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  }
};
