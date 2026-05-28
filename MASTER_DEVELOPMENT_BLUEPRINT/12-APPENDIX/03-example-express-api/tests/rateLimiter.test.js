import { expect } from 'chai'
import { SlidingWindowRateLimiter, RateLimitError } from '../src/services/rateLimiter.js'

describe('SlidingWindowRateLimiter', () => {
  it('allows requests under the limit', () => {
    const limiter = new SlidingWindowRateLimiter({ windowMs: 1000, maxRequests: 5 })
    for (let i = 0; i < 5; i++) {
      const result = limiter.check('test-client')
      expect(result.remaining).to.be.greaterThanOrEqual(0)
    }
  })

  it('blocks requests over the limit', () => {
    const limiter = new SlidingWindowRateLimiter({ windowMs: 1000, maxRequests: 2 })
    limiter.check('test-client')
    limiter.check('test-client')
    expect(() => limiter.check('test-client')).to.throw(RateLimitError)
  })

  it('resets per key', () => {
    const limiter = new SlidingWindowRateLimiter({ windowMs: 1000, maxRequests: 2 })
    limiter.check('client-a')
    limiter.check('client-a')

    limiter.check('client-b')

    limiter.reset('client-a')
    const result = limiter.check('client-a')
    expect(result.remaining).to.be.greaterThanOrEqual(0)
  })

  it('tracks unique clients', () => {
    const limiter = new SlidingWindowRateLimiter({ windowMs: 1000, maxRequests: 10 })
    limiter.check('a')
    limiter.check('b')
    limiter.check('c')
    expect(limiter.size).to.equal(3)
  })
})
