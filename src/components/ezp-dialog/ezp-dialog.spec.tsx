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
