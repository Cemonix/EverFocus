import type { YouTubeSettings, ScheduleBlock, BlockerSettings } from './types/settings';
import { defaultSettings, defaultBlockerSettings } from './types/settings';

// Site blocker state
let cachedBlockerSettings: BlockerSettings = { ...defaultBlockerSettings };

function normalizeBlockerSettings(settings: BlockerSettings | undefined | null): BlockerSettings {
    if (!settings) {
        return { ...defaultBlockerSettings };
    }
    return {
        ...defaultBlockerSettings,
        ...settings,
        blockedSites: Array.isArray(settings.blockedSites) ? [...settings.blockedSites] : []
    };
}

async function loadBlockerSettings(): Promise<void> {
    try {
        const result = await chrome.storage.sync.get(['blockerSettings']);
        cachedBlockerSettings = normalizeBlockerSettings(result.blockerSettings as BlockerSettings);
    } catch (error) {
        console.error('Failed to load blocker settings:', error);
    }
}

function isBlockedSite(url: string, blockedSites: string[]): boolean {
    try {
        const hostname = new URL(url).hostname.toLowerCase();
        return blockedSites.some(site => {
            const normalized = site.trim().toLowerCase()
                .replace(/^https?:\/\//, '')
                .replace(/^www\./, '')
                .split('/')[0]!
                .split(':')[0]!;
            return hostname === normalized || hostname === 'www.' + normalized;
        });
    } catch {
        return false;
    }
}

async function isInGracePeriod(hostname: string): Promise<boolean> {
    try {
        const result = await chrome.storage.local.get(['gracePeriods']);
        const gracePeriods: Record<string, number> = (result.gracePeriods || {}) as Record<string, number>;
        const expiry = gracePeriods[hostname];
        if (expiry && Date.now() < expiry) {
            return true;
        }
        if (expiry) {
            delete gracePeriods[hostname];
            await chrome.storage.local.set({ gracePeriods });
        }
        return false;
    } catch {
        return false;
    }
}

async function grantGracePeriod(url: string, gracePeriodMinutes: number): Promise<void> {
    const hostname = new URL(url).hostname.toLowerCase();
    const result = await chrome.storage.local.get(['gracePeriods']);
    const gracePeriods: Record<string, number> = (result.gracePeriods || {}) as Record<string, number>;
    gracePeriods[hostname] = Date.now() + (gracePeriodMinutes * 60 * 1000);
    await chrome.storage.local.set({ gracePeriods });
}

function redirectToCooldown(tabId: number, originalUrl: string, cooldownSeconds: number): void {
    const cooldownUrl = chrome.runtime.getURL(
        `cooldown.html?url=${encodeURIComponent(originalUrl)}&cooldown=${cooldownSeconds}`
    );
    chrome.tabs.update(tabId, { url: cooldownUrl });
}

async function handleBlockingForUrl(tabId: number, urlToCheck: string): Promise<boolean> {
    if (!urlToCheck || urlToCheck.startsWith('chrome-extension://') || urlToCheck.startsWith('chrome://')) {
        return false;
    }

    let settingsToUse = cachedBlockerSettings;
    try {
        const result = await chrome.storage.sync.get(['blockerSettings']);
        settingsToUse = normalizeBlockerSettings(result.blockerSettings as BlockerSettings);
        cachedBlockerSettings = settingsToUse;
    } catch (error) {
        console.error('Failed to read blocker settings for navigation:', error);
    }

    if (settingsToUse.enabled && isBlockedSite(urlToCheck, settingsToUse.blockedSites)) {
        const hostname = new URL(urlToCheck).hostname.toLowerCase();
        const inGrace = await isInGracePeriod(hostname);
        if (!inGrace) {
            redirectToCooldown(tabId, urlToCheck, settingsToUse.cooldownSeconds);
            return true;
        }
    }

    return false;
}

// Track active YouTube tab and time
let activeYouTubeTabId: number | null = null;
let sessionStartTime: number | null = null;
let lastUpdateTime: number = Date.now();
let sessionTotalTime: number = 0; // milliseconds
let notificationShown: boolean = false;

// Get current date string (YYYY-MM-DD)
function getCurrentDateString(): string {
    const date = new Date().toISOString().split('T')[0];
    return date || '';
}

// Check if current time is within a schedule block
function isWithinScheduleBlock(blocks: ScheduleBlock[]): boolean {
    const now = new Date();
    const currentDay = now.getDay(); // 0-6 (Sunday-Saturday)
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    return blocks.some(block => {
        if (!block.days.includes(currentDay)) return false;
        return currentTime >= block.startTime && currentTime <= block.endTime;
    });
}

// Update daily usage in storage
async function updateDailyUsage(minutesToAdd: number) {
    try {
        const result = await chrome.storage.sync.get(['youtubeSettings']);
        const settings: YouTubeSettings = (result.youtubeSettings as YouTubeSettings) || defaultSettings;

        const today = getCurrentDateString();
        const currentUsage = settings.dailyUsage[today] || 0;
        settings.dailyUsage[today] = currentUsage + (minutesToAdd * 60 * 1000); // convert to ms

        // Keep only last 30 days of data
        const dates = Object.keys(settings.dailyUsage).sort();
        if (dates.length > 30) {
            const oldDates = dates.slice(0, dates.length - 30);
            oldDates.forEach(date => delete settings.dailyUsage[date]);
        }

        await chrome.storage.sync.set({ youtubeSettings: settings });
    } catch (error) {
        console.error('Failed to update daily usage:', error);
    }
}

// Check if daily limit is exceeded
async function checkDailyLimit(): Promise<boolean> {
    try {
        const result = await chrome.storage.sync.get(['youtubeSettings']);
        const settings: YouTubeSettings = (result.youtubeSettings as YouTubeSettings) || defaultSettings;

        if (!settings.dailyLimitEnabled) return false;

        const today = getCurrentDateString();
        const todayUsage = settings.dailyUsage[today] || 0;
        const limitMs = settings.dailyLimitMinutes * 60 * 1000;

        return todayUsage >= limitMs;
    } catch (error) {
        console.error('Failed to check daily limit:', error);
        return false;
    }
}

// Check if session warning should be shown
async function checkSessionWarning(): Promise<boolean> {
    try {
        const result = await chrome.storage.sync.get(['youtubeSettings']);
        const settings: YouTubeSettings = (result.youtubeSettings as YouTubeSettings) || defaultSettings;

        if (!settings.sessionWarningEnabled || notificationShown) return false;

        const sessionMinutes = sessionTotalTime / (60 * 1000);
        return sessionMinutes >= settings.sessionWarningMinutes;
    } catch (error) {
        console.error('Failed to check session warning:', error);
        return false;
    }
}

// Show notification
function showNotification(title: string, message: string) {
    chrome.notifications.create({
        type: 'basic',
        iconUrl: 'logo_128.png',
        title: title,
        message: message
    });
}

// Start tracking time for active YouTube tab
function startTracking(tabId: number) {
    activeYouTubeTabId = tabId;
    sessionStartTime = Date.now();
    lastUpdateTime = Date.now();
    console.log('Started tracking YouTube tab:', tabId);
}

// Stop tracking and save time
async function stopTracking() {
    if (!activeYouTubeTabId || !sessionStartTime) return;

    const now = Date.now();
    const elapsed = now - lastUpdateTime;
    sessionTotalTime += elapsed;

    // Save every minute of accumulated time
    const minutesElapsed = Math.floor(sessionTotalTime / (60 * 1000));
    if (minutesElapsed > 0) {
        await updateDailyUsage(minutesElapsed);
        sessionTotalTime = sessionTotalTime % (60 * 1000); // keep remainder
    }

    activeYouTubeTabId = null;
    sessionStartTime = null;
    lastUpdateTime = Date.now();
    console.log('Stopped tracking YouTube');
}

// Update tracking (called periodically)
async function updateTracking() {
    if (!activeYouTubeTabId || !sessionStartTime) return;

    const now = Date.now();
    const elapsed = now - lastUpdateTime;
    sessionTotalTime += elapsed;
    lastUpdateTime = now;

    // Check session warning
    if (await checkSessionWarning()) {
        showNotification(
            'EverFocus: Session Warning',
            'You\'ve been watching YouTube for a while. Time for a break?'
        );
        notificationShown = true;
    }

    // Check daily limit
    if (await checkDailyLimit()) {
        showNotification(
            'EverFocus: Daily Limit Reached',
            'You\'ve reached your daily YouTube time limit!'
        );
        // Optionally redirect tab here
    }

    // Save time every minute
    const minutesElapsed = Math.floor(sessionTotalTime / (60 * 1000));
    if (minutesElapsed > 0) {
        await updateDailyUsage(minutesElapsed);
        sessionTotalTime = sessionTotalTime % (60 * 1000);
    }
}

function isYouTubeUrl(url: string | undefined): boolean {
    if (!url) return false;
    try {
        const hostname = new URL(url).hostname.toLowerCase();
        return (hostname === 'youtube.com' || hostname.endsWith('.youtube.com'))
            && hostname !== 'music.youtube.com';
    } catch {
        return false;
    }
}

// Check if tab is YouTube
async function isYouTubeTab(tabId: number): Promise<boolean> {
    try {
        const tab = await chrome.tabs.get(tabId);
        return isYouTubeUrl(tab.url);
    } catch {
        return false;
    }
}

// Handle tab activation
chrome.tabs.onActivated.addListener(async (activeInfo) => {
    const isYouTube = await isYouTubeTab(activeInfo.tabId);

    if (isYouTube) {
        if (activeYouTubeTabId !== activeInfo.tabId) {
            await stopTracking();
            startTracking(activeInfo.tabId);
            notificationShown = false; // reset for new session
        }
    } else {
        await stopTracking();
    }
});

// Handle tab updates (URL changes)
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    // Determine URL to check: prefer changeInfo.url, fall back to tab.url on loading
    const urlToCheck = changeInfo.url || (changeInfo.status === 'loading' ? tab.url : null);

    if (urlToCheck && (await handleBlockingForUrl(tabId, urlToCheck))) {
        return;
    }

    if (changeInfo.status === 'complete' && tab.active) {
        const isYouTube = isYouTubeUrl(tab.url);

        if (isYouTube) {
            if (activeYouTubeTabId !== tabId) {
                await stopTracking();
                startTracking(tabId);
                notificationShown = false;
            }
        } else if (activeYouTubeTabId === tabId) {
            await stopTracking();
        }
    }
});

