chrome.webNavigation.onBeforeNavigate.addListener(
    (details: chrome.webNavigation.WebNavigationParentedCallbackDetails) => {
    // Get the hostname from the URL
    const url = new URL(details.url);
    const hostname = url.hostname.replace(/^www\./, '');

    // Check if the hostname is in blocked sites
    chrome.storage.sync.get(['blockedSites'], (result) => {
        const blockedSites = result.blockedSites || [];
        const matchingSite = blockedSites.find((site: { url: string; disabled: boolean }) => {
            const normalizedSite = (typeof site === 'string' ? site : site.url).replace(/^www\./, '');
            return hostname === normalizedSite;
        });

        if (matchingSite && !matchingSite.disabled) {
            chrome.tabs.update(details.tabId, {
                url: chrome.runtime.getURL('blocked.html')
            });
        }
    });
});