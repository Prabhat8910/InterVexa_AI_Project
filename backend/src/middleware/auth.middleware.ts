import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: 'student' | 'recruiter' | 'university' | 'admin';
  };
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  let token: string | undefined;

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
    const decoded = jwt.verify(token, jwtSecret) as { id: string; email: string; role: 'student' | 'recruiter' | 'university' | 'admin' };
    
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role
    };
    
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
};

export const authorize = (...roles: ('student' | 'recruiter' | 'university' | 'admin')[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized. Authentication required.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden. Insufficient permissions to access this resource.' });
    }

    next();
  };
};
