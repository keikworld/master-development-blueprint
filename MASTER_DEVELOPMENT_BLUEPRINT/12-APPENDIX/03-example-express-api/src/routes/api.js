import { Router } from 'express'
import { validateCreateUser, validatePagination } from '../middleware/inputValidation.js'

const router = Router()

router.get('/users', (req, res) => {
  const result = validatePagination(req.query)
  if (!result.valid) {
    res.status(400).json({ errors: result.errors })
    return
  }

  res.json({
    page: result.data.page,
    limit: result.data.limit,
    users: [],
  })
})

router.post('/users', (req, res) => {
  if (req.headers['content-type'] !== 'application/json') {
    res.status(415).json({ error: 'Content-Type must be application/json' })
    return
  }

  const result = validateCreateUser(req.body || {})
  if (!result.valid) {
    res.status(400).json({ errors: result.errors })
    return
  }

  res.status(201).json({
    id: `user-${Date.now()}`,
    ...result.data,
    createdAt: new Date().toISOString(),
  })
})

export default router
