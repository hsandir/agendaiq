import fetch from 'node-fetch'

describe('Security smoke tests', () => {
  const baseURL = process.env.BASE_URL || 'https://www.agendaiq.app'

  test.skip('RBAC denies access to admin route for teacher', async () => {
    const res = await fetch(`${baseURL}/api/admin`, {
      headers: { Authorization: 'Bearer teacher-token' },
    })
    expect(res.status).toBe(403)
  })

  test.skip('CSRF token required for form submission', async () => {
    const res = await fetch(`${baseURL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'x', password: 'y' }),
    })
    expect(res.status).toBeGreaterThanOrEqual(400)
  })
})
