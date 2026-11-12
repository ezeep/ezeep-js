import { newE2EPage } from '@stencil/core/testing'
import en from '../../data/locales/en.json'

/**
 * End-to-end (real headless browser): the entry point of the print journey.
 * Verifies the button trigger renders and that activating it opens the auth
 * dialog. The full networked journey (real OAuth + upload + print) needs a live
 * ezeep backend and is covered structurally by ezp-printing.spec.tsx instead.
 */
describe('ezp-printing (e2e)', () => {
  it('renders the button trigger and opens the auth dialog on click', async () => {
    const page = await newE2EPage()
    await page.setContent(
      '<ezp-printing trigger="button" clientid="demo" redirecturi="https://example.com/cb"></ezp-printing>',
    )

    const trigger = await page.find('ezp-printing >>> #print-trigger')
    expect(trigger).not.toBeNull()

    await trigger.click()
    await page.waitForChanges()

    const auth = await page.find('ezp-printing >>> ezp-auth')
    expect(auth).not.toBeNull()
  })
  it('shows the popup-blocked dialog when the browser blocks the sign-in popup', async () => {
    const page = await newE2EPage()
    // Simulate a browser that blocks popups (e.g. iOS Safari with "Block Pop-ups" on).
    await page.evaluateOnNewDocument(() => {
      ;(window as any).open = () => null
    })
    await page.setContent(
      '<ezp-printing trigger="button" hidelogin language="en" clientid="demo" redirecturi="https://example.com/cb"></ezp-printing>',
    )

    const trigger = await page.find('ezp-printing >>> #print-trigger')
    await trigger.click()
    await page.waitForChanges()

    // `instance` is a prop, not a reflected attribute, so match on the property.
    const handle = await page.waitForFunction(
      () => {
        const auth = document.querySelector('ezp-printing')?.shadowRoot?.querySelector('ezp-auth')
        const dialog = auth?.shadowRoot?.querySelector('ezp-dialog') as any
        return dialog?.instance === 'popup-blocked' ? dialog : null
      },
      { timeout: 10000 },
    )
    const heading = await handle.evaluate((el: any) => el.heading)
    expect(heading).toBe(en.popup_blocked_dialog.heading)
  })
})
