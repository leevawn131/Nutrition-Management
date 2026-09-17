const jwt = require('jsonwebtoken');

/**
 * Optional JWT Authentication Middleware
 * If Authorization header with Bearer token is provided and valid,
 * attaches decoded user id to req.user: { id: decoded.id }.
 * If not provided or invalid/expired, continues with req.user = null.
 */
const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }

    const token = authHeader.split(' ')[1];
    if (!token || !token.trim()) {
      req.user = null;
      return next();
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(token, secret);
    if (decoded && decoded.id) {
      req.user = {
        id: decoded.id,
      };
    } else {
      req.user = null;
    }

    return next();
  } catch (error) {
    // For optional auth, token errors should not reject the request;
    // proceed as unauthenticated user
    req.user = null;
    return next();
  }
};

module.exports = optionalAuth;
