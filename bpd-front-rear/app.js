const config = require('./config')
const createController = require("./src/controllers")
const logger = require('./src/utils/logger')

async function main() {
    try {
        logger.info("Application starting in multi-controller mode...");
        const activeControllers = [];
        const machineNames = Object.keys(config.machines);

        if (machineNames.length === 0) {
            logger.warn("No machines configured. Please check your .env file. Exiting.");
            return;
        }

        logger.info(`Found ${machineNames.length} machine(s) to monitor: [${machineNames.join(', ')}]`);

        for (const machineName of machineNames) {
            try {
                const machineConfig = config.machines[machineName];
                
                // Jika controller tidak ditemukan atau ada error saat pembuatan, akan ditangkap di sini
                const controller = createController(machineName, machineConfig);
                
                // controller.start() memiliki mekanisme retry internal, jadi kita tidak perlu `await`
                // Namun, kita tetap memanggilnya di dalam try...catch untuk menangani error sinkron jika ada.
                controller.start(); 
                
                activeControllers.push(controller);
                logger.info(`Successfully launched controller for [${machineName}].`);

            } catch (error) {
                // Jika satu controller gagal (misal, config salah), catat error dan lanjutkan ke controller berikutnya
                logger.error(`Failed to launch controller for [${machineName}]. Skipping.`, error.message);
            }

            if (activeControllers.length === 0) {
                logger.error("No controllers were started successfully. Please check configurations. Exiting.");
                return;
            }
            logger.info(`Total controllers running: ${activeControllers.length}`);
        }
    } catch (err) {
        console.error(err)
    }
}

main();