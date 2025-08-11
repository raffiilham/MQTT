const oci1Controller = require('./frontRearOci1Controller');
const oci2Controller = require('./frontRearOci2Controller');

const controllers = {
    oci1: oci1Controller,
    oci2: oci2Controller,
};

module.exports = (machineName, config) => {
    const ControllerClass = controllers[machineName];
    if (!ControllerClass) {
        throw new Error(`No controller found for machine: ${machineName}`);
    }
    return new ControllerClass(config);
};