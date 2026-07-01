import { newSpecPage } from '@stencil/core/testing'
import { EzpStepper } from './ezp-stepper'

async function setup(attrs = 'min="1" max="5"') {
  const page = await newSpecPage({
    components: [EzpStepper],
    html: `<ezp-stepper ${attrs}></ezp-stepper>`,
  })
  // rootInstance is typed loosely; cast to reach the bounded handlers/state.
  return { page, stepper: page.rootInstance as any }
}

describe('ezp-stepper', () => {
  it('initialises at the minimum and cannot decrease below it', async () => {
    const { stepper } = await setup('min="1" max="5"')
    expect(stepper.value).toBe(1)
    expect(stepper.canDecrease).toBe(false)
    expect(stepper.canIncrease).toBe(true)
  })

  it('clamps the initial value up to a higher min on load', async () => {
    const { stepper } = await setup('min="3" max="5"')
    expect(stepper.value).toBe(3)
    expect(stepper.canDecrease).toBe(false)
  })

  it('increments up to max, then blocks', async () => {
    const { page, stepper } = await setup('min="1" max="3"')
    stepper.handleIncrease()
    await page.waitForChanges()
    expect(stepper.value).toBe(2)

    stepper.handleIncrease()
    await page.waitForChanges()
    expect(stepper.value).toBe(3)
    expect(stepper.canIncrease).toBe(false)

    stepper.handleIncrease() // already at max
    await page.waitForChanges()
    expect(stepper.value).toBe(3)
  })

  it('decrements down to min, then blocks', async () => {
    const { page, stepper } = await setup('min="1" max="5"')
    stepper.handleIncrease()
    stepper.handleIncrease()
    await page.waitForChanges()
    expect(stepper.value).toBe(3)

    stepper.handleDecrease()
    await page.waitForChanges()
    expect(stepper.value).toBe(2)
    expect(stepper.canDecrease).toBe(true)

    stepper.handleDecrease()
    await page.waitForChanges()
    expect(stepper.value).toBe(1)
    expect(stepper.canDecrease).toBe(false)

    stepper.handleDecrease() // already at min
    await page.waitForChanges()
    expect(stepper.value).toBe(1)
  })

  it('emits stepperChanged with the new value', async () => {
    const { page, stepper } = await setup('min="1" max="5"')
    const detail: number[] = []
    page.root!.addEventListener('stepperChanged', ((e: CustomEvent<number>) => {
      detail.push(e.detail)
    }) as EventListener)
    stepper.handleIncrease()
    await page.waitForChanges()
    expect(detail).toContain(2)
  })
})

describe('ezp-stepper input sanitization', () => {
  async function typeInto(attrs: string, raw: string, prep?: (s: any) => void) {
    const { page, stepper } = await setup(attrs)
    if (prep) {
      prep(stepper)
      await page.waitForChanges()
    }
    stepper.input.value = raw
    stepper.handleInput()
    await page.waitForChanges()
    return stepper
  }

  it('reverts non-numeric input to the current value', async () => {
    const stepper = await typeInto('min="1" max="9"', 'abc', (s) => s.handleIncrease())
    expect(stepper.value).toBe(2)
    expect(stepper.input.value).toBe('2')
  })

  it('clamps a value above max down to max', async () => {
    const stepper = await typeInto('min="1" max="3"', '9')
    expect(stepper.value).toBe(3)
  })

  it('resets an empty input to the minimum', async () => {
    const stepper = await typeInto('min="2" max="8"', '')
    expect(stepper.value).toBe(2)
  })

  it('strips non-digits and parses the numeric remainder', async () => {
    const stepper = await typeInto('min="1" max="99"', '0a7')
    expect(stepper.value).toBe(7)
  })
})

describe('ezp-stepper keyboard + focus', () => {
  function keydown(key: string, mods: Partial<KeyboardEvent> = {}) {
    return {
      key,
      ctrlKey: false,
      metaKey: false,
      preventDefault: jest.fn(),
      ...mods,
    } as unknown as KeyboardEvent
  }

  it('blocks non-digit keys', async () => {
    const { stepper } = await setup()
    const event = keydown('a')
    stepper.handleKeyDown(event)
    expect(event.preventDefault).toHaveBeenCalled()
  })

  it('allows digit keys', async () => {
    const { stepper } = await setup()
    const event = keydown('5')
    stepper.handleKeyDown(event)
    expect(event.preventDefault).not.toHaveBeenCalled()
  })

  it('allows editing/navigation keys and Ctrl/Cmd shortcuts', async () => {
    const { stepper } = await setup()
    const backspace = keydown('Backspace')
    stepper.handleKeyDown(backspace)
    expect(backspace.preventDefault).not.toHaveBeenCalled()

    const paste = keydown('v', { ctrlKey: true })
    stepper.handleKeyDown(paste)
    expect(paste.preventDefault).not.toHaveBeenCalled()
  })

  it('tracks focus state', async () => {
    const { page, stepper } = await setup()
    stepper.handleFocus()
    await page.waitForChanges()
    expect(stepper.focused).toBe(true)
    stepper.handleBlur()
    await page.waitForChanges()
    expect(stepper.focused).toBe(false)
  })
})
