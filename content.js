let lastSelection = '';
let autoScanTimer = null;
let isScanning = false;
let resultToast = null;

function getSelectedText() {
    const selection = window.getSelection();
    if (!selection) return '';
    return selection.toString().trim();
}

function ensureResultToast() {
    if (resultToast && document.body.contains(resultToast)) return resultToast;

    resultToast = document.createElement('div');
    resultToast.id = 'balduin-result-toast';
    resultToast.style.cssText = [
        'position: fixed',
        'right: 18px',
        'bottom: 18px',
        'max-width: 420px',
        'max-height: 45vh',
        'overflow-y: auto',
        'z-index: 2147483647',
        'background: #f0f3f5',
        'border: 1px solid rgba(140, 181, 212, 0.45)',
        'border-radius: 8px',
        'box-shadow: 0 6px 24px rgba(0,0,0,0.16)',
        'font-family: Open Sans, Arial, sans-serif',
        'color: #273b4c',
        'padding: 10px 12px',
        'font-size: 12px',
        'line-height: 1.45'
    ].join(';');

    document.body.appendChild(resultToast);
    return resultToast;
}

function setToast(message, tone) {
    const toast = ensureResultToast();
    toast.innerHTML = message;
    if (tone === 'error') {
        toast.style.borderColor = 'rgba(192, 57, 43, 0.55)';
        toast.style.background = '#fff3f2';
        toast.style.color = '#8e2a20';
    } else {
        toast.style.borderColor = 'rgba(140, 181, 212, 0.45)';
        toast.style.background = '#f0f3f5';
        toast.style.color = '#273b4c';
    }
}

function getApiKey() {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get('apiKey', (result) => {
            if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
                return;
            }
            resolve((result.apiKey || '').trim());
        });
    });
}

function sendForAnswer(selectedText, apiKey) {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(
            { type: 'GET_ANSWERS', questions: [selectedText], apiKey },
            (response) => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                    return;
                }
                if (!response) {
                    reject(new Error('Keine Antwort vom Hintergrundskript.'));
                    return;
                }
                if (!response.success) {
                    reject(new Error(response.error || 'Unbekannter Fehler.'));
                    return;
                }
                resolve(response.text || 'Keine Antwort erhalten.');
            }
        );
    });
}

async function scanSelection(selectedText) {
    setToast('Analysiere Auswahl...', 'info');

    const apiKey = await getApiKey();
    if (!apiKey) {
        throw new Error('Kein API-Key gesetzt. Bitte im Popup speichern.');
    }

    const answer = await sendForAnswer(selectedText, apiKey);
    return answer;
}

function scheduleAutoScan() {
    if (autoScanTimer) clearTimeout(autoScanTimer);

    autoScanTimer = setTimeout(async () => {
        if (isScanning) return;

        const selectedText = getSelectedText();
        if (!selectedText || selectedText.length < 3) return;
        if (selectedText === lastSelection) return;

        lastSelection = selectedText;
        isScanning = true;

        try {
            const answer = await scanSelection(selectedText);
            setToast(answer.replace(/\n/g, '<br>'), 'info');
        } catch (err) {
            setToast('Error: ' + (err.message || 'Unbekannter Fehler.'), 'error');
        } finally {
            isScanning = false;
        }
    }, 220);
}

document.addEventListener('mouseup', scheduleAutoScan);
document.addEventListener('keyup', scheduleAutoScan);

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.action === 'open_overlay') {
        sendResponse({ ok: true, info: 'Auto-Modus aktiv' });
    }
});
