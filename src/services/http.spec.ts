import { authGetJson, bearer } from './http'

function jsonResponse(body: unknown, status = 200) {
  return Promise.resolve({ status, json: () => Promise.resolve(body) }) as unknown as Promise<Response>
}

describe('bearer', () => {
  it('builds the Authorization header', () => {
    expect(bearer('xyz')).toEqual({ Authorization: 'Bearer xyz' })
  })
})

describe('authGetJson', () => {
  it('GETs with the bearer token and returns the parsed body', async () => {
    const fetchMock = jest.fn().mockReturnValue(jsonResponse({ ok: true }))
    global.fetch = fetchMock as unknown as typeof fetch

    const result = await authGetJson('https://api/x', 'tok')

    expect(fetchMock).toHaveBeenCalledWith('https://api/x', {
      method: 'GET',
      headers: { Authorization: 'Bearer tok' },
    })
    expect(result).toEqual({ ok: true })
  })
})
