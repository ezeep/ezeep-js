import { E2EPage, newE2EPage } from '@stencil/core/testing'

/**
 * End-to-end (real headless browser): what the unit tests cannot see — whether
 * a name is actually clipped at the width it was given, and where the tooltip
 * ends up on screen. Real pointer and keyboard input throughout.
 */

const LONG = 'Quarterly-report-final-version-reviewed-and-approved_DE.pdf'
const TRIGGER = 'ezp-file-name >>> #trigger'
const TOOLTIP = 'ezp-file-name >>> #tooltip'
/** Longer than the 300 ms open delay and the 200 ms close grace period. */
const SETTLED = 600

const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/** The spacing tokens `ezp-printing` normally provides; the tooltip's offset
 *  from its row is built on them. */
const TOKENS = '--ezp-spacing-2: 6px; --ezp-spacing-3: 8px'

/** One name in a positioned row of the given width, clear of the page edges. */
async function openName(name: string, width = 180, attrs = ''): Promise<E2EPage> {
  const page = await newE2EPage()
  await page.setContent(
    `<div id="row" style="${TOKENS}; position: relative; width: ${width}px; margin: 150px 0 0 40px">
       <ezp-file-name name="${name}" ${attrs}></ezp-file-name>
     </div>`,
  )
  await page.waitForChanges()
  return page
}

const hover = async (page: E2EPage, selector: string) => (await page.$(selector))!.hover()
const leave = (page: E2EPage) => page.mouse.move(700, 500)
const tooltipText = (page: E2EPage) =>
  page.evaluate(
    () =>
      document.querySelector('ezp-file-name')!.shadowRoot!.querySelector('#tooltip')?.textContent ??
      null,
  )
const rect = (page: E2EPage, selector: string) =>
  page.$eval(selector, (el) => {
    const box = el.getBoundingClientRect()
    return { top: box.top, bottom: box.bottom, height: box.height }
  })

describe('ezp-file-name (e2e)', () => {
  describe('showing the name', () => {
    it('keeps the end of a long name readable and clips the middle', async () => {
      const page = await openName(LONG)

      const parts = await page.$$eval('ezp-file-name >>> ezp-label', (labels) =>
        labels.map((label: any) => label.text as string),
      )
      expect(parts).toEqual([LONG.slice(0, -8), LONG.slice(-8)])
      expect(parts.join('')).toBe(LONG)

      // Only the first half gives way; the tail is on screen in full.
      const [head, tail] = await page.$$('ezp-file-name >>> ezp-label')
      expect(await head.evaluate((el: any) => el.isTruncated())).toBe(true)
      expect(await tail.evaluate((el: any) => el.isTruncated())).toBe(false)

      // And the row keeps to one line at its given width.
      const row = await page.$eval('#row', (el) => ({
        width: el.scrollWidth,
        height: el.getBoundingClientRect().height,
      }))
      expect(row.width).toBe(180)
      expect(row.height).toBeLessThan(30)
    })

    it('states the whole name once to assistive technology', async () => {
      const page = await openName(LONG)

      const trigger = await page.find(TRIGGER)
      expect(trigger.getAttribute('aria-label')).toBe(LONG)
      expect(trigger.getAttribute('aria-expanded')).toBe('false')
    })

    it('does not split a name too short to need it', async () => {
      const page = await openName('a.pdf')

      const parts = await page.$$eval('ezp-file-name >>> ezp-label', (labels) =>
        labels.map((label: any) => label.text as string),
      )
      expect(parts).toEqual(['a.pdf'])
    })
  })

  describe('the tooltip', () => {
    it('opens over a clipped name after a short delay and closes when the pointer leaves', async () => {
      const page = await openName(LONG)

      await hover(page, TRIGGER)
      // Not at once: passing over a list must not flash a tooltip per row.
      await pause(100)
      expect(await tooltipText(page)).toBeNull()

      await pause(SETTLED)
      expect(await tooltipText(page)).toBe(LONG)

      await leave(page)
      await pause(SETTLED)
      expect(await tooltipText(page)).toBeNull()
    })

    it('stays closed when the pointer only passes over the name', async () => {
      const page = await openName(LONG)

      await hover(page, TRIGGER)
      await pause(100)
      await leave(page)
      await pause(SETTLED)

      expect(await tooltipText(page)).toBeNull()
    })

    it('does not open over a name that fits', async () => {
      const page = await openName('Quarterly-report.pdf', 600)

      await hover(page, TRIGGER)
      await pause(SETTLED)

      expect(await tooltipText(page)).toBeNull()
    })

    it('opens above the row by default and below it when asked', async () => {
      const above = await openName(LONG)
      await hover(above, TRIGGER)
      await pause(SETTLED)
      expect((await rect(above, TOOLTIP)).bottom).toBeLessThanOrEqual(
        (await rect(above, '#row')).top,
      )

      const below = await openName(LONG, 180, 'placement="bottom"')
      await hover(below, TRIGGER)
      await pause(SETTLED)
      expect((await rect(below, TOOLTIP)).top).toBeGreaterThanOrEqual(
        (await rect(below, '#row')).bottom,
      )
    })

    it('can itself be hovered without closing', async () => {
      const page = await openName(LONG)
      await hover(page, TRIGGER)
      await pause(SETTLED)

      await hover(page, TOOLTIP)
      await pause(SETTLED)
      expect(await tooltipText(page)).toBe(LONG)

      await leave(page)
      await page.waitForChanges()
      expect(await tooltipText(page)).toBeNull()
    })

    it('opens on keyboard focus and closes on blur', async () => {
      const page = await openName(LONG)

      await page.keyboard.press('Tab')
      await pause(SETTLED)
      expect(await tooltipText(page)).toBe(LONG)

      await page.keyboard.press('Tab')
      await page.waitForChanges()
      expect(await tooltipText(page)).toBeNull()
    })

    it('closes on Escape without the page seeing the key', async () => {
      const page = await openName(LONG)
      await page.evaluate(() => {
        ;(window as any).escapes = 0
        document.addEventListener('keydown', (event) => {
          if (event.key === 'Escape') (window as any).escapes++
        })
      })
      const escapes = () => page.evaluate(() => (window as any).escapes as number)

      await hover(page, TRIGGER)
      await pause(SETTLED)
      await page.keyboard.press('Escape')
      await page.waitForChanges()

      // A host dialog that closes on Escape must stay open here…
      expect(await tooltipText(page)).toBeNull()
      expect(await escapes()).toBe(0)

      // …and gets the key as usual once there is no tooltip to dismiss.
      await page.keyboard.press('Escape')
      expect(await escapes()).toBe(1)
    })
  })

  describe('expanding the name', () => {
    it('shows the whole name on click, wrapped, and collapses on the next', async () => {
      const page = await openName(LONG)
      const collapsed = (await rect(page, '#row')).height

      await page.click(TRIGGER)
      await page.waitForChanges()

      const trigger = await page.find(TRIGGER)
      expect(trigger.getAttribute('aria-expanded')).toBe('true')
      expect((await rect(page, '#row')).height).toBeGreaterThan(collapsed * 2)
      const label = await page.$('ezp-file-name >>> ezp-label')
      expect(await label!.evaluate((el: any) => el.isTruncated())).toBe(false)
      expect(await page.$eval('#row', (el) => el.scrollWidth)).toBe(180)

      await page.click(TRIGGER)
      await page.waitForChanges()
      expect((await page.find(TRIGGER)).getAttribute('aria-expanded')).toBe('false')
      expect((await rect(page, '#row')).height).toBe(collapsed)
    })

    it('expands from the keyboard', async () => {
      const page = await openName(LONG)

      await page.keyboard.press('Tab')
      await page.keyboard.press('Enter')
      await page.waitForChanges()
      expect((await page.find(TRIGGER)).getAttribute('aria-expanded')).toBe('true')

      await page.keyboard.press('Space')
      await page.waitForChanges()
      expect((await page.find(TRIGGER)).getAttribute('aria-expanded')).toBe('false')
    })

    it('closes the tooltip, and keeps it closed while the name is shown in full', async () => {
      const page = await openName(LONG)
      await hover(page, TRIGGER)
      await pause(SETTLED)
      expect(await tooltipText(page)).toBe(LONG)

      await page.click(TRIGGER)
      await page.waitForChanges()
      expect(await tooltipText(page)).toBeNull()

      await leave(page)
      await hover(page, TRIGGER)
      await pause(SETTLED)
      expect(await tooltipText(page)).toBeNull()
    })
  })

  describe('in a scrolling list (anchor="parent")', () => {
    /** Four rows in a scroller two rows tall; the tooltip's positioned
     *  ancestor is outside the scroller, as in the upload card. */
    async function openList(marginTop: number): Promise<E2EPage> {
      const rows = [1, 2, 3, 4]
        .map(
          (n) =>
            `<div class="row" data-tooltip-row style="height: 30px">
               <ezp-file-name id="name-${n}" anchor="parent" name="${n}-${LONG}"></ezp-file-name>
             </div>`,
        )
        .join('')
      const page = await newE2EPage()
      await page.setContent(
        `<div id="anchor" style="${TOKENS}; position: relative; width: 200px; margin: ${marginTop}px 0 0 40px">
           <div id="scroller" style="max-height: 60px; overflow-y: auto">${rows}</div>
         </div>`,
      )
      await page.waitForChanges()
      return page
    }
    const NAME = '#name-2'

    it('lines the tooltip up with its own row, not with the list', async () => {
      const page = await openList(200)

      await hover(page, `${NAME} >>> #trigger`)
      await pause(SETTLED)

      const tooltip = await rect(page, `${NAME} >>> #tooltip`)
      const row = await page.$eval(NAME, (el) => {
        const box = el.closest('.row')!.getBoundingClientRect()
        return { top: box.top, bottom: box.bottom }
      })
      expect(tooltip.bottom).toBeLessThanOrEqual(row.top)
      expect(row.top - tooltip.bottom).toBeLessThan(12)
    })

    it('opens below the row when there is no room above it', async () => {
      const page = await openList(0)

      await hover(page, '#name-1 >>> #trigger')
      await pause(SETTLED)

      const tooltip = await rect(page, '#name-1 >>> #tooltip')
      const row = await page.$eval('#name-1', (el) => {
        const box = el.closest('.row')!.getBoundingClientRect()
        return { top: box.top, bottom: box.bottom }
      })
      expect(tooltip.top).toBeGreaterThanOrEqual(row.bottom)
      expect(tooltip.top).toBeGreaterThanOrEqual(0)
    })

    it('closes when the list scrolls, rather than pointing at the wrong row', async () => {
      const page = await openList(200)
      await hover(page, `${NAME} >>> #trigger`)
      await pause(SETTLED)
      expect(await page.$(`${NAME} >>> #tooltip`)).not.toBeNull()

      await page.$eval('#scroller', (el) => (el.scrollTop = 30))
      await page.waitForChanges()

      expect(await page.$(`${NAME} >>> #tooltip`)).toBeNull()
    })
  })

  describe('on a touch device', () => {
    it('expands on tap and never opens a tooltip', async () => {
      const page = await newE2EPage()
      await page.setViewport({ width: 400, height: 700, hasTouch: true, isMobile: true })
      await page.setContent(
        `<div id="row" style="${TOKENS}; position: relative; width: 180px; margin: 150px 0 0 40px">
           <ezp-file-name name="${LONG}"></ezp-file-name>
         </div>`,
      )
      await page.waitForChanges()
      expect(await page.evaluate(() => matchMedia('(hover: hover)').matches)).toBe(false)

      await (await page.$(TRIGGER))!.tap()
      await pause(SETTLED)

      expect((await page.find(TRIGGER)).getAttribute('aria-expanded')).toBe('true')
      expect(await tooltipText(page)).toBeNull()
    })
  })
})
