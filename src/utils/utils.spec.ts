import {
  encodeFormData,
  firstVisibleChild,
  pickTooltipSide,
  capitalize,
  removeEmptyStrings,
  managePaperDimensions,
  formatPageRange,
  validatePageRange,
  poll,
  PAPER_ID,
} from './utils'

describe('poll', () => {
  it('resolves once validate passes', async () => {
    let n = 0
    const fn = jest.fn(async () => ++n)
    const result = await poll<number>({ fn, validate: (r) => r >= 3, interval: 0, maxAttempts: 10 })
    expect(result).toBe(3)
    expect(fn).toHaveBeenCalledTimes(3)
  })

  it('rejects after exceeding maxAttempts', async () => {
    const fn = jest.fn(async () => 0)
    await expect(
      poll<number>({ fn, validate: () => false, interval: 0, maxAttempts: 3 }),
    ).rejects.toThrow('Exceeded max attempts')
    expect(fn).toHaveBeenCalledTimes(3)
  })
})

describe('encodeFormData', () => {
  it('url-encodes keys and values and joins with &', () => {
    expect(encodeFormData({ grant_type: 'refresh_token', scope: 'printing' })).toBe(
      'grant_type=refresh_token&scope=printing',
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
    expect(removeEmptyStrings({ a: '', b: 'x', c: 0, d: false })).toEqual({
      b: 'x',
      c: 0,
      d: false,
    })
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

describe('firstVisibleChild', () => {
  /** A container whose top edge sits at 100, with 30px children ending at `bottoms`. */
  function container(bottoms: number[]): HTMLElement {
    const child = (bottom: number) => ({
      getBoundingClientRect: () => ({ top: bottom - 30, bottom }),
    })
    return {
      getBoundingClientRect: () => ({ top: 100 }),
      children: bottoms.map(child),
    } as unknown as HTMLElement
  }

  it('finds the first child that is at least half in view', () => {
    // The first two are scrolled out; the third shows two thirds of itself.
    expect(firstVisibleChild(container([40, 100, 120, 150]))).toBe(2)
  })

  it('skips a child showing only a sliver, for the one below it', () => {
    // 4px of the first child shows; the second is the row read first.
    expect(firstVisibleChild(container([104, 134, 164]))).toBe(1)
  })

  it('reports -1 for an empty container', () => {
    expect(firstVisibleChild(container([]))).toBe(-1)
  })
})

describe('pickTooltipSide', () => {
  // The visible area runs from 100 to 400; the bubble needs 54px with its gap.
  const visible = { top: 100, bottom: 400 }

  it('keeps the requested side when the bubble fits there', () => {
    expect(pickTooltipSide('top', { top: 200, bottom: 220 }, 54, visible)).toBe('top')
    expect(pickTooltipSide('bottom', { top: 200, bottom: 220 }, 54, visible)).toBe('bottom')
  })

  it('flips downwards when the row sits too close to the top edge', () => {
    // The case from review: a row 30px into a scrolled list, under a
    // two-line bubble that would be cut off by the card's top.
    expect(pickTooltipSide('top', { top: 130, bottom: 150 }, 54, visible)).toBe('bottom')
  })

  it('flips upwards when the row sits too close to the bottom edge', () => {
    expect(pickTooltipSide('bottom', { top: 360, bottom: 380 }, 54, visible)).toBe('top')
  })

  it('takes the roomier side when the bubble fits on neither', () => {
    // 110px above, 40px below, but the bubble needs 120px.
    expect(pickTooltipSide('bottom', { top: 210, bottom: 360 }, 120, visible)).toBe('top')
    // 20px above, 180px below.
    expect(pickTooltipSide('top', { top: 120, bottom: 220 }, 300, visible)).toBe('bottom')
  })

  it('stays put when neither side fits and the other has no more room', () => {
    expect(pickTooltipSide('top', { top: 150, bottom: 350 }, 120, visible)).toBe('top')
  })
})
