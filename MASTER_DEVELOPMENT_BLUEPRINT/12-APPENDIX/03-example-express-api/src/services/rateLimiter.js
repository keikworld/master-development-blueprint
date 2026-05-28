import CONFIG from '../config/constants.js'
import env from '../config/env.js'

class RateLimitError extends Error {
  constructor(retryAfter) {
    super('Rate limit exceeded')
    this.name = 'RateLimitError'
    this.statusCode = 429
    this.retryAfter = retryAfter
  }
}

class SlidingWindowRateLimiter {
  constructor(options = {}) {
    this._windowMs = options.windowMs || env.RATE_LIMIT_WINDOW_MS
    this._maxRequests = options.maxRequests || env.RATE_LIMIT_MAX_REQUESTS
    this._clients = new Map()
  }

  check(key) {
    const now = Date.now()
    const windowStart = now - this._windowMs

    let entry = this._clients.get(key)
    if (!entry) {
      entry = { timestamps: [] }
      this._clients.set(key, entry)
    }

    entry.timestamps = entry.timestamps.filter(t => t > windowStart)
    entry.timestamps.push(now)

    if (entry.timestamps.length > this._maxRequests) {
      const oldest = entry.timestamps[0]
      const retryAfter = Math.ceil((oldest + this._windowMs - now) / 1000)
      throw new RateLimitError(retryAfter)
    }

    return {
      remaining: this._maxRequests - entry.timestamps.length,
      resetMs: this._windowMs,
    }
  }

  reset(key) {
    this._clients.delete(key)
  }

  get size() {
    return this._clients.size
  }
}

export { RateLimitError, SlidingWindowRateLimiter }
