document.addEventListener('DOMContentLoaded', () => {
    const captureButton = document.getElementById('capture-btn');
    const status = document.getElementById('status');

    function setStatus(message, tone = 'info') {
        status.textContent = message;
        status.className = `status ${tone === 'error' ? 'error' : tone === 'success' ? 'success' : ''}`.trim();
    }

    captureButton.addEventListener('click', async () => {
        captureButton.disabled = true;
        setStatus('Screenshot wird erstellt...');

        try {
            const response = await browser.runtime.sendMessage({ type: 'START_CAPTURE' });

            if (!response || !response.ok) {
                throw new Error(response?.error || 'Screenshot konnte nicht gestartet werden.');
            }

            setStatus('Editor-Tab geöffnet.', 'success');
            window.close();
        } catch (error) {
            setStatus(error?.message || 'Unbekannter Fehler.', 'error');
            captureButton.disabled = false;
        }
    });
});