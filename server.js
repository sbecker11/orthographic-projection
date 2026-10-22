const express = require('express');
const fs = require('fs');
const path = require('path');
const { isAppState } = require('./public/js/app-state');
const app = express();
const port = 3000;
const statePath = path.join(__dirname, 'public', 'app_state.json');

app.use(express.json());

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