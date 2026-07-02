import { storage } from './storage'

describe('storage', () => {
  beforeEach(() => localStorage.clear())

  it('round-trips the refresh token using the legacy key name', () => {
    storage.setRefreshToken('def')
    expect(storage.getRefreshToken()).toBe('def')
    // The literal key string must not change (existing sessions depend on it).
    expect(localStorage.getItem('refreshToken')).toBe('def')
  })

  it('returns null for an unset refresh token', () => {
    expect(storage.getRefreshToken()).toBeNull()
  })

  it('stores isAuthorized as a string and reads it back as a boolean', () => {
    storage.setIsAuthorized(true)
    expect(localStorage.getItem('isAuthorized')).toBe('true')
    expect(storage.getIsAuthorized()).toBe(true)
    expect(storage.hasIsAuthorized()).toBe(true)

    storage.setIsAuthorized(false)
    expect(storage.getIsAuthorized()).toBe(false)
  })

  it('hasIsAuthorized is false until set', () => {
    expect(storage.hasIsAuthorized()).toBe(false)
  })

  it('serialises and parses properties and printer objects', () => {
    storage.setProperties({ copies: 2, color: true })
    storage.setPrinter({ id: 'p1', name: 'Printer', location: 'Lab', is_queue: false })
    expect(storage.getProperties()).toEqual({ copies: 2, color: true })
    expect(storage.getPrinter()).toEqual({
      id: 'p1',
      name: 'Printer',
      location: 'Lab',
      is_queue: false,
    })
  })

  it('returns null (not a throw) for corrupt JSON', () => {
    localStorage.setItem('properties', '{not valid json')
    expect(storage.getProperties()).toBeNull()
  })

  it('clearSession removes every session key (incl. any legacy access_token)', () => {
    localStorage.setItem('access_token', 'a') // legacy value from before in-memory tokens
    storage.setRefreshToken('r')
    storage.setIsAuthorized(true)
    storage.setProperties({ copies: 1 })
    storage.setPrinter({ id: 'p', name: 'n', location: 'l', is_queue: false })

    storage.clearSession()

    expect(localStorage.getItem('access_token')).toBeNull()
    expect(localStorage.getItem('refreshToken')).toBeNull()
    expect(localStorage.getItem('isAuthorized')).toBeNull()
    expect(localStorage.getItem('properties')).toBeNull()
    expect(localStorage.getItem('printer')).toBeNull()
  })

  it('clearSavedPrinter removes only the printer + its properties', () => {
    storage.setRefreshToken('keep-me')
    storage.setProperties({ copies: 1 })
    storage.setPrinter({ id: 'p', name: 'n', location: 'l', is_queue: false })

    storage.clearSavedPrinter()

    expect(storage.getPrinter()).toBeNull()
    expect(storage.getProperties()).toBeNull()
    expect(storage.getRefreshToken()).toBe('keep-me')
  })
})
