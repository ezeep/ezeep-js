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

  it('preSelect() resets to the placeholder when nothing matches', async () => {
    const { page, sel } = await setup()
    // A value that matches is reflected in the selection.
    ;(page.root as any).preSelected = 'Letter'
    await page.waitForChanges()
    expect(sel.selected.title).toBe('Letter')

    // Switching to a value with no matching option (e.g. a printer that lacks
    // this paper size) must clear the stale label back to the placeholder,
    // not keep showing the previous — now invalid — selection.
    ;(page.root as any).preSelected = 'Legal'
    await page.waitForChanges()
    expect(sel.selected.title).toBe('')
    expect(sel.selected.id).toBe(false)
  })

  it('exposes combobox / listbox / option roles', async () => {
    const { page } = await setup()
    const markup = page.root!.shadowRoot!.innerHTML
    expect(markup).toContain('role="combobox"')
    expect(markup).toContain('role="listbox"')
    expect(markup).toContain('role="option"')
    expect(markup).toContain('aria-expanded="false"')
  })

  it('opens the list from the keyboard (ArrowDown)', async () => {
    const { sel } = await setup()
    const toggleSpy = jest.fn()
    sel.toggle = toggleSpy
    sel.handleToggleKeydown({ key: 'ArrowDown', preventDefault: () => undefined })
    expect(toggleSpy).toHaveBeenCalled()
  })

  it('selects an option from the keyboard (Enter)', async () => {
    const { sel } = await setup()
    sel.handleOptionKeydown({ key: 'Enter', preventDefault: () => undefined }, 2)
    expect(sel.selected).toEqual({ id: 2, title: 'Letter', meta: '' })
  })

  it('roves to the next/previous option with the arrow keys', async () => {
    const { sel } = await setup()
    const first = { focus: jest.fn() }
    const second = { focus: jest.fn() }
    sel.getOptionElements = () => [first, second]

    sel.handleOptionKeydown({ key: 'ArrowDown', preventDefault: () => undefined, currentTarget: first }, 1)
    expect(second.focus).toHaveBeenCalled()

    sel.handleOptionKeydown({ key: 'ArrowUp', preventDefault: () => undefined, currentTarget: second }, 2)
    expect(first.focus).toHaveBeenCalled()
  })

  it('jumps to first/last with Home/End', async () => {
    const { sel } = await setup()
    const a = { focus: jest.fn() }
    const b = { focus: jest.fn() }
    const c = { focus: jest.fn() }
    sel.getOptionElements = () => [a, b, c]

    sel.handleOptionKeydown({ key: 'End', preventDefault: () => undefined, currentTarget: a }, 1)
    expect(c.focus).toHaveBeenCalled()
    sel.handleOptionKeydown({ key: 'Home', preventDefault: () => undefined, currentTarget: c }, 3)
    expect(a.focus).toHaveBeenCalled()
  })

  it('Escape from an option closes the list and returns focus to the toggle', async () => {
    const { sel } = await setup()
    sel.expanded = true
    const toggleSpy = jest.fn()
    sel.toggle = toggleSpy
    const toggleFocus = jest.fn()
    sel.toggleEl = { focus: toggleFocus }
    sel.getOptionElements = () => []

    sel.handleOptionKeydown({ key: 'Escape', preventDefault: () => undefined, currentTarget: null }, 1)

    expect(toggleSpy).toHaveBeenCalled()
    expect(toggleFocus).toHaveBeenCalled()
  })
})
