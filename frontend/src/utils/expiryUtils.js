/**
 * Frontend utility functions for expiry date handling
 */

/**
 * Get freshness options for a category
 * @param {string} category - Item category
 * @returns {Array} Array of freshness options
 */
export const getFreshnessOptions = (category) => {
    const freshnessOptions = {
        vegetables: [
            { value: 'fresh', label: 'Fresh (5 days)', days: 5 },
            { value: 'good', label: 'Good (3 days)', days: 3 },
            { value: 'fair', label: 'Fair (2 days)', days: 2 }
        ],
        fruits: [
            { value: 'fresh', label: 'Fresh (7 days)', days: 7 },
            { value: 'good', label: 'Good (5 days)', days: 5 },
            { value: 'fair', label: 'Fair (3 days)', days: 3 }
        ],
        meat: [
            { value: 'fresh', label: 'Fresh (2 days)', days: 2 },
            { value: 'good', label: 'Good (1 day)', days: 1 },
            { value: 'fair', label: 'Fair (1 day)', days: 1 }
        ],
        seafood: [
            { value: 'fresh', label: 'Fresh (2 days)', days: 2 },
            { value: 'good', label: 'Good (1 day)', days: 1 },
            { value: 'fair', label: 'Fair (1 day)', days: 1 }
        ],
        grains: [
            { value: 'fresh', label: 'Fresh (1 year)', days: 365 },
            { value: 'good', label: 'Good (1 year)', days: 365 },
            { value: 'fair', label: 'Fair (6 months)', days: 180 }
        ],
        spices: [
            { value: 'fresh', label: 'Fresh (3 years)', days: 1095 },
            { value: 'good', label: 'Good (2 years)', days: 730 },
            { value: 'fair', label: 'Fair (1 year)', days: 365 }
        ],
        beverages: [
            { value: 'fresh', label: 'Fresh (30 days)', days: 30 },
            { value: 'good', label: 'Good (14 days)', days: 14 },
            { value: 'fair', label: 'Fair (7 days)', days: 7 }
        ],
        frozen: [
            { value: 'fresh', label: 'Fresh (6 months)', days: 180 },
            { value: 'good', label: 'Good (3 months)', days: 90 },
            { value: 'fair', label: 'Fair (1 month)', days: 30 }
        ],
        canned: [
            { value: 'fresh', label: 'Fresh (5 years)', days: 1825 },
            { value: 'good', label: 'Good (3 years)', days: 1095 },
            { value: 'fair', label: 'Fair (2 years)', days: 730 }
        ],
        dairy: [], // No freshness options for dairy (manual entry)
        other: []  // No freshness options for other (manual entry)
    };
    
    return freshnessOptions[category] || [];
};

/**
 * Check if category requires manual expiry date entry
 * @param {string} category - Item category
 * @returns {boolean} True if manual entry is required
 */
export const requiresManualExpiryDate = (category) => {
    const manualEntryCategories = ['dairy', 'other'];
    return manualEntryCategories.includes(category);
};

/**
 * Get default expiry date for categories that don't support automatic calculation
 * @param {string} category - Item category
 * @returns {Date} Default expiry date
 */
export const getDefaultExpiryDate = (category) => {
    const defaultExpiryDays = {
        dairy: 7,        // 7 days default for dairy
        other: 30        // 30 days default for other items
    };
    
    const daysToAdd = defaultExpiryDays[category] || 30;
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + daysToAdd);
    
    return expiryDate.toISOString().split('T')[0]; // Return in YYYY-MM-DD format
};

/**
 * Calculate expiry date based on category and freshness
 * @param {string} category - Item category
 * @param {string} freshness - Freshness level
 * @returns {Date} Calculated expiry date
 */
export const calculateExpiryDate = (category, freshness) => {
    const freshnessOptions = getFreshnessOptions(category);
    const selectedOption = freshnessOptions.find(option => option.value === freshness);
    
    if (!selectedOption) {
        return getDefaultExpiryDate(category);
    }
    
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + selectedOption.days);
    
    return expiryDate.toISOString().split('T')[0]; // Return in YYYY-MM-DD format
};

/**
 * Get category description for expiry date handling
 * @param {string} category - Item category
 * @returns {string} Description of how expiry date is handled
 */
export const getExpiryDateDescription = (category) => {
    const descriptions = {
        vegetables: "Expiry date will be calculated automatically based on freshness",
        fruits: "Expiry date will be calculated automatically based on freshness",
        meat: "Expiry date will be calculated automatically based on freshness",
        seafood: "Expiry date will be calculated automatically based on freshness",
        grains: "Expiry date will be calculated automatically based on freshness",
        spices: "Expiry date will be calculated automatically based on freshness",
        beverages: "Expiry date will be calculated automatically based on freshness",
        frozen: "Expiry date will be calculated automatically based on freshness",
        canned: "Expiry date will be calculated automatically based on freshness",
        dairy: "Please enter the expiry date from the package (dairy products have printed expiry dates)",
        other: "Please enter the expiry date manually or leave blank for default (30 days)"
    };
    
    return descriptions[category] || "Please enter the expiry date manually";
};

/**
 * Format date for display
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date string
 */
export const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0];
};

/**
 * Get days until expiry
 * @param {string|Date} expiryDate - Expiry date
 * @returns {number} Days until expiry (negative if expired)
 */
export const getDaysUntilExpiry = (expiryDate) => {
    if (!expiryDate) return null;
    
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
};

/**
 * Get expiry status color class
 * @param {string|Date} expiryDate - Expiry date
 * @returns {string} CSS class for expiry status
 */
export const getExpiryStatusClass = (expiryDate) => {
    const days = getDaysUntilExpiry(expiryDate);
    
    if (days === null) return 'text-gray-500';
    if (days < 0) return 'text-red-600 font-semibold'; // Expired
    if (days <= 1) return 'text-red-500 font-semibold'; // Expires today or tomorrow
    if (days <= 3) return 'text-orange-500 font-semibold'; // Expires in 2-3 days
    if (days <= 7) return 'text-yellow-600'; // Expires in 4-7 days
    return 'text-green-600'; // Fresh
};
