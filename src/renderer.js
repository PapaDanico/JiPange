/**
 * Screen Renderer & Navigation
 * Manages screen display, navigation, and event binding
 */

/**
 * Screen factory - creates screen objects with render and event handling
 */
class Screen {
    constructor(config) {
        this.id = config.id;
        this.title = config.title || '';
        this.html = config.html || '';
        this.handlers = config.handlers || {};
        this.state_keys = config.state_keys || [];
    }

    /**
     * Get HTML content for this screen
     */
    render() {
        return this.html;
    }

    /**
     * Called when screen is shown
     */
    show() {
        if (this.handlers.onShow) {
            this.handlers.onShow();
        }
    }

    /**
     * Called when screen is hidden
     */
    hide() {
        if (this.handlers.onHide) {
            this.handlers.onHide();
        }
    }
}

/**
 * Screen manager for navigation and display
 */
class ScreenManager {
    constructor(containerId = 'app-container') {
        this.containerId = containerId;
        this.screens = new Map();
        this.currentScreen = null;
    }

    /**
     * Register a screen
     */
    registerScreen(screen) {
        this.screens.set(screen.id, screen);
    }

    /**
     * Display a screen by ID
     */
    showScreen(screenId) {
        // Hide current screen
        if (this.currentScreen) {
            this.currentScreen.hide();
        }

        // Get and display new screen
        const screen = this.screens.get(screenId);
        if (!screen) {
            console.error(`Screen not found: ${screenId}`);
            return;
        }

        const container = document.getElementById(this.containerId);
        if (container) {
            container.innerHTML = screen.render();
        }

        // Bind event handlers
        if (screen.handlers.bind) {
            screen.handlers.bind();
        }

        // Show new screen
        screen.show();
        this.currentScreen = screen;

        // Update active nav tab
        this.updateActiveTab(screenId);
    }

    /**
     * Update which nav tab appears active
     */
    updateActiveTab(screenId) {
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.remove('active');
            if (tab.dataset.screen === screenId) {
                tab.classList.add('active');
            }
        });
    }

    /**
     * Get current screen
     */
    getCurrentScreen() {
        return this.currentScreen;
    }
}

/**
 * Event binding utilities
 */
const EventBinder = {
    /**
     * Bind input change event to a state path and recalculator
     */
    bindInput(inputSelector, statePath, recalculator, debounceMs = 150) {
        const input = document.querySelector(inputSelector);
        if (!input) return;

        let timeout;
        input.addEventListener('change', (e) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                // Set value at state path
                const value = input.type === 'checkbox' ? input.checked :
                             input.type === 'number' ? parseFloat(input.value) || 0 :
                             input.value;

                // Navigate to nested path and set value
                const keys = statePath.split('.');
                let obj = window.state;
                for (let i = 0; i < keys.length - 1; i++) {
                    obj = obj[keys[i]];
                }
                obj[keys[keys.length - 1]] = value;

                if (recalculator) {
                    recalculator();
                }
            }, debounceMs);
        });
    },

    /**
     * Bind multiple inputs to state and recalculator
     */
    bindInputs(bindings, recalculator, debounceMs = 150) {
        bindings.forEach(binding => {
            this.bindInput(binding.selector, binding.statePath, recalculator, debounceMs);
        });
    },

    /**
     * Bind a form submit button
     */
    bindSubmit(buttonSelector, handler) {
        const btn = document.querySelector(buttonSelector);
        if (btn) {
            btn.addEventListener('click', handler);
        }
    }
};

export { Screen, ScreenManager, EventBinder };
