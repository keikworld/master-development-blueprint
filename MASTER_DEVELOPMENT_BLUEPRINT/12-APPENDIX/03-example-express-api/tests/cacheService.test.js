import { expect } from 'chai'
import { MemoryCacheService } from '../src/services/cacheService.js'

describe('MemoryCacheService', () => {
  let cache

  beforeEach(() => {
    cache = new MemoryCacheService()
  })

  afterEach(async () => {
    await cache.clear()
  })

  it('stores and retrieves values', async () => {
    await cache.set('key1', 'value1')
    const result = await cache.get('key1')
    expect(result).to.equal('value1')
  })

  it('returns null for missing keys', async () => {
    const result = await cache.get('nonexistent')
    expect(result).to.be.null
  })

  it('respects TTL expiry', async () => {
    await cache.set('short', 'temp', 10)
    let result = await cache.get('short')
    expect(result).to.equal('temp')

    await new Promise(resolve => setTimeout(resolve, 20))
    result = await cache.get('short')
    expect(result).to.be.null
  })

  it('deletes values', async () => {
    await cache.set('key1', 'value1')
    await cache.delete('key1')
    const result = await cache.get('key1')
    expect(result).to.be.null
  })

  it('tracks size', async () => {
    expect(cache.size).to.equal(0)
    await cache.set('a', 1)
    expect(cache.size).to.equal(1)
    await cache.set('b', 2)
    expect(cache.size).to.equal(2)
  })

  it('clears all values', async () => {
    await cache.set('a', 1)
    await cache.set('b', 2)
    await cache.clear()
    expect(cache.size).to.equal(0)
    expect(await cache.get('a')).to.be.null
    expect(await cache.get('b')).to.be.null
  })
})
