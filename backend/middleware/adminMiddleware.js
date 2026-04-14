module.exports = function (req, res, next) {
  // We assume this runs AFTER authMiddleware, so req.user already exists.
  
  // Check if the user's role is 'admin'
  if (req.user && req.user.role === 'admin') {
    next(); // They are an admin, let them pass!
  } else {
    // They are just a regular student (rider/driver)
    res.status(403).json({ error: 'Access denied. Admin privileges required.' });
  }
};