const express = require('express');
const fs = require('fs');
const path = require('path');
const { spawn, spawnSync } = require('child_process');
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

function isLoopback(req) {
    const address = req.socket.remoteAddress || '';
    return address === '127.0.0.1' || address === '::1' || address === '::ffff:127.0.0.1';
}

let quitting = false;

// One local process serves the page and the API. Quit stops that process and closes its browser tab.
app.post('/api/quit', (req, res) => {
    if (!isLoopback(req)) {
        res.status(403).json({ error: 'Quit is only available on the local server.' });
        return;
    }
    if (quitting) {
        res.json({ ok: true });
        return;
    }
    quitting = true;
    res.json({ ok: true });
    res.on('finish', () => {
        setTimeout(() => {
            closeLocalBrowserTabs();
            server.close(() => process.exit(0));
            setTimeout(() => process.exit(0), 400).unref();
        }, 150);
    });
});

// Serve static files from the public directory
app.use(express.static('public'));

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const browserApps = ['Google Chrome', 'Chromium', 'Brave Browser', 'Microsoft Edge', 'Arc', 'Safari'];

function browserIsRunning(appName) {
    const result = spawnSync('osascript', ['-e', `tell application "System Events" to (name of processes) contains ${JSON.stringify(appName)}`], { encoding: 'utf8' });
    return result.status === 0 && result.stdout.trim() === 'true';
}

function closeTabsInBrowser(appName) {
    const needleA = `localhost:${port}`;
    const needleB = `127.0.0.1:${port}`;
    const script = `
tell application ${JSON.stringify(appName)}
    set closedCount to 0
    repeat with w in windows
        set tabIndex to (count of tabs of w)
        repeat while tabIndex > 0
            try
                set pageUrl to URL of tab tabIndex of w
                if pageUrl contains ${JSON.stringify(needleA)} or pageUrl contains ${JSON.stringify(needleB)} then
                    close tab tabIndex of w
                    set closedCount to closedCount + 1
                end if
            end try
            set tabIndex to tabIndex - 1
        end repeat
    end repeat
    return closedCount
end tell
`;
    const result = spawnSync('osascript', ['-'], { input: script, encoding: 'utf8' });
    if (result.status !== 0) {
        console.error(`[quit] Failed to close a ${appName} tab`, result.stderr.trim());
        console.log('Remedy: Close the localhost tab yourself. The server is stopping.');
        return 0;
    }
    const closed = Number.parseInt(String(result.stdout).trim(), 10);
    return Number.isFinite(closed) ? closed : 0;
}

function closeLocalBrowserTabs() {
    let closed = 0;
    browserApps.forEach((appName) => {
        if (browserIsRunning(appName)) {
            closed += closeTabsInBrowser(appName);
        }
    });
    console.log(`[quit] Closed ${closed} browser tab(s)`);
}

function openBrowser(url) {
    const child = spawn('open', [url], { stdio: 'ignore', detached: true });
    child.on('error', (error) => {
        console.error('[start] Failed to open the browser', error);
        console.log(`Remedy: Open ${url} yourself.`);
    });
    child.unref();
}

let server = app.listen(port);

server.on('listening', () => {
    const url = `http://localhost:${port}`;
    console.log(`Server running at ${url}`);
    openBrowser(url);
});

server.on('error', (error) => {
    console.error('[start] Server failed to start', error);
    console.log('Remedy: Free port 3000 or stop the process already using it, then run npm start again.');
    process.exit(1);
});
 