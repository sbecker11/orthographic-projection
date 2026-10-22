const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 3000;
const statePath = path.join(__dirname, 'public', 'app_state.json');

app.use(express.json());

function isFiniteNumber(value) {
    return typeof value === 'number' && Number.isFinite(value);
}

function inRange(value, min, max) {
    return isFiniteNumber(value) && value >= min && value <= max;
}

function isAppState(body) {
    if (!body || typeof body !== 'object' || !Array.isArray(body.points) || !Array.isArray(body.texts)) {
        return false;
    }
    const themeOk = body.theme === 'light' || body.theme === 'dark';
    const sliders = body.sliders;
    const slidersOk = sliders
        && inRange(sliders.zoom, 0.2, 2)
        && inRange(sliders.phi, 0, 360)
        && inRange(sliders.theta, -180, 180);
    const pointsOk = body.points.every((point) => point && isFiniteNumber(point.x) && isFiniteNumber(point.y));
    const textsOk = body.texts.every((item) => item && typeof item.text === 'string' && item.text.trim() !== '' && isFiniteNumber(item.x) && isFiniteNumber(item.y));
    return themeOk && slidersOk && pointsOk && textsOk;
}

// Local instances save point and text changes. Remote hosts only read public/app_state.json.
app.post('/api/state', (req, res) => {
    if (!isAppState(req.body)) {
        res.status(400).json({ error: 'Invalid app state. Expected { theme: "light"|"dark", sliders: {zoom, phi, theta}, points: [{x, y}], texts: [{text, x, y}] }.' });
        return;
    }
    const file = JSON.stringify(req.body, null, 2) + '\n';
    fs.writeFile(statePath, file, (err) => {
        if (err) {
            console.error('[app-state] Failed to write public/app_state.json', err);
            res.status(500).json({ error: 'Failed to write app state' });
            return;
        }
        res.json({ ok: true });
    });
});

// Serve static files from the public directory
app.use(express.static('public'));

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
}); 