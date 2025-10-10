// import jwt from 'jsonwebtoken';
// import { errorHandler } from './errorHandler.js';

// export const generateTokenAndSetCookie = (userId, res) => {

//   const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
//     expiresIn: '1d',
//   });

//   res.cookie('access_token', token, {
//     httpOnly: true,
//     secure: process.env.NODE_ENV === 'production', // Secure in production
//     sameSite: 'lax', // CSRF protection
//     expires: new Date(Date.now() +  6 * 60 * 60 * 1000), // 1 day
//     maxAge: 1 * 6 * 60 * 60 * 1000, // 1 days
//   });

//   return token;
// };

// // Verify JWT token
// export const verifyToken = (req, res, next) => {
//   const token = req.cookies.access_token;

//   if (!token) return next(errorHandler(401, 'Unauthorized!'));

//   jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
//     if (err) return next(errorHandler(403, 'Forbidden!'));
//     req.user = user;
//     next();
//   });
// }

// // Clear JWT token from cookie
// export const clearCookie = (res) => {
//   res.clearCookie('access_token').status(200).json({ message: 'Signout successfully' });
// };


// // Get user ID from JWT token
// export const getUserIdFromToken = (token) => {
//   const decoded = jwt.verify(token, process.env.JWT_SECRET);
//   return decoded.id;
// };



// utils/jwtUtils.js
import jwt from 'jsonwebtoken';

export const generateTokenAndSetCookie = (userId, res) => {
  const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: '1h', // Adjust token expiration as needed
  });

  // Determine if running in a production-like environment (could be staging, etc.)
  const isProduction = process.env.NODE_ENV === 'production';
  // Determine if running on localhost for sameSite/secure adjustments
  const isLocalhost = process.env.HOST === 'localhost' || process.env.HOST === '127.0.0.1';

  res.cookie('access_token', token, {
    httpOnly: true, // Prevents client-side JavaScript from accessing the cookie

    // `secure` should be true in production, false for local development over HTTP
    // If you're using HTTPS in development (e.g., via a proxy), set secure: true
    secure: isProduction, // Set to true for production, false for HTTP local dev

    // `sameSite` policy:
    // 'Lax': Recommended default. Sends cookies for top-level navigations and safe HTTP methods (GET).
    // 'None': Required for cross-site requests (e.g., API on different domain/port than frontend)
    //          AND requires `secure: true`. Use with caution due to potential CSRF risks.
    // 'Strict': Most secure. Sends cookies only for same-site requests (same domain/port).
    sameSite: isLocalhost ? 'Lax' : 'Lax', // 'Lax' is a good default for local development and same-site production.
                                           // If you encounter issues in cross-origin local dev (different ports for FE/BE)
                                           // AND you're using HTTPS, you might need 'None' and 'secure: true'.
                                           // For your current setup with localhost:5173 and localhost:5000, 'Lax' should be fine.
    maxAge: 3600000, // 1 hour (same as token expiration)
  });
};

export const clearCookie = (res) => {
  res.clearCookie('access_token', {
    httpOnly: true,
    // Secure flag for clearing should match the one used during setting the cookie in production.
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Lax', // Match the sameSite setting used when the cookie was set.
  });
  res.status(200).json({ success: true, message: 'Signed out successfully' });
};

export const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

export const getUserIdFromToken = (token) => {
  const decoded = verifyToken(token);
  return decoded.id;
};