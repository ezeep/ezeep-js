import { newSpecPage } from '@stencil/core/testing'
import { EzpInput } from './ezp-input'

describe('ezp-input', () => {
  it('renders no icon by default', async () => {
    const page = await newSpecPage({ components: [EzpInput], html: `<ezp-input></ezp-input>` })

    expect(page.root!.classList.contains('has-icon')).toBe(false)
    expect(page.root!.shadowRoot!.querySelector('#icon')).toBeNull()
  })

  it('renders the icon and switches the grid when one is passed', async () => {
    const page = await newSpecPage({
      components: [EzpInput],
      html: `<ezp-input icon="width"></ezp-input>`,
    })

    expect(page.root!.classList.contains('has-icon')).toBe(true)
    expect(page.root!.shadowRoot!.querySelector('#icon')).not.toBeNull()
  })

  it('treats an empty icon as no icon', async () => {
    const page = await newSpecPage({
      components: [EzpInput],
      html: `<ezp-input icon=""></ezp-input>`,
    })

    expect(page.root!.classList.contains('has-icon')).toBe(false)
    expect(page.root!.shadowRoot!.querySelector('#icon')).toBeNull()
  })
})
