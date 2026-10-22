const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { describe, it } = require('node:test');
const { isAppState } = require('../public/js/app-state');

function validState() {
    return {
        theme: 'light',
        layout: { width: 500, height: 500, pageZoom: 1 },
        sliders: { zoom: 1, phi: 45, theta: 0 },
        points: [{ x: -2, y: 1.5 }],
        texts: [{ text: 'Origin', x: 0.45, y: 0.45 }]
    };
}

describe('app state', () => {
    it('accepts the committed public/app_state.json file', () => {
        const file = path.join(__dirname, '..', 'public', 'app_state.json');
        const state = JSON.parse(fs.readFileSync(file, 'utf8'));
        assert.equal(isAppState(state), true);
    });

    it('accepts an empty scene when theme and sliders are set', () => {
        const state = validState();
        state.points = [];
        state.texts = [];
        assert.equal(isAppState(state), true);
    });

    it('rejects a missing or non-object body', () => {
        assert.equal(isAppState(undefined), false);
        assert.equal(isAppState(null), false);
        assert.equal(isAppState('light'), false);
        assert.equal(isAppState([]), false);
    });
});

describe('theme', () => {
    it('accepts light and dark', () => {
        const light = validState();
        const dark = validState();
        dark.theme = 'dark';
        assert.equal(isAppState(light), true);
        assert.equal(isAppState(dark), true);
    });

    it('rejects any other theme value', () => {
        for (const theme of [undefined, null, '', 'Light', 'DARK', true, 0]) {
            const state = validState();
            state.theme = theme;
            assert.equal(isAppState(state), false, `theme ${JSON.stringify(theme)} should be rejected`);
        }
    });
});

describe('layout', () => {
    it('accepts canvas size and page zoom inside their ranges', () => {
        for (const layout of [
            { width: 200, height: 200, pageZoom: 0.5 },
            { width: 500, height: 500, pageZoom: 1 },
            { width: 1600, height: 1200, pageZoom: 2 }
        ]) {
            const state = validState();
            state.layout = layout;
            assert.equal(isAppState(state), true, `layout ${JSON.stringify(layout)} should be accepted`);
        }
    });

    it('rejects a missing layout or a value outside range', () => {
        const state = validState();
        delete state.layout;
        assert.equal(isAppState(state), false);
        for (const layout of [
            { width: 199, height: 500, pageZoom: 1 },
            { width: 1601, height: 500, pageZoom: 1 },
            { width: 500, height: 199, pageZoom: 1 },
            { width: 500, height: 1201, pageZoom: 1 },
            { width: 500, height: 500, pageZoom: 0.49 },
            { width: 500, height: 500, pageZoom: 2.01 },
            { width: 500, height: 500 }
        ]) {
            const next = validState();
            next.layout = layout;
            assert.equal(isAppState(next), false, `layout ${JSON.stringify(layout)} should be rejected`);
        }
    });
});

describe('sliders.zoom', () => {
    it('accepts the closed range 0.2 to 2', () => {
        for (const zoom of [0.2, 1, 2]) {
            const state = validState();
            state.sliders.zoom = zoom;
            assert.equal(isAppState(state), true, `zoom ${zoom} should be accepted`);
        }
    });

    it('rejects values outside 0.2 to 2 and non-numbers', () => {
        for (const zoom of [0.199, 2.001, NaN, Infinity, -Infinity, '1', null, undefined]) {
            const state = validState();
            state.sliders.zoom = zoom;
            assert.equal(isAppState(state), false, `zoom ${zoom} should be rejected`);
        }
    });
});

describe('sliders.phi', () => {
    it('accepts the closed range 0 to 360', () => {
        for (const phi of [0, 45, 360]) {
            const state = validState();
            state.sliders.phi = phi;
            assert.equal(isAppState(state), true, `phi ${phi} should be accepted`);
        }
    });

    it('rejects values outside 0 to 360 and non-numbers', () => {
        for (const phi of [-0.001, 360.001, NaN, Infinity, '45', null, undefined]) {
            const state = validState();
            state.sliders.phi = phi;
            assert.equal(isAppState(state), false, `phi ${phi} should be rejected`);
        }
    });
});

describe('sliders.theta', () => {
    it('accepts the closed range -180 to 180', () => {
        for (const theta of [-180, 0, 180]) {
            const state = validState();
            state.sliders.theta = theta;
            assert.equal(isAppState(state), true, `theta ${theta} should be accepted`);
        }
    });

    it('rejects values outside -180 to 180 and non-numbers', () => {
        for (const theta of [-180.001, 180.001, NaN, Infinity, '0', null, undefined]) {
            const state = validState();
            state.sliders.theta = theta;
            assert.equal(isAppState(state), false, `theta ${theta} should be rejected`);
        }
    });

    it('rejects a missing sliders object', () => {
        const state = validState();
        delete state.sliders;
        assert.equal(isAppState(state), false);
    });
});

describe('points', () => {
    it('accepts finite x and y', () => {
        const state = validState();
        state.points = [{ x: -2, y: 1.5 }, { x: 0, y: 0 }, { x: 2.2, y: -2 }];
        assert.equal(isAppState(state), true);
    });

    it('rejects a point that is missing or has a non-finite coordinate', () => {
        const cases = [
            undefined,
            null,
            {},
            { x: -2 },
            { y: 1.5 },
            { x: ' -2', y: 1.5 },
            { x: NaN, y: 1.5 },
            { x: -2, y: Infinity }
        ];
        for (const point of cases) {
            const state = validState();
            state.points = [point];
            assert.equal(isAppState(state), false, `point ${JSON.stringify(point)} should be rejected`);
        }
    });

    it('rejects a missing points array', () => {
        const state = validState();
        delete state.points;
        assert.equal(isAppState(state), false);
    });
});

describe('texts', () => {
    it('accepts a non-empty label with finite x and y', () => {
        const state = validState();
        state.texts = [{ text: 'Origin', x: 0.45, y: 0.45 }, { text: ' A ', x: 0, y: 0 }];
        assert.equal(isAppState(state), true);
    });

    it('rejects a blank label or a non-finite coordinate', () => {
        const cases = [
            undefined,
            null,
            {},
            { text: '', x: 0, y: 0 },
            { text: '   ', x: 0, y: 0 },
            { text: 1, x: 0, y: 0 },
            { x: 0, y: 0 },
            { text: 'Origin', y: 0.45 },
            { text: 'Origin', x: NaN, y: 0.45 },
            { text: 'Origin', x: 0.45, y: Infinity }
        ];
        for (const item of cases) {
            const state = validState();
            state.texts = [item];
            assert.equal(isAppState(state), false, `text ${JSON.stringify(item)} should be rejected`);
        }
    });

    it('rejects a missing texts array', () => {
        const state = validState();
        delete state.texts;
        assert.equal(isAppState(state), false);
    });
});
