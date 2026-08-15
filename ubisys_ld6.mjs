/**
 * Zigbee2MQTT External Converter for ubisys LD6 LED Controller
 * 
 * This converter provides support for the ubisys LD6 6-channel LED controller.
 * It uses a hybrid approach: ModernExtend for core logic, and dynamic exposes 
 * to correctly reflect the device's current configuration.
 */

import * as m from 'zigbee-herdsman-converters/lib/modernExtend';
import * as exposes from 'zigbee-herdsman-converters/lib/exposes';
import { Zcl } from 'zigbee-herdsman';
import { Buffer } from 'buffer';

const e = exposes.presets || (exposes.default && exposes.default.presets) || exposes;
const ea = exposes.access || (exposes.default && exposes.default.access);

const UBISYS_MANUFACTURER_CODE = Zcl.ManufacturerCode.UBISYS_TECHNOLOGIES_GMBH;

// Output configurations from the technical reference
const OUTPUT_CONFIGURATIONS = {
    '1x_dimmable': { description: '1x Dimmable (mono)', data: [[0x10, 0xff, 0xff, 0xff, 0xff, 0xff], [0x00, 0xff, 0xff, 0xff, 0xff, 0xff], [0x00, 0xff, 0xff, 0xff, 0xff, 0xff], [0x00, 0xff, 0xff, 0xff, 0xff, 0xff], [0x00, 0xff, 0xff, 0xff, 0xff, 0xff], [0x00, 0xff, 0xff, 0xff, 0xff, 0xff]] },
    '1x_cct': { description: '1x CCT / Tunable White', data: [[0x11, 0xfe, 0x42, 0x50, 0xd9, 0x52], [0x12, 0xfe, 0xb9, 0x75, 0x1d, 0x69], [0x00, 0xff, 0xff, 0xff, 0xff, 0xff], [0x00, 0xff, 0xff, 0xff, 0xff, 0xff], [0x00, 0xff, 0xff, 0xff, 0xff, 0xff], [0x00, 0xff, 0xff, 0xff, 0xff, 0xff]] },
    '1x_rgb': { description: '1x RGB Color', data: [[0x13, 0x47, 0x06, 0xb1, 0xef, 0x4e], [0x14, 0xa0, 0x39, 0x1d, 0x82, 0xd3], [0x15, 0x42, 0xc6, 0x1f, 0xcc, 0x0e], [0x00, 0xff, 0xff, 0xff, 0xff, 0xff], [0x00, 0xff, 0xff, 0xff, 0xff, 0xff], [0x00, 0xff, 0xff, 0xff, 0xff, 0xff]] },
    '1x_rgbw': { description: '1x RGBW', data: [[0x13, 0x47, 0x06, 0xb1, 0xef, 0x4e], [0x14, 0xa0, 0x39, 0x1d, 0x82, 0xd3], [0x15, 0x42, 0xc6, 0x1f, 0xcc, 0x0e], [0x11, 0xfe, 0x64, 0x61, 0x72, 0x60], [0x00, 0xff, 0xff, 0xff, 0xff, 0xff], [0x00, 0xff, 0xff, 0xff, 0xff, 0xff]] },
    '1x_rgbww': { description: '1x RGBWW', data: [[0x13, 0x47, 0x06, 0xb1, 0xef, 0x4e], [0x14, 0xa0, 0x39, 0x1d, 0x82, 0xd3], [0x15, 0x42, 0xc6, 0x1f, 0xcc, 0x0e], [0x11, 0xfe, 0x42, 0x50, 0xd9, 0x52], [0x12, 0xfe, 0xb9, 0x75, 0x1d, 0x69], [0x00, 0xff, 0xff, 0xff, 0xff, 0xff]] },
    '1x_cct_1x_rgb': { description: '1x CCT + 1x RGB', data: [[0x11, 0xfe, 0x42, 0x50, 0xd9, 0x52], [0x12, 0xfe, 0xb9, 0x75, 0x1d, 0x69], [0x53, 0x47, 0x06, 0xb1, 0xef, 0x4e], [0x54, 0xa0, 0x39, 0x1d, 0x82, 0xd3], [0x55, 0x42, 0xc6, 0x1f, 0xcc, 0x0e], [0x00, 0xff, 0xff, 0xff, 0xff, 0xff]] },
    '1x_rgb_1x_cct': { description: '1x RGB + 1x CCT', data: [[0x13, 0x47, 0x06, 0xb1, 0xef, 0x4e], [0x14, 0xa0, 0x39, 0x1d, 0x82, 0xd3], [0x15, 0x42, 0xc6, 0x1f, 0xcc, 0x0e], [0x51, 0xfe, 0x42, 0x50, 0xd9, 0x52], [0x52, 0xfe, 0xb9, 0x75, 0x1d, 0x69], [0x00, 0xff, 0xff, 0xff, 0xff, 0xff]] },
    '1x_rgbw_1x_cct': { description: '1x RGBW + 1x CCT', data: [[0x13, 0x47, 0x06, 0xb1, 0xef, 0x4e], [0x14, 0xa0, 0x39, 0x1d, 0x82, 0xd3], [0x15, 0x42, 0xc6, 0x1f, 0xcc, 0x0e], [0x11, 0xfe, 0x64, 0x61, 0x72, 0x60], [0x51, 0xfe, 0x42, 0x50, 0xd9, 0x52], [0x52, 0xfe, 0xb9, 0x75, 0x1d, 0x69]] },
    '2x_dimmable': { description: '2x Dimmable (mono)', data: [[0x10, 0xff, 0xff, 0xff, 0xff, 0xff], [0x50, 0xff, 0xff, 0xff, 0xff, 0xff], [0x00, 0xff, 0xff, 0xff, 0xff, 0xff], [0x00, 0xff, 0xff, 0xff, 0xff, 0xff], [0x00, 0xff, 0xff, 0xff, 0xff, 0xff], [0x00, 0xff, 0xff, 0xff, 0xff, 0xff]] },
    '2x_cct': { description: '2x CCT / Tunable White', data: [[0x11, 0xfe, 0x42, 0x50, 0xd9, 0x52], [0x12, 0xfe, 0xb9, 0x75, 0x1d, 0x69], [0x51, 0xfe, 0x42, 0x50, 0xd9, 0x52], [0x52, 0xfe, 0xb9, 0x75, 0x1d, 0x69], [0x00, 0xff, 0xff, 0xff, 0xff, 0xff], [0x00, 0xff, 0xff, 0xff, 0xff, 0xff]] },
    '2x_rgb': { description: '2x RGB Color', data: [[0x13, 0x47, 0x06, 0xb1, 0xef, 0x4e], [0x14, 0xa0, 0x39, 0x1d, 0x82, 0xd3], [0x15, 0x42, 0xc6, 0x1f, 0xcc, 0x0e], [0x53, 0x47, 0x06, 0xb1, 0xef, 0x4e], [0x54, 0xa0, 0x39, 0x1d, 0x82, 0xd3], [0x55, 0x42, 0xc6, 0x1f, 0xcc, 0x0e]] },
    '3x_cct': { description: '3x CCT / Tunable White', data: [[0x11, 0xfe, 0x42, 0x50, 0xd9, 0x52], [0x12, 0xfe, 0xb9, 0x75, 0x1d, 0x69], [0x51, 0xfe, 0x42, 0x50, 0xd9, 0x52], [0x52, 0xfe, 0xb9, 0x75, 0x1d, 0x69], [0x61, 0xfe, 0x42, 0x50, 0xd9, 0x52], [0x62, 0xfe, 0xb9, 0x75, 0x1d, 0x69]] },
    '3x_dimmable': { description: '3x Dimmable (mono)', data: [[0x10, 0xff, 0xff, 0xff, 0xff, 0xff], [0x50, 0xff, 0xff, 0xff, 0xff, 0xff], [0x60, 0xff, 0xff, 0xff, 0xff, 0xff], [0x00, 0xff, 0xff, 0xff, 0xff, 0xff], [0x00, 0xff, 0xff, 0xff, 0xff, 0xff], [0x00, 0xff, 0xff, 0xff, 0xff, 0xff]] },
    '4x_dimmable': { description: '4x Dimmable (mono)', data: [[0x10, 0xff, 0xff, 0xff, 0xff, 0xff], [0x50, 0xff, 0xff, 0xff, 0xff, 0xff], [0x60, 0xff, 0xff, 0xff, 0xff, 0xff], [0x70, 0xff, 0xff, 0xff, 0xff, 0xff], [0x00, 0xff, 0xff, 0xff, 0xff, 0xff], [0x00, 0xff, 0xff, 0xff, 0xff, 0xff]] },
    '5x_dimmable': { description: '5x Dimmable (mono)', data: [[0x10, 0xff, 0xff, 0xff, 0xff, 0xff], [0x50, 0xff, 0xff, 0xff, 0xff, 0xff], [0x60, 0xff, 0xff, 0xff, 0xff, 0xff], [0x70, 0xff, 0xff, 0xff, 0xff, 0xff], [0x80, 0xff, 0xff, 0xff, 0xff, 0xff], [0x00, 0xff, 0xff, 0xff, 0xff, 0xff]] },
    '6x_dimmable': { description: '6x Dimmable (mono)', data: [[0x10, 0xff, 0xff, 0xff, 0xff, 0xff], [0x50, 0xff, 0xff, 0xff, 0xff, 0xff], [0x60, 0xff, 0xff, 0xff, 0xff, 0xff], [0x70, 0xff, 0xff, 0xff, 0xff, 0xff], [0x80, 0xff, 0xff, 0xff, 0xff, 0xff], [0x90, 0xff, 0xff, 0xff, 0xff, 0xff]] },
};

