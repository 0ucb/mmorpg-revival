// Shared rate limiting configuration to eliminate duplication
import rateLimit from 'express-rate-limit';

const createLimiter = (windowMs, max, message) => {
    return rateLimit({ 
        windowMs, 
        max, 
        message: { error: message }
    });
};

// Predefined rate limiters for different endpoints
export const rateLimiters = {
    market: createLimiter(60 * 1000, 10, 'Too many market operations, please slow down'),
    auth: createLimiter(15 * 60 * 1000, 5, 'Too many authentication attempts'),
    general: createLimiter(60 * 1000, 100, 'Too many requests, please slow down')
};

// Individual exports for convenience
export const marketLimiter = rateLimiters.market;
export const authLimiter = rateLimiters.auth;
export const generalLimiter = rateLimiters.general;