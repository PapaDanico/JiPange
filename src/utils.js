/**
 * Utility Functions
 * Formatting, helpers, and constants
 */

/**
 * Format number as Kenyan Shillings
 * @param {number} num - Amount to format
 * @returns {string} Formatted string like "150,000"
 */
function formatKES(num) {
    return Math.round(num).toLocaleString('en-KE');
}

/**
 * Format decimal as percentage
 * @param {number} num - Decimal (0.42 becomes "42.0%")
 * @returns {string} Formatted percentage
 */
function formatPercent(num) {
    return (num * 100).toFixed(1) + '%';
}

/**
 * Format number with commas for display
 * @param {number} num - Number to format
 * @returns {string} Formatted with thousands separators
 */
function formatNumber(num) {
    return Math.round(num).toLocaleString();
}

/**
 * Get color based on health score band
 */
function getHealthScoreColor(score) {
    if (score >= 85) return '#FFC200'; // Gold
    if (score >= 70) return '#1B3A6B'; // Navy
    if (score >= 55) return '#276128'; // Green
    if (score >= 35) return '#B87C00'; // Amber
    return '#A32D2D'; // Red
}

/**
 * Get display label for health score band
 */
function getHealthScoreBand(score) {
    if (score >= 85) return 'Excellent';
    if (score >= 70) return 'Strong';
    if (score >= 55) return 'Good';
    if (score >= 35) return 'Fair';
    return 'Poor';
}

/**
 * Clamp value between min and max
 */
function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

/**
 * Debounce function for event handlers
 */
function debounce(fn, delay = 150) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn(...args), delay);
    };
}

/**
 * Kenya counties list for profile selection
 */
const KENYA_COUNTIES = [
    'Nairobi', 'Mombasa', 'Nakuru', 'Kisumu', 'Uasin Gishu',
    'Nyeri', 'Kiambu', 'Muranga', 'Machakos', 'Makueni',
    'Kajiado', 'Laikipia', 'Samburu', 'Isiolo', 'Meru',
    'Tharaka Nithi', 'Embu', 'Kitui', 'Kericho', 'Bomet',
    'Kakamega', 'Vihiga', 'Bungoma', 'Busia', 'Siaya',
    'Kisii', 'Nyamira', 'Migori', 'Homa Bay', 'Nandi',
    'Baringo', 'Turkana', 'West Pokot', 'Garissa', 'Wajir',
    'Mandera', 'Kilifi', 'Tana River', 'Lamu', 'Kwale'
];

/**
 * Logger utility for debugging
 */
const logger = {
    log: (msg, data) => {
        if (typeof console !== 'undefined') {
            console.log(`[JiPange] ${msg}`, data || '');
        }
    },
    error: (msg, data) => {
        if (typeof console !== 'undefined') {
            console.error(`[JiPange] ERROR: ${msg}`, data || '');
        }
    },
    warn: (msg, data) => {
        if (typeof console !== 'undefined') {
            console.warn(`[JiPange] WARNING: ${msg}`, data || '');
        }
    }
};

export {
    formatKES,
    formatPercent,
    formatNumber,
    getHealthScoreColor,
    getHealthScoreBand,
    clamp,
    debounce,
    KENYA_COUNTIES,
    logger
};