const fzOutputConfiguration = {
    cluster: 'manuSpecificUbisysDeviceSetup',
    type: ['attributeReport', 'readResponse'],
    convert: (model, msg, publish, options, meta) => {
        if (msg.data.outputConfigurations) {
            const configs = msg.data.outputConfigurations;
            const elements = configs.map(buf => [buf.length, ...buf]);
            const raw = Buffer.from([0x48, 0x41, configs.length & 0xFF, (configs.length >> 8) & 0xFF, ...elements.flat()]).toString('hex');
            return {
                output_configuration_raw: raw,
                calibration_current: decodeCalibration(configs),
            };
        }
    },
};

// toZigbee converter for the 'output_mode' enum
const tzOutputConfiguration = {
    key: ['output_mode'],
    convertSet: async (entity, key, value, meta) => {
        const config = OUTPUT_CONFIGURATIONS[value];
        if (!config) throw new Error(`Unknown mode: ${value}`);

        // Write all 6 output slots to the device at once
        await writeSetupAttribute(meta.device, 0x0010, config.data);

        // Read back the configuration so 'exposes' can update immediately
        try {
            await getSetupEndpoint(meta.device).read('manuSpecificUbisysDeviceSetup', ['outputConfigurations']);
        } catch (e) {
            // Ignore but log.
            console.error(e);
        }

        return { state: { output_mode: value } };
    },
};

/**
 * Converts CIE xy coordinates to Mireds using McCamy's formula.
 * @param {number} x - CIE x coordinate
 * @param {number} y - CIE y coordinate
 * @returns {number} Mireds (1,000,000 / CCT)
 */
function xyToMireds(x, y) {
    const n = (x - 0.3320) / (0.1858 - y);
    const cct = 449 * Math.pow(n, 3) + 3525 * Math.pow(n, 2) + 6823.3 * n + 5520.33;
    return Math.round(1000000 / cct);
}

/**
 * Approximates the Planckian locus point for a color temperature (Kim et al.
 * cubic spline approximation, CIE 1931; valid for 1667K-25000K). Reproduces
 * the ubisys built-in white reference points to within ~1e-3.
 * @param {number} kelvin - Color temperature in Kelvin
 * @returns {{x: number, y: number}} CIE 1931 chromaticity coordinates
 */
function cctToXy(kelvin) {
    const T = kelvin;
    let x;
    if (T <= 4000) {
        x = -0.2661239e9 / T ** 3 - 0.2343589e6 / T ** 2 + 0.8776956e3 / T + 0.179910;
    } else {
        x = -3.0258469e9 / T ** 3 + 2.1070379e6 / T ** 2 + 0.2226347e3 / T + 0.240390;
    }
    let y;
    if (T <= 2222) {
        y = -1.1063814 * x ** 3 - 1.34811020 * x ** 2 + 2.18555832 * x - 0.20219683;
    } else if (T <= 4000) {
        y = -0.9549476 * x ** 3 - 1.37418593 * x ** 2 + 2.09137015 * x - 0.16748867;
    } else {
        y = 3.0817580 * x ** 3 - 5.87338670 * x ** 2 + 3.75112997 * x - 0.37001483;
    }
    return { x, y };
}

// Low nibble of a channel's type byte; the high nibble is the logical endpoint.
const CHANNEL_FUNCTIONS = { 0: 'mono', 1: 'cool_white', 2: 'warm_white', 3: 'red', 4: 'green', 5: 'blue' };

/**
 * Decodes OutputConfigurations into per-channel entries, in the same shape the
 * `calibration` field accepts — so a value read back can be edited and written
 * again. Coordinates keep enough precision to re-encode to the same bytes.
 * @param {Array<Buffer>} configs - Attribute value, one octet string per channel
 * @returns {Array<object>} One entry per channel
 */
function decodeCalibration(configs) {
    return configs.map((buf, i) => {
        const el = Buffer.from(buf);
        const channel = i + 1;
        if (el[0] === 0x00) return { channel, type: 'disabled' };

        const fn = el[0] & 0x0F;
        const entry = {
            channel,
            type: CHANNEL_FUNCTIONS[fn] ?? `unknown_0x${el[0].toString(16).padStart(2, '0')}`,
            endpoint: (el[0] >> 4) & 0x0F,
        };
        // 0xFF marks an unset intensity, 0xFFFF an unset coordinate
        if (el[1] !== 0xFF) entry.flux = el[1];
        const x = el[2] | (el[3] << 8);
        const y = el[4] | (el[5] << 8);
        if (x !== 0xFFFF && y !== 0xFFFF) {
            entry.x = Number((x / 65536).toFixed(6));
            entry.y = Number((y / 65536).toFixed(6));
        }
        return entry;
    });
}

/**
 * Validates one calibration entry and resolves the "cct" convenience form into
 * x/y coordinates. Mutates the entry in place.
 * @param {object} cal - Single calibration entry
 */
function validateCalibrationEntry(cal) {
    if (!cal || typeof cal !== 'object' || Array.isArray(cal)) {
        throw new Error('Each calibration entry must be a JSON object');
    }
    if (!Number.isInteger(cal.channel) || cal.channel < 1 || cal.channel > 6) {
        throw new Error('Calibration must specify an integer "channel" between 1 and 6');
    }
    if (cal.cct !== undefined) {
        // Convenience form: derive the Planckian locus xy from a CCT,
        // e.g. {"channel": 5, "cct": 3000} for a 3000K warm white.
        if (cal.x !== undefined || cal.y !== undefined) {
            throw new Error('Calibration accepts either "cct" or "x"/"y", not both');
        }
        if (typeof cal.cct !== 'number' || cal.cct < 1667 || cal.cct > 25000) {
            throw new Error('Calibration "cct" must be a number between 1667 and 25000 (Kelvin)');
        }
        const xy = cctToXy(cal.cct);
        cal.x = xy.x;
        cal.y = xy.y;
    }
    if (cal.flux !== undefined && (!Number.isInteger(cal.flux) || cal.flux < 0 || cal.flux > 254)) {
        throw new Error('Calibration "flux" must be an integer between 0 and 254');
    }
    for (const coord of ['x', 'y']) {
        if (cal[coord] !== undefined && (typeof cal[coord] !== 'number' || cal[coord] < 0 || cal[coord] > 1)) {
            throw new Error(`Calibration "${coord}" must be a number between 0 and 1`);
        }
    }
}

/**
 * Safely retrieves the ubisys device setup endpoint (232).
 * @param {Device} device - zigbee-herdsman device object
 * @returns {Endpoint} The setup endpoint or throws if not found.
 */
function getSetupEndpoint(device) {
    const ep = device.getEndpoint(232);
    if (!ep) throw new Error('ubisys setup endpoint (232) not found');
    return ep;
}

/**
 * Writes a structured attribute to the manufacturer-specific setup cluster.
 * @param {Device} device - zigbee-herdsman device
 * @param {number} attrId - Attribute ID (e.g., 0x0010 for outputConfigurations)
 * @param {Array} elements - Array elements (Buffers for OCTET_STR, numbers for DATA8)
 * @param {number} elementType - Zcl.DataType of the array elements (default: OCTET_STR)
 */
async function writeSetupAttribute(device, attrId, elements, elementType = Zcl.DataType.OCTET_STR) {
    const endpoint = getSetupEndpoint(device);
    await endpoint.writeStructured('manuSpecificUbisysDeviceSetup', [{
        attrId, selector: {}, dataType: Zcl.DataType.ARRAY,
        elementData: { elementType, elements }
    }]);
}

const definition = {
    zigbeeModel: ['LD6'],
    model: 'LD6',
    vendor: 'ubisys',
    description: 'Zigbee/Bluetooth LED controller with 6 configurable outputs',
    endpoint: (device) => {
        return {
            l1: 1, l2: 5, l3: 6, l4: 7, l5: 8, l6: 9,
            s1: 2, s2: 3, s3: 4, setup: 232,
        };
    },
    meta: {
        multiEndpoint: true,
    },
    extend: [
        ...[1, 5, 6, 7, 8, 9].map(epNum => {
            const name = epNum === 1 ? 'l1' : `l${epNum === 5 ? 2 : epNum - 3}`;
            return {
                ...m.light({
                    endpointName: name,
                    colorTemp: { range: [133, 556] },
                    color: true,
                }),
                exposes: [], // Suppress static exposes
            };
        }),
        m.deviceAddCustomCluster('manuSpecificUbisysDeviceSetup', {
            name: 'manuSpecificUbisysDeviceSetup',
            ID: 0xfc00,
            attributes: {
                inputConfigurations: { name: 'inputConfigurations', ID: 0x0000, type: Zcl.DataType.ARRAY, write: true },
                inputActions: { name: 'inputActions', ID: 0x0001, type: Zcl.DataType.ARRAY, write: true },
                outputConfigurations: { name: 'outputConfigurations', ID: 0x0010, type: Zcl.DataType.ARRAY, write: true },
            },
            commands: {}, commandsResponse: {},
        }),
        m.deviceAddCustomCluster('lightingColorCtrl', {
            name: 'lightingColorCtrl',
            ID: Zcl.Clusters.lightingColorCtrl.ID,
            attributes: {
                advancedOptions: { name: 'advancedOptions', ID: 0x0000, type: Zcl.DataType.BITMAP8, manufacturerCode: UBISYS_MANUFACTURER_CODE, write: true },
            },
            commands: {}, commandsResponse: {},
        }),
        m.deviceAddCustomCluster('genLevelCtrl', {
            name: 'genLevelCtrl',
            ID: Zcl.Clusters.genLevelCtrl.ID,
            attributes: {
                // options, onOffTransitionTime and startUpCurrentLevel are already part of
                // the standard genLevelCtrl definition; only the manufacturer-specific
                // MinimumOnLevel needs to be added here
                minimumOnLevel: { name: 'minimumOnLevel', ID: 0x0000, type: Zcl.DataType.UINT8, manufacturerCode: UBISYS_MANUFACTURER_CODE, write: true },
            },
            commands: {}, commandsResponse: {},
        }),
        {
            fromZigbee: [
                fzOutputConfiguration,
                {
                    cluster: 'manuSpecificUbisysDeviceSetup',
                    type: ['attributeReport', 'readResponse'],
                    convert: (model, msg, publish, options, meta) => {
                        const result = {};
                        // InputConfigurations elements are 8-bit data (0x08); herdsman parses them as plain numbers
                        if (msg.data.inputConfigurations !== undefined) result.input_configurations = msg.data.inputConfigurations;
                        if (msg.data.inputActions !== undefined) result.input_actions = msg.data.inputActions.map(b => b.toString('hex'));
                        return result;
                    },
                },
                {
                    cluster: 'lightingColorCtrl',
                    type: ['attributeReport', 'readResponse'],
                    convert: (model, msg, publish, options, meta) => {
                        if (msg.data.advancedOptions !== undefined) {
                            const val = msg.data.advancedOptions;
                            return {
                                advanced_options_no_color_white: (val & 0x01) > 0,
                                advanced_options_no_first_white_color: (val & 0x02) > 0,
                                advanced_options_no_second_white_color: (val & 0x04) > 0,
                            };
                        }
                    },
                },
                {
                    cluster: 'genLevelCtrl',
                    type: ['attributeReport', 'readResponse'],
                    convert: (model, msg, publish, options, meta) => {
                        const result = {};
                        if (msg.data.minimumOnLevel !== undefined) result.minimum_on_level = msg.data.minimumOnLevel;
                        if (msg.data.options !== undefined) result.execute_if_off = !!(msg.data.options & 1);
                        if (msg.data.onOffTransitionTime !== undefined) result.on_off_transition_time = msg.data.onOffTransitionTime;
                        if (msg.data.startUpCurrentLevel !== undefined) result.startup_level = msg.data.startUpCurrentLevel;
                        return result;
                    },
                },
                {
                    cluster: 'lightingBallastCfg',
                    type: ['attributeReport', 'readResponse'],
                    convert: (model, msg, publish, options, meta) => {
                        const result = {};
                        if (msg.data.minLevel !== undefined) result.ballast_min_level = msg.data.minLevel;
                        if (msg.data.maxLevel !== undefined) result.ballast_max_level = msg.data.maxLevel;
                        return result;
                    },
                },
            ],
            toZigbee: [
                tzOutputConfiguration,
                {
                    key: ['output_configuration'],
                    convertSet: async (entity, key, value, meta) => {
                        // Parse a raw hex string back into individual OCTET_STR elements for the array
                        const payload = Buffer.from(value, 'hex');
                        const data = [];
                        let offset = 4; // Skip the raw prefix [0x48, 0x41, 0x06, 0x00]
                        while (offset < payload.length) {
                            const len = payload[offset];
                            data.push(payload.slice(offset + 1, offset + 1 + len));
                            offset += len + 1;
                        }
                        await writeSetupAttribute(meta.device, 0x0010, data);
                        return { state: { output_configuration_raw: value } };
                    },
                    convertGet: async (entity, key, meta) => {
                        await getSetupEndpoint(meta.device).read('manuSpecificUbisysDeviceSetup', ['outputConfigurations']);
                    },
                },
                {
                    key: ['input_configurations'],
                    convertSet: async (entity, key, value, meta) => {
                        // InputConfigurations is an array of 8-bit data (0x08), one byte per physical input
                        if (!Array.isArray(value) || value.some(v => !Number.isInteger(v) || v < 0 || v > 0xff)) {
                            throw new Error('input_configurations must be an array of bytes (0-255), e.g. [0, 0, 0]');
                        }
                        await writeSetupAttribute(meta.device, 0x0000, value, Zcl.DataType.DATA8);
                        return { state: { input_configurations: value } };
                    },
                    convertGet: async (entity, key, meta) => {
                        await getSetupEndpoint(meta.device).read('manuSpecificUbisysDeviceSetup', ['inputConfigurations']);
                    },
                },
                {
                    key: ['input_actions'],
                    convertSet: async (entity, key, value, meta) => {
                        const data = value.map(val => Buffer.from(val, 'hex'));
                        await writeSetupAttribute(meta.device, 0x0001, data);
                        return { state: { input_actions: value } };
                    },
                    convertGet: async (entity, key, meta) => {
                        await getSetupEndpoint(meta.device).read('manuSpecificUbisysDeviceSetup', ['inputActions']);
                    },
                },
                {
                    key: [
                        'advanced_options_no_color_white', 'advanced_options_no_first_white_color', 'advanced_options_no_second_white_color',
                    ],
                    convertSet: async (entity, key, value, meta) => {
                        // Read-modify-write on the device value: Z2M's cached state can be
                        // stale for the other bits (changed via Dev console or the ubisys
                        // app). Bits #3..#7 are reserved (manual 6.4.8.1) and must be
                        // written as 0, so the result is masked to the three defined bits.
                        const bitMapping = [
                            'advanced_options_no_color_white',
                            'advanced_options_no_first_white_color',
                            'advanced_options_no_second_white_color',
                        ];
                        const resp = await entity.read('lightingColorCtrl', ['advancedOptions'], { manufacturerCode: UBISYS_MANUFACTURER_CODE });
                        const current = (resp && resp.advancedOptions) || 0;
                        const bit = 1 << bitMapping.indexOf(key);
                        const val = (value ? current | bit : current & ~bit) & 0x07;
                        await entity.write('lightingColorCtrl', { advancedOptions: val }, { manufacturerCode: UBISYS_MANUFACTURER_CODE });
                        return { state: Object.fromEntries(bitMapping.map((k, i) => [k, (val & (1 << i)) > 0])) };
                    },
                    convertGet: async (entity, key, meta) => {
                        await entity.read('lightingColorCtrl', ['advancedOptions'], { manufacturerCode: UBISYS_MANUFACTURER_CODE });
                    },
                },
                {
                    key: ['minimum_on_level', 'on_off_transition_time', 'startup_level', 'execute_if_off'],
                    convertSet: async (entity, key, value, meta) => {
                        if (key === 'minimum_on_level') {
                            await entity.write('genLevelCtrl', { minimumOnLevel: value }, { manufacturerCode: UBISYS_MANUFACTURER_CODE });
                        } else if (key === 'on_off_transition_time') {
                            await entity.write('genLevelCtrl', { onOffTransitionTime: value });
                        } else if (key === 'startup_level') {
                            await entity.write('genLevelCtrl', { startUpCurrentLevel: value });
                        } else if (key === 'execute_if_off') {
                            await entity.write('genLevelCtrl', { options: value ? 1 : 0 });
                        }
                        return { state: { [key]: value } };
                    },
                    convertGet: async (entity, key, meta) => {
                        if (key === 'minimum_on_level') {
                            await entity.read('genLevelCtrl', ['minimumOnLevel'], { manufacturerCode: UBISYS_MANUFACTURER_CODE });
                        } else if (key === 'on_off_transition_time') {
                            await entity.read('genLevelCtrl', ['onOffTransitionTime']);
                        } else if (key === 'startup_level') {
                            await entity.read('genLevelCtrl', ['startUpCurrentLevel']);
                        } else if (key === 'execute_if_off') {
                            await entity.read('genLevelCtrl', ['options']);
                        }
                    },
                },
                {
                    key: ['ballast_min_level', 'ballast_max_level'],
                    convertSet: async (entity, key, value, meta) => {
                        if (key === 'ballast_min_level') {
                            await entity.write('lightingBallastCfg', { minLevel: value });
                        } else if (key === 'ballast_max_level') {
                            await entity.write('lightingBallastCfg', { maxLevel: value });
                        }
                        return { state: { [key]: value } };
                    },
                    convertGet: async (entity, key, meta) => {
                        if (key === 'ballast_min_level') {
                            await entity.read('lightingBallastCfg', ['minLevel']);
                        } else if (key === 'ballast_max_level') {
                            await entity.read('lightingBallastCfg', ['maxLevel']);
                        }
                    },
                },
                {
                    key: ['calibration', 'calibration_current'],
                    convertSet: async (entity, key, value, meta) => {
                        if (key === 'calibration_current') {
                            throw new Error('calibration_current is read-only; write to "calibration" instead');
                        }
                        let parsed;
                        try {
                            if (!value || (typeof value === 'string' && value.trim() === '')) {
                                throw new Error('Empty or missing calibration value');
                            }
                            parsed = typeof value === 'string' ? JSON.parse(value) : value;
                        } catch (err) {
                            throw new Error(`Invalid calibration JSON: ${err.message}. Expected format: {"channel": 1..6, "x": 0..1, "y": 0..1, "flux": 0..254} or {"channel": 1..6, "cct": 1667..25000, "flux": 0..254}, or an array of those to calibrate several channels at once`);
                        }

                        // A single object calibrates one channel; an array calibrates
                        // several within one read-modify-write, so a strip never ends
                        // up half-calibrated and concurrent writes cannot race.
                        const entries = Array.isArray(parsed) ? parsed : [parsed];
                        if (entries.length === 0) {
                            throw new Error('Calibration array must contain at least one entry');
                        }

                        const byChannel = new Map();
                        for (const cal of entries) {
                            validateCalibrationEntry(cal);
                            if (byChannel.has(cal.channel)) {
                                throw new Error(`Calibration lists channel ${cal.channel} more than once`);
                            }
                            byChannel.set(cal.channel, cal);
                        }

                        const setupEp = getSetupEndpoint(meta.device);
                        const resp = await setupEp.read('manuSpecificUbisysDeviceSetup', ['outputConfigurations']);
                        if (!resp || !resp.outputConfigurations) {
                            throw new Error('Could not read current output configurations from device');
                        }

                        for (const channel of byChannel.keys()) {
                            if (channel > resp.outputConfigurations.length) {
                                throw new Error(`Device reports ${resp.outputConfigurations.length} channels; cannot calibrate channel ${channel}`);
                            }
                        }

                        // Modify only the requested channels in the existing configuration array
                        const elements = resp.outputConfigurations.map((buf, i) => {
                            const el = Buffer.from(buf);
                            const cal = byChannel.get(i + 1);
                            if (cal) {
                                if (cal.flux !== undefined) el[1] = cal.flux;
                                // CIE 1931 coordinates are value * 65536, little-endian,
                                // valid range 0..65279 (0xFFFF denotes invalid/unknown)
                                if (cal.x !== undefined) {
                                    const x = Math.min(65279, Math.round(cal.x * 65536));
                                    el[2] = x & 0xFF;
                                    el[3] = (x >> 8) & 0xFF;
                                }
                                if (cal.y !== undefined) {
                                    const y = Math.min(65279, Math.round(cal.y * 65536));
                                    el[4] = y & 0xFF;
                                    el[5] = (y >> 8) & 0xFF;
                                }
                            }
                            return el;
                        });

                        await writeSetupAttribute(meta.device, 0x0010, elements);
                        const channels = [...byChannel.keys()].sort((a, b) => a - b).join(', ');
                        return {
                            state: {
                                calibration_status: `Updated channel${byChannel.size > 1 ? 's' : ''} ${channels}`,
                                calibration_current: decodeCalibration(elements),
                            },
                        };
                    },
                    convertGet: async (entity, key, meta) => {
                        // The read response is decoded into calibration_current by fzOutputConfiguration
                        await getSetupEndpoint(meta.device).read('manuSpecificUbisysDeviceSetup', ['outputConfigurations']);
                    },
                }
            ],
            isModernExtend: true,
        }
    ],
    exposes: (device, options) => {
        let exposesList = [];
        try {
            // Validate presets availability
            if (!e || !ea) {
                console.error('ubisys_ld6: Exposes presets not found. Library import failed?');
                return [];
            }

            // Global device settings

            exposesList.push(e.enum('output_mode', ea.SET, Object.keys(OUTPUT_CONFIGURATIONS)));
            exposesList.push(e.text('output_configuration', ea.SET));
            exposesList.push(e.text('output_configuration_raw', ea.STATE));
            exposesList.push(e.numeric('ballast_min_level', ea.ALL).withValueMin(1).withValueMax(254));
            exposesList.push(e.numeric('ballast_max_level', ea.ALL).withValueMin(1).withValueMax(254));
            // on_off_transition_time moved to per-endpoint loop
            exposesList.push(e.binary('advanced_options_no_color_white', ea.ALL, true, false)
                .withDescription('Compose CT-mode white only from the white channels; narrows the CT range to the calibrated whites. The firmware applies this fully only at boot: power-cycle the device after changing, then restart Z2M (see README).'));
            exposesList.push(e.binary('advanced_options_no_first_white_color', ea.ALL, true, false)
                .withDescription('Exclude the first (cool) white from color rendering. Power-cycle the device after changing.'));
            exposesList.push(e.binary('advanced_options_no_second_white_color', ea.ALL, true, false)
                .withDescription('Exclude the second (warm) white from color rendering. Power-cycle the device after changing.'));
            exposesList.push(e.numeric('minimum_on_level', ea.ALL).withValueMin(1).withValueMax(254));
            exposesList.push(e.list('input_configurations', ea.ALL, e.numeric('value', ea.ALL)));
            exposesList.push(e.list('input_actions', ea.ALL, e.text('value', ea.ALL)));
            exposesList.push(e.text('calibration', ea.SET)
                .withDescription('Calibrate the primaries: one entry, or an array of entries, one per channel.'));
            exposesList.push(e.list('calibration_current', ea.STATE_GET, e.text('entry', ea.STATE))
                .withDescription('Current calibration, in the shape "calibration" accepts — read it, edit it, write it back.'));
            exposesList.push(e.text('calibration_status', ea.STATE));

            /**
             * Dynamic Feature Probing
             * The LD6 can be anything from 6 dimmers to 1 RGBWW + 1 CCT. 
             * We check the actual clusters and attributes on each endpoint to 
             * decide which controls to show in the UI.
             */


            if (device && typeof device.getEndpoint === 'function') {
                const setupEp = device.getEndpoint(232);
                // Read current PWM config to derive physical CCT limits
                const outputConfigs = setupEp?.getClusterAttributeValue('manuSpecificUbisysDeviceSetup', 'outputConfigurations');

                [1, 5, 6, 7, 8, 9].forEach(epNum => {
                    const ep = device.getEndpoint(epNum);
                    if (ep) {
                        const name = epNum === 1 ? 'l1' : `l${epNum === 5 ? 2 : epNum - 3}`;
                        let colorCapabilities, physMinMireds, physMaxMireds;
                        try {
                            if (ep.supportsInputCluster('lightingColorCtrl')) {
                                colorCapabilities = ep.getClusterAttributeValue('lightingColorCtrl', 'colorCapabilities');
                                physMinMireds = ep.getClusterAttributeValue('lightingColorCtrl', 'colorTempPhysicalMin');
                                physMaxMireds = ep.getClusterAttributeValue('lightingColorCtrl', 'colorTempPhysicalMax');
                            }
                        } catch (e) { /* ignore */ }

                        // 1. Determine capabilities from Output Configuration (if available)
                        // This is more reliable than waiting for attributes to be read, as we know exactly how we configured the device.
                        let configHasColorTemp = false;
                        let configHasColorXY = false;
                        let cwMireds, wwMireds;

                        if (outputConfigs) {
                            outputConfigs.forEach((buf) => {
                                const el = Buffer.from(buf);
                                const epFunc = el[0];
                                const channelEp = (epFunc >> 4) & 0x0F;
                                const func = epFunc & 0x0F;
                                if (channelEp === epNum) {
                                    // Determine capabilities based on function
                                    if (func === 1 || func === 2) configHasColorTemp = true; // CW or WW
                                    if (func >= 3 && func <= 9) configHasColorXY = true;     // Color channels

                                    // Collect calibration data for range calculation
                                    if (func === 1 || func === 2) {
                                        const x = (el[2] | (el[3] << 8)) / 65536;
                                        const y = (el[4] | (el[5] << 8)) / 65536;
                                        const mireds = xyToMireds(x, y);
                                        if (func === 1) cwMireds = mireds;
                                        if (func === 2) wwMireds = mireds;
                                    }
                                }
                            });
                        }

                        // 2. Decide exposed features (Priority: Explicit Capability > Configured Mode > Attribute Presence)
                        const hasColorTemp = (colorCapabilities !== undefined) ? (colorCapabilities & 0x10) : (configHasColorTemp || (ep.getClusterAttributeValue('lightingColorCtrl', 'colorTemperature') !== undefined));
                        const hasColorXY = (colorCapabilities !== undefined) ? (colorCapabilities & 0x08) : (configHasColorXY || (ep.getClusterAttributeValue('lightingColorCtrl', 'currentX') !== undefined));
                        const hasBrightness = ep.supportsInputCluster('genLevelCtrl');
                        const hasOnOff = ep.supportsInputCluster('genOnOff');

                        // 3. Expose provisions
                        if (hasColorTemp) {
                            // Prefer the range the device itself reports: the Versalight engine
                            // widens it beyond the physical whites (RGB-assisted CT) and narrows
                            // it when AdvancedOptions bit #0 is set. Fall back to the range
                            // derived from the configured white primaries.
                            let range = [133, 556]; // Fallback: measured device-reported range with full RGB mixing
                            if (physMinMireds && physMaxMireds) {
                                range = [physMinMireds, physMaxMireds];
                            } else if (cwMireds && wwMireds) {
                                range = [Math.min(cwMireds, wwMireds), Math.max(cwMireds, wwMireds)];
                            }

                            if (hasColorXY) {
                                exposesList.push(e.light_brightness_colortemp_colorxy(range).withEndpoint(name));
                            } else {
                                exposesList.push(e.light_brightness_colortemp(range).withEndpoint(name));
                            }
                        } else if (hasColorXY) {
                            exposesList.push(e.light_brightness_colorxy().withEndpoint(name));
                        } else if (hasBrightness) {
                            exposesList.push(e.light_brightness().withEndpoint(name));
                        } else if (hasOnOff) {
                            exposesList.push(e.light_onoff().withEndpoint(name));
                        }

                        // Expose transition time and startup level for this endpoint
                        exposesList.push(e.numeric('on_off_transition_time', ea.ALL).withUnit('0.1s').withValueMin(0).withValueMax(65535).withEndpoint(name));
                        exposesList.push(e.numeric('startup_level', ea.ALL).withValueMin(0).withValueMax(254).withEndpoint(name));
                        exposesList.push(e.binary('execute_if_off', ea.ALL, true, false).withEndpoint(name));
                    }
                });
            } else {
                // Fallback for when device is not yet fully available (e.g. definition loading)
                // Expose all 6 endpoints with maximum capabilities to ensure they are available in the UI
                [1, 5, 6, 7, 8, 9].forEach(epNum => {
                    const name = epNum === 1 ? 'l1' : `l${epNum === 5 ? 2 : epNum - 3}`;
                    // Default to most capable light type so user can at least see controls
                    exposesList.push(e.light_brightness_colortemp_colorxy([133, 556]).withEndpoint(name));
                    exposesList.push(e.numeric('on_off_transition_time', ea.ALL).withUnit('0.1s').withValueMin(0).withValueMax(65535).withEndpoint(name));
                    exposesList.push(e.numeric('startup_level', ea.ALL).withValueMin(0).withValueMax(254).withEndpoint(name));
                    exposesList.push(e.binary('execute_if_off', ea.ALL, true, false).withEndpoint(name));
                });
            }
        } catch (err) {
            console.error('ubisys_ld6: Error in exposes function:', err);
        }
        return exposesList;
    },
    configure: async (device, coordinatorEndpoint, definition) => {
        const setupEp = device.getEndpoint(232);
        if (setupEp) {
            /** 
             * Read the current PWM configuration on startup. 
             * This allows 'exposes' to correctly calculate CCT ranges even 
             * before the user makes any changes.
             */
            try { await setupEp.read('manuSpecificUbisysDeviceSetup', ['outputConfigurations']); } catch (e) { console.warn(`ubisys LD6: Failed to read outputConfigurations: ${e.message}`); }
        }

        // Proactively read color capabilities for all potential endpoints to ensure UI is correct
        for (const epNum of [1, 5, 6, 7, 8, 9]) {
            const ep = device.getEndpoint(epNum);
            if (ep) {
                try {
                    // Start with basic on/off/level
                    await ep.read('genOnOff', ['onOff']);
                    await ep.read('genLevelCtrl', ['currentLevel']);

                    // Check color capabilities if cluster exists
                    if (ep.supportsInputCluster('lightingColorCtrl')) {
                        await ep.read('lightingColorCtrl', ['colorCapabilities', 'colorTemperature', 'colorTempPhysicalMin', 'colorTempPhysicalMax']);
                    }
                    if (ep.supportsInputCluster('lightingBallastCfg')) {
                        await ep.read('lightingBallastCfg', ['minLevel', 'maxLevel']);
                    }
                    await ep.read('genLevelCtrl', ['startUpCurrentLevel', 'options']);
                } catch (e) { console.warn(`ubisys LD6: Failed to configure endpoint ${epNum}: ${e.message}`); }
            }
        }
    },
    onEvent: async (type, data, device) => {
        // The LD6 recomputes colorTempPhysicalMin/Max (and its effective CT
        // clamping) only at boot, from the active mixing mode and the white
        // calibration. Refresh the cached values on every device announce so
        // the next exposes recalculation (Z2M restart) picks up the current
        // range.
        if (type === 'deviceAnnounce') {
            for (const ep of device.endpoints) {
                if (ep.supportsInputCluster('lightingColorCtrl')) {
                    try {
                        await ep.read('lightingColorCtrl', ['colorCapabilities', 'colorTempPhysicalMin', 'colorTempPhysicalMax']);
                    } catch (e) {
                        // Device may still be waking up; configure or the next announce will retry.
                    }
                }
            }
        }
    },
    ota: true,
};

export default definition;