// Handle SPA/history navigations that may not trigger tabs.onUpdated
chrome.webNavigation.onCommitted.addListener(async (details) => {
    if (details.tabId >= 0 && details.url) {
        await handleBlockingForUrl(details.tabId, details.url);
    }
});

chrome.webNavigation.onHistoryStateUpdated.addListener(async (details) => {
    if (details.tabId >= 0 && details.url) {
        await handleBlockingForUrl(details.tabId, details.url);
    }
});

// Handle tab removal
chrome.tabs.onRemoved.addListener(async (tabId) => {
    if (activeYouTubeTabId === tabId) {
        await stopTracking();
    }
});

// Handle window focus changes
chrome.windows.onFocusChanged.addListener(async (windowId) => {
    if (windowId === chrome.windows.WINDOW_ID_NONE) {
        // Browser lost focus
        await stopTracking();
    } else {
        // Browser gained focus, check active tab
        try {
            const tabs = await chrome.tabs.query({ active: true, windowId: windowId });
            if (tabs[0]) {
                const isYouTube = isYouTubeUrl(tabs[0].url);
                if (isYouTube) {
                    startTracking(tabs[0].id!);
                    notificationShown = false;
                }
            }
        } catch (error) {
            console.error('Failed to query tabs:', error);
        }
    }
});

