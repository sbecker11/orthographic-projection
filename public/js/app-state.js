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
    const layout = body.layout;
    const layoutOk = layout
        && inRange(layout.width, 200, 1600)
        && inRange(layout.height, 200, 1200)
        && inRange(layout.pageZoom, 0.5, 2);
    const sliders = body.sliders;
    const slidersOk = sliders
        && inRange(sliders.zoom, 0.2, 2)
        && inRange(sliders.phi, 0, 360)
        && inRange(sliders.theta, -180, 180);
    const pointsOk = body.points.every((point) => point && isFiniteNumber(point.x) && isFiniteNumber(point.y));
    const textsOk = body.texts.every((item) => item && typeof item.text === 'string' && item.text.trim() !== '' && isFiniteNumber(item.x) && isFiniteNumber(item.y));
    return Boolean(themeOk && layoutOk && slidersOk && pointsOk && textsOk);
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { isAppState };
}
