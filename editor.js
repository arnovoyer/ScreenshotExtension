const CAPTURE_PREFIX = 'screenshot-mockup-capture:';

const STORAGE_AREA = browser.storage.session || browser.storage.local;

const DEFAULT_STATE = {
    frameStyle: 'safari',
    backgroundMode: 'gradient',
    solidColor: '#f4f7fb',
    gradientStart: '#edf2ff',
    gradientEnd: '#dbeafe',
    padding: 56,
    shadowOpacity: 0.22,
    shadowBlur: 42
};

const state = { ...DEFAULT_STATE };

const elements = {
    canvas: document.getElementById('mockupCanvas'),
    canvasWrap: document.getElementById('canvasWrap'),
    emptyState: document.getElementById('emptyState'),
    status: document.getElementById('status'),
    frameStyle: document.getElementById('frameStyle'),
    backgroundMode: document.getElementById('backgroundMode'),
    solidColor: document.getElementById('solidColor'),
    gradientStart: document.getElementById('gradientStart'),
    gradientEnd: document.getElementById('gradientEnd'),
    padding: document.getElementById('padding'),
    shadowOpacity: document.getElementById('shadowOpacity'),
    shadowBlur: document.getElementById('shadowBlur'),
    paddingValue: document.getElementById('paddingValue'),
    shadowValue: document.getElementById('shadowValue'),
    blurValue: document.getElementById('blurValue'),
    exportButton: document.getElementById('exportButton'),
    resetButton: document.getElementById('resetButton'),
    solidColorGroup: document.getElementById('solidColorGroup'),
    gradientGroup: document.getElementById('gradientGroup')
};

const ctx = elements.canvas.getContext('2d');
let sourceImage = null;

function storageKey(id) {
    return `${CAPTURE_PREFIX}${id}`;
}

function setStatus(message, tone = 'info') {
    elements.status.textContent = message;
    elements.status.className = `status ${tone === 'error' ? 'error' : tone === 'success' ? 'success' : ''}`.trim();
}

function loadImage(src) {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error('Screenshot konnte nicht geladen werden.'));
        image.src = src;
    });
}

async function readCaptureFromStorage() {
    const params = new URLSearchParams(window.location.search);
    const captureId = params.get('id');

    if (!captureId) {
        throw new Error('Keine Capture-ID in der URL gefunden.');
    }

    const result = await STORAGE_AREA.get(storageKey(captureId));
    const capture = result[storageKey(captureId)];

    if (!capture?.imageData) {
        throw new Error('Screenshot-Daten wurden nicht gefunden.');
    }

    await STORAGE_AREA.remove(storageKey(captureId));
    return capture.imageData;
}

function updateOptionVisibility() {
    elements.solidColorGroup.hidden = state.backgroundMode !== 'solid';
    elements.gradientGroup.hidden = state.backgroundMode !== 'gradient';
}

function getFrameMetrics() {
    switch (state.frameStyle) {
        case 'chrome':
            return { topBar: 82, shellRadius: 28, shellPaddingTop: 18, frameBorder: 1.5, contentRadius: 22 };
        case 'safari':
            return { topBar: 64, shellRadius: 28, shellPaddingTop: 18, frameBorder: 1.25, contentRadius: 22 };
        default:
            return { topBar: 0, shellRadius: 0, shellPaddingTop: 0, frameBorder: 0, contentRadius: 18 };
    }
}

function createRoundedRectPath(context, x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);

    context.beginPath();
    context.moveTo(x + r, y);
    context.lineTo(x + width - r, y);
    context.quadraticCurveTo(x + width, y, x + width, y + r);
    context.lineTo(x + width, y + height - r);
    context.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    context.lineTo(x + r, y + height);
    context.quadraticCurveTo(x, y + height, x, y + height - r);
    context.lineTo(x, y + r);
    context.quadraticCurveTo(x, y, x + r, y);
    context.closePath();
}

function drawBackground(context, width, height) {
    if (state.backgroundMode === 'transparent') {
        context.clearRect(0, 0, width, height);
        return;
    }

    if (state.backgroundMode === 'solid') {
        context.fillStyle = state.solidColor;
        context.fillRect(0, 0, width, height);
        return;
    }

    const gradient = context.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, state.gradientStart);
    gradient.addColorStop(1, state.gradientEnd);
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);
}

function drawFrame(context, frameX, frameY, frameWidth, frameHeight, metrics) {
    if (state.frameStyle === 'none') {
        return;
    }

    context.save();
    createRoundedRectPath(context, frameX, frameY, frameWidth, frameHeight, metrics.shellRadius);
    context.fillStyle = 'rgba(255, 255, 255, 0.92)';
    context.fill();
    context.lineWidth = metrics.frameBorder;
    context.strokeStyle = 'rgba(148, 163, 184, 0.26)';
    context.stroke();

    const topBarY = frameY;
    const topBarHeight = metrics.topBar;

    createRoundedRectPath(context, frameX, frameY, frameWidth, topBarHeight + metrics.shellPaddingTop, metrics.shellRadius);
    context.clip();

    if (state.frameStyle === 'safari') {
        context.fillStyle = 'rgba(248, 250, 252, 0.96)';
        context.fillRect(frameX, topBarY, frameWidth, topBarHeight);

        const buttonY = topBarY + 18;
        const buttonX = frameX + 18;
        const buttonRadius = 6;
        const colors = ['#ff5f57', '#febc2e', '#28c840'];

        colors.forEach((color, index) => {
            context.beginPath();
            context.fillStyle = color;
            context.arc(buttonX + index * 18, buttonY, buttonRadius, 0, Math.PI * 2);
            context.fill();
        });

        const pillWidth = Math.min(360, frameWidth * 0.54);
        const pillX = frameX + (frameWidth - pillWidth) / 2;
        const pillY = topBarY + 12;
        context.fillStyle = 'rgba(226, 232, 240, 0.92)';
        createRoundedRectPath(context, pillX, pillY, pillWidth, 30, 15);
        context.fill();
        context.fillStyle = '#475569';
        context.font = '600 12px Inter, ui-sans-serif, sans-serif';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText('screenshot-mockup.local', pillX + pillWidth / 2, pillY + 15);
    } else if (state.frameStyle === 'chrome') {
        context.fillStyle = 'rgba(245, 247, 250, 0.98)';
        context.fillRect(frameX, topBarY, frameWidth, topBarHeight);

        context.fillStyle = 'rgba(226, 232, 240, 0.95)';
        createRoundedRectPath(context, frameX + 14, topBarY + 14, 140, 34, 16);
        context.fill();
        context.fillStyle = '#475569';
        context.font = '600 11px Inter, ui-sans-serif, sans-serif';
        context.textAlign = 'left';
        context.textBaseline = 'middle';
        context.fillText('Mockup', frameX + 34, topBarY + 31);

        const controlY = topBarY + 29;
        const controlX = frameX + frameWidth - 76;
        ['#94a3b8', '#94a3b8', '#94a3b8'].forEach((color, index) => {
            context.beginPath();
            context.fillStyle = color;
            context.arc(controlX + index * 18, controlY, 3.5, 0, Math.PI * 2);
            context.fill();
        });
    }

    context.restore();
}

function drawScreenshot(context, image, canvasWidth, canvasHeight) {
    const metrics = getFrameMetrics();
    const padding = state.padding;
    const outerPadding = metrics.topBar > 0 ? Math.max(padding, 18) : padding;

    const contentX = outerPadding;
    const contentY = outerPadding + metrics.topBar;

    const frameX = metrics.topBar > 0 ? Math.max(0, outerPadding - 18) : 0;
    const frameY = metrics.topBar > 0 ? Math.max(0, outerPadding - 18) : 0;
    const frameWidth = image.naturalWidth + 36;
    const frameHeight = image.naturalHeight + metrics.topBar + 36;

    drawBackground(context, canvasWidth, canvasHeight);

    if (metrics.topBar > 0) {
        drawFrame(context, frameX, frameY, frameWidth, frameHeight, metrics);
    }

    const radius = metrics.contentRadius;
    const targetX = contentX;
    const targetY = contentY;

    context.save();
    context.shadowColor = `rgba(15, 23, 42, ${state.shadowOpacity})`;
    context.shadowBlur = state.shadowBlur;
    context.shadowOffsetY = Math.max(4, Math.round(state.shadowBlur / 5));
    context.shadowOffsetX = 0;
    createRoundedRectPath(context, targetX, targetY, image.naturalWidth, image.naturalHeight, radius);
    context.fillStyle = 'rgba(255, 255, 255, 0.001)';
    context.fill();
    context.clip();
    context.drawImage(image, targetX, targetY, image.naturalWidth, image.naturalHeight);
    context.restore();
}

