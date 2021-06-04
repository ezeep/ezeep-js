import { Component, Host, Prop, State, Watch, Element, Event, EventEmitter, h } from '@stencil/core'
import { SelectFlowTypes, SelectOptionType, IconNameTypes } from './../../shared/types'

@Component({
  tag: 'ejs-select',
  styleUrl: 'ejs-select.scss',
  shadow: true,
})
export class EjstSelect {
  @Element() component!: HTMLEjsSelectElement

  private dialog: HTMLDivElement
  private dialogHeight: number = 0
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
  @Prop() optionFlow: SelectFlowTypes = 'vertical'

  /** Description... */
  @Prop() options: SelectOptionType[]

  /** Description... */
  @Prop() placeholder: string = 'Placeholder'

  /** Description... */
  @Prop() toggleFlow: SelectFlowTypes = 'horizontal'

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
        this.expanded ? `${this.dialogHeight - this.toggleHeight}px` : '0px'
      )
      this.component.style.setProperty(
        '--wrap-translate-y',
        this.expanded ? `${this.wrapTop * -1 + this.spacing}px` : '0px'
      )
    } else if (this.expandRise) {
      console.log('hello')
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

  private select = (id: number) => {
    const delay = this.selected.id === id ? 0 : this.duration * 1000

    this.selected = this.options.find((option) => option.id === id)
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
    this.dialog = this.component.closest('#dialog')
  }

  componentDidLoad() {
    const styles = getComputedStyle(this.component)

    this.toggleHeight = parseInt(styles.getPropertyValue('--toggle-height'))
    this.duration = parseFloat(styles.getPropertyValue('--duration'))
    this.dialogHeight = this.dialog.clientHeight - this.spacing * 2
    this.listHeight = this.list.scrollHeight
    this.wrapTop = this.component.offsetTop
    this.wrapHeight = this.toggleHeight + this.listHeight
    this.expandCover = this.wrapHeight > this.dialogHeight
    this.expandRise = this.wrapHeight > this.dialogHeight - this.wrapTop
    this.wrapDiff = this.dialogHeight - this.wrapHeight - this.wrapTop
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
      `option-${this.optionFlow}`,
    ]
    const labelLevel = this.toggleFlow === 'horizontal' ? 'primary' : 'secondary'

    return (
      <Host class={hostClasses.join(' ')}>
        <div id="wrap">
          <div id="toggle" onClick={() => this.toggle()}>
            {this.icon ? <ejs-icon id="icon" name={this.icon} /> : null}
            <ejs-typo-body id="label" level={labelLevel}>
              {this.label}
            </ejs-typo-body>
            <ejs-typo-body id="value">
              {this.selected.title !== '' ? this.selected.title : this.placeholder}
            </ejs-typo-body>
            <ejs-icon id="accessory" name="expand" />
          </div>
          <div id="list" ref={(element) => (this.list = element)}>
            {this.options.map((option) => (
              <div
                class={`option ${option.id === this.selected.id ? 'is-selected' : ''}`}
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
        </div>
      </Host>
    )
  }
}
