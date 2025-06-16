const rateLimit = require('express-rate-limit');

// Create a rate limiter middleware
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 requests per windowMs
  message: {
    status: 429,
    message: 'Too many requests from this IP, please try again after a minute.',
  },
});

module.exports = apiLimiter;
