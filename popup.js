// popup.js
document.addEventListener('DOMContentLoaded', async () => {
    const rulesContainer = document.getElementById('rules-container');
    const saveButton = document.getElementById('save-rules');
    const addRuleButton = document.getElementById('add-rule');
    const toggleInterceptor = document.getElementById('toggle-interceptor');

    // Load existing rules and interceptor state from local storage
    const loadSettings = async () => {
        chrome.runtime.sendMessage({ action: 'getRules' }, (response) => {
            toggleInterceptor.checked = response.enabled;
            rulesContainer.innerHTML = ''; // Clear existing rules
            response.rules.forEach((rule, index) => {
                const ruleElement = createRuleElement(rule, index);
                rulesContainer.appendChild(ruleElement);
            });
        });
    };

    // Create a new rule element with editable fields
    const createRuleElement = (rule) => {
        const ruleElement = document.createElement('div');
        ruleElement.className = 'rule';

        ruleElement.innerHTML = `
            <input type="text" placeholder="Pattern" value="${rule.pattern}" />
            <input type="text" placeholder="Redirect URL" value="${rule.redirectUrl}" />
            <textarea placeholder="Headers (JSON format)">${JSON.stringify(rule.headers || {})}</textarea>
            <button class="remove-rule">Remove</button>
        `;

        // Event listener for removing a rule
        ruleElement.querySelector('.remove-rule').addEventListener('click', () => {
            rulesContainer.removeChild(ruleElement);
        });

        return ruleElement;
    };

    // Add a new rule
    addRuleButton.addEventListener('click', () => {
        const pattern = document.getElementById('new-pattern').value.trim();
        const redirectUrl = document.getElementById('new-redirect-url').value.trim();
        const headersInput = document.getElementById('new-headers').value.trim();
        const headers = headersInput ? JSON.parse(headersInput) : {};

        if (pattern) {
            const newRule = { pattern, redirectUrl, headers };
            const ruleElement = createRuleElement(newRule);
            rulesContainer.appendChild(ruleElement);
            // Clear input fields after adding the rule
            document.getElementById('new-pattern').value = '';
            document.getElementById('new-redirect-url').value = '';
            document.getElementById('new-headers').value = '';
        } else {
            alert('Pattern cannot be empty');
        }
    });

    // Save modified rules and interceptor state to local storage
    saveButton.addEventListener('click', async () => {
        const updatedRules = [];
        const ruleElements = rulesContainer.children;

        for (let ruleElement of ruleElements) {
            const inputs = ruleElement.querySelectorAll('input, textarea');
            const pattern = inputs[0].value.trim();
            const redirectUrl = inputs[1].value.trim();
            const headers = inputs[2].value.trim() ? JSON.parse(inputs[2].value) : {};

            if (pattern) { // Only add valid rules
                updatedRules.push({ pattern, redirectUrl, headers });
            }
        }

        // Save rules and enabled state
        const isEnabled = toggleInterceptor.checked;
        chrome.runtime.sendMessage({ action: 'saveRules', rules: updatedRules, enabled: isEnabled }, (response) => {
            if (response.status === 'success') {
                console.log("Response from background:", response);
                alert('Rules and interceptor state saved successfully!');
            } else {
                console.error("Failed to save rules:", response);
            }
        });
    });

    // Load existing settings when the popup opens
    loadSettings();
});
