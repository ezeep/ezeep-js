import i18next from 'i18next'
import translationsDE from '../data/locales/de.json'
import translationsEN from '../data/locales/en.json'

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

export const poll = async ({ fn, validate, interval, maxAttempts }) => {
  let attempts = 0

  const executePoll = async (resolve, reject) => {
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

  return new Promise(executePoll)
}

export const removeEmptyStrings = (obj: { [x: string]: any }) => {
  let newObj = {}
  Object.keys(obj).forEach((prop) => {
    if (obj[prop] !== '') {
      newObj[prop] = obj[prop]
    }
  })
  return newObj
}
