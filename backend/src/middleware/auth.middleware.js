import jwt from 'jsonwebtoken';
export const authenticate = (req, res, next) => {
    let token;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
    }
    if (!token) {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }
    try {
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            console.error('FATAL: JWT_SECRET environment variable is not defined.');
            return res.status(500).json({ message: 'Internal Server Error.' });
        }
        const decoded = jwt.verify(token, jwtSecret);
        req.user = {
            id: decoded.id,
            email: decoded.email,
            role: decoded.role
        };
        next();
    }
    catch (error) {
        return res.status(401).json({ message: 'Invalid or expired token.' });
    }
};
export const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Unauthorized. Authentication required.' });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Forbidden. Insufficient permissions to access this resource.' });
        }
        next();
    };
};
