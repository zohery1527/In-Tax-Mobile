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
    password:"152721",
    database:  "in_tax_db",
    host: "localhost",
    port:  5432,
    dialect: "postgres",

  }
};




// require('dotenv').config();

// module.exports = {
//   development: {
//     username: process.env.DB_USER || "in_tax_db_u7lk_user",
//     password: process.env.DB_PASS || "UrJblEFLY0hzhFerdXmANaSq96LdIQZp",
//     database: process.env.DB_NAME || "in_tax_db_u7lk",
//     host: process.env.DB_HOST || "dpg-d4s18b0gjchc738481dg-a.singapore-postgres.render.com",
//     port: process.env.DB_PORT || 5432,
//     dialect: "postgres",
//     dialectOptions: {
//       ssl: {
//         require: true,
//         rejectUnauthorized: false
//       }
//     }
//   },
//   test: {},
//   production: {
//     username: process.env.DB_USER || "in_tax_db_u7lk_user",
//     password: process.env.DB_PASS || "UrJblEFLY0hzhFerdXmANaSq96LdIQZp",
//     database: process.env.DB_NAME || "in_tax_db_u7lk",
//     host: process.env.DB_HOST || "dpg-d4s18b0gjchc738481dg-a.singapore-postgres.render.com",
//     port: process.env.DB_PORT || 5432,
//     dialect: "postgres",
//     dialectOptions: {
//       ssl: {
//         require: true,
//         rejectUnauthorized: false
//       }
//     }
//   }
// };
