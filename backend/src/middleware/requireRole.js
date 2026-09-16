// src/middleware/requireRole.js
function requireRole(requiredRole) {
  return (req, res, next) => {
    if (!req.user || req.user.role !== requiredRole) {
      return res.status(403).json({ 
        error: `Access forbidden: requires ${requiredRole} role` 
      });
    }
    next();
  };
}

module.exports = requireRole;