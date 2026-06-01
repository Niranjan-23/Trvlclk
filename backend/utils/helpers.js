const handleDBError = (res, error) => {
    console.error('Database Error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Internal server error' });
  };
  
  module.exports = { handleDBError };