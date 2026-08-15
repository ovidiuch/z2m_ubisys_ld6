import assert from 'node:assert/strict';
import definition from './ubisys_ld6.mjs';

// Defaults for 1x_rgbww: [type, intensity, x_lo, x_hi, y_lo, y_hi] per channel
const RGBWW = [
    [0x13, 0x47, 0x06, 0xb1, 0xef, 0x4e],
    [0x14, 0xa0, 0x39, 0x1d, 0x82, 0xd3],
    [0x15, 0x42, 0xc6, 0x1f, 0xcc, 0x0e],
    [0x11, 0xfe, 0x42, 0x50, 0xd9, 0x52],
    [0x12, 0xfe, 0xb9, 0x75, 0x1d, 0x69],
    [0x00, 0xff, 0xff, 0xff, 0xff, 0xff],
];

const calibration = definition.extend
    .flatMap((ext) => ext.toZigbee ?? [])
    .find((tz) => tz.key?.includes('calibration'));
assert.ok(calibration, 'calibration converter not found');

function makeDevice(config = RGBWW) {
    const calls = { reads: 0, writes: [] };
    const endpoint = {
        read: async () => {
            calls.reads++;
            return { outputConfigurations: config.map((el) => Buffer.from(el)) };
        },
        writeStructured: async (_cluster, records) => {
            calls.writes.push(records[0].elementData.elements.map((b) => Buffer.from(b)));
        },
    };
    return { device: { getEndpoint: (id) => (id === 232 ? endpoint : null) }, calls };
}

const set = (value, config) => {
    const { device, calls } = makeDevice(config);
    return calibration.convertSet(null, 'calibration', value, { device }).then((r) => ({ ...calls, result: r }));
};
const hex = (buf) => [...buf].map((b) => b.toString(16).padStart(2, '0')).join(' ');

const tests = {
    async 'array calibrates every channel in a single read and write'() {
        const { reads, writes, result } = await set([
            { channel: 1, x: 0.6926, y: 0.3069, flux: 51 },
            { channel: 2, x: 0.1342, y: 0.7164, flux: 121 },
            { channel: 3, x: 0.1381, y: 0.0535, flux: 25 },
            { channel: 4, x: 0.3108, y: 0.3267, flux: 254 },
            { channel: 5, x: 0.5263, y: 0.4137, flux: 188 },
        ]);
        assert.equal(reads, 1, 'expected exactly one read');
        assert.equal(writes.length, 1, 'expected exactly one write');
        assert.deepEqual(writes[0].map(hex), [
            '13 33 4e b1 91 4e',
            '14 79 5b 22 66 b7',
            '15 19 5b 23 b2 0d',
            '11 fe 91 4f a3 53',
            '12 bc bc 86 e8 69',
            '00 ff ff ff ff ff', // unused channel untouched
        ]);
        assert.equal(result.state.calibration_status, 'Updated channels 1, 2, 3, 4, 5');
    },

    async 'single object still works and touches only its channel'() {
        const { writes, result } = await set({ channel: 3, flux: 25 });
        assert.equal(hex(writes[0][2]), '15 19 c6 1f cc 0e', 'flux patched, coordinates kept');
        assert.equal(hex(writes[0][0]), '13 47 06 b1 ef 4e', 'other channels untouched');
        assert.equal(result.state.calibration_status, 'Updated channel 3');
    },

    async 'JSON string payloads are accepted'() {
        const { writes } = await set('[{"channel": 1, "flux": 51}, {"channel": 2, "flux": 121}]');
        assert.equal(writes[0][0][1], 51);
        assert.equal(writes[0][1][1], 121);
    },

    async 'cct entries resolve to Planckian coordinates'() {
        const { writes } = await set([{ channel: 5, cct: 2000 }]);
        const el = writes[0][4];
        const x = (el[3] << 8 | el[2]) / 65536;
        const y = (el[5] << 8 | el[4]) / 65536;
        assert.ok(Math.abs(x - 0.5269) < 0.001, `x=${x}`);
        assert.ok(Math.abs(y - 0.4133) < 0.001, `y=${y}`);
    },

    async 'a duplicate channel is rejected before writing'() {
        const { device, calls } = makeDevice();
        await assert.rejects(
            calibration.convertSet(null, 'calibration', [{ channel: 1, flux: 10 }, { channel: 1, flux: 20 }], { device }),
            /channel 1 more than once/,
        );
        assert.equal(calls.writes.length, 0, 'nothing must be written');
    },

    async 'one invalid entry rejects the whole batch'() {
        const { device, calls } = makeDevice();
        await assert.rejects(
            calibration.convertSet(null, 'calibration', [{ channel: 1, flux: 51 }, { channel: 2, flux: 300 }], { device }),
            /"flux" must be an integer between 0 and 254/,
        );
        assert.equal(calls.writes.length, 0, 'no half-calibrated strip');
    },

    async 'a channel the device does not expose is rejected'() {
        const { device, calls } = makeDevice(RGBWW.slice(0, 2));
        await assert.rejects(
            calibration.convertSet(null, 'calibration', [{ channel: 5, flux: 51 }], { device }),
            /Device reports 2 channels/,
        );
        assert.equal(calls.writes.length, 0);
    },

    async 'an empty array is rejected'() {
        const { device } = makeDevice();
        await assert.rejects(
            calibration.convertSet(null, 'calibration', [], { device }),
            /at least one entry/,
        );
    },
};

let failed = 0;
for (const [name, fn] of Object.entries(tests)) {
    try {
        await fn();
        console.log(`  ok   ${name}`);
    } catch (err) {
        failed++;
        console.log(`  FAIL ${name}\n       ${err.message}`);
    }
}
console.log(failed ? `\n${failed} failing` : `\n${Object.keys(tests).length} passing`);
process.exit(failed ? 1 : 0);
