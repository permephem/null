import logger from '../utils/logger.js';
export const errorHandler = (err, req, res, _next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    logger.error({
        error: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        statusCode,
    });
    res.status(statusCode).json({
        error: {
            message,
            statusCode,
            ...(process.env['NODE_ENV'] === 'development' && { stack: err.stack }),
        },
    });
};
export const notFoundHandler = (_req, res) => {
    res.status(404).json({
        error: {
            message: 'Route not found',
            statusCode: 404,
        },
    });
};
//# sourceMappingURL=errorHandler.js.map