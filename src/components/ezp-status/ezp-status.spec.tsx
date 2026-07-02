import { newSpecPage } from '@stencil/core/testing'
import i18next from 'i18next'
import { EzpStatus } from './ezp-status'
import { initi18n } from '../../utils/utils'

describe('ezp-status', () => {
  it('shows the processing indicator when processing', async () => {
    const page = await newSpecPage({
      components: [EzpStatus],
      html: `<ezp-status processing></ezp-status>`,
    })
    expect(page.root!.shadowRoot!.querySelector('#indicator')).not.toBeNull()
  })

  it('renders no footer when no actions are provided', async () => {
    const page = await newSpecPage({
      components: [EzpStatus],
      html: `<ezp-status></ezp-status>`,
    })
    expect(page.root!.shadowRoot!.querySelector('#footer')).toBeNull()
  })

  it('renders one button per provided action', async () => {
    // Truthy string values mirror the boolean `true` passed from JSX usage.
    const page = await newSpecPage({
      components: [EzpStatus],
      html: `<ezp-status cancel="Cancel" close="Close" retry="Retry"></ezp-status>`,
    })
    expect(page.root!.shadowRoot!.querySelector('#footer')).not.toBeNull()
    expect(page.root!.shadowRoot!.querySelectorAll('ezp-text-button').length).toBe(3)
  })

  it('is a polite live region so status changes are announced', async () => {
    const page = await newSpecPage({
      components: [EzpStatus],
      html: `<ezp-status description="Printing…"></ezp-status>`,
    })
    expect(page.root!.getAttribute('role')).toBe('status')
    expect(page.root!.getAttribute('aria-live')).toBe('polite')
  })

  it('emits statusClose carrying the instance name', async () => {
    const page = await newSpecPage({
      components: [EzpStatus],
      html: `<ezp-status instance="print-success" close></ezp-status>`,
    })
    let received: string | undefined
    page.root!.addEventListener('statusClose', ((e: CustomEvent<string>) => {
      received = e.detail
    }) as EventListener)
    ;(page.rootInstance as any).handleClose()
    expect(received).toBe('print-success')
  })

  it('re-renders translated labels when the language changes at runtime', async () => {
    initi18n('en')
    const page = await newSpecPage({
      components: [EzpStatus],
      html: `<ezp-status></ezp-status>`,
    })
    // Boolean (non-string) cancel makes the label come from i18next.
    ;(page.rootInstance as any).cancel = true
    await page.waitForChanges()
    const label = () =>
      page.root!.shadowRoot!.querySelector('ezp-text-button')!.getAttribute('label')
    expect(label()).toBe('Cancel')

    await i18next.changeLanguage('de')
    await page.waitForChanges()
    expect(label()).toBe('Abbrechen')

    await i18next.changeLanguage('en') // restore shared i18next state for other tests
  })
})
