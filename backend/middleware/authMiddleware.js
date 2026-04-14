const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  // 1. Look for the token in the headers
  const authHeader = req.header('Authorization');

  // 2. If there is no token, deny access
  if (!authHeader) {
    return res.status(401).json({ error: 'No token provided. Access denied.' });
  }

  try {
    // The token usually looks like "Bearer eyJhbGciOi..."
    // We split it to just grab the actual token part
    const token = authHeader.split(' ')[1]; 

    // 3. Verify the token using your secret key
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4. Attach the user data to the request so the next route can use it
    req.user = decoded;
    
    // 5. Let them pass!
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token. Access denied.' });
  }
};