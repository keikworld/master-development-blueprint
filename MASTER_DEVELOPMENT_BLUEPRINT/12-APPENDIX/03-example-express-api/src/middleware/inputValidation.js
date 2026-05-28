import CONFIG from '../config/constants.js'

class ValidationError extends Error {
  constructor(message, field, code) {
    super(message)
    this.name = 'ValidationError'
    this.statusCode = 400
    this.field = field
    this.code = code
  }
}

function exists(value, field) {
  if (value === undefined || value === null) {
    throw new ValidationError(`${field} is required`, field, 'REQUIRED')
  }
  return value
}

function isType(value, type, field) {
  const actual = typeof value
  if (actual !== type) {
    throw new ValidationError(
      `${field} must be ${type}, got ${actual}`,
      field,
      'WRONG_TYPE',
    )
  }
  return value
}

function isString(value, field) {
  return isType(value, 'string', field)
}

function isNumber(value, field) {
  return isType(value, 'number', field)
}

function isArray(value, field) {
  if (!Array.isArray(value)) {
    throw new ValidationError(
      `${field} must be an array, got ${typeof value}`,
      field,
      'WRONG_TYPE',
    )
  }
  return value
}

function maxLength(value, max, field) {
  if (value.length > max) {
    throw new ValidationError(
      `${field} exceeds max length ${max} (got ${value.length})`,
      field,
      'TOO_LONG',
    )
  }
  return value
}

function maxValue(value, max, field) {
  if (value > max) {
    throw new ValidationError(
      `${field} exceeds max value ${max} (got ${value})`,
      field,
      'TOO_LARGE',
    )
  }
  return value
}

function minValue(value, min, field) {
  if (value < min) {
    throw new ValidationError(
      `${field} below min value ${min} (got ${value})`,
      field,
      'TOO_SMALL',
    )
  }
  return value
}

function matchesPattern(value, pattern, field) {
  if (!pattern.test(value)) {
    throw new ValidationError(
      `${field} has invalid format`,
      field,
      'INVALID_FORMAT',
    )
  }
  return value
}

function sanitizeString(value, field) {
  isString(value, field)
  maxLength(value, CONFIG.INPUT_MAX_STRING_LENGTH, field)
  const trimmed = value.trim()
  if (trimmed.length === 0) {
    throw new ValidationError(`${field} cannot be empty`, field, 'EMPTY')
  }
  return trimmed
}

function validateEmail(value) {
  isString(value, 'email')
  maxLength(value, CONFIG.INPUT_MAX_STRING_LENGTH, 'email')
  matchesPattern(value, /^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'email')
  return value.trim().toLowerCase()
}

function validateAge(value) {
  isNumber(value, 'age')
  minValue(value, 0, 'age')
  maxValue(value, 150, 'age')
  return Math.floor(value)
}

function validateTags(value) {
  isArray(value, 'tags')
  maxLength(value, CONFIG.INPUT_MAX_ARRAY_LENGTH, 'tags')
  value.forEach((tag, idx) => {
    sanitizeString(tag, `tags[${idx}]`)
  })
  return value
}

function validateCreateUser(body) {
  const errors = []

  try {
    exists(body, 'body')
  } catch {
    return { valid: false, errors: [{ field: 'body', code: 'REQUIRED' }] }
  }

  if (body.email !== undefined) {
    try { body.email = validateEmail(body.email) }
    catch (e) { errors.push({ field: e.field, code: e.code, message: e.message }) }
  }

  if (body.age !== undefined) {
    try { body.age = validateAge(body.age) }
    catch (e) { errors.push({ field: e.field, code: e.code, message: e.message }) }
  }

  if (body.name !== undefined) {
    try { body.name = sanitizeString(body.name, 'name') }
    catch (e) { errors.push({ field: e.field, code: e.code, message: e.message }) }
  }

  if (body.tags !== undefined) {
    try { body.tags = validateTags(body.tags) }
    catch (e) { errors.push({ field: e.field, code: e.code, message: e.message }) }
  }

  if (errors.length > 0) {
    return { valid: false, errors }
  }

  return { valid: true, data: body }
}

function validatePagination(query) {
  const errors = []
  const result = { page: 1, limit: 20 }

  if (query.page !== undefined) {
    const page = parseInt(query.page, 10)
    if (Number.isNaN(page) || page < 1) {
      errors.push({ field: 'page', code: 'INVALID', message: 'page must be a positive integer' })
    } else {
      result.page = page
    }
  }

  if (query.limit !== undefined) {
    const limit = parseInt(query.limit, 10)
    if (Number.isNaN(limit) || limit < 1) {
      errors.push({ field: 'limit', code: 'INVALID', message: 'limit must be a positive integer' })
    } else {
      maxValue(limit, 100, 'limit')
      result.limit = limit
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors }
  }

  return { valid: true, data: result }
}

export {
  ValidationError,
  exists,
  isString,
  isNumber,
  isArray,
  maxLength,
  maxValue,
  minValue,
  matchesPattern,
  sanitizeString,
  validateEmail,
  validateAge,
  validateTags,
  validateCreateUser,
  validatePagination,
}
