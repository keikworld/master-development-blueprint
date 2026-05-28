import logger from './structuredLogger.js'

function errorHandler(err, req, res, _next) {
  if (err.name === 'ValidationError') {
    logger.warn({ err, path: req.path }, 'validation error')
    res.status(err.statusCode || 400).json({
      error: err.message,
      field: err.field,
      code: err.code,
    })
    return
  }

  if (err.name === 'RateLimitError') {
    logger.warn({ err, path: req.path }, 'rate limit exceeded')
    res.status(429).json({
      error: 'Too many requests',
      retryAfter: err.retryAfter,
    })
    return
  }

  logger.error({ err, path: req.path }, 'unhandled error')
  res.status(500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  })
}

export default errorHandler
