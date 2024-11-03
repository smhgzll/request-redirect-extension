// requestInterceptor.js
(function () {
    const { fetch: originalFetch } = window;
    const OriginalXMLHttpRequest = window.XMLHttpRequest;

    console.log("Extension loaded...", window);

    let cachedSettings = null; // Variable to store settings

    // Function to request settings from the background script
    async function fetchSettings() {
        return new Promise((resolve) => {
            // This should trigger the message in background.js
            window.postMessage({ type: 'GET_SETTINGS' }, '*');

            // Listen for the response from the background script
            window.addEventListener('message', function handler(event) {
                if (event.source !== window || event.data.type !== 'SETTINGS_RESPONSE') return;
                window.removeEventListener('message', handler);
                resolve(event.data.settings);
            });
        });
    }

    // Pre-fetch settings
    (async () => {
        cachedSettings = await fetchSettings();
    })();

    // Interceptor for fetch requests
    window.fetch = async (...args) => {
        let [resource, config] = args;

        // Use cached settings
        if (!cachedSettings) {
            cachedSettings = await fetchSettings();
        }

        const { enabled, rules } = cachedSettings;

        if (!enabled) return originalFetch(resource, config);

        for (const rule of rules || []) {
            const pattern = new RegExp(rule.pattern);
            if (pattern.test(resource)) {
                if (rule.redirectUrl) {
                    console.log(`Redirecting fetch request from ${resource} to ${rule.redirectUrl}`);
                    resource = rule.redirectUrl;
                }

                if (rule.headers) {
                    config = config || {};
                    config.headers = {
                        ...config.headers, // Keep original headers
                        ...rule.headers,   // Override with new headers
                    };
                }
                break;
            }
        }

        return originalFetch(resource, config);
    };

    // Interceptor for XMLHttpRequest
    window.XMLHttpRequest = function() {
        const xhr = new OriginalXMLHttpRequest();
        const tempHeaders = {};
        let isOpened = false; // Flag to check if open has been called

        // Override open method to intercept the request URL
        const originalOpen = xhr.open;
        xhr.open = function(method, url, ...rest) {
            // Use cached settings
            const { enabled, rules } = cachedSettings;

            if (enabled) {
                for (const rule of rules || []) {
                    const pattern = new RegExp(rule.pattern);
                    if (pattern.test(url)) {
                        if (rule.redirectUrl) {
                            console.log(`Redirecting XHR request from ${url} to ${rule.redirectUrl}`);
                            url = rule.redirectUrl;
                        }
                        if (rule.headers) {
                            // Override existing headers with the rule's headers
                            Object.entries(rule.headers).forEach(([header, value]) => {
                                tempHeaders[header] = value;
                            });
                        }
                        break;
                    }
                }
            }

            originalOpen.call(xhr, method, url, ...rest);
            isOpened = true; // Mark as opened
        };

        // Override setRequestHeader to store headers temporarily
        const originalSetRequestHeader = xhr.setRequestHeader;
        xhr.setRequestHeader = function(header, value) {
            if (!isOpened) {
                console.warn("setRequestHeader called before open");
            }
            // If the header is already set by a rule, it will be overridden here
            tempHeaders[header] = value;
        };

        // Override send to apply headers before sending the request
        const originalSend = xhr.send;
        xhr.send = function(...sendArgs) {
            if (!isOpened) {
                throw new Error("send called before open");
            }

            // Apply all headers, including any overridden by rules
            for (const [header, value] of Object.entries(tempHeaders)) {
                originalSetRequestHeader.call(xhr, header, value);
            }

            originalSend.apply(xhr, sendArgs);
        };

        return xhr;
    };

})();
