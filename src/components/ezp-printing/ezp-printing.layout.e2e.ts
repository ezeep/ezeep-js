import { E2EPage } from '@stencil/core/testing'
import {
  PRINTERS,
  SELECT,
  chooseFiles,
  click,
  getCalls,
  jsonBody,
  openPrinting,
  pickOption,
  removeFiles,
  waitFor,
  waitForInstance,
  waitForPrintOptions,
} from '../../testing/mock-backend'

/**
 * End-to-end (real headless browser, faked network): the journey on small
 * screens. The other suites run at one desktop size, where nothing is ever
 * short of room.
 */

const UPLOAD = 'ezp-printing >>> ezp-upload'
const AUTH_BOX = 'ezp-printing >>> ezp-auth >>> ezp-dialog >>> #box'
const OPTIONS = 'ezp-printing >>> ezp-printer-selection'

const SCREENS = [
  { name: 'a small phone', width: 320, height: 568 },
  { name: 'a phone', width: 375, height: 667 },
  { name: 'a phone held sideways', width: 667, height: 375 },
  { name: 'a tablet', width: 768, height: 1024 },
]

const LONG_NAME = 'Quarterly-report-final-version-reviewed-and-approved_DE.pdf'

/** How far `selector` reaches past the left and right edge of the screen. */
async function overflowX(page: E2EPage, selector: string) {
  const handle = await waitFor(page, selector)
  return handle.evaluate((el: Element) => {
    const box = el.getBoundingClientRect()
    return { left: Math.max(0, -box.left), right: Math.max(0, box.right - window.innerWidth) }
  })
}

/** Whether the page as a whole scrolls sideways. */
const pageScrollsSideways = (page: E2EPage) =>
  page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)

describe('ezp-printing on small screens (e2e)', () => {
  afterAll(removeFiles)

  describe.each(SCREENS)('on $name ($width×$height)', ({ width, height }) => {
    const open = async (options: Parameters<typeof openPrinting>[0] = {}) => {
      const page = await openPrinting({ signedIn: true, ...options })
      await page.setViewport({ width, height })
      await page.waitForChanges()
      return page
    }

    it('fits every step of the journey between the edges of the screen', async () => {
      const page = await open()
      const fits = { left: 0, right: 0 }

      await chooseFiles(page, LONG_NAME, 'b.pdf', 'c.pdf', 'd.pdf', 'e.pdf', 'f.pdf')
      expect(await overflowX(page, `${UPLOAD} >>> #modal`)).toEqual(fits)
      expect(await overflowX(page, `${UPLOAD} >>> #continue`)).toEqual(fits)

      await click(page, `${UPLOAD} >>> #continue`)
      expect(await overflowX(page, AUTH_BOX)).toEqual(fits)

      await click(page, `${AUTH_BOX} >>> #footer ezp-text-button`)
      await waitForPrintOptions(page)
      expect(await overflowX(page, `${OPTIONS} >>> #box`)).toEqual(fits)
      expect(await overflowX(page, `${OPTIONS} >>> #close`)).toEqual(fits)
      expect(await overflowX(page, `${OPTIONS} >>> #print`)).toEqual(fits)

      await pickOption(page, SELECT.printer, PRINTERS[0].name)
      await click(page, `${OPTIONS} >>> #print`)
      await waitForInstance(page, 'ezp-status', 'print-success')
      expect(await overflowX(page, `${OPTIONS} >>> ezp-status >>> #box`)).toEqual(fits)

      expect(await pageScrollsSideways(page)).toBe(false)
    })

    it('keeps Print on screen however far the options are scrolled', async () => {
      const page = await open({ printers: [PRINTERS[0]] })
      await chooseFiles(page, 'report.pdf')
      await click(page, `${UPLOAD} >>> #continue`)
      await click(page, `${AUTH_BOX} >>> #footer ezp-text-button`)
      await waitForPrintOptions(page)

      const printOnScreen = async () => {
        const print = await waitFor(page, `${OPTIONS} >>> #print`)
        return print.evaluate((el: Element) => {
          const box = el.getBoundingClientRect()
          return box.top >= 0 && box.bottom <= window.innerHeight
        })
      }
      expect(await printOnScreen()).toBe(true)

      await page.$eval(OPTIONS, (el) => (el.scrollTop = el.scrollHeight))
      await page.waitForChanges()
      expect(await printOnScreen()).toBe(true)

      await page.$eval(OPTIONS, (el) => (el.scrollTop = 0))
      await page.waitForChanges()
      expect(await printOnScreen()).toBe(true)
    })

    it('lets the last option be set and the job printed', async () => {
      const page = await open({ printers: [PRINTERS[0]] })
      await chooseFiles(page, 'report.pdf')
      await click(page, `${UPLOAD} >>> #continue`)
      await click(page, `${AUTH_BOX} >>> #footer ezp-text-button`)
      await waitForPrintOptions(page)

      // The tray is the last dropdown: below the fold, and under the sticky
      // footer until it is scrolled clear of it.
      await pickOption(page, SELECT.tray, 'Tray 2')
      await click(page, `${OPTIONS} >>> #print`)
      await waitForInstance(page, 'ezp-status', 'print-success')

      const [print] = await getCalls(page, 'Print')
      expect(jsonBody(print).properties.trayname).toBe('Tray 2')
    })
  })
})
