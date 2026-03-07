import { describe, test, expect } from 'vitest'
import request from 'supertest'
import { createHttpServer } from '../src/create-server.js'

describe('Smoke Tests', () => {
  const server = createHttpServer()

  test('server starts', async () => {
    const res = await request(server).get('/api/health')
    expect(res.status).toBe(200)
  })

  test('API routes are registered', async () => {
    const res = await request(server).get('/api/status')
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('companyRoot')
  })
})
