import { forceUpdate } from '@stencil/core'
import i18next from 'i18next'
import translationsDE from '../data/locales/de.json'
import translationsEN from '../data/locales/en.json'
import { PrinterProperties, TooltipPlacementTypes } from './../shared/types'
import { PAPER_ID } from '../shared/constants'

export { PAPER_ID } from '../shared/constants'

/**
 * Re-render a Stencil component whenever the i18next language changes.
 * i18next fires `languageChanged` but has no hook into Stencil's render cycle,
 * so any component that calls `i18next.t()` in render() must force an update —
 * otherwise a runtime language switch leaves already-mounted text stale.
 * Call from connectedCallback and invoke the returned disposer in
 * disconnectedCallback.
 */
export function subscribeToLanguageChange(component: unknown): () => void {
  const rerender = () => forceUpdate(component)
  i18next.on('languageChanged', rerender)
  return () => i18next.off('languageChanged', rerender)
}

/** Index of the first child of a scroll container that is at least half in
 *  view, or -1 when it has none. Lists use it to open the topmost visible row's
 *  tooltip downwards, as nothing in the list is left above that row to cover.
 *  A row showing only a sliver doesn't count: the row below it is the one the
 *  user reads first, and that one should open downwards. */
export function firstVisibleChild(container: HTMLElement): number {
  const top = container.getBoundingClientRect().top
  return Array.from(container.children).findIndex((child) => {
    const rect = child.getBoundingClientRect()
    return (rect.top + rect.bottom) / 2 > top
  })
}

/**
 * Side a tooltip should open on, given where it was asked to open and the room
 * there is. The requested side wins whenever the bubble fits there; otherwise
 * it flips to the other side if that fits, or if that simply has more room.
 * All values are in the same (screen) pixels.
 */
export function pickTooltipSide(
  requested: TooltipPlacementTypes,
  row: { top: number; bottom: number },
  needed: number,
  visible: { top: number; bottom: number },
): TooltipPlacementTypes {
  const above = row.top - visible.top
  const below = visible.bottom - row.bottom
  const room = { top: above, bottom: below }
  const other: TooltipPlacementTypes = requested === 'top' ? 'bottom' : 'top'
  if (room[requested] >= needed) return requested
  if (room[other] >= needed || room[other] > room[requested]) return other
  return requested
}

export function encodeFormData(data: { [x: string]: string | number | boolean }): string {
  return Object.keys(data)
    .map((key) => encodeURIComponent(key) + '=' + encodeURIComponent(data[key]))
    .join('&')
}

export function capitalize(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1)
}

export function initi18n(language?: string) {
  const resources = {
    en: {
      translation: translationsEN,
    },
    de: {
      translation: translationsDE,
    },
  }
  // override browserlanguage if language is provided
  if (language != '') {
    i18next.init({
      resources,
      lng: language,
      // allow keys to be phrases having `:`, `.`
      nsSeparator: false,
      fallbackLng: 'en',
    })
  } else {
    i18next.init({
      resources,
      lng: navigator.language,
      // allow keys to be phrases having `:`, `.`
      nsSeparator: false,
      fallbackLng: 'en',
    })
  }
}

interface PollOptions<T> {
  fn: () => Promise<T>
  validate: (result: T) => boolean
  interval: number
  maxAttempts: number
}

export const poll = async <T = any>({
  fn,
  validate,
  interval,
  maxAttempts,
}: PollOptions<T>): Promise<T> => {
  let attempts = 0

  const executePoll = async (resolve: (value: T) => void, reject: (reason?: unknown) => void) => {
    const result = await fn()
    attempts++

    if (validate(result)) {
      return resolve(result)
    } else if (maxAttempts && attempts === maxAttempts) {
      return reject(new Error('Exceeded max attempts.'))
    } else {
      setTimeout(executePoll, interval, resolve, reject)
    }
  }

  return new Promise<T>(executePoll)
}

export const removeEmptyStrings = (obj: { [x: string]: any }) => {
  const newObj: { [key: string]: any } = {}
  Object.keys(obj).forEach((prop) => {
    if (obj[prop] !== '') {
      newObj[prop] = obj[prop]
    }
  })
  return newObj
}

export const managePaperDimensions = (properties: PrinterProperties) => {
  if (properties.paperid != PAPER_ID) {
    delete properties.paperlength
    delete properties.paperwidth
  }

  if (properties.paperlength && properties.paperwidth) {
    properties.paperlength = +properties.paperlength * 10
    properties.paperwidth = +properties.paperwidth * 10
  }

  return properties
}

export const formatPageRange = (pageRange: string) => {
  return pageRange.replace(/,/g, ';')
}

export const validatePageRange = (pageRange: string) => {
  if (!pageRange) {
    return true
  }
  const regex = /^(\d+(-\d+)?(,\d+(-\d+)?)*|(\d+,\d+(-\d+)?(,\d+(-\d+)?)*)+)$/
  const isValid = regex.test(pageRange)
  if (!isValid) {
    return false
  }
  const ranges = pageRange.split(',')
  for (let i = 0; i < ranges.length; i++) {
    const rng = ranges[i].trim()
    if (rng.includes('-')) {
      const [startStr, endStr] = rng.split('-')
      const start = parseInt(startStr)
      const end = parseInt(endStr)
      if (isNaN(start) || isNaN(end) || start > end || start <= 0) {
        return false
      }
    } else {
      const page = parseInt(rng)
      if (isNaN(page) || page <= 0) {
        return false
      }
    }
  }
  return true
}
