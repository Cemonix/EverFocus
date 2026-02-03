
const params = new URLSearchParams(window.location.search);
const originalUrl = params.get('url');
const cooldownSeconds = parseInt(params.get('cooldown') || '30', 10);

const timerDisplay = document.getElementById('timer');
const proceedBtn = document.getElementById('proceed-btn') as HTMLButtonElement;
const backBtn = document.getElementById('back-btn') as HTMLButtonElement;
const siteDisplay = document.getElementById('site-name');

if (siteDisplay) {
    if (originalUrl) {
        try {
            siteDisplay.textContent = new URL(originalUrl).hostname;
        } catch {
            siteDisplay.textContent = originalUrl;
        }
    } else {
        siteDisplay.textContent = 'Unknown site';
    }
}

let remaining = cooldownSeconds;
if (timerDisplay) {
    timerDisplay.textContent = remaining.toString();
}

const interval = setInterval(() => {
    remaining--;
    if (timerDisplay) {
        timerDisplay.textContent = remaining.toString();
    }
    if (remaining <= 0) {
        clearInterval(interval);
        if (proceedBtn) {
            proceedBtn.disabled = false;
            proceedBtn.textContent = 'Proceed';
        }
    }
}, 1000);

if (proceedBtn) {
    proceedBtn.addEventListener('click', async () => {
        if (!originalUrl) return;
        proceedBtn.disabled = true;
        proceedBtn.textContent = 'Redirecting...';
        try {
            await chrome.runtime.sendMessage({
                type: 'COOLDOWN_COMPLETE',
                url: originalUrl
            });
            window.location.href = originalUrl;
        } catch (err) {
            console.error('Failed to communicate with background:', err);
            window.location.href = originalUrl;
        }
    });
}

if (backBtn) {
    backBtn.addEventListener('click', () => {
        if (window.history.length > 1) {
            window.history.back();
        } else {
            window.location.href = 'about:blank';
        }
    });
}
