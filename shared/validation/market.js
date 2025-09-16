// Shared market validation rules - single source of truth for frontend and backend

const MARKET_LIMITS = {
    MIN_PRICE: 1,
    MAX_PRICE: 1000000,
    MIN_QUANTITY: 1,
    MAX_QUANTITY: 9999,
    VALID_ITEM_TYPES: ['gems', 'metals']
};

function validateMarketListing(quantity, pricePerUnit, itemType = null) {
    const errors = [];
    
    // Validate quantity
    if (!Number.isInteger(quantity) || quantity < MARKET_LIMITS.MIN_QUANTITY || quantity > MARKET_LIMITS.MAX_QUANTITY) {
        errors.push(`Quantity must be between ${MARKET_LIMITS.MIN_QUANTITY} and ${MARKET_LIMITS.MAX_QUANTITY}`);
    }
    
    // Validate price per unit
    if (!Number.isInteger(pricePerUnit) || pricePerUnit < MARKET_LIMITS.MIN_PRICE || pricePerUnit > MARKET_LIMITS.MAX_PRICE) {
        errors.push(`Price must be between ${MARKET_LIMITS.MIN_PRICE.toLocaleString()} and ${MARKET_LIMITS.MAX_PRICE.toLocaleString()} gold`);
    }
    
    // Validate item type if provided
    if (itemType && !MARKET_LIMITS.VALID_ITEM_TYPES.includes(itemType)) {
        errors.push('Invalid item type');
    }
    
    // Validate total price doesn't exceed limits
    if (Number.isInteger(quantity) && Number.isInteger(pricePerUnit)) {
        const totalPrice = quantity * pricePerUnit;
        const maxTotal = MARKET_LIMITS.MAX_PRICE * MARKET_LIMITS.MAX_QUANTITY;
        if (totalPrice > maxTotal) {
            errors.push('Total listing value exceeds maximum');
        }
    }
    
    return {
        valid: errors.length === 0,
        errors: errors
    };
}

function validatePurchaseQuantity(requestedQuantity, availableQuantity) {
    const errors = [];
    
    if (!Number.isInteger(requestedQuantity) || requestedQuantity <= 0) {
        errors.push('Invalid quantity');
    }
    
    if (requestedQuantity > availableQuantity) {
        errors.push(`Cannot purchase more than ${availableQuantity} available`);
    }
    
    return {
        valid: errors.length === 0,
        errors: errors
    };
}

// ES module exports for frontend
export { MARKET_LIMITS, validateMarketListing, validatePurchaseQuantity };

// CommonJS exports for backend
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        MARKET_LIMITS,
        validateMarketListing,
        validatePurchaseQuantity
    };
}