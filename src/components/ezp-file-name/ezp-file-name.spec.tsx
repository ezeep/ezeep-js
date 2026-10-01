import { newSpecPage } from '@stencil/core/testing'
import { EzpFileName } from './ezp-file-name'

async function setup(name: string, extra = '') {
  const page = await newSpecPage({
    components: [EzpFileName],
    html: `<ezp-file-name name="${name}" ${extra}></ezp-file-name>`,
  })
  return { page, fn: page.rootInstance as any, shadow: page.root!.shadowRoot! }
}

/** Waits out the tooltip's open delay on the real clock. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 400))

/** The two labels together always spell out the whole name. */
function rendered(shadow: ShadowRoot): string {
  return Array.from(shadow.querySelectorAll('ezp-label'))
    .map((el) => el.getAttribute('text'))
    .join('')
}

describe('ezp-file-name', () => {
  it('holds the tail back from truncation so a suffix stays readable', async () => {
    const { shadow } = await setup('Quarterly_Report_2026_final_DE.pdf')

    const head = shadow.querySelector('.head')!
    const tail = shadow.querySelector('.tail')!

    // Only the head may be clipped by CSS, so the distinguishing end survives.
    expect(head.getAttribute('ellipsis')).not.toBeNull()
    expect(tail.getAttribute('text')).toBe('l_DE.pdf')
    expect(rendered(shadow)).toBe('Quarterly_Report_2026_final_DE.pdf')
  })

  it('leaves a short name in one piece', async () => {
    const { shadow } = await setup('a.pdf')

    expect(shadow.querySelector('.tail')).toBeNull()
    expect(shadow.querySelector('.head')!.getAttribute('text')).toBe('a.pdf')
  })

  it('shows the whole name once expanded, and collapses again', async () => {
    const { page, fn, shadow } = await setup('Quarterly_Report_2026_final_DE.pdf')

    fn.toggleExpanded()
    await page.waitForChanges()

    expect(shadow.querySelector('.tail')).toBeNull()
    expect(shadow.querySelector('.head')!.getAttribute('text')).toBe(
      'Quarterly_Report_2026_final_DE.pdf',
    )
    expect(shadow.querySelector('#trigger')!.getAttribute('aria-expanded')).toBe('true')

    fn.toggleExpanded()
    await page.waitForChanges()
    expect(shadow.querySelector('.tail')!.getAttribute('text')).toBe('l_DE.pdf')
  })

  it('does not open a tooltip on a device without hover', async () => {
    const { page, fn, shadow } = await setup('Quarterly_Report_2026_final_DE.pdf')
    // Touch devices get the tap-to-expand path; tapping fires a synthetic
    // mouseenter, which must not raise a tooltip nothing can dismiss.
    window.matchMedia = jest.fn().mockReturnValue({ matches: false }) as any
    fn.isClipped = jest.fn().mockResolvedValue(true)

    fn.openTooltip()
    await settle()
    await page.waitForChanges()

    expect(shadow.querySelector('#tooltip')).toBeNull()
  })

  it('opens the tooltip only once the name is actually clipped', async () => {
    const { page, fn, shadow } = await setup('Quarterly_Report_2026_final_DE.pdf')
    window.matchMedia = jest.fn().mockReturnValue({ matches: true }) as any

    // A name that fits needs no tooltip...
    fn.isClipped = jest.fn().mockResolvedValue(false)
    fn.openTooltip()
    await settle()
    await page.waitForChanges()
    expect(shadow.querySelector('#tooltip')).toBeNull()

    // ...but a clipped one does.
    fn.isClipped = jest.fn().mockResolvedValue(true)
    fn.openTooltip()
    await settle()
    await page.waitForChanges()
    expect(shadow.querySelector('#tooltip')!.textContent).toBe('Quarterly_Report_2026_final_DE.pdf')
  })

  it('drops an in-flight open when the pointer leaves while measuring', async () => {
    const { page, fn, shadow } = await setup('Quarterly_Report_2026_final_DE.pdf')
    window.matchMedia = jest.fn().mockReturnValue({ matches: true }) as any
    fn.isClipped = jest.fn().mockResolvedValue(true)

    fn.openTooltip()
    // Leaves after the delay elapses but before the measurement resolves.
    await new Promise((resolve) => setTimeout(resolve, 310))
    fn.closeTooltip()
    await settle()
    await page.waitForChanges()

    expect(shadow.querySelector('#tooltip')).toBeNull()
  })

  it('closes the tooltip when the name is expanded instead', async () => {
    const { page, fn, shadow } = await setup('Quarterly_Report_2026_final_DE.pdf')
    fn.tooltipOpen = true
    await page.waitForChanges()
    expect(shadow.querySelector('#tooltip')).not.toBeNull()

    fn.toggleExpanded()
    await page.waitForChanges()

    expect(shadow.querySelector('#tooltip')).toBeNull()
  })

  it('points the tooltip away from the edge the row sits against', async () => {
    const { page } = await setup('Quarterly_Report_2026_final_DE.pdf', 'placement="bottom"')
    expect(page.root!.className).toContain('place-bottom')
  })
})
