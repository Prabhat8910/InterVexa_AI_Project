export const errorHandler = (err, _req, res, _next) => {
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal Server Error';
    console.error(`[Error Handler] Log:`, err);
    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
        statusCode = 400;
        message = `Resource not found with id of ${err.value}`;
    }
    // Mongoose duplicate key
    if (err.code === 11000) {
        statusCode = 400;
        message = 'Duplicate field value entered.';
    }
    // Mongoose validation error
    if (err.name === 'ValidationError') {
        statusCode = 400;
        message = Object.values(err.errors).map((val) => val.message).join(', ');
    }
    res.status(statusCode).json({
        message: message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack
    });
};
