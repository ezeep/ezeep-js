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

  it('serialises and parses the printer object', () => {
    storage.setPrinter({ id: 'p1', name: 'Printer', location: 'Lab', is_queue: false })
    expect(storage.getPrinter()).toEqual({
      id: 'p1',
      name: 'Printer',
      location: 'Lab',
      is_queue: false,
    })
  })

  it('returns null (not a throw) for corrupt JSON', () => {
    localStorage.setItem('printer', '{not valid json')
    expect(storage.getPrinter()).toBeNull()
  })

  it("keeps each printer's settings apart", () => {
    storage.setPrinterSettings('p1', { color: true, paper: 'A4' })
    storage.setPrinterSettings('p2', { color: false, paper: 'Letter' })

    expect(storage.getPrinterSettings('p1')).toEqual({ color: true, paper: 'A4' })
    expect(storage.getPrinterSettings('p2')).toEqual({ color: false, paper: 'Letter' })
    expect(storage.getPrinterSettings('never-used')).toBeNull()
  })

  it('adopts the pre-upgrade settings blob for the printer it was saved with', () => {
    // Written by a version that kept one set of settings for one printer.
    localStorage.setItem('properties', JSON.stringify({ color: true, paper: 'A4' }))
    localStorage.setItem(
      'printer',
      JSON.stringify({ id: 'old', name: 'n', location: 'l', is_queue: false }),
    )

    expect(storage.getPrinterSettings('old')).toEqual({ color: true, paper: 'A4' })
    expect(storage.getPrinterSettings('other')).toBeNull()
  })

  it('clearSession ends the session but keeps the print settings', () => {
    localStorage.setItem('access_token', 'a') // legacy value from before in-memory tokens
    storage.setRefreshToken('r')
    storage.setIsAuthorized(true)
    storage.setPrinterSettings('p', { color: true })
    storage.setPrinter({ id: 'p', name: 'n', location: 'l', is_queue: false })

    storage.clearSession()

    expect(localStorage.getItem('access_token')).toBeNull()
    expect(localStorage.getItem('refreshToken')).toBeNull()
    expect(localStorage.getItem('isAuthorized')).toBeNull()
    // These belong to the browser profile, not the session: the next sign-in
    // validates them against that user's printers.
    expect(storage.getPrinterSettings('p')).toEqual({ color: true })
    expect(storage.getPrinter()).not.toBeNull()
  })

  it('clearSavedPrinter forgets the printer but keeps its settings for its return', () => {
    storage.setRefreshToken('keep-me')
    storage.setPrinterSettings('p', { color: true })
    storage.setPrinter({ id: 'p', name: 'n', location: 'l', is_queue: false })

    storage.clearSavedPrinter()

    expect(storage.getPrinter()).toBeNull()
    expect(storage.getPrinterSettings('p')).toEqual({ color: true })
    expect(storage.getRefreshToken()).toBe('keep-me')
  })
})
