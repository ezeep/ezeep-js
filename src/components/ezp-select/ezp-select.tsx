import { Component, Host, Prop, State, Watch, Element, Event, EventEmitter, h } from '@stencil/core'
import { SelectFlowTypes, SelectOptionType, IconNameTypes } from '../../shared/types'

/**
 * The "nothing selected" sentinel. Its empty `title` makes the toggle fall back
 * to the placeholder (see render). Used as the initial state and to reset the
 * selection when the current `preSelected` value has no matching option.
 */
const EMPTY_SELECTION: SelectOptionType = { id: false, title: '', meta: '' }

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
  private toggleEl?: HTMLDivElement
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

  /** The currently-selected option, matched by title (string) or id (number). */
  @Prop() preSelected: string | number | null

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
  @State() selected: SelectOptionType = EMPTY_SELECTION

  /**
   *
   * Events
   *
   */

  @Event() selectToggle: EventEmitter<boolean>
  @Event() selectSelection: EventEmitter<SelectOptionType>

  /**
   *
   * Watchers
   *
   */

  @Watch('expanded')
  watchExpanded() {
    if (this.expandCover) {
      this.component.style.setProperty(
        '--ezp-select-list-height',
        this.expanded ? `${this.containerHeight - this.toggleHeight}px` : '0px',
      )
      this.component.style.setProperty(
        '--ezp-select-wrap-translateY',
        this.expanded ? `${this.wrapTop * -1 + this.spacing}px` : '0px',
      )
    } else if (this.expandRise) {
      this.component.style.setProperty(
        '--ezp-select-list-height',
        this.expanded ? `${this.listHeight}px` : '0px',
      )
      this.component.style.setProperty(
        '--ezp-select-wrap-translateY',
        this.expanded ? `${this.wrapDiff + this.spacing}px` : '0px',
      )
    } else {
      this.component.style.setProperty(
        '--ezp-select-list-height',
        this.expanded ? `${this.listHeight}px` : '0px',
      )
    }

    if (this.expanded) {
      this.backdrop.visible = true
      this.container.appendChild(this.backdrop)
    } else {
      this.backdrop.visible = false
    }
  }

  @Watch('preSelected')
  preSelectedChanged() {
    this.preSelect()
  }

  /**
   *
   * Private methods
   *
   */

  private toggle = () => {
    this.containerHeight = this.container.clientHeight - this.spacing * 2
    this.listHeight = this.list.scrollHeight
    this.wrapTop = this.component.offsetTop
    this.wrapHeight = this.toggleHeight + this.listHeight
    this.expandCover = this.wrapHeight > this.containerHeight
    this.expandRise = this.wrapHeight > this.containerHeight - this.wrapTop
    this.wrapDiff = this.containerHeight - this.wrapHeight - this.wrapTop
    this.expanded = !this.expanded
    this.selectToggle.emit(this.expanded)
  }

  private select = (id: number | string | boolean) => {
    const delay = this.selected?.id === id ? 0 : this.duration * 1000

    // The id always comes from an existing option, so a match is guaranteed.
    this.selected = this.options.find((option) => option.id === id)!
    this.selectSelection.emit(this.selected)

    window.setTimeout(() => {
      this.toggle()
    }, delay)
  }

  private preSelect = () => {
    const match = this.options?.find((option) =>
      typeof this.preSelected === 'number'
        ? option.id === this.preSelected
        : typeof this.preSelected === 'string'
          ? option.title === this.preSelected
          : null,
    )
    // Reset to the placeholder when the current printer has no matching option,
    // rather than leaving the previous printer's (now-invalid) label showing.
    this.selected = match ?? EMPTY_SELECTION
  }

  private getOptionElements(): HTMLElement[] {
    return this.list ? Array.from(this.list.querySelectorAll<HTMLElement>('[role="option"]')) : []
  }

  /** Move focus onto the option at `index` (clamped to the list bounds). */
  private focusOption(index: number) {
    const options = this.getOptionElements()
    const target = options[Math.max(0, Math.min(index, options.length - 1))]
    target?.focus()
  }

  // Open the list on Enter/Space/ArrowDown (moving focus to the first option);
  // close it on Escape.
  private handleToggleKeydown = (event: KeyboardEvent) => {
    if (this.disabled) return
    if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown') {
      event.preventDefault()
      if (!this.expanded) {
        this.toggle()
        // Focus the first option once the expanded list has rendered.
        window.setTimeout(() => this.focusOption(0), 0)
      }
    } else if (event.key === 'Escape' && this.expanded) {
      this.toggle()
    }
  }

  // Full listbox keyboard support: arrows/Home/End roam the options, Enter/Space
  // selects, Escape closes and returns focus to the toggle.
  private handleOptionKeydown = (event: KeyboardEvent, id: number | string | boolean) => {
    const options = this.getOptionElements()
    const current = options.indexOf(event.currentTarget as HTMLElement)
    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault()
        this.select(id)
        break
      case 'ArrowDown':
        event.preventDefault()
        this.focusOption(current + 1)
        break
      case 'ArrowUp':
        event.preventDefault()
        this.focusOption(current - 1)
        break
      case 'Home':
        event.preventDefault()
        this.focusOption(0)
        break
      case 'End':
        event.preventDefault()
        this.focusOption(options.length - 1)
        break
      case 'Escape':
        if (this.expanded) {
          this.toggle()
          this.toggleEl?.focus()
        }
        break
    }
  }

  /**
   *
   * Lifecycle methods
   *
   */

  componentWillLoad() {
    this.container = this.component.closest('[data-backdrop-surface]') as HTMLDivElement

    this.backdrop.addEventListener('backdropHideStart', () => {
      this.expanded = false
    })

    this.backdrop.addEventListener('backdropHideEnd', () => {
      this.container.removeChild(this.backdrop)
    })

    if (this.preSelected !== undefined && this.preSelected !== '' && this.preSelected !== null) {
      this.preSelect()
    }
  }

  componentDidLoad() {
    const styles = getComputedStyle(this.component)

    this.toggleHeight = parseInt(styles.getPropertyValue('--ezp-select-toggle-height'))
    this.duration = parseFloat(styles.getPropertyValue('--ezp-select-duration'))
  }

  componentWillUpdate() {
    if (
      this.selected?.id === false &&
      this.preSelected !== undefined &&
      this.preSelected !== '' &&
      this.preSelected !== null
    ) {
      this.preSelect()
    }
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
          <div
            id="toggle"
            role="combobox"
            aria-haspopup="listbox"
            aria-controls="list"
            aria-expanded={this.expanded ? 'true' : 'false'}
            aria-label={this.label}
            aria-disabled={this.disabled ? 'true' : 'false'}
            tabindex={this.disabled ? -1 : 0}
            ref={(el) => (this.toggleEl = el as HTMLDivElement)}
            onClick={() => !this.disabled && this.toggle()}
            onKeyDown={this.handleToggleKeydown}
          >
            {this.icon ? <ezp-icon id="icon" name={this.icon} /> : null}
            <ezp-label id="label" noWrap level={labelLevel} text={this.label} />
            <ezp-label
              id="value"
              ellipsis
              text={this.selected?.title !== '' ? this.selected?.title : this.placeholder}
            />
            <ezp-icon id="accessory" name="expand" />
          </div>
          <div
            id="list"
            role="listbox"
            aria-label={this.label}
            ref={(element) => (this.list = element as HTMLDivElement)}
          >
            {this.options?.map((option) => {
              if (option.title !== '') {
                return (
                  <div
                    class={`option ${option.id === this.selected?.id ? 'is-selected' : ''} ${
                      option.meta !== '' ? 'has-meta' : ''
                    } `}
                    role="option"
                    aria-selected={option.id === this.selected?.id ? 'true' : 'false'}
                    tabindex={this.expanded ? 0 : -1}
                    onClick={() => this.select(option.id)}
                    onKeyDown={(event) => this.handleOptionKeydown(event, option.id)}
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
