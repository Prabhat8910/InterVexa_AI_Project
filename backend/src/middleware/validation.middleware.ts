import { Request, Response, NextFunction } from 'express';

export const validateRegister = (req: Request, res: Response, next: NextFunction) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: 'Name, email, password, and role are required.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: 'Please provide a valid email address.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
  }

  const validRoles = ['student', 'recruiter', 'university', 'admin'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ message: 'Invalid user role selected.' });
  }

  next();
};

export const validateLogin = (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  next();
};

export const validateForgotPassword = (req: Request, res: Response, next: NextFunction) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: 'Please provide a valid email address.' });
  }

  next();
};

export const validateResetPassword = (req: Request, res: Response, next: NextFunction) => {
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ message: 'Password is required.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
  }

  next();
};
