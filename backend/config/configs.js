








require('dotenv').config();

module.exports = {
  development: {
    username: "postgres",
    password: "152721",
    database:  "in_tax_db",
    host: "localhost",
    port:  5432,
    dialect: "postgres",
  },
  test: {},
  production: {
    username: "postgres",
    password: "152721",
    database:  "in_tax_db",
    host: "localhost",
    port:  5432,
    dialect: "postgres",

  }
};
