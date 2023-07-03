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

  @Prop() label: string = 'Label'
  @Prop({ mutable: true }) value: number | string
  @Prop() type: string = 'text'
  @Prop() icon: IconNameTypes = 'color'
  @Prop({ reflect: true }) suffix: string
  @Event() inputValueChanged: EventEmitter
  @State() focused: boolean = false

  handleChange(event) {
    if (this.timeout) {
      clearTimeout(this.timeout)
    }
    this.value = event.target.value ? event.target.value : 0
    this.timeout = setTimeout(() => {
      this.inputValueChanged.emit({
        type: this.label.toLowerCase(),
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
