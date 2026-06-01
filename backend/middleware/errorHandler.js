const handleError = (res, error) => {
    console.error('Database Error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Internal server error' });
  };
  
  // Error handling middleware for Express
  const handleErrorMiddleware = (err, req, res, next) => {
    console.error('Error:', err);
    
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: err.message });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  };
  
  module.exports = { handleError, handleErrorMiddleware: handleErrorMiddleware };