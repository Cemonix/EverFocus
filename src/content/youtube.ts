import type { YouTubeSettings } from '../types/settings';

// CSS styles for hiding YouTube elements
const CSS_RULES = {
    shorts: `
        /* Hide Shorts shelf on homepage */
        ytd-rich-shelf-renderer[is-shorts],
        ytd-reel-shelf-renderer,
        /* Hide Shorts tab */
        ytd-guide-entry-renderer:has(a[href*="/shorts"]),
        /* Hide individual Shorts in feeds */
        ytd-reel-item-renderer,
        /* Hide Shorts button */
        ytd-button-renderer:has(a[href*="/shorts"]) {
            display: none !important;
        }
    `,
    feed: `
        /* Hide homepage feed */
        ytd-browse[page-subtype="home"] ytd-rich-grid-renderer,
        ytd-browse[page-subtype="home"] ytd-two-column-browse-results-renderer {
            display: none !important;
        }
    `,
    sidebar: `
        /* Hide sidebar recommendations */
        #related,
        #secondary,
        ytd-watch-next-secondary-results-renderer {
            display: none !important;
        }
    `,
    comments: `
        /* Hide comments section */
        ytd-comments,
        #comments {
            display: none !important;
        }
    `,
    endScreens: `
        /* Hide end screen suggestions */
        .ytp-ce-element,
        .ytp-endscreen-content,
        .ytp-ce-element-show,
        .ytp-ce-covering-overlay,
        .ytp-ce-size-1280 {
            display: none !important;
        }
    `
};

let styleElement: HTMLStyleElement | null = null;
let currentSettings: YouTubeSettings | null = null;
let urlObserver: MutationObserver | null = null;
let scrollBlocked: boolean = false;
let scrollObserver: MutationObserver | null = null;

// Inject or update CSS based on settings
function updateStyles(settings: YouTubeSettings) {
    currentSettings = settings;

    if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = 'everfocus-youtube-styles';
        document.documentElement.appendChild(styleElement);
    }

    let css = '';
    if (settings.blockShorts) css += CSS_RULES.shorts;
    if (settings.hideFeed) css += CSS_RULES.feed;
    if (settings.hideSidebar) css += CSS_RULES.sidebar;
    if (settings.hideComments) css += CSS_RULES.comments;
    if (settings.hideEndScreens) css += CSS_RULES.endScreens;

    styleElement.textContent = css;
}

// Handle URL changes for redirects (search-only, subscriptions-only)
function handleURLChange(settings: YouTubeSettings) {
    const currentURL = window.location.href;
    const pathname = window.location.pathname;

    // Search-only mode: redirect homepage to search
    if (settings.searchOnlyMode && pathname === '/') {
        window.location.href = 'https://www.youtube.com/results';
        return;
    }

    // Subscriptions-only mode: redirect homepage to subscriptions
    if (settings.subscriptionsOnlyMode && pathname === '/') {
        window.location.href = 'https://www.youtube.com/feed/subscriptions';
        return;
    }

    // Block Shorts navigation
    if (settings.blockShorts && currentURL.includes('/shorts/')) {
        window.location.href = 'https://www.youtube.com';
        return;
    }
}

