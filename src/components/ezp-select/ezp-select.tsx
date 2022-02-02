import { Component, Host, Prop, State, Watch, Element, Event, EventEmitter, h } from '@stencil/core'
import { SelectFlowTypes, SelectOptionType, IconNameTypes } from '../../shared/types'

@Component({
  tag: 'ezp-select',
  styleUrl: 'ezp-select.scss',
  shadow: true,
})
export class EzpSelect {
  @Element() component!: HTMLEzpSelectElement

  private container: HTMLDivElement
  private backdrop: HTMLEzpBackdropElement = document.createElement('ezp-backdrop')
  private containerHeight: number = 0
  private expandCover: boolean = false
  private expandRise: boolean = false
  private list: HTMLDivElement
  private listHeight: number = 0
  private spacing: number = 6
  private toggleHeight: number = 0
  private wrapDiff: number = 0
  private wrapHeight: number = 0
  private wrapTop: number = 0
  private duration: number = 0

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
  @Prop() optionFlow: SelectFlowTypes

  /** Description... */
  @Prop() options: SelectOptionType[]

  /** Description... */
  @Prop() placeholder: string = 'Placeholder'

  /** Description... */
  @Prop() preSelected: any

  /** Description... */
  @Prop() toggleFlow: SelectFlowTypes = 'horizontal'

  /** Description... */
  @Prop() disabled: boolean = false

  /**
   *
   * States
   *
   */

  /** Description... */
  @State() expanded: boolean = false

  /** Description... */
  @State() selected: SelectOptionType = { id: 0, title: '', meta: '' }

  /**
   *
   * Events
   *
   */

  @Event() selectToggle: EventEmitter
  @Event() selectSelection: EventEmitter

  /**
   *
   * Watchers
   *
   */

  @Watch('expanded')
  watchExpanded() {
    if (this.expandCover) {
      this.component.style.setProperty(
        '--list-height',
        this.expanded ? `${this.containerHeight - this.toggleHeight}px` : '0px'
      )
      this.component.style.setProperty(
        '--wrap-translate-y',
        this.expanded ? `${this.wrapTop * -1 + this.spacing}px` : '0px'
      )
    } else if (this.expandRise) {
      this.component.style.setProperty(
        '--list-height',
        this.expanded ? `${this.listHeight}px` : '0px'
      )
      this.component.style.setProperty(
        '--wrap-translate-y',
        this.expanded ? `${this.wrapDiff + this.spacing}px` : '0px'
      )
    } else {
      this.component.style.setProperty(
        '--list-height',
        this.expanded ? `${this.listHeight}px` : '0px'
      )
    }

    if (this.expanded) {
      this.backdrop.visible = true
      this.container.appendChild(this.backdrop)
    } else {
      this.backdrop.visible = false
    }
  }

  /**
   *
   * Private methods
   *
   */

  private toggle = () => {
    this.expanded = !this.expanded
    this.selectToggle.emit(this.expanded)
  }

  private select = (id: number | string) => {
    const delay = this.selected.id === id ? 0 : this.duration * 1000

    this.selected = this.options.find((option) => option.id === id)
    this.selectSelection.emit(this.selected)
    window.setTimeout(() => {
      this.toggle()
    }, delay)
  }

  /**
   *
   * Lifecycle methods
   *
   */

  componentWillLoad() {
    this.container = this.component.closest('[data-backdrop-surface]')

    this.backdrop.addEventListener('backdropHideStart', () => {
      this.expanded = false
    })

    this.backdrop.addEventListener('backdropHideEnd', () => {
      this.container.removeChild(this.backdrop)
    })

    if (this.preSelected) {
      this.selected = this.options.find((option) =>
        typeof this.preSelected === 'number'
          ? option.id === this.preSelected
          : option.title === this.preSelected
      )
    }
  }

  componentDidLoad() {
    const styles = getComputedStyle(this.component)

    this.toggleHeight = parseInt(styles.getPropertyValue('--toggle-height'))
    this.duration = parseFloat(styles.getPropertyValue('--duration'))
    this.containerHeight = this.container.clientHeight - this.spacing * 2
    this.listHeight = this.list.scrollHeight
    this.wrapTop = this.component.offsetTop
    this.wrapHeight = this.toggleHeight + this.listHeight
    this.expandCover = this.wrapHeight > this.containerHeight
    this.expandRise = this.wrapHeight > this.containerHeight - this.wrapTop
    this.wrapDiff = this.containerHeight - this.wrapHeight - this.wrapTop
  }

  /**
   *
   * Render method
   *
   */

  render() {
    const hostClasses = [
      this.expanded ? 'is-expanded' : '',
      this.icon ? 'has-icon' : '',
      `toggle-${this.toggleFlow}`,
      this.optionFlow ? `option-${this.optionFlow}` : '',
      this.disabled ? 'disabled' : '',
    ]
    const labelLevel = this.toggleFlow === 'horizontal' ? 'secondary' : 'tertiary'

    return (
      <Host class={hostClasses.join(' ')}>
        <div id="wrap">
          <div id="toggle" onClick={() => !this.disabled && this.toggle()}>
            {this.icon ? <ezp-icon id="icon" name={this.icon} /> : null}
            <ezp-label id="label" noWrap level={labelLevel} text={this.label} />
            <ezp-label
              id="value"
              ellipsis
              text={this.selected.title !== '' ? this.selected.title : this.placeholder}
            />
            <ezp-icon id="accessory" name="expand" />
          </div>
          <div id="list" ref={(element) => (this.list = element)}>
            {this.options.map((option) => {
              if (option.title !== '') {
                return (
                  <div
                    class={`option ${option.id === this.selected.id ? 'is-selected' : ''} ${
                      option.meta !== '' ? 'has-meta' : ''
                    } `}
                    onClick={() => this.select(option.id)}
                  >
                    <ezp-icon name="checkmark" class="indicator" />
                    <div class="details">
                      <ezp-label class="title" ellipsis text={option.title} />
                      {option.meta !== '' ? (
                        <ezp-label level="tertiary" class="meta" text={option.meta} ellipsis />
                      ) : null}
                    </div>
                  </div>
                )
              }
            })}
          </div>
        </div>
      </Host>
    )
  }
}
