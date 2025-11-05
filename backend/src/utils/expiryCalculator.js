/**
 * Utility functions for calculating automatic expiry dates based on item categories
 */

/**
 * Calculate expiry date based on category and freshness
 * @param {string} category - Item category
 * @param {string} freshness - Freshness level (optional)
 * @param {Date} addedDate - Date when item was added (defaults to today)
 * @returns {Date|null} Calculated expiry date or null for manual entry
 */
export const calculateExpiryDate = (category, freshness = 'fresh', addedDate = new Date()) => {
    // Expiry date rules by category (in days)
    const expiryRules = {
        // Vegetables - typically 3-7 days
        vegetables: {
            fresh: 5,        // 5 days for fresh vegetables
            good: 3,         // 3 days for good condition
            fair: 2,         // 2 days for fair condition
            default: 4       // Default 4 days
        },
        
        // Fruits - typically 3-10 days depending on type
        fruits: {
            fresh: 7,        // 7 days for fresh fruits
            good: 5,         // 5 days for good condition
            fair: 3,         // 3 days for fair condition
            default: 5       // Default 5 days
        },
        
        // Dairy products - manual entry (expiry on package)
        dairy: null,         // Manual entry required
        
        // Meat - typically 1-3 days
        meat: {
            fresh: 2,        // 2 days for fresh meat
            good: 1,         // 1 day for good condition
            fair: 1,         // 1 day for fair condition
            default: 2       // Default 2 days
        },
        
        // Seafood - typically 1-2 days
        seafood: {
            fresh: 2,        // 2 days for fresh seafood
            good: 1,         // 1 day for good condition
            fair: 1,         // 1 day for fair condition
            default: 1       // Default 1 day
        },
        
        // Grains - typically 1-2 years (long shelf life)
        grains: {
            fresh: 365,      // 1 year
            good: 365,       // 1 year
            fair: 180,       // 6 months
            default: 365     // Default 1 year
        },
        
        // Spices - typically 2-3 years
        spices: {
            fresh: 1095,     // 3 years
            good: 730,       // 2 years
            fair: 365,       // 1 year
            default: 730     // Default 2 years
        },
        
        // Beverages - varies by type
        beverages: {
            fresh: 30,       // 30 days for fresh beverages
            good: 14,        // 14 days for good condition
            fair: 7,         // 7 days for fair condition
            default: 14      // Default 14 days
        },
        
        // Frozen items - typically 3-12 months
        frozen: {
            fresh: 180,      // 6 months
            good: 90,        // 3 months
            fair: 30,        // 1 month
            default: 90      // Default 3 months
        },
        
        // Canned items - typically 2-5 years
        canned: {
            fresh: 1825,     // 5 years
            good: 1095,      // 3 years
            fair: 730,       // 2 years
            default: 1095    // Default 3 years
        },
        
        // Other items - manual entry or default
        other: null          // Manual entry or default 30 days
    };

    const rule = expiryRules[category];
    
    // If no rule exists or rule is null (manual entry), return null
    if (!rule) {
        return null;
    }
    
    // Get days to add based on freshness
    const daysToAdd = rule[freshness] || rule.default;
    
    // Calculate expiry date
    const expiryDate = new Date(addedDate);
    expiryDate.setDate(expiryDate.getDate() + daysToAdd);
    
    return expiryDate;
};

/**
 * Get freshness options for a category
 * @param {string} category - Item category
 * @returns {Array} Array of freshness options
 */
export const getFreshnessOptions = (category) => {
    const freshnessOptions = {
        vegetables: ['fresh', 'good', 'fair'],
        fruits: ['fresh', 'good', 'fair'],
        meat: ['fresh', 'good', 'fair'],
        seafood: ['fresh', 'good', 'fair'],
        grains: ['fresh', 'good', 'fair'],
        spices: ['fresh', 'good', 'fair'],
        beverages: ['fresh', 'good', 'fair'],
        frozen: ['fresh', 'good', 'fair'],
        canned: ['fresh', 'good', 'fair'],
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
 * @param {Date} addedDate - Date when item was added
 * @returns {Date} Default expiry date
 */
export const getDefaultExpiryDate = (category, addedDate = new Date()) => {
    const defaultExpiryDays = {
        dairy: 7,        // 7 days default for dairy (should be manual)
        other: 30        // 30 days default for other items
    };
    
    const daysToAdd = defaultExpiryDays[category] || 30;
    const expiryDate = new Date(addedDate);
    expiryDate.setDate(expiryDate.getDate() + daysToAdd);
    
    return expiryDate;
};

/**
 * Format expiry date for display
 * @param {Date} date - Date to format
 * @returns {string} Formatted date string
 */
export const formatExpiryDate = (date) => {
    if (!date) return '';
    return new Date(date).toISOString().split('T')[0];
};

/**
 * Get days until expiry
 * @param {Date} expiryDate - Expiry date
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
