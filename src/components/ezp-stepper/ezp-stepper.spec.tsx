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
    page.root.addEventListener('stepperChanged', (e: CustomEvent<number>) => detail.push(e.detail))
    stepper.handleIncrease()
    await page.waitForChanges()
    expect(detail).toContain(2)
  })
})
