import i18next from 'i18next'
import translationsDE from '../data/locales/de.json'
import translationsEN from '../data/locales/en.json'
import { PrinterProperties } from './../shared/types';

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

export const managePaperDimensions = (properties :PrinterProperties)=>{
  if(properties.paperid != PAPER_ID){
    delete properties.paperlength
    delete properties.paperwidth
  }

  if(properties.paperlength && properties.paperwidth){
    properties.paperlength = +properties.paperlength * 10
    properties.paperwidth = +properties.paperwidth * 10
  }

  return properties
}

export const formatPageRange = (pageRange) => {
  return pageRange.replace(/,/g, ';')
}

export const validatePageRange = (pageRange) => {
  if (!pageRange) {
    return true
  }
  const regex = /^(\d+(-\d+)?(,\d+(-\d+)?)*|(\d+,\d+(-\d+)?(,\d+(-\d+)?)*)+)$/;
  const isValid = regex.test(pageRange);
  if (!isValid) {
    return false
  }
  let ranges = pageRange.split(',');
  for (let i = 0; i < ranges.length; i++) {
    let rng = ranges[i].trim();
    if (rng.includes('-')) {
      let [start, end] = rng.split('-');
      start = parseInt(start);
      end = parseInt(end);
      if (isNaN(start) || isNaN(end) || start > end || start <= 0) {
        return false;
      }
    } else {
      let page = parseInt(rng);
      if (isNaN(page) || page <= 0) {
        return false
      }
    }
  }
  return true
}

export const PAPER_ID = 256
