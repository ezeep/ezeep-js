/**
 * Single typed entry point for the `localStorage` keys this library persists.
 *
 * Previously these keys were referenced as string literals in ~30 places across
 * services and components, with inconsistent naming (`access_token` vs
 * `refreshToken`). The literal key strings are preserved here exactly so that
 * users who are already signed in keep their session across an upgrade.
 */

import { PrinterProperties, Printer } from './types'

/** Persisted localStorage keys. Do not change the string values — see note above. */
const KEY = {
  accessToken: 'access_token',
  refreshToken: 'refreshToken',
  isAuthorized: 'isAuthorized',
  properties: 'properties',
  printer: 'printer',
} as const

function getJSON<T>(key: string): T | null {
  const raw = localStorage.getItem(key)
  if (raw === null) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export const storage = {
  getAccessToken(): string | null {
    return localStorage.getItem(KEY.accessToken)
  },
  setAccessToken(token: string): void {
    localStorage.setItem(KEY.accessToken, token)
  },

  getRefreshToken(): string | null {
    return localStorage.getItem(KEY.refreshToken)
  },
  setRefreshToken(token: string): void {
    localStorage.setItem(KEY.refreshToken, token)
  },

  getIsAuthorized(): boolean {
    return localStorage.getItem(KEY.isAuthorized) === 'true'
  },
  setIsAuthorized(value: boolean): void {
    localStorage.setItem(KEY.isAuthorized, value.toString())
  },
  hasIsAuthorized(): boolean {
    return localStorage.getItem(KEY.isAuthorized) !== null
  },

  getProperties(): PrinterProperties | null {
    return getJSON<PrinterProperties>(KEY.properties)
  },
  setProperties(properties: PrinterProperties): void {
    localStorage.setItem(KEY.properties, JSON.stringify(properties))
  },

  getPrinter(): Printer | null {
    return getJSON<Printer>(KEY.printer)
  },
  setPrinter(printer: Printer): void {
    localStorage.setItem(KEY.printer, JSON.stringify(printer))
  },

  /** Remove everything tied to the current session (used on logout). */
  clearSession(): void {
    localStorage.removeItem(KEY.properties)
    localStorage.removeItem(KEY.refreshToken)
    localStorage.removeItem(KEY.accessToken)
    localStorage.removeItem(KEY.printer)
    localStorage.removeItem(KEY.isAuthorized)
  },

  /** Remove just the saved printer + its properties (used when the saved printer is gone). */
  clearSavedPrinter(): void {
    localStorage.removeItem(KEY.printer)
    localStorage.removeItem(KEY.properties)
  },
}
