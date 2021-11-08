import { Component, Host, Prop, State, Event, EventEmitter, Watch, h } from '@stencil/core'

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
      <Host>
        <ezp-label noWrap id="label" text={this.label} />
        <input
          id="input"
          type="number"
          ref={(input) => (this.input = input)}
          min={this.min.toString()}
          max={this.max.toString()}
          value={this.value.toString()}
          onInput={this.handleInput}
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
