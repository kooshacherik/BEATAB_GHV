// middleware/authMiddleware.js
import { verifyToken } from '../utils/jwtUtils.js';
import { User } from '../models/PostgreSQL_AllModels.js'; // Ensure Artist, Song, UserSongPlay are not directly used here to prevent circular dependency if they import User

const authMiddleware = async (req, res, next) => {
  try {
    console.log('AuthMiddleware: Incoming request for path:', req.path);

    const headerToken = req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.split(' ')[1]
      : null;
    const cookieToken = req.cookies?.access_token || null;

    console.log('AuthMiddleware: Header Token:', headerToken ? 'Present' : 'Not Present');
    console.log('AuthMiddleware: Cookie Token (access_token):', cookieToken ? 'Present' : 'Not Present');

    const token = headerToken || cookieToken;

    if (!token) {
      console.warn('AuthMiddleware: No token provided. Returning 401.');
      return res.status(401).json({ message: 'No token provided' });
    }

    let decoded;
    try {
      decoded = verifyToken(token); // Decodes and verifies the token
      console.log('AuthMiddleware: Token successfully decoded. User ID:', decoded.id);
    } catch (tokenError) {
      console.error('AuthMiddleware: Token verification failed:', tokenError.message);
      return res.status(401).json({
        message: 'Invalid or expired token',
        error: process.env.NODE_ENV === 'production' ? undefined : tokenError.message,
      });
    }

    const userInstance = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password'] },
    });

    if (!userInstance) {
      console.warn('AuthMiddleware: User not found for ID:', decoded.id, 'Returning 401.');
      return res.status(401).json({ message: 'User not found or deleted' }); // Changed to 401 as per common practice for "not authorized to access"
    }

    req.user = userInstance.get({ plain: true });
    console.log('AuthMiddleware: User authenticated:', req.user.email, 'Role:', req.user.role);
    next(); // Proceed to the next middleware/route handler
  } catch (error) {
    console.error('AuthMiddleware: Unexpected error:', error);
    return res.status(401).json({
      message: 'Authentication failed', // More generic message for unexpected errors
      error: process.env.NODE_ENV === 'production' ? undefined : error.message,
    });
  }
};

export default authMiddleware;