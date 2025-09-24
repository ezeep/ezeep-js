import { Component, Host, Prop, State, Event, EventEmitter, Watch, h } from '@stencil/core'
import { IconNameTypes } from '../../shared/types'

@Component({
  tag: 'ezp-stepper',
  styleUrl: 'ezp-stepper.scss',
  shadow: true,
})
export class EzpStepper {
  private input?: HTMLInputElement

  private static readonly ALLOWED_KEYS = [
    'Backspace',
    'Delete',
    'Tab',
    'Escape',
    'Enter',
    'ArrowLeft',
    'ArrowUp',
    'ArrowRight',
    'ArrowDown',
  ]

  private static readonly CTRL_CMD_KEYS = ['a', 'c', 'v', 'x']

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
    const effectiveMax = this.max !== undefined ? Math.min(this.max, Number.MAX_SAFE_INTEGER) : Number.MAX_SAFE_INTEGER
    this.canIncrease = this.value < effectiveMax
    this.canDecrease = this.min !== undefined ? this.value > this.min : true
    this.stepperChanged.emit(this.value)
  }

  /**
   *
   * Private methods
   *
   */

  private handleDecrease = () => {
    const newValue = this.value - 1
    // Only decrease if within safe range and above minimum
    if (newValue >= Number.MIN_SAFE_INTEGER && (this.min === undefined || newValue >= this.min)) {
      this.value = newValue
    }
  }

  private handleIncrease = () => {
    const newValue = this.value + 1
    const effectiveMax = this.max !== undefined ? Math.min(this.max, Number.MAX_SAFE_INTEGER) : Number.MAX_SAFE_INTEGER
    // Only increase if within safe range and below maximum
    if (newValue <= Number.MAX_SAFE_INTEGER && newValue <= effectiveMax) {
      this.value = newValue
    }
  }

  private handleInput = () => {
    if (!this.input) return

    let inputString = this.input.value.trim()

    // If the input is empty, set the value to the minimum
    if (inputString === '') {
      this.value = this.min
      this.input.value = this.value.toString()
      return
    }

    // Remove all non-digit characters, keep only numbers
    const cleanedInput = inputString.replace(/\D/g, '')

    // If nothing remains after cleaning, revert to the last valid value
    if (cleanedInput === '') {
      this.input.value = this.value.toString()
      return
    }

    // Limit input length to prevent precision loss (MAX_SAFE_INTEGER has 16 digits)
    const maxDigits = Number.MAX_SAFE_INTEGER.toString().length
    const truncatedInput = cleanedInput.slice(0, maxDigits)

    let inputValue = Number(truncatedInput)

    // Safety check: ensure the number is within safe integer range
    if (inputValue > Number.MAX_SAFE_INTEGER) {
      inputValue = Number.MAX_SAFE_INTEGER
    }

    // Ensure the value is between min and max
    if (this.min !== undefined && inputValue < this.min) inputValue = this.min
    const effectiveMax = this.max !== undefined ? Math.min(this.max, Number.MAX_SAFE_INTEGER) : Number.MAX_SAFE_INTEGER
    if (inputValue > effectiveMax) inputValue = effectiveMax

    // Update component state and input field
    this.value = inputValue
    this.input.value = inputValue.toString()
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
  private handleKeyDown = (event: KeyboardEvent) => {
    // If key is allowed or a Ctrl/Cmd combination, do nothing
    if (
      EzpStepper.ALLOWED_KEYS.includes(event.key) ||
      ((event.ctrlKey || event.metaKey) && EzpStepper.CTRL_CMD_KEYS.includes(event.key.toLowerCase()))
    ) {
      return
    }

    // If the key is not a digit, prevent default behavior (block input)
    const isDigit = /^\d$/.test(event.key)
    if (!isDigit) {
      event.preventDefault()
    }
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
          max={this.max !== undefined ? this.max.toString() : undefined}
          value={this.value.toString()}
          onInput={this.handleInput}
          onKeyDown={this.handleKeyDown}
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
