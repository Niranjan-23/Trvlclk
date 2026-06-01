const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1]; // Expecting "Bearer <token>"
    if (!token || token !== 'dummy-token') {
      return res.status(401).json({ error: 'Invalid or no token provided' });
    }
    // Since no JWT, manually set req.user._id (for testing purposes)
    // In a real app, you'd need to fetch the user from the database or pass ID in the request
    req.user = { _id: req.headers['user-id'] || 'temp-user-id' }; // Adjust as needed
    next();
  };
  
  module.exports = { verifyToken };