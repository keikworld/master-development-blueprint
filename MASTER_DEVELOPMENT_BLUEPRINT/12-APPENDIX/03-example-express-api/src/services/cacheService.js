import CONFIG from '../config/constants.js'

class MemoryCacheService {
  constructor() {
    this._store = new Map()
    this._timers = new Map()
  }

  async get(key) {
    const entry = this._store.get(key)
    if (!entry) return null
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this._store.delete(key)
      this._clearTimer(key)
      return null
    }
    return entry.value
  }

  async set(key, value, ttlMs = CONFIG.HEALTH_CACHE_TTL_MS) {
    this._store.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
    })
    this._clearTimer(key)
    if (ttlMs > 0) {
      const timer = setTimeout(() => {
        this._store.delete(key)
        this._timers.delete(key)
      }, ttlMs)
      if (timer.unref) timer.unref()
      this._timers.set(key, timer)
    }
  }

  async delete(key) {
    this._store.delete(key)
    this._clearTimer(key)
  }

  async clear() {
    this._store.clear()
    for (const timer of this._timers.values()) {
      clearTimeout(timer)
    }
    this._timers.clear()
  }

  get size() {
    return this._store.size
  }

  _clearTimer(key) {
    const timer = this._timers.get(key)
    if (timer) {
      clearTimeout(timer)
      this._timers.delete(key)
    }
  }
}

export { MemoryCacheService }