function renderMockup() {
    if (!sourceImage) {
        return;
    }

    const metrics = getFrameMetrics();
    const outerPadding = metrics.topBar > 0 ? Math.max(state.padding, 18) : state.padding;
    const width = sourceImage.naturalWidth + outerPadding * 2;
    const height = sourceImage.naturalHeight + outerPadding * 2 + metrics.topBar;

    elements.canvas.width = width;
    elements.canvas.height = height;
    elements.canvas.style.aspectRatio = `${width} / ${height}`;

    drawScreenshot(ctx, sourceImage, width, height);

    elements.canvas.hidden = false;
    elements.emptyState.hidden = true;
}

function syncFields() {
    elements.frameStyle.value = state.frameStyle;
    elements.backgroundMode.value = state.backgroundMode;
    elements.solidColor.value = state.solidColor;
    elements.gradientStart.value = state.gradientStart;
    elements.gradientEnd.value = state.gradientEnd;
    elements.padding.value = String(state.padding);
    elements.shadowOpacity.value = String(state.shadowOpacity);
    elements.shadowBlur.value = String(state.shadowBlur);

    elements.paddingValue.textContent = `${state.padding} px`;
    elements.shadowValue.textContent = state.shadowOpacity.toFixed(2);
    elements.blurValue.textContent = `${state.shadowBlur} px`;

    updateOptionVisibility();
}

function wireControls() {
    elements.frameStyle.addEventListener('change', (event) => {
        state.frameStyle = event.target.value;
        renderMockup();
    });

    elements.backgroundMode.addEventListener('change', (event) => {
        state.backgroundMode = event.target.value;
        updateOptionVisibility();
        renderMockup();
    });

    elements.solidColor.addEventListener('input', (event) => {
        state.solidColor = event.target.value;
        renderMockup();
    });

    elements.gradientStart.addEventListener('input', (event) => {
        state.gradientStart = event.target.value;
        renderMockup();
    });

    elements.gradientEnd.addEventListener('input', (event) => {
        state.gradientEnd = event.target.value;
        renderMockup();
    });

    elements.padding.addEventListener('input', (event) => {
        state.padding = Number(event.target.value);
        elements.paddingValue.textContent = `${state.padding} px`;
        renderMockup();
    });

    elements.shadowOpacity.addEventListener('input', (event) => {
        state.shadowOpacity = Number(event.target.value);
        elements.shadowValue.textContent = state.shadowOpacity.toFixed(2);
        renderMockup();
    });

    elements.shadowBlur.addEventListener('input', (event) => {
        state.shadowBlur = Number(event.target.value);
        elements.blurValue.textContent = `${state.shadowBlur} px`;
        renderMockup();
    });

    elements.resetButton.addEventListener('click', () => {
        Object.assign(state, DEFAULT_STATE);
        syncFields();
        renderMockup();
    });

    elements.exportButton.addEventListener('click', async () => {
        if (!sourceImage) {
            return;
        }

        elements.exportButton.disabled = true;
        setStatus('PNG wird vorbereitet ...');

        try {
            const blob = await new Promise((resolve, reject) => {
                elements.canvas.toBlob((result) => {
                    if (!result) {
                        reject(new Error('Das PNG konnte nicht erstellt werden.'));
                        return;
                    }

                    resolve(result);
                }, 'image/png');
            });

            const url = URL.createObjectURL(blob);
            const filename = `screenshot-mockup-${new Date().toISOString().slice(0, 10)}.png`;

            await browser.downloads.download({
                url,
                filename,
                saveAs: true
            });

            setStatus('Download gestartet.', 'success');

            setTimeout(() => {
                URL.revokeObjectURL(url);
            }, 1000);
        } catch (error) {
            setStatus(error?.message || 'Export fehlgeschlagen.', 'error');
        } finally {
            elements.exportButton.disabled = false;
        }
    });
}

async function init() {
    wireControls();
    syncFields();

    try {
        const imageData = await readCaptureFromStorage();
        sourceImage = await loadImage(imageData);
        setStatus('Screenshot geladen.', 'success');
        renderMockup();
    } catch (error) {
        elements.canvas.hidden = true;
        elements.emptyState.hidden = false;
        setStatus(error?.message || 'Screenshot konnte nicht geladen werden.', 'error');
        elements.exportButton.disabled = true;
    }
}

init();