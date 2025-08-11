const fs = require("fs");
const path = require("path");
const Sequelize = require("sequelize");
const Op = Sequelize.Op;
require('dotenv').config({ path: '../env/.env.dev' });

// change format name to camelcase
const toCamelCaseName = (str) => {
    return str
        .toLowerCase()
        .replace(/_(.)/g, (_, match) => match.toUpperCase());
};

// Extract prefixes from environment variables
const prefixes = Object.keys(process.env)
    .filter(key => key.endsWith('_NAME') && /^(MYSQL|MSSQL|POSTGRE)/.test(key))
    .map(key => key.split('_NAME')[0]);
    
// Define directories dynamically
const directories = {};
prefixes.forEach(prefix => {
    const camelCaseName = toCamelCaseName(process.env[`${prefix}_NAME`]);
    const dirPath = path.join(__dirname, `../src/models/${camelCaseName}`);
    if (!fs.existsSync(dirPath)) {
        throw new Error(`Directory ${dirPath} does not exist`);
    }
    directories[camelCaseName] = dirPath;
});

// Define operatorsAliases (removed in Sequelize v6)
const operatorsAliases = {
    $and: Op.and,
    $or: Op.or,
    $eq: Op.eq,
    $ne: Op.ne,
    $gt: Op.gt,
    $lt: Op.lt,
    $lte: Op.lte,
    $like: Op.like,
    $between: Op.between,
    $not: Op.not,
};

// Function to generate pool configuration
const generatePoolConfig = (prefix) => ({
    min: Number(process.env[`${prefix}_POOL_MIN`]),
    max: Number(process.env[`${prefix}_POOL_MAX`]),
    idle: Number(process.env[`${prefix}_POOL_IDLE`]),
    acquire: Number(process.env[`${prefix}_POOL_ACQUIRE`]),
    evict: Number(process.env[`${prefix}_POOL_EVICT`]),
    handleDisconnects: true,
});

// Function to generate sequelize configuration
const generateSequelizeConfig = (prefix) => ({
    host: process.env[`${prefix}_HOST`],
    dialect: process.env[`${prefix}_DIALECT`],
    database: process.env[`${prefix}_NAME`],
    username: process.env[`${prefix}_USER`],
    password: process.env[`${prefix}_PASS`],
    pool: generatePoolConfig(prefix),
    port: Number(process.env[`${prefix}_PORT`]),
    define: {
        timestamps: false,
        timezone: "+07:00",
    },
    logging: Boolean(process.env[`${prefix}_LOGGING`]),
    timezone: "+07:00",
});

const poolConfigurations = {};
const sequelizeConfigurations = {};
// Generate configurations dynamically
prefixes.forEach(prefix => {
    const camelCaseName = toCamelCaseName(process.env[`${prefix}_NAME`]);
    poolConfigurations[camelCaseName] = generatePoolConfig(prefix);
    sequelizeConfigurations[camelCaseName] = generateSequelizeConfig(prefix);
});

// Initialize sequelize instances
const sequelizeInstances = {};
for (const [key, config] of Object.entries(sequelizeConfigurations)) {
    sequelizeInstances[key] = new Sequelize(config);
}

// Authenticate sequelize instances
const authenticateSequelize = async (instanceName) => {
    try {
        await sequelizeInstances[instanceName].authenticate();
        console.log(`[OK] DB ${instanceName.toUpperCase()} connected!`);
    } catch (error) {
        console.error(
            `[ERR] DB ${instanceName.toUpperCase()} connection error!`,
            error
        );
    }
};

// Authenticate all sequelize instances
for (const instanceName in sequelizeInstances) {
    authenticateSequelize(instanceName);
}

// Initialize db object
const db = {};
let model;

// Define models and associations
const defineModels = (directory, sequelizeInstance) => {
    db[directory] = {};
    fs.readdirSync(directories[directory])
        .filter(
            (file) => file.indexOf(".") !== 0 && file.indexOf(".map") === -1
        )
        .forEach((file) => {
            model = require(path.join(directories[directory], file))(
                sequelizeInstance,
                Sequelize.DataTypes
            );
            db[directory][model.name] = model;
        });

    Object.keys(db[directory]).forEach((name) => {
        if ("associate" in db[directory][name]) {
            db[directory][name].associate(db[directory]);
        }
    });
};

// Define models and associations for each directory
for (const directory in directories) {
    defineModels(directory, sequelizeInstances[directory]);
}

module.exports = {
    db,
    sequelizeInstances,
    Op,
    Sequelize
};