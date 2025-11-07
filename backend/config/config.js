require('dotenv').config();

module.exports = {
  development: {
    url: process.env.DATABASE_URL || "postgresql://in_tax_db_ijil_user:29Jx5YgqiEXRhK3J30rL8AWNIk0Mz7cc@dpg-d45fpo3uibrs73f4kr40-a.singapore-postgres.render.com/in_tax_db_ijil?ssl=true",
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
    url: process.env.DATABASE_URL || "postgresql://in_tax_db_ijil_user:29Jx5YgqiEXRhK3J30rL8AWNIk0Mz7cc@dpg-d45fpo3uibrs73f4kr40-a.singapore-postgres.render.com/in_tax_db_ijil?ssl=true",
    dialect: "postgres",
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  }
};
