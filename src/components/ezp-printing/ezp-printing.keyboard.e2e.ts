import { E2EPage } from '@stencil/core/testing'
import {
  PRINTERS,
  chooseFiles,
  getCalls,
  jsonBody,
  openPrinting,
  removeFiles,
  waitForInstance,
  waitForPrintOptions,
} from '../../testing/mock-backend'

/**
 * End-to-end (real headless browser, faked network): the print journey with
 * the keyboard alone. Only choosing the files goes through the harness — the
 * native file picker belongs to the operating system.
 */

/** Where focus is, through every shadow root: `ezp-printing > ezp-upload > …`. */
const focusPath = (page: E2EPage): Promise<string> =>
  page.evaluate(() => {
    const path: string[] = []
    let el: any = document.activeElement
    while (el) {
      path.push(el.tagName.toLowerCase() + (el.id ? `#${el.id}` : ''))
      el = el.shadowRoot?.activeElement
    }
    return path.join(' > ')
  })

/**
 * Press Tab until focus is on a control whose path contains `target`, and
 * return every stop on the way. Fails rather than loop when it is unreachable.
 */
async function tabTo(page: E2EPage, target: string, limit = 40): Promise<string[]> {
  const stops: string[] = []
  for (let i = 0; i < limit; i++) {
    await page.keyboard.press('Tab')
    const path = await focusPath(page)
    stops.push(path)
    if (path.includes(target)) return stops
  }
  throw new Error(`Tab never reached "${target}". Stops:\n${stops.join('\n')}`)
}

describe('ezp-printing with the keyboard only (e2e)', () => {
  afterAll(removeFiles)

  it('goes from the chosen files to a finished print', async () => {
    const page = await openPrinting({ signedIn: true })
    const finished = await page.spyOnEvent('printFinished')
    await chooseFiles(page, 'report.pdf')

    // Upload card.
    await tabTo(page, 'ezp-text-button#continue')
    await page.keyboard.press('Enter')

    // Sign-in dialog: focus is moved into it, and its action is one Tab on.
    await page.waitForChanges()
    expect(await focusPath(page)).toContain('ezp-auth > ezp-dialog')
    await tabTo(page, 'ezp-dialog > ezp-text-button')
    await page.keyboard.press('Enter')
    await waitForPrintOptions(page)

    // Print options: pick the second printer from its dropdown…
    await tabTo(page, 'ezp-select#printer')
    await page.keyboard.press('Enter')
    await page.waitForChanges()
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('Enter')
    await page.waitForFunction(
      () =>
        !(
          document
            .querySelector('ezp-printing')!
            .shadowRoot!.querySelector('ezp-printer-selection')!
            .shadowRoot!.querySelector('#print') as HTMLButtonElement
        ).disabled,
    )

    // …raise the copies, and print.
    await tabTo(page, 'ezp-stepper')
    await page.keyboard.press('ArrowUp')
    await tabTo(page, 'button#print')
    await page.keyboard.press('Enter')
    await waitForInstance(page, 'ezp-status', 'print-success')

    // Result card.
    await tabTo(page, 'ezp-status > ezp-text-button')
    await page.keyboard.press('Enter')
    await page.waitForChanges()

    const [print] = await getCalls(page, 'Print')
    expect(jsonBody(print).printerid).toBe(PRINTERS[1].id)
    expect(jsonBody(print).properties.copies).toBe(2)
    expect(finished).toHaveReceivedEventTimes(1)
  })

  it('keeps focus out of the upload card while the print options cover it', async () => {
    const page = await openPrinting({ signedIn: true, printers: [PRINTERS[0]] })
    await chooseFiles(page, 'report.pdf', 'invoice.docx')
    await tabTo(page, 'ezp-text-button#continue')
    await page.keyboard.press('Enter')
    await page.waitForChanges()
    await tabTo(page, 'ezp-dialog > ezp-text-button')
    await page.keyboard.press('Enter')
    await waitForPrintOptions(page)

    // The first stop is in the card on top, and so is every one after it.
    const stops = await tabTo(page, 'button#print')

    expect(stops[0]).toContain('ezp-printer-selection')
    expect(stops.filter((stop) => stop.includes('ezp-upload'))).toEqual([])
  })

  it('reaches Retry on a failed print, and nothing of the form under the card', async () => {
    const page = await openPrinting({
      signedIn: true,
      printers: [PRINTERS[0]],
      printResponses: [{ body: { code: 804 } }, { body: { jobid: 'job-2' } }],
    })
    await chooseFiles(page, 'report.pdf')
    await tabTo(page, 'ezp-text-button#continue')
    await page.keyboard.press('Enter')
    await page.waitForChanges()
    await tabTo(page, 'ezp-dialog > ezp-text-button')
    await page.keyboard.press('Enter')
    await waitForPrintOptions(page)
    await tabTo(page, 'button#print')
    await page.keyboard.press('Enter')
    await waitForInstance(page, 'ezp-status', 'print-failed')

    // Close, then Retry — and from there Tab leaves the card, not into the form.
    const stops = await tabTo(page, 'ezp-status > ezp-text-button')
    stops.push(...(await tabTo(page, 'ezp-status > ezp-text-button')))
    expect(stops.filter((stop) => !stop.includes('ezp-status') && stop !== 'body')).toEqual([])

    await page.keyboard.press('Enter')
    await waitForInstance(page, 'ezp-status', 'print-success')
    expect((await getCalls(page, 'Print')).length).toBe(2)
  })

  it('gives the upload card back once the print options are cancelled', async () => {
    const page = await openPrinting({ signedIn: true, printers: [PRINTERS[0]] })
    await chooseFiles(page, 'report.pdf')
    await tabTo(page, 'ezp-text-button#continue')
    await page.keyboard.press('Enter')
    await page.waitForChanges()
    await tabTo(page, 'ezp-dialog > ezp-text-button')
    await page.keyboard.press('Enter')
    await waitForPrintOptions(page)

    await tabTo(page, 'ezp-text-button#cancel')
    await page.keyboard.press('Enter')
    await page.waitForChanges()

    const stops = await tabTo(page, 'ezp-text-button#continue')
    expect(stops.every((stop) => stop.includes('ezp-upload'))).toBe(true)
  })

  it('cancels sign-in with Escape and returns to the upload card', async () => {
    const page = await openPrinting()
    await chooseFiles(page, 'report.pdf')
    await tabTo(page, 'ezp-text-button#continue')
    await page.keyboard.press('Enter')
    await page.waitForChanges()
    expect(await focusPath(page)).toContain('ezp-auth > ezp-dialog')

    await page.keyboard.press('Escape')
    await page.waitForChanges()

    expect(await page.$('ezp-printing >>> ezp-auth')).toBeNull()
    expect(await page.$('ezp-printing >>> ezp-upload')).not.toBeNull()
  })
})