// Periodic update every 10 seconds
setInterval(updateTracking, 10000);

// Alarms
chrome.alarms.create('scheduleCheck', { periodInMinutes: 1 });
chrome.alarms.create('graceCleanup', { periodInMinutes: 5 });

chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === 'scheduleCheck') {
        try {
            const result = await chrome.storage.sync.get(['youtubeSettings']);
            const settings: YouTubeSettings = (result.youtubeSettings as YouTubeSettings) || defaultSettings;

            if (settings.scheduleEnabled && isWithinScheduleBlock(settings.scheduleBlocks)) {
                // Block YouTube during scheduled time (exclude YouTube Music)
                const allYtTabs = await chrome.tabs.query({ url: '*://*.youtube.com/*' });
                const tabs = allYtTabs.filter(tab => isYouTubeUrl(tab.url));
                tabs.forEach(tab => {
                    if (tab.id) {
                        chrome.tabs.update(tab.id, {
                            url: chrome.runtime.getURL('index.html')
                        });
                    }
                });

                showNotification(
                    'EverFocus: Scheduled Block Active',
                    'YouTube is blocked during your scheduled focus time.'
                );
            }
        } catch (error) {
            console.error('Failed to check schedule:', error);
        }
    }

    if (alarm.name === 'graceCleanup') {
        try {
            const result = await chrome.storage.local.get(['gracePeriods']);
            const gracePeriods = (result.gracePeriods || {}) as Record<string, number>;
            const now = Date.now();
            let changed = false;
            for (const hostname of Object.keys(gracePeriods)) {
                if (gracePeriods[hostname]! < now) {
                    delete gracePeriods[hostname];
                    changed = true;
                }
            }
            if (changed) {
                await chrome.storage.local.set({ gracePeriods });
            }
        } catch (error) {
            console.error('Failed to clean up grace periods:', error);
        }
    }
});

// Handle cooldown completion messages
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === 'COOLDOWN_COMPLETE' && message.url) {
        grantGracePeriod(message.url, cachedBlockerSettings.gracePeriodMinutes)
            .then(() => sendResponse({ success: true }))
            .catch(() => sendResponse({ success: false }));
        return true; // keep message channel open for async response
    }
});

// Keep blocker settings cache in sync
chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'sync' && changes.blockerSettings) {
        cachedBlockerSettings = normalizeBlockerSettings(changes.blockerSettings.newValue as BlockerSettings);
    }
});

// Initialize on install
chrome.runtime.onInstalled.addListener(async () => {
    const result = await chrome.storage.sync.get(['youtubeSettings', 'blockerSettings']);
    if (!result.youtubeSettings) {
        await chrome.storage.sync.set({ youtubeSettings: defaultSettings });
    }
    if (!result.blockerSettings) {
        await chrome.storage.sync.set({ blockerSettings: defaultBlockerSettings });
    }
    await loadBlockerSettings();
});

console.log('EverFocus background script loaded');
loadBlockerSettings();
