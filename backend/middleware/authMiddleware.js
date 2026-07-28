import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;

  // Check if Bearer token is provided in the Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_finance_tracker_key_2026_finance_tracker');

      // Get user from the database (exclude password)
      const user = await User.findById(decoded.id);

      if (!user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }

      req.user = {
        id: user.id,
        name: user.name,
        email: user.email,
        groupIds: user.groupIds
      };

      next();
    } catch (error) {
      console.error('JWT Verification Error:', error);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};
