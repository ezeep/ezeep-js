import { Component, Host, Prop, State, Event, EventEmitter, Watch, h } from '@stencil/core'
import { IconNameTypes } from '../../shared/types'

@Component({
  tag: 'ezp-stepper',
  styleUrl: 'ezp-stepper.scss',
  shadow: true,
})
export class EzpStepper {
  private input?: HTMLInputElement

  /**
   *
   * Properties
   *
   */

  /** Description... */
  @Prop() icon: IconNameTypes

  /** Description... */
  @Prop() label: string = 'Label'

  /** Description... */
  @Prop() max: number

  /** Description... */
  @Prop() min: number = 1

  /**
   *
   * States
   *
   */

  /** Description... */
  @State() canDecrease: boolean = true

  /** Description... */
  @State() canIncrease: boolean = true

  /** Description... */
  @State() focused: boolean = false

  /** Description... */
  @State() value: number = 1

  /**
   *
   * Events
   *
   */

  @Event() stepperChanged: EventEmitter

  /**
   *
   * Watchers
   *
   */

  @Watch('value')
  watchValue() {
    this.canIncrease = this.max !== undefined ? this.value < this.max : true
    this.canDecrease = this.min !== undefined ? this.value > this.min : true
    this.stepperChanged.emit(this.value)
  }

  /**
   *
   * Private methods
   *
   */

  private handleDecrease = () => {
    this.value--
  }

  private handleIncrease = () => {
    this.value++
  }

  private handleInput = () => {
    this.value = this.input.value !== '' ? parseInt(this.input.value) : this.min
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

  /**
   *
   * Lifecycle methods
   *
   */

  componentWillLoad() {
    this.watchValue()
  }

  /**
   *
   * Render method
   *
   */

  render() {
    return (
      <Host class={`${this.focused ? 'focused' : ''} ${this.icon ? 'has-icon' : ''}`}>
        <div id="toggle" onClick={this.setFocus} />
        {this.icon ? <ezp-icon id="icon" name={this.icon} /> : null}
        <ezp-label id="label" noWrap text={this.label} />
        <input
          id="input"
          type="number"
          ref={(input) => (this.input = input)}
          min={this.min.toString()}
          max={this.max.toString()}
          value={this.value.toString()}
          onInput={this.handleInput}
          onFocus={this.handleFocus}
          onBlur={this.handleBlur}
        />
        <div class="buttons">
          <button class="button" disabled={!this.canDecrease} onClick={this.handleDecrease}>
            <ezp-icon name="minus" />
          </button>
          <button class="button" disabled={!this.canIncrease} onClick={this.handleIncrease}>
            <ezp-icon name="plus" />
          </button>
        </div>
      </Host>
    )
  }
}
