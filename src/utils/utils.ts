import i18next from "i18next"
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

export function initi18n() {
  const resources = {
    en: {
      translation: translationsEN,
    },
    de: {
      translation: translationsDE,
    },
  }

  i18next.init({
    resources,
    lng: navigator.language,
    // allow keys to be phrases having `:`, `.`
    nsSeparator: false,
    fallbackLng: 'en',
  })
}
