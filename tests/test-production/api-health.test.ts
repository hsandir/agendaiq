import fetch from 'node-fetch'

describe('API health checks', () => {
  const baseURL = process.env.BASE_URL || 'https://www.agendaiq.app'

  test.skip('GET /api/health returns 200', async () => {
    const res = await fetch(`${baseURL}/api/health`)
    expect(res.status).toBe(200)
  })
})
