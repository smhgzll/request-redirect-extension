// content.js
function injectFetchInterceptor() {
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('requestInterceptor.js');
    script.onload = () => script.remove(); // Remove after loading
    document.documentElement.appendChild(script);
}

// Listen for messages from the requestInterceptor.js
window.addEventListener('message', (event) => {
    if (event.source !== window || event.data.type !== 'GET_SETTINGS') return;

    // Fetch the settings
    chrome.storage.local.get(['rules', 'enabled'], (result) => {
        const settings = { rules: result.rules || [], enabled: result.enabled || false };
        // Send the settings back
        window.postMessage({ type: 'SETTINGS_RESPONSE', settings: settings }, '*');
    });
});

injectFetchInterceptor();
