import { Router } from 'express'
import { MemoryCacheService } from '../services/cacheService.js'
import CONFIG from '../config/constants.js'

const router = Router()
const healthCache = new MemoryCacheService()

router.get('/health', async (req, res) => {
  const cached = await healthCache.get('health-status')
  if (cached) {
    res.json(cached)
    return
  }

  const status = {
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    memory: process.memoryUsage(),
  }

  await healthCache.set('health-status', status, CONFIG.HEALTH_CACHE_TTL_MS)
  res.json(status)
})

export default router
