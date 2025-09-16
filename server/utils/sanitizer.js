import DOMPurify from 'isomorphic-dompurify';

export const sanitizeInput = (input) => {
    if (input === null || input === undefined) return input;
    
    if (typeof input === 'string') {
        // Remove all HTML tags and attributes for API inputs
        return DOMPurify.sanitize(input, { 
            ALLOWED_TAGS: [],
            ALLOWED_ATTR: [],
            KEEP_CONTENT: true
        }).trim();
    }
    
    if (typeof input === 'number') {
        // Ensure numbers are within safe bounds
        if (!Number.isFinite(input)) return 0;
        if (input > Number.MAX_SAFE_INTEGER) return Number.MAX_SAFE_INTEGER;
        if (input < Number.MIN_SAFE_INTEGER) return Number.MIN_SAFE_INTEGER;
        return input;
    }
    
    if (Array.isArray(input)) {
        return input.map(sanitizeInput);
    }
    
    if (typeof input === 'object') {
        const sanitized = {};
        for (const [key, value] of Object.entries(input)) {
            // Sanitize both keys and values
            const sanitizedKey = sanitizeInput(key);
            if (sanitizedKey && sanitizedKey.length <= 100) { // Limit key length
                sanitized[sanitizedKey] = sanitizeInput(value);
            }
        }
        return sanitized;
    }
    
    return input;
};

export const sanitizeRequestBody = (req, res, next) => {
    if (req.body) {
        req.body = sanitizeInput(req.body);
    }
    if (req.query) {
        req.query = sanitizeInput(req.query);
    }
    if (req.params) {
        req.params = sanitizeInput(req.params);
    }
    next();
};