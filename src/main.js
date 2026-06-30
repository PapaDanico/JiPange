/**
 * JiPange - Main Application Orchestrator
 * Modular version: loads state, calculators, and UI initialization
 */

import { loadState, saveState as saveStateFn } from './state.js';
import { recalculateAll } from './calculators.js';
import { formatKES, formatPercent, logger } from './utils.js';
import { initMVPScreens } from './screens-mvp.js';

// Initialize global state
window.state = loadState();
window.recalculateAll = recalculateAll;
window.saveState = () => saveStateFn(window.state);

// Make utils globally available for legacy code
window.formatKES = formatKES;
window.formatPercent = formatPercent;

logger.log('JiPange initialized', { state: window.state });

/**
 * Application entry point
 * Called when DOM is ready
 */
function initApp() {
    logger.log('App initializing');

    // Set up navigation event listeners
    setupNavigation();

    // Wire MVP screens (Profile, Income, Budget, Savings, Goals, Dashboard)
    initMVPScreens(window.state, window.saveState);

    // Load initial screen
    showScreen('screen-0');

    // Run initial calculations
    recalculateAll(window.state);

    logger.log('App ready');
}

/**
 * Set up navigation tabs
 */
function setupNavigation() {
    const navTabs = document.querySelectorAll('.nav-tab');
    navTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const screenId = tab.getAttribute('data-screen');
            if (screenId) {
                showScreen(screenId);
            }
        });
    });

    const dropdownItems = document.querySelectorAll('.dropdown-item');
    dropdownItems.forEach(item => {
        item.addEventListener('click', () => {
            const screenId = item.getAttribute('data-screen');
            if (screenId) {
                showScreen(screenId);
            }
        });
    });
}

/**
 * Show a screen by ID
 */
function showScreen(screenId) {
    // Hide all sections
    const sections = document.querySelectorAll('section[id^="screen"]');
    sections.forEach(section => {
        section.style.display = 'none';
    });

    // Show requested screen
    const screen = document.getElementById(screenId);
    if (screen) {
        screen.style.display = 'block';
        screen.scrollIntoView({ behavior: 'smooth', block: 'start' });

        // Update active nav
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.remove('active');
            if (tab.getAttribute('data-screen') === screenId) {
                tab.classList.add('active');
            }
        });

        // Trigger screen-specific init if needed
        if (window.initScreen) {
            window.initScreen(screenId);
        }
    }
}

// Export for module use
window.showScreen = showScreen;
window.setupNavigation = setupNavigation;

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

export { initApp, showScreen, setupNavigation };
