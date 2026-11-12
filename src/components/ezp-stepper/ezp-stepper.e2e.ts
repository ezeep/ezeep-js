import { newE2EPage, E2EPage } from '@stencil/core/testing'

/**
 * End-to-end (real headless browser): the copies stepper driven with a real
 * mouse and keyboard — what jsdom specs can't cover (native number input,
 * key filtering, focus).
 */

async function openStepper(attributes = ''): Promise<E2EPage> {
  const page = await newE2EPage()
  await page.setContent(`<ezp-stepper label="Copies" ${attributes}></ezp-stepper>`)
  return page
}

const DECREASE = 'ezp-stepper >>> button[aria-label="Decrease Copies"]'
const INCREASE = 'ezp-stepper >>> button[aria-label="Increase Copies"]'
const INPUT = 'ezp-stepper >>> #input'

const inputValue = (page: E2EPage) => page.$eval(INPUT, (el) => (el as HTMLInputElement).value)
const isDisabled = (page: E2EPage, selector: string) =>
  page.$eval(selector, (el) => (el as HTMLButtonElement).disabled)

/** Replace the field's content by typing, like a user selecting all and typing over it. */
async function typeOver(page: E2EPage, text: string): Promise<void> {
  const input = await page.find(INPUT)
  await input.click({ clickCount: 3 })
  await input.type(text)
  await page.waitForChanges()
}

describe('ezp-stepper (e2e)', () => {
  it('starts at 1 and cannot go below it', async () => {
    const page = await openStepper()

    expect(await inputValue(page)).toBe('1')
    expect(await isDisabled(page, DECREASE)).toBe(true)
    expect(await isDisabled(page, INCREASE)).toBe(false)
  })

  it('steps up and down with the buttons, announcing each change', async () => {
    const page = await openStepper()
    const changed = await page.spyOnEvent('stepperChanged')

    await (await page.find(INCREASE)).click()
    await (await page.find(INCREASE)).click()
    await page.waitForChanges()
    expect(await inputValue(page)).toBe('3')
    expect(changed).toHaveReceivedEventDetail(3)
    expect(await isDisabled(page, DECREASE)).toBe(false)

    await (await page.find(DECREASE)).click()
    await page.waitForChanges()
    expect(await inputValue(page)).toBe('2')
    expect(changed).toHaveReceivedEventDetail(2)
  })

  it('stops at the maximum', async () => {
    const page = await openStepper('max="2"')

    await (await page.find(INCREASE)).click()
    await page.waitForChanges()

    expect(await inputValue(page)).toBe('2')
    expect(await isDisabled(page, INCREASE)).toBe(true)
  })

  it('starts at the minimum when that is above 1', async () => {
    const page = await openStepper('min="5"')

    expect(await inputValue(page)).toBe('5')
    expect(await isDisabled(page, DECREASE)).toBe(true)
  })

  it('accepts a typed number', async () => {
    const page = await openStepper()
    const changed = await page.spyOnEvent('stepperChanged')

    await typeOver(page, '12')

    expect(await inputValue(page)).toBe('12')
    expect(changed).toHaveReceivedEventDetail(12)
  })

  it('ignores keys that are not digits', async () => {
    const page = await openStepper()

    await typeOver(page, '4')
    await (await page.find(INPUT)).type('e-.+x')
    await page.waitForChanges()

    expect(await inputValue(page)).toBe('4')
  })

  it('clamps a typed number to the allowed range', async () => {
    const page = await openStepper('min="2" max="10"')

    await typeOver(page, '99')
    expect(await inputValue(page)).toBe('10')

    await typeOver(page, '1')
    expect(await inputValue(page)).toBe('2')
  })

  it('falls back to the minimum when the field is emptied', async () => {
    const page = await openStepper()
    await typeOver(page, '7')

    const input = await page.find(INPUT)
    await input.press('Backspace')
    await page.waitForChanges()

    expect(await inputValue(page)).toBe('1')
  })

  it('shows focus on the host while the field is focused', async () => {
    const page = await openStepper()
    const focused = () => page.$eval('ezp-stepper', (el) => el.classList.contains('focused'))

    await (await page.find(INPUT)).focus()
    await page.waitForChanges()
    expect(await focused()).toBe(true)

    await page.$eval(INPUT, (el) => (el as HTMLElement).blur())
    await page.waitForChanges()
    expect(await focused()).toBe(false)
  })
})
