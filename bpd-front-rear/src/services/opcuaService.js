// /services/OpcuaService.js
const { OPCUAClient, AttributeIds, ClientSubscription, TimestampsToReturn } = require("node-opcua");
const logger = require('../utils/logger');
const { Sequelize, where } = require("sequelize");
const { db, sequelizeInstances } = require("../../config/sequelize");
const { Op } = Sequelize;

class OpcuaService {
    constructor(config, machineName) {
        this.client = OPCUAClient.create({ endpointMustExist: false });
        this.config = config;
        this.machineName = machineName;
        this.session = null;
        this.lastRejectCount = 0;
    }

    async connect() {
        try {
            await this.client.connect(this.config.endpoint);
            this.session = await this.client.createSession();
            logger.info(`[${this.machineName}] Connection and session created successfully.`);
            this.client.on("backoff", (retry, delay) => logger.info(`[${this.machineName}] Reconnecting... attempt #${retry}, next try in ${delay / 1000}s`));
        } catch (error) {
            logger.error(`[${this.machineName}] Connection failed:`, error.message);
            throw error;
        }
    }

    async startMonitoring(onDataChangedCallback) {
        if (!this.session) throw new Error("Cannot start monitoring without a session.");

        try {
            const subscription = await ClientSubscription.create(this.session, this.config.subscription);
            
            const initialData = await this.session.read({ nodeId: this.config.nodeIds.reject, attributeId: AttributeIds.Value });
            this.lastRejectCount = initialData.value.value || 0;
            logger.info(`[${this.machineName}] Initial reject count: ${this.lastRejectCount}`);

            const monitoredItem = await subscription.monitor(
                { nodeId: this.config.nodeIds.reject, attributeId: AttributeIds.Value },
                this.config.monitor,
                TimestampsToReturn.Both
            );

            monitoredItem.on("changed", (dataValue) => {
                const currentRejectCount = dataValue.value.value;
                let diff = 0;
                
                if (currentRejectCount < this.lastRejectCount) {
                    logger.warn(`[${this.machineName}] Counter reset detected! From: ${this.lastRejectCount}, To: ${currentRejectCount}`);
                    diff = currentRejectCount;
                } else {
                    diff = currentRejectCount - this.lastRejectCount;
                }

                if (diff > 0) {
                    onDataChangedCallback(diff);
                }
                this.lastRejectCount = currentRejectCount;
            });

            logger.info(`[${this.machineName}] Monitoring reject count node successfully.`);

        } catch (error) {
            logger.error(`[${this.machineName}] Failed to start monitoring:`, error.message);
            throw error;
        }
    }

    async getInspectionData(diff) {
        const frontNodes = this.config.nodeIds.front.slice(0, diff);
        const rearNodes = this.config.nodeIds.rear.slice(0, diff);

        const nodesToRead = [
            ...frontNodes.map(nodeId => ({ nodeId, attributeId: AttributeIds.Value })),
            ...rearNodes.map(nodeId => ({ nodeId, attributeId: AttributeIds.Value }))
        ];

        if (nodesToRead.length === 0) {
            return [];
        }

        try {
            const results = await this.session.read(nodesToRead);
            const processedData = [];

            const date = new Date();
            for (let i = 0; i < diff; i++) {
                const time = date.getTime();
                processedData.push({
                    epochtime: time,
                    counter: this.lastRejectCount - diff + i + 1,
                    front: results[i].value.value,
                    rear: results[i + diff].value.value,
                    delta: Math.abs(results[i].value.value - results[i + diff].value.value),
                    // frontNodeId: frontNodes[i],
                    // rearNodeId: rearNodes[i],
                });
            }
            return processedData;
        } catch (error) {
            logger.error(`[${this.machineName}] Error reading front/rear nodes:`, error.message);
            return [];
        }
    }

    async saveRejectFrontRear(payload, machine) {
        const t = await sequelizeInstances.nodeRed.transaction();
        const aio = machine === 'oci1' ? db.aioIotOci1 : db.aioIotOci2;

        try {
            const prodidentity = await aio.mstProdidentity.findOne({
                attributes: ['lotno', 'prod_order'],
                where: { isActive: 'ACTIVE' },
                order: [['id', 'DESC']]
            });

            const frontRear = machine === 'oci1' ? db.nodeRed.frontRearBpdOci1 : db.nodeRed.frontRearBpdOci2;
            const bulkData = payload.map(data => ({
                lotno: prodidentity ? prodidentity.lotno : null,
                pro: prodidentity ? prodidentity.prod_order : null,
                epochtime: data.epochtime,
                counter: data.counter,
                front: data.front,
                rear: data.rear,
                delta: data.delta,
            }));
            const result = await frontRear.bulkCreate(bulkData, { transaction: t });
            await t.commit();
            logger.info(`[${this.machineName}] Data saved successfully.`);
            return true;
        } catch (err) {
            logger.error(`[${machine}] Error save data reject: ${err}`)
            await t.rollback();
            return false;
        }
    }

    async disconnect() {
        try {
            if (this.session) await this.session.close();
            await this.client.disconnect();
            logger.info(`[${this.machineName}] Disconnected.`);
        } catch (error) {
            logger.error(`[${this.machineName}] Error during disconnection:`, error.message);
        }
    }
}

module.exports = OpcuaService;