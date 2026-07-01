import { newE2EPage } from '@stencil/core/testing'

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
})
