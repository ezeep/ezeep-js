import { newSpecPage } from '@stencil/core/testing'
import { EzpDialog } from './ezp-dialog'

describe('ezp-dialog accessibility', () => {
  it('renders as a labelled modal dialog', async () => {
    const page = await newSpecPage({
      components: [EzpDialog],
      html: `<ezp-dialog heading="Are you sure?"></ezp-dialog>`,
    })
    const markup = page.root!.shadowRoot!.innerHTML
    expect(markup).toContain('role="dialog"')
    expect(markup).toContain('aria-modal="true"')
    expect(markup).toContain('aria-label="Are you sure?"')
  })

  it('closes on Escape', async () => {
    const page = await newSpecPage({
      components: [EzpDialog],
      html: `<ezp-dialog instance="confirm"></ezp-dialog>`,
    })
    let closed: string | undefined
    page.root!.addEventListener('dialogClose', ((e: CustomEvent<string>) => {
      closed = e.detail
    }) as EventListener)

    ;(page.rootInstance as any).handleKeydown({ key: 'Escape' } as KeyboardEvent)

    expect(closed).toBe('confirm')
  })

  it('ignores other keys', async () => {
    const page = await newSpecPage({
      components: [EzpDialog],
      html: `<ezp-dialog instance="confirm"></ezp-dialog>`,
    })
    let closed = false
    page.root!.addEventListener('dialogClose', (() => {
      closed = true
    }) as EventListener)

    ;(page.rootInstance as any).handleKeydown({ key: 'Enter' } as KeyboardEvent)

    expect(closed).toBe(false)
  })
})

describe('ezp-dialog focus trap', () => {
  async function dialog() {
    const page = await newSpecPage({
      components: [EzpDialog],
      html: `<ezp-dialog></ezp-dialog>`,
    })
    const el = page.rootInstance as any
    el.box = {} // truthy; collectFocusable is stubbed per test
    return el
  }

  it('wraps Tab from the last control back to the first', async () => {
    const el = await dialog()
    const first = { focus: jest.fn() }
    const last = { focus: jest.fn() }
    el.collectFocusable = () => [first, last]
    el.deepActiveElement = () => last
    const preventDefault = jest.fn()

    el.handleKeydown({ key: 'Tab', shiftKey: false, preventDefault })

    expect(preventDefault).toHaveBeenCalled()
    expect(first.focus).toHaveBeenCalled()
  })

  it('wraps Shift+Tab from the first control to the last', async () => {
    const el = await dialog()
    const first = { focus: jest.fn() }
    const last = { focus: jest.fn() }
    el.collectFocusable = () => [first, last]
    el.deepActiveElement = () => first
    const preventDefault = jest.fn()

    el.handleKeydown({ key: 'Tab', shiftKey: true, preventDefault })

    expect(preventDefault).toHaveBeenCalled()
    expect(last.focus).toHaveBeenCalled()
  })

  it('pulls focus back inside when it has escaped the dialog', async () => {
    const el = await dialog()
    const first = { focus: jest.fn() }
    const last = { focus: jest.fn() }
    el.collectFocusable = () => [first, last]
    el.deepActiveElement = () => ({}) // some element outside the dialog
    const preventDefault = jest.fn()

    el.handleKeydown({ key: 'Tab', shiftKey: false, preventDefault })

    expect(preventDefault).toHaveBeenCalled()
    expect(first.focus).toHaveBeenCalled()
  })
})
