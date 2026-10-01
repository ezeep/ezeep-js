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
  /** Legacy single-printer settings blob, read once to seed `printerSettings`. */
  properties: 'properties',
  printer: 'printer',
  printerSettings: 'printerSettings',
} as const

/** Print settings remembered per printer, keyed by printer id. */
type PrinterSettings = Record<string, PrinterProperties>

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
  // Note: the access token is intentionally NOT persisted (kept in memory only,
  // for XSS defense-in-depth). `clearSession` still removes any legacy value.

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

  /**
   * Settings the user last printed with on `printerId`, or null if that printer
   * has none yet. Kept per printer so switching printers never carries another
   * printer's paper size or tray over to one that may not have it.
   */
  getPrinterSettings(printerId: string): PrinterProperties | null {
    return readPrinterSettings()[printerId] ?? null
  },
  setPrinterSettings(printerId: string, properties: PrinterProperties): void {
    const all = readPrinterSettings()
    all[printerId] = properties
    localStorage.setItem(KEY.printerSettings, JSON.stringify(all))
  },

  /** The printer used for the last print, preselected when the dialog reopens. */
  getPrinter(): Printer | null {
    return getJSON<Printer>(KEY.printer)
  },
  setPrinter(printer: Printer): void {
    localStorage.setItem(KEY.printer, JSON.stringify(printer))
  },

  /**
   * Remove everything tied to the current session (used on logout).
   *
   * Print settings and the last printer deliberately survive: they belong to
   * this browser profile rather than to the session, and are validated against
   * the signed-in user's printers on the next load (an unknown printer resets
   * the selection), so the next user never inherits a selection they can't use.
   */
  clearSession(): void {
    localStorage.removeItem(KEY.refreshToken)
    localStorage.removeItem(KEY.accessToken)
    localStorage.removeItem(KEY.isAuthorized)
  },

  /** Forget which printer was last used (when it is gone from the user's list).
   *  Its settings stay put, ready in case that printer comes back. */
  clearSavedPrinter(): void {
    localStorage.removeItem(KEY.printer)
  },
}

/**
 * Read the per-printer settings map, seeding it once from the pre-upgrade
 * single-printer blob so a user who already printed keeps those settings.
 */
function readPrinterSettings(): PrinterSettings {
  const stored = getJSON<PrinterSettings>(KEY.printerSettings)
  if (stored) return stored

  const legacy = getJSON<PrinterProperties>(KEY.properties)
  const legacyPrinter = getJSON<Printer>(KEY.printer)
  if (legacy && legacyPrinter?.id) return { [legacyPrinter.id]: legacy }

  return {}
}
