import CONFIG from './constants.js'

function getEnv(key, fallback) {
  const value = process.env[key]
  if (value === undefined || value === '') {
    return fallback
  }
  return value
}

function getEnvInt(key, fallback) {
  const raw = process.env[key]
  if (raw === undefined || raw === '') {
    return fallback
  }
  const parsed = parseInt(raw, 10)
  if (Number.isNaN(parsed) || parsed < 0) {
    return fallback
  }
  return parsed
}

const env = Object.freeze({
  PORT: getEnvInt('PORT', CONFIG.DEFAULT_PORT),
  NODE_ENV: getEnv('NODE_ENV', 'development'),
  LOG_LEVEL: getEnv('LOG_LEVEL', CONFIG.DEFAULT_LOG_LEVEL),
  RATE_LIMIT_WINDOW_MS: getEnvInt('RATE_LIMIT_WINDOW_MS', CONFIG.RATE_LIMIT_WINDOW_MS),
  RATE_LIMIT_MAX_REQUESTS: getEnvInt('RATE_LIMIT_MAX_REQUESTS', CONFIG.RATE_LIMIT_MAX_REQUESTS),
})

export default env