// Block infinite scroll by preventing new content from loading
function blockInfiniteScroll(enabled: boolean) {
    if (enabled && !scrollBlocked) {
        scrollBlocked = true;

        // Strategy 1: Selectively disable IntersectionObserver for video feeds only
        // Store the original IntersectionObserver
        const OriginalIntersectionObserver = window.IntersectionObserver;

        window.IntersectionObserver = function(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
            // Create a wrapper that filters out video-related observations
            const wrappedCallback: IntersectionObserverCallback = (entries, observer) => {
                // Only block observations for video continuation elements
                const filteredEntries = entries.filter(entry => {
                    const target = entry.target;
                    // Allow comments and other elements through
                    if (target.closest('ytd-comments') ||
                        target.closest('#comments') ||
                        target.id === 'comments') {
                        return true; // Allow comments to load
                    }
                    // Block video feed continuation elements
                    if (target.matches('ytd-continuation-item-renderer') ||
                        target.closest('ytd-rich-grid-renderer') ||
                        target.closest('ytd-item-section-renderer')) {
                        return false; // Block video feed loading
                    }
                    return true; // Allow everything else
                });

                if (filteredEntries.length > 0) {
                    callback(filteredEntries, observer);
                }
            };

            return new OriginalIntersectionObserver(wrappedCallback, options);
        } as any;

        // Strategy 2: Remove continuation elements and video items beyond initial load
        let initialVideoCount = 0;
        let hasCountedInitial = false;

        scrollObserver = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node instanceof HTMLElement) {
                        // Count initial videos only once
                        if (!hasCountedInitial) {
                            const videos = document.querySelectorAll('ytd-video-renderer, ytd-grid-video-renderer, ytd-rich-item-renderer');
                            if (videos.length > 10) { // Wait for some initial content
                                initialVideoCount = videos.length;
                                hasCountedInitial = true;
                                console.log('EverFocus: Locked to initial', initialVideoCount, 'videos');
                            }
                        }

                        // Remove continuation triggers (but not inside comments)
                        const continuations = node.querySelectorAll('ytd-continuation-item-renderer, yt-next-continuation-data');
                        continuations.forEach(el => {
                            if (!el.closest('ytd-comments') && !el.closest('#comments')) {
                                el.remove();
                            }
                        });

                        // Remove new videos beyond initial count
                        if (hasCountedInitial) {
                            const allVideos = document.querySelectorAll('ytd-video-renderer, ytd-grid-video-renderer, ytd-rich-item-renderer');
                            if (allVideos.length > initialVideoCount) {
                                for (let i = initialVideoCount; i < allVideos.length; i++) {
                                    allVideos[i]?.remove();
                                }
                            }
                        }
                    }
                });
            });
        });

        // Wait for body to be available
        const startObserving = () => {
            if (document.body && scrollObserver) {
                scrollObserver.observe(document.body, {
                    childList: true,
                    subtree: true
                });
            }
        };

        if (document.body) {
            startObserving();
        } else {
            document.addEventListener('DOMContentLoaded', startObserving);
        }

        // Strategy 3: Periodically clean up
        const cleanupInterval = setInterval(() => {
            // Remove continuation elements (but not inside comments)
            const continuations = document.querySelectorAll('ytd-continuation-item-renderer, yt-next-continuation-data');
            continuations.forEach(el => {
                if (!el.closest('ytd-comments') && !el.closest('#comments')) {
                    el.remove();
                }
            });

            // Remove extra videos
            if (hasCountedInitial) {
                const allVideos = document.querySelectorAll('ytd-video-renderer, ytd-grid-video-renderer, ytd-rich-item-renderer');
                if (allVideos.length > initialVideoCount) {
                    for (let i = initialVideoCount; i < allVideos.length; i++) {
                        allVideos[i]?.remove();
                    }
                }
            }
        }, 1000);

        // Store cleanup interval ID for later cleanup
        (window as any).__everfocusCleanupInterval = cleanupInterval;

    } else if (!enabled && scrollBlocked) {
        scrollBlocked = false;

        // Clean up observers
        if (scrollObserver) {
            scrollObserver.disconnect();
            scrollObserver = null;
        }

        // Clear cleanup interval
        if ((window as any).__everfocusCleanupInterval) {
            clearInterval((window as any).__everfocusCleanupInterval);
            delete (window as any).__everfocusCleanupInterval;
        }

        // Reload page to restore normal functionality
        window.location.reload();
    }
}

// Observe URL changes (YouTube is a SPA)
function observeURLChanges() {
    // Retry finding body if not available yet
    if (!document.body) {
        setTimeout(observeURLChanges, 100);
        return;
    }

    let lastURL = window.location.href;

    urlObserver = new MutationObserver(() => {
        const currentURL = window.location.href;
        if (currentURL !== lastURL) {
            lastURL = currentURL;
            if (currentSettings) {
                handleURLChange(currentSettings);
                // Re-apply scroll blocking on page changes
                blockInfiniteScroll(currentSettings.blockInfiniteScroll);
            }
        }
    });

    urlObserver.observe(document.body, {
        childList: true,
        subtree: true
    });
}

// Load settings and initialize
async function init() {
    try {
        const result = await chrome.storage.sync.get(['youtubeSettings']);
        const settings = result.youtubeSettings as YouTubeSettings;

        if (settings) {
            updateStyles(settings);
            handleURLChange(settings);
            blockInfiniteScroll(settings.blockInfiniteScroll);
        }

        // Start observing URL changes
        if (document.body) {
            observeURLChanges();
        } else {
            document.addEventListener('DOMContentLoaded', observeURLChanges);
        }

        // Listen for settings updates from popup
        chrome.storage.onChanged.addListener((changes, areaName) => {
            if (areaName === 'sync' && changes.youtubeSettings) {
                const newSettings = changes.youtubeSettings.newValue as YouTubeSettings;
                updateStyles(newSettings);
                handleURLChange(newSettings);
                blockInfiniteScroll(newSettings.blockInfiniteScroll);
            }
        });

    } catch (error) {
        console.error('EverFocus: Failed to initialize', error);
    }
}

// Run initialization
init();
