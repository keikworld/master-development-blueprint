import { expect } from 'chai'
import request from 'supertest'
import createApp from '../src/app.js'
import {
  validateEmail,
  validateAge,
  validateCreateUser,
  validatePagination,
} from '../src/middleware/inputValidation.js'

describe('Input Validation', () => {
  describe('validateEmail', () => {
    it('accepts valid emails', () => {
      expect(validateEmail('test@example.com')).to.equal('test@example.com')
      expect(validateEmail('USER@Example.COM')).to.equal('user@example.com')
    })

    it('rejects invalid emails', () => {
      expect(() => validateEmail('not-an-email')).to.throw()
      expect(() => validateEmail('')).to.throw()
      expect(() => validateEmail('@domain.com')).to.throw()
    })
  })

  describe('validateAge', () => {
    it('accepts valid ages', () => {
      expect(validateAge(25)).to.equal(25)
      expect(validateAge(0)).to.equal(0)
      expect(validateAge(150)).to.equal(150)
    })

    it('rejects invalid ages', () => {
      expect(() => validateAge(-1)).to.throw()
      expect(() => validateAge(151)).to.throw()
      expect(() => validateAge('25')).to.throw()
    })
  })

  describe('validateCreateUser', () => {
    it('passes valid user data', () => {
      const result = validateCreateUser({
        name: 'Alice',
        email: 'alice@example.com',
        age: 30,
        tags: ['user', 'premium'],
      })
      expect(result.valid).to.be.true
      expect(result.data.name).to.equal('Alice')
      expect(result.data.email).to.equal('alice@example.com')
    })

    it('handles missing body', () => {
      const result = validateCreateUser(undefined)
      expect(result.valid).to.be.false
      expect(result.errors[0].code).to.equal('REQUIRED')
    })

    it('collects multiple validation errors', () => {
      const result = validateCreateUser({
        email: 'bad-email',
        age: -5,
        name: '',
        tags: 'not-an-array',
      })
      expect(result.valid).to.be.false
      expect(result.errors.length).to.be.greaterThan(0)
    })

    it('passes with only optional fields', () => {
      const result = validateCreateUser({ name: 'Bob' })
      expect(result.valid).to.be.true
      expect(result.data.name).to.equal('Bob')
    })
  })

  describe('validatePagination', () => {
    it('defaults to page 1, limit 20', () => {
      const result = validatePagination({})
      expect(result.valid).to.be.true
      expect(result.data.page).to.equal(1)
      expect(result.data.limit).to.equal(20)
    })

    it('accepts valid pagination params', () => {
      const result = validatePagination({ page: '3', limit: '50' })
      expect(result.valid).to.be.true
      expect(result.data.page).to.equal(3)
      expect(result.data.limit).to.equal(50)
    })

    it('rejects negative page', () => {
      const result = validatePagination({ page: '-1' })
      expect(result.valid).to.be.false
    })
  })
})

describe('POST /users validation', () => {
  it('returns 400 for invalid data', async () => {
    const app = createApp()
    const res = await request(app)
      .post('/users')
      .send({ email: 'bad', age: -1 })
      .set('Content-Type', 'application/json')
    expect(res.status).to.equal(400)
    expect(res.body.errors).to.be.an('array')
    expect(res.body.errors.length).to.be.greaterThan(0)
  })

  it('returns 415 for wrong content type', async () => {
    const app = createApp()
    const res = await request(app)
      .post('/users')
      .send('name=alice')
      .set('Content-Type', 'application/x-www-form-urlencoded')
    expect(res.status).to.equal(415)
  })
})
