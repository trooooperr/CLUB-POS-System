const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'humtum-pos-secret-key-change-in-production';

/**
 * Generate JWT token for a user
 */
function generateToken(user) {
  return jwt.sign(
    { id: user._id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

/**
 * Middleware: require valid JWT token
 */
function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  const token = header.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired, please login again' });
    }
    return res.status(401).json({ message: 'Invalid token' });
  }
}

/**
 * Middleware: require specific role(s)
 * Usage: requireRole('admin') or requireRole(['admin', 'manager'])
 */
function requireRole(roles) {
  const allowed = Array.isArray(roles) ? roles : [roles];
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    if (!allowed.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    next();
  };
}

/**
 * Middleware: Allow either valid JWT OR a valid Cron Secret
 */
function allowCronSecret(req, res, next) {
  const cronSecret = req.headers['x-cron-secret'];
  const envSecret = process.env.CRON_SECRET || 'humtum_cron_secret_2026';
  
  if (cronSecret && cronSecret === envSecret) {
    req.user = { role: 'admin', username: 'cron_job' }; // Grant admin-like access for cron
    return next();
  }
  
  // Fallback to standard auth
  return requireAuth(req, res, next);
}

module.exports = { generateToken, requireAuth, requireRole, allowCronSecret, JWT_SECRET };
