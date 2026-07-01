import { newSpecPage } from '@stencil/core/testing'
import { EzpSelect } from './ezp-select'

async function setup() {
  const page = await newSpecPage({ components: [EzpSelect], html: `<ezp-select></ezp-select>` })
  // Set props on the host element (the external, allowed way) to avoid the
  // "immutable @Prop modified from within" warning.
  ;(page.root as any).options = [
    { id: 1, title: 'A4', meta: '' },
    { id: 2, title: 'Letter', meta: '' },
  ]
  await page.waitForChanges()
  const sel = page.rootInstance as any
  // toggle() reads live layout measurements (container/list); stub it so the
  // post-select timeout doesn't touch the DOM.
  sel.toggle = () => undefined
  return { page, sel }
}

async function withPreSelected(value: string | number) {
  const { page, sel } = await setup()
  ;(page.root as any).preSelected = value
  await page.waitForChanges()
  return sel
}

describe('ezp-select', () => {
  it('select() records the chosen option and emits it', async () => {
    const { page, sel } = await setup()
    const emitted: any[] = []
    page.root!.addEventListener('selectSelection', ((e: CustomEvent) => {
      emitted.push(e.detail)
    }) as EventListener)

    sel.select(2)

    expect(sel.selected).toEqual({ id: 2, title: 'Letter', meta: '' })
    expect(emitted[0]).toEqual({ id: 2, title: 'Letter', meta: '' })
  })

  it('preSelect() matches an option by title (string)', async () => {
    const sel = await withPreSelected('Letter')
    sel.preSelect()
    expect(sel.selected.id).toBe(2)
  })

  it('preSelect() matches an option by id (number)', async () => {
    const sel = await withPreSelected(1)
    sel.preSelect()
    expect(sel.selected.title).toBe('A4')
  })

  it('preSelect() keeps the current selection when nothing matches', async () => {
    const sel = await withPreSelected('Legal')
    const before = sel.selected
    sel.preSelect()
    expect(sel.selected).toBe(before)
  })
})
