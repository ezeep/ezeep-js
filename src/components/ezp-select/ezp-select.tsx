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
  @Prop() toggleFlow: SelectFlowTypes = 'horizontal'

  @Prop() previouslySelected: any
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

    if (this.previouslySelected !== '') {
      this.selected.title = this.previouslySelected
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
    ]
    const labelLevel = this.toggleFlow === 'horizontal' ? 'secondary' : 'tertiary'

    return (
      <Host class={hostClasses.join(' ')}>
        <div id="wrap">
          <div id="toggle" onClick={() => this.toggle()}>
            {this.icon ? <ezp-icon id="icon" name={this.icon} /> : null}
            <cap-label id="label" level={labelLevel}>
              {this.label}
            </cap-label>
            <cap-label id="value" clip>
              {this.selected.title !== '' ? this.selected.title : this.placeholder}
            </cap-label>
            <ezp-icon id="accessory" name="expand" />
          </div>
          <div id="list" ref={(element) => (this.list = element)}>
            {this.options.map((option) => (
              <div
                class={`option ${option.id === this.selected.id ? 'is-selected' : ''} ${
                  option.meta !== '' ? 'has-meta' : ''
                } `}
                onClick={() => this.select(option.id)}
              >
                <ezp-icon name="checkmark" class="indicator" />
                <div class="details">
                  <cap-label class="title" clip>
                    {option.title}
                  </cap-label>
                  {option.meta !== '' ? (
                    <cap-label level="tertiary" class="meta">
                      {option.meta}
                    </cap-label>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Host>
    )
  }
}
