chrome.webNavigation.onBeforeNavigate.addListener(
    (details: chrome.webNavigation.WebNavigationParentedCallbackDetails) => {
    // Get the hostname from the URL
    const url = new URL(details.url);
    const hostname = url.hostname.replace(/^www\./, ''); // Remove www. if present

    // Check if the hostname is in blocked sites
    chrome.storage.sync.get(['blockedSites'], (result) => {
        const blockedSites = result.blockedSites || [];
        if (blockedSites.some((site: string) => {
            // Remove www. from blocked site if present
            const normalizedSite = site.replace(/^www\./, '');
            // Check for exact domain match
            return hostname === normalizedSite;
        })) {
            // Redirect to extension's blocked page
            chrome.tabs.update(details.tabId, {
                url: chrome.runtime.getURL('blocked.html')
            });
        }
    });
});