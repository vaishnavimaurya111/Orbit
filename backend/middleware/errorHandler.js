const errorHandler = (err, req, res, next) => {
  console.error('Error:', err.message);

  // Don't leak stack traces to client
  if (process.env.NODE_ENV === 'production') {
    return res.status(500).json({ error: 'Internal server error' });
  }

  // PostgreSQL constraint violations
  if (err.code === '23505') {
    return res.status(409).json({ error: 'Duplicate entry. Record already exists.' });
  }
  if (err.code === '23503') {
    return res.status(400).json({ error: 'Referenced record not found.' });
  }
  if (err.code === '23502') {
    return res.status(400).json({ error: 'Required field is missing.' });
  }
  if (err.code === '23514') {
    return res.status(400).json({ error: 'Invalid value for this field.' });
  }

  return res.status(500).json({
    error: err.message || 'Internal server error',
  });
};

const notFound = (req, res) => {
  res.status(404).json({ error: `Route ${req.originalUrl} not found` });
};

module.exports = { errorHandler, notFound };
