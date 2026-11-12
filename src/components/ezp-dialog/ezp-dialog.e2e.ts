import { newE2EPage, E2EPage } from '@stencil/core/testing'

/**
 * End-to-end (real headless browser): the modal dialog's keyboard and focus
 * behaviour, which only a real browser (focus, Tab order through nested shadow
 * roots) can exercise.
 */

async function openDialog(): Promise<E2EPage> {
  const page = await newE2EPage()
  await page.setContent(
    `<button id="outside">Outside</button>
     <ezp-dialog heading="Heading" description="Description" action="Do it" instance="demo"></ezp-dialog>`,
  )
  return page
}

/** Describes the innermost focused element, following focus through shadow roots. */
const focused = (page: E2EPage) =>
  page.evaluate(() => {
    let el: Element | null = document.activeElement
    const path: string[] = []
    while (el) {
      path.push(el.id ? `${el.tagName.toLowerCase()}#${el.id}` : el.tagName.toLowerCase())
      el = el.shadowRoot?.activeElement ?? null
    }
    return path.join(' > ')
  })

const CLOSE_BUTTON = 'ezp-dialog > ezp-icon-button > button#button'
const ACTION_BUTTON = 'ezp-dialog > ezp-text-button > button#button'

describe('ezp-dialog (e2e)', () => {
  it('renders its heading, description and action, and labels itself for assistive tech', async () => {
    const page = await openDialog()

    const box = await page.$eval('ezp-dialog >>> #box', (el) => ({
      role: el.getAttribute('role'),
      modal: el.getAttribute('aria-modal'),
      label: el.getAttribute('aria-label'),
    }))
    expect(box).toEqual({ role: 'dialog', modal: 'true', label: 'Heading' })

    const labels = await page.$$eval('ezp-dialog >>> #text ezp-label', (els) =>
      els.map((el: any) => el.text),
    )
    expect(labels).toEqual(['Heading', 'Description'])
    expect(await page.$eval('ezp-dialog >>> #footer ezp-text-button', (el: any) => el.label)).toBe(
      'Do it',
    )
  })

  it('takes focus when it opens', async () => {
    const page = await openDialog()

    expect(await focused(page)).toBe('ezp-dialog > div#box')
  })

  it('emits dialogAction with its instance when the action is clicked', async () => {
    const page = await openDialog()
    const action = await page.spyOnEvent('dialogAction')

    await (await page.find('ezp-dialog >>> #footer ezp-text-button')).click()
    await page.waitForChanges()

    expect(action).toHaveReceivedEventDetail('demo')
  })

  it('emits dialogClose when the close button is clicked', async () => {
    const page = await openDialog()
    const close = await page.spyOnEvent('dialogClose')

    await (await page.find('ezp-dialog >>> #header ezp-icon-button')).click()
    await page.waitForChanges()

    expect(close).toHaveReceivedEventDetail('demo')
  })

  it('emits dialogClose on Escape', async () => {
    const page = await openDialog()
    const close = await page.spyOnEvent('dialogClose')

    await page.keyboard.press('Escape')
    await page.waitForChanges()

    expect(close).toHaveReceivedEventDetail('demo')
  })

  it('keeps Tab focus inside the dialog, wrapping in both directions', async () => {
    const page = await openDialog()

    // From the dialog box itself, Tab lands on the first control.
    await page.keyboard.press('Tab')
    expect(await focused(page)).toBe(CLOSE_BUTTON)

    await page.keyboard.press('Tab')
    expect(await focused(page)).toBe(ACTION_BUTTON)

    // Past the last control: wraps to the first, not out to the page.
    await page.keyboard.press('Tab')
    expect(await focused(page)).toBe(CLOSE_BUTTON)

    // And backwards from the first to the last.
    await page.keyboard.down('Shift')
    await page.keyboard.press('Tab')
    await page.keyboard.up('Shift')
    expect(await focused(page)).toBe(ACTION_BUTTON)
  })

  it('pulls focus back in when it has escaped to the page behind', async () => {
    const page = await openDialog()
    await page.$eval('#outside', (el) => (el as HTMLElement).focus())
    expect(await focused(page)).toBe('button#outside')

    await page.keyboard.press('Tab')

    expect(await focused(page)).toBe(CLOSE_BUTTON)
  })

  it('activates the focused action with the keyboard', async () => {
    const page = await openDialog()
    const action = await page.spyOnEvent('dialogAction')

    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Enter')
    await page.waitForChanges()

    expect(action).toHaveReceivedEventDetail('demo')
  })
})
