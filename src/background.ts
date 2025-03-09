chrome.webNavigation.onBeforeNavigate.addListener(
    (details: chrome.webNavigation.WebNavigationParentedCallbackDetails) => {
    console.log('Navigating to:', details.url);
    
    // Example: Check if URL is in blocked list
    if (details.url.includes('youtube.com')) {
        // You can implement blocking logic here
        console.log('This site should be blocked');
    }
});