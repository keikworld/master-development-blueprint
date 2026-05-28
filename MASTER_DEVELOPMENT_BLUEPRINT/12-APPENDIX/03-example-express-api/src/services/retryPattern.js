import CONFIG from '../config/constants.js'

class CircuitBreakerOpenError extends Error {
  constructor(service) {
    super(`Circuit breaker open for ${service}`)
    this.name = 'CircuitBreakerOpenError'
    this.service = service
  }
}

class CircuitBreaker {
  constructor(options = {}) {
    this._threshold = options.threshold || CONFIG.CIRCUIT_BREAKER_THRESHOLD
    this._resetMs = options.resetMs || CONFIG.CIRCUIT_BREAKER_RESET_MS
    this._state = 'CLOSED'
    this._failures = 0
    this._nextAttempt = 0
  }

  get state() {
    if (this._state === 'OPEN' && Date.now() >= this._nextAttempt) {
      this._state = 'HALF_OPEN'
    }
    return this._state
  }

  async call(fn, serviceName = 'unknown') {
    if (this.state === 'OPEN') {
      throw new CircuitBreakerOpenError(serviceName)
    }

    try {
      const result = await fn()
      if (this._state === 'HALF_OPEN') {
        this._state = 'CLOSED'
        this._failures = 0
      }
      this._failures = 0
      return result
    } catch (err) {
      this._failures++
      if (this._failures >= this._threshold) {
        this._state = 'OPEN'
        this._nextAttempt = Date.now() + this._resetMs
      }
      throw err
    }
  }

  reset() {
    this._state = 'CLOSED'
    this._failures = 0
    this._nextAttempt = 0
  }
}

function jitter(delayMs, maxJitterMs = CONFIG.RETRY_JITTER_MAX_MS) {
  const j = Math.random() * maxJitterMs
  return delayMs + j
}

async function withRetry(fn, options = {}) {
  const maxAttempts = options.maxAttempts || CONFIG.RETRY_MAX_ATTEMPTS
  const baseDelay = options.baseDelay || CONFIG.RETRY_BASE_DELAY_MS
  const maxDelay = options.maxDelay || CONFIG.RETRY_MAX_DELAY_MS
  const isRetryable = options.isRetryable || (() => true)

  let lastError

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastError = err
      if (!isRetryable(err) || attempt === maxAttempts) {
        throw err
      }
      const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay)
      const sleepMs = jitter(delay)
      await new Promise(resolve => setTimeout(resolve, sleepMs))
    }
  }

  throw lastError
}

export { CircuitBreaker, CircuitBreakerOpenError, withRetry, jitter }
