import createApp from './app.js'
import env from './config/env.js'
import logger from './middleware/structuredLogger.js'
import CONFIG from './config/constants.js'

const app = createApp()
const port = env.PORT || CONFIG.DEFAULT_PORT

const server = app.listen(port, () => {
  logger.info({ port, env: env.NODE_ENV }, 'server started')
})

function shutdown(signal) {
  logger.info({ signal }, 'shutting down')
  server.close(() => {
    logger.info('server closed')
    process.exit(0)
  })
  setTimeout(() => {
    logger.error('forced shutdown')
    process.exit(1)
  }, 5000).unref()
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))
