// background.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

    console.log("Received request:", request); // Log the incoming request
    if (request.action === 'getRules') {
        // Retrieve the rules and enabled state from local storage
        chrome.storage.local.get(['rules', 'enabled'], (result) => {
            console.log("Retrieved from storage:", result); // Log what we retrieved
            sendResponse({ rules: result.rules || [], enabled: result.enabled || false });
        });
        return true; // Keep the message channel open for sendResponse
    }

    if (request.action === 'saveRules') {
        console.log("Saving rules:", request.rules, "Enabled:", request.enabled); // Log what we are saving
        // Save new rules and enabled state to storage
        chrome.storage.local.set({ rules: request.rules, enabled: request.enabled }, () => {
            console.log("Rules saved successfully");
            sendResponse({ status: 'success' });
        });
        return true; // Keep the message channel open
    }

});
