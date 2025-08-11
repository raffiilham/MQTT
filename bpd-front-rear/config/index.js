const dotenv = require("dotenv");
dotenv.config();

const sharedConfig = {
    subscription: {
        requestedPublishingInterval: 1000,
        requestedLifetimeCount: 100,
        requestedMaxKeepAliveCount: 10,
        publishingEnabled: true,
    },
    monitor: {
        samplingInterval: 1000,
        discardOldest: true,
        queueSize: 10,
    },
    connectionRetry: {
        initialDelay: parseInt(process.env.OPCUA_RETRY_DELAY) || 5000,
    }
}

const machines = {};

// Secara otomatis mencari semua mesin yang didefinisikan di .env
for (const key in process.env) {
    if (key.endsWith("_OPCUA_ENDPOINT")) {
        const machineName = key.split("_")[0].toLowerCase(); // e.g., 'oci1'
        
        machines[machineName] = {
            endpoint: process.env[`${machineName.toUpperCase()}_OPCUA_ENDPOINT`],
            nodeIds: {
                front: process.env[`${machineName.toUpperCase()}_OPCUA_NODEIDS_FRONT`].split(',').map(id => id.trim()),
                rear: process.env[`${machineName.toUpperCase()}_OPCUA_NODEIDS_REAR`].split(',').map(id => id.trim()),
                reject: process.env[`${machineName.toUpperCase()}_OPCUA_NODEID_REJECT`],
            },
            ...sharedConfig
        };
    }
}

module.exports = {
    machines,
};