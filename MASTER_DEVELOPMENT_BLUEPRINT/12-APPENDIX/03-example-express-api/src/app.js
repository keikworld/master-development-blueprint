import express from 'express'
import healthRouter from './routes/health.js'
import apiRouter from './routes/api.js'
import errorHandler from './middleware/errorHandler.js'

function createApp() {
  const app = express()

  app.use(express.json())

  app.use(healthRouter)
  app.use(apiRouter)

  app.use(errorHandler)

  return app
}

export default createApp
