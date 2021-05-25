import { Component, Host, Prop, State, h } from '@stencil/core'
import { SelectOptionType } from './../../shared/types'

@Component({
  tag: 'ejs-input-select',
  styleUrl: 'ejs-input-select.scss',
  shadow: true,
})
export class EjsInputSelect {
  /**
   *
   * Properties
   *
   */

  /** Description... */
  @Prop() label: string = 'Label'

  /** Description... */
  @Prop() options: SelectOptionType[]

  /** Description... */
  @Prop() placeholder: string = 'Placeholder'

  /**
   *
   * States
   *
   */

  /** Description... */
  @State() selected: SelectOptionType = { id: 0, title: '', meta: '' }

  /**
   *
   * Private methods
   *
   */

  /** Description... */
  private select = (id: number) => {
    this.selected = this.options.find((option) => option.id === id)
  }

  /**
   *
   * Render method
   *
   */

  render() {
    return (
      <Host>
        <div id="toggle">
          <div id="result">
            <ejs-typo-body id="label">{this.label}</ejs-typo-body>
            <ejs-typo-body id="value">
              {this.selected.title !== '' ? this.selected.title : this.placeholder}
            </ejs-typo-body>
          </div>
          <ejs-icon name="expand" id="accessory" />
        </div>
        <div id="list">
          {this.options.map((option) => (
            <div
              class={`option ${option.meta !== '' ? 'has-meta' : ''} ${
                option.id === this.selected.id ? 'is-selected' : ''
              }`}
              onClick={() => this.select(option.id)}
            >
              <ejs-icon name="checkmark" class="indicator" />
              <div class="details">
                <ejs-typo-body class="title">{option.title}</ejs-typo-body>
                {option.meta !== '' ? (
                  <ejs-typo-body level="secondary" class="meta">
                    {option.meta}
                  </ejs-typo-body>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </Host>
    )
  }
}
