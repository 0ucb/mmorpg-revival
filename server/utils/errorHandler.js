// Standardized error handling extracted from auth.js patterns

export const sendError = (res, status, message, details = null) => {
    const response = { error: message };
    if (details && process.env.NODE_ENV === 'development') {
        response.details = details;
    }
    return res.status(status).json(response);
};

export const sendSuccess = (res, data, status = 200) => {
    return res.status(status).json({
        success: true,
        ...data
    });
};