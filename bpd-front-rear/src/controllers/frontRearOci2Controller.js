const OpcuaService = require("../services/opcuaService")
const logger = require("../utils/logger")

class FrontRearOci1Controller {
    constructor(config) {
        this.machineName = 'oci2'; 
        this.config = config;
        this.opcuaService = new OpcuaService(config, this.machineName);
    }

    async start() {
        try {
            logger.info(`[${this.machineName}] Controller starting...`);
            await this.opcuaService.connect();
            await this.opcuaService.startMonitoring(this.handleRejectCountChange.bind(this));
        } catch (error) {
            logger.error(`[${this.machineName}] Controller failed to start. Retrying...`, error.message);
            setTimeout(() => this.start(), this.config.connectionRetry.initialDelay);
        }
    }

    async handleRejectCountChange(diff) {
        logger.info(`[${this.machineName}] Detected ${diff} new reject(s). Fetching inspection data.`);
        const inspectionDataArray = await this.opcuaService.getInspectionData(diff);

        if (inspectionDataArray.length > 0) {
            // Panggil metode pemrosesan data spesifik milik kelas ini
            this.processData(inspectionDataArray);
        }
    }

    async stop() {
        logger.info(`[${this.machineName}] Stopping controller.`);
        await this.opcuaService.disconnect();
    }

    processData(inspectionDataArray) {
        logger.info(`[${this.machineName}] Processing ${inspectionDataArray.length} data records.`);
        for (const data of inspectionDataArray) {
            const completeData = {
                machine: this.machineName,
                timestamp: new Date(),
                ...data,
            };

            console.log("================ OCI 1 ================");
            console.log(completeData);
            console.log("=======================================");
        }
    }
}

module.exports = FrontRearOci1Controller;