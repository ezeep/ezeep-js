import { newE2EPage, E2EPage } from '@stencil/core/testing'

/**
 * End-to-end (real headless browser): the text/number field with real typing,
 * including the debounce that batches keystrokes into one change event.
 */

async function openInput(attributes: string): Promise<E2EPage> {
  const page = await newE2EPage()
  await page.setContent(`<ezp-input ${attributes}></ezp-input>`)
  return page
}

/** `ezp-input` reports a change 500 ms after the last keystroke. */
const debounce = () => new Promise((resolve) => setTimeout(resolve, 650))

describe('ezp-input (e2e)', () => {
  it('renders its label, placeholder and suffix', async () => {
    const page = await openInput('label="Width" event-type="width" type="number" suffix="mm"')

    expect(await page.$eval('ezp-input >>> #label', (el: any) => el.text)).toBe('Width')
    expect(await page.$eval('ezp-input >>> #suffix', (el: any) => el.text)).toBe('mm')
    const field = await page.$eval('ezp-input >>> #input', (el) => ({
      type: el.getAttribute('type'),
      label: el.getAttribute('aria-label'),
    }))
    expect(field).toEqual({ type: 'number', label: 'Width' })
  })

  it('reports typed text once, after the user pauses', async () => {
    const page = await openInput(
      'label="Page Ranges" event-type="paper_ranges" placeholder="1-2,4"',
    )
    const changed = await page.spyOnEvent('inputValueChanged')

    await (await page.find('ezp-input >>> #input')).type('1-3,5')
    // Nothing yet: the keystrokes are still being collected.
    expect(changed).toHaveReceivedEventTimes(0)

    await debounce()

    expect(changed).toHaveReceivedEventTimes(1)
    expect(changed).toHaveReceivedEventDetail({ type: 'paper_ranges', value: '1-3,5' })
  })

  it('reports 0 when a number field is emptied', async () => {
    const page = await openInput('label="Width" event-type="width" type="number"')
    const changed = await page.spyOnEvent('inputValueChanged')
    const field = await page.find('ezp-input >>> #input')

    await field.type('7')
    await field.press('Backspace')
    await debounce()

    expect(changed).toHaveReceivedEventDetail({ type: 'width', value: 0 })
  })

  it('focuses the field when its label area is clicked', async () => {
    const page = await openInput('label="Width" event-type="width"')

    await (await page.find('ezp-input >>> #label')).click()
    await page.waitForChanges()

    const active = await page.$eval('ezp-input', (el) => el.shadowRoot!.activeElement?.id)
    expect(active).toBe('input')
    expect(await page.$eval('ezp-input', (el) => el.classList.contains('focused'))).toBe(true)
  })
})
