/**
 * Usage example:
 *
 * npm run models-dev -- --db=digimond table1 table2
 *
 * db: Select from available database configurations (e.g., digimond, php_ms_login, aiopms)
 * table1 table2: Optional list of specific tables to generate models for
 */

const path = require("path");
const SequelizeAuto = require("sequelize-auto");
const dotenv = require("dotenv");

// Function to convert names to camelCase
const toCamelCaseName = (str) => {
  return str.toLowerCase().replace(/_(.)/g, (_, match) => match.toUpperCase());
};

// Parse command-line arguments
const args = process.argv.slice(2);
const dbArg =
  args.find((arg) => arg.startsWith("--db="))?.split("=")[1] || "node_red"; // Default to 'DIGIMOND'
const envArg =
  args.find((arg) => arg.startsWith("--env="))?.split("=")[1] || "../env/.env.dev"; // Default to '../env/.env.dev'
const tables = args.filter(
  (arg) => !arg.startsWith("--db=") && !arg.startsWith("--env=")
);
const tablesToGenerate = tables.length > 0 ? tables : undefined; // Default set to undefined to generate all table

// Load environment variables from the specified .env file
dotenv.config({ path: path.join(__dirname, envArg) });

// Extract prefixes from environment variables
const prefixes = Object.keys(process.env)
  .filter((key) => key.endsWith("_NAME") && /^(MYSQL|MSSQL|POSTGRE)/.test(key))
  .map((key) => key.split("_NAME")[0]);

// Function to generate sequelize configuration
const generateSequelizeConfig = (prefix) => ({
  host: process.env[`${prefix}_HOST`],
  dialect: process.env[`${prefix}_DIALECT`],
  database: process.env[`${prefix}_NAME`],
  username: process.env[`${prefix}_USER`],
  password: process.env[`${prefix}_PASS`],
  port: Number(process.env[`${prefix}_PORT`]),
});

let dbConfig = {};
// Generate configurations dynamically
const matchedPrefix = prefixes.find(
  (prefix) => process.env[`${prefix}_NAME`] === dbArg
);

if (matchedPrefix) {
  dbConfig = generateSequelizeConfig(matchedPrefix);
  console.log(`Using configuration for database: ${dbArg}`);
  console.log(dbConfig);
} else {
  throw new Error(`No configuration found for database: ${dbArg}`);
}

// Initialize SequelizeAuto
const auto = new SequelizeAuto(
  dbConfig.database, // Database name
  dbConfig.username, // User
  dbConfig.password, // Password
  {
    host: dbConfig.host,
    dialect: dbConfig.dialect,
    directory: path.join(
      __dirname,
      "../src/models/",
      toCamelCaseName(dbConfig.database)
    ), // Specify the models directory
    port: dbConfig.port,
    caseModel: "c", // Camelcase model name
    caseFile: "c", // Camelcase file name
    singularize: false,
    additional: {
      timestamps: false, // Disable timestamps
    },
    noInitModels: true, // Don't initialize models
    tables: tablesToGenerate, // Specify tables to generate models for
  }
);

// Run SequelizeAuto and handle results
auto.run().then((data) => {
  // Uncomment to debug
  // console.log(data.tables);      // Table and field list
  // console.log(data.foreignKeys); // Table foreign key list
  // console.log(data.indexes);     // Table indexes
  // console.log(data.hasTriggerTables); // Tables with triggers
  // console.log(data.relations);   // Relationships between models
  // console.log(data.text)         // Text of generated models
  console.log("Models generated successfully!");
});
