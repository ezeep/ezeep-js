import { newE2EPage } from '@stencil/core/testing'

/**
 * End-to-end test: renders the component in a real (headless) browser via the
 * full Stencil build. Requires `puppeteer` to be installed and a Chromium
 * binary available. Run with `npm run test.e2e`.
 */
describe('ezp-status (e2e)', () => {
  it('renders the description into the shadow DOM', async () => {
    const page = await newE2EPage()
    await page.setContent('<ezp-status description="Printing…"></ezp-status>')

    const host = await page.find('ezp-status')
    expect(host).not.toBeNull()

    const description = await page.find('ezp-status >>> #description')
    expect(description).not.toBeNull()
  })

  it('emits statusClose with the instance name when the close button is clicked', async () => {
    const page = await newE2EPage()
    await page.setContent('<ezp-status instance="print-success" close="Close"></ezp-status>')

    const closed = await page.spyOnEvent('statusClose')
    const closeButton = await page.find('ezp-status >>> ezp-text-button')
    await closeButton.click()
    await page.waitForChanges()

    expect(closed).toHaveReceivedEventDetail('print-success')
  })
})
