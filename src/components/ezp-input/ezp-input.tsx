import { Component, Host, Prop, h, State, EventEmitter, Event } from '@stencil/core'
import { IconNameTypes } from './../../shared/types'

@Component({
  tag: 'ezp-input',
  styleUrl: 'ezp-input.scss',
  shadow: true,
})
export class EzpInput {
  private input?: HTMLInputElement
  private timeout = null

   /**
   *
   * Properties
   *
   */

  /** Description... */
  @Prop() label: string = 'Label'

  /** Description... */
  @Prop({ mutable: true }) value: number | string

  /** Description... */
  @Prop() type: string = 'text'

  /** Description... */
  @Prop() icon: IconNameTypes = 'color'

  /** Description... */
  @Prop({ reflect: true }) suffix: string
  
  /** Description... */
  @Prop() eventType: string


   /**
   *
   * Events
   *
   */

  @Event() inputValueChanged: EventEmitter

   /**
   *
   * States
   *
   */
  @State() focused: boolean = false

  handleChange(event) {
    if (this.timeout) {
      clearTimeout(this.timeout)
    }
    this.value = event.target.value ? event.target.value : 0
    this.timeout = setTimeout(() => {
      this.inputValueChanged.emit({
        type: this.eventType.toLowerCase(),
        value: this.value,
      })
    }, 500)
  }

  private setFocus = () => {
    this.input.focus()
  }

  private handleBlur = () => {
    this.focused = false
  }

  private handleFocus = () => {
    this.focused = true
  }

  render() {
    return (
      <Host class={{ focused: this.focused }} onClick={this.setFocus}>
        <ezp-icon id="icon" name={this.icon} />
        <ezp-label id="label" noWrap level="secondary" text={this.label} />
        <input
          id="input"
          type={this.type}
          value={this.value}
          onInput={(event) => this.handleChange(event)}
          ref={(input) => (this.input = input)}
          onFocus={this.handleFocus}
          onBlur={this.handleBlur}
        />
        {this.suffix ? <ezp-label id="suffix" level="secondary" text={this.suffix} /> : null}
      </Host>
    )
  }
}
