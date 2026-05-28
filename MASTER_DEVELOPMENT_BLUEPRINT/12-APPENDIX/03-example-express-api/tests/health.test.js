import { expect } from 'chai'
import request from 'supertest'
import createApp from '../src/app.js'

describe('GET /health', () => {
  it('returns ok status', async () => {
    const app = createApp()
    const res = await request(app).get('/health')
    expect(res.status).to.equal(200)
    expect(res.body.status).to.equal('ok')
    expect(res.body).to.have.property('uptime')
    expect(res.body).to.have.property('timestamp')
  })
})
