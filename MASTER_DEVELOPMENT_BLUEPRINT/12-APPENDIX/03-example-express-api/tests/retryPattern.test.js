import { expect } from 'chai'
import { CircuitBreaker, withRetry } from '../src/services/retryPattern.js'

describe('CircuitBreaker', () => {
  let breaker

  beforeEach(() => {
    breaker = new CircuitBreaker({ threshold: 3, resetMs: 500 })
  })

  it('starts closed', () => {
    expect(breaker.state).to.equal('CLOSED')
  })

  it('opens after threshold failures', async () => {
    const failing = async () => { throw new Error('fail') }

    for (let i = 0; i < 3; i++) {
      try { await breaker.call(failing, 'test') } catch { }
    }

    expect(breaker.state).to.equal('OPEN')
  })

  it('throws CircuitBreakerOpenError when open', async () => {
    const failing = async () => { throw new Error('fail') }
    for (let i = 0; i < 3; i++) {
      try { await breaker.call(failing, 'test') } catch { }
    }

    try {
      await breaker.call(failing, 'test')
      throw new Error('should have thrown')
    } catch (err) {
      expect(err.name).to.equal('CircuitBreakerOpenError')
    }
  })

  it('closes after successful call in half-open', async () => {
    const failer = async () => { throw new Error('fail') }
    for (let i = 0; i < 3; i++) {
      try { await breaker.call(failer, 'test') } catch { }
    }
    expect(breaker.state).to.equal('OPEN')

    await new Promise(resolve => setTimeout(resolve, 600))

    const succeeder = async () => 'ok'
    const result = await breaker.call(succeeder, 'test')
    expect(result).to.equal('ok')
    expect(breaker.state).to.equal('CLOSED')
  })

  it('resets manually', async () => {
    const failing = async () => { throw new Error('fail') }
    for (let i = 0; i < 3; i++) {
      try { await breaker.call(failing, 'test') } catch { }
    }
    expect(breaker.state).to.equal('OPEN')

    breaker.reset()
    expect(breaker.state).to.equal('CLOSED')
  })
})

describe('withRetry', () => {
  it('succeeds on first attempt', async () => {
    const fn = async () => 'ok'
    const result = await withRetry(fn)
    expect(result).to.equal('ok')
  })

  it('retries on failure and succeeds', async () => {
    let attempts = 0
    const fn = async () => {
      attempts++
      if (attempts < 3) throw new Error('temporary')
      return 'ok'
    }
    const result = await withRetry(fn, { maxAttempts: 3, baseDelay: 10 })
    expect(result).to.equal('ok')
    expect(attempts).to.equal(3)
  })

  it('fails after max attempts', async () => {
    const fn = async () => { throw new Error('persistent') }
    try {
      await withRetry(fn, { maxAttempts: 2, baseDelay: 10 })
      throw new Error('should have thrown')
    } catch (err) {
      expect(err.message).to.equal('persistent')
    }
  })

  it('does not retry non-retryable errors', async () => {
    let attempts = 0
    const fn = async () => {
      attempts++
      throw new Error('bad request')
    }
    const isRetryable = (err) => !err.message.includes('bad request')

    try {
      await withRetry(fn, { maxAttempts: 3, baseDelay: 10, isRetryable })
      throw new Error('should have thrown')
    } catch {
      expect(attempts).to.equal(1)
    }
  })
})
