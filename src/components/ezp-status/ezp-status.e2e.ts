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

  it('gives the primary action a visible background', async () => {
    const page = await newE2EPage()
    await page.setContent(
      // `ezp-printing` normally provides the theme colour.
      '<ezp-status style="--ezp-theme-solid: rgb(0 143 178)" instance="no-printers" close="Close"></ezp-status>',
    )

    // The label is white, so a transparent button is invisible (this happened on
    // Safari < 16.2, where the `color-mix()` gradient is invalid). Whatever the
    // browser supports, the button must paint either a gradient or a solid colour.
    const button = await page.find('ezp-status >>> ezp-text-button >>> #button')
    const style = await button.getComputedStyle()
    const painted = style.backgroundImage !== 'none' || style.backgroundColor !== 'rgba(0, 0, 0, 0)'

    expect(painted).toBe(true)
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
