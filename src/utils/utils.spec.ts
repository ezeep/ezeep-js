import {
  encodeFormData,
  capitalize,
  removeEmptyStrings,
  managePaperDimensions,
  formatPageRange,
  validatePageRange,
  PAPER_ID,
} from './utils'

describe('encodeFormData', () => {
  it('url-encodes keys and values and joins with &', () => {
    expect(encodeFormData({ grant_type: 'refresh_token', scope: 'printing' })).toBe(
      'grant_type=refresh_token&scope=printing'
    )
    expect(encodeFormData({ 'a b': 'c&d' })).toBe('a%20b=c%26d')
  })
})

describe('capitalize', () => {
  it('uppercases the first character only', () => {
    expect(capitalize('hello')).toBe('Hello')
    expect(capitalize('A4')).toBe('A4')
  })
})

describe('removeEmptyStrings', () => {
  it('drops keys whose value is an empty string but keeps falsy non-strings', () => {
    expect(removeEmptyStrings({ a: '', b: 'x', c: 0, d: false })).toEqual({ b: 'x', c: 0, d: false })
  })
})

describe('managePaperDimensions', () => {
  it('removes custom dimensions when the paper is not the custom size', () => {
    const result = managePaperDimensions({ paperid: 9, paperlength: 5, paperwidth: 4 })
    expect(result.paperlength).toBeUndefined()
    expect(result.paperwidth).toBeUndefined()
  })

  it('scales custom dimensions by 10 for the custom paper size', () => {
    const result = managePaperDimensions({ paperid: PAPER_ID, paperlength: 5, paperwidth: 4 })
    expect(result.paperlength).toBe(50)
    expect(result.paperwidth).toBe(40)
  })
})

describe('formatPageRange', () => {
  it('replaces commas with semicolons', () => {
    expect(formatPageRange('1-2,4,6-8')).toBe('1-2;4;6-8')
  })
})

describe('validatePageRange', () => {
  it('accepts empty input and valid ranges', () => {
    expect(validatePageRange('')).toBe(true)
    expect(validatePageRange('1')).toBe(true)
    expect(validatePageRange('1-2,4-5,8')).toBe(true)
  })

  it('rejects malformed ranges and reversed/zero bounds', () => {
    expect(validatePageRange('a')).toBe(false)
    expect(validatePageRange('5-2')).toBe(false)
    expect(validatePageRange('0-3')).toBe(false)
    expect(validatePageRange('1-')).toBe(false)
  })
})
