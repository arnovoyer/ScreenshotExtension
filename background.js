const CAPTURE_PREFIX = 'screenshot-mockup-capture:';

let captureInProgress = false;

function getStorageArea() {
    return browser.storage.session || browser.storage.local;
}

function createCaptureId() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }

    return `capture-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function storageKey(id) {
    return `${CAPTURE_PREFIX}${id}`;
}

async function storeCapture(payload) {
    const id = createCaptureId();
    await getStorageArea().set({ [storageKey(id)]: payload });
    return id;
}

async function openEditorTab(captureId) {
    const url = browser.runtime.getURL(`editor.html?id=${encodeURIComponent(captureId)}`);
    await browser.tabs.create({ url, active: true });
}

async function handleCapture() {
    if (captureInProgress) {
        throw new Error('Ein Screenshot wird bereits verarbeitet.');
    }

    captureInProgress = true;

    try {
        const imageData = await browser.tabs.captureVisibleTab(null, { format: 'png' });
        const captureId = await storeCapture({ imageData, createdAt: Date.now() });
        await openEditorTab(captureId);
        return { ok: true, captureId };
    } finally {
        captureInProgress = false;
    }
}

browser.runtime.onMessage.addListener((message) => {
    if (!message || message.type !== 'START_CAPTURE') {
        return undefined;
    }

    return handleCapture().catch((error) => ({
        ok: false,
        error: error?.message || 'Screenshot konnte nicht erstellt werden.'
    }));
});