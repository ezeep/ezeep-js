import { newSpecPage } from '@stencil/core/testing'
import { EzpIconButton } from './ezp-icon-button'

describe('ezp-icon-button accessibility', () => {
  it('derives a readable aria-label from the icon name', async () => {
    const page = await newSpecPage({
      components: [EzpIconButton],
      html: `<ezp-icon-button icon="paper_range" type="button"></ezp-icon-button>`,
    })
    expect(page.root!.shadowRoot!.innerHTML).toContain('aria-label="paper range"')
  })
})
