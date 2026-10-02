import { Component, Element, Host, Listen, Prop, State, h } from '@stencil/core'
import { LabelLevelTypes, TooltipPlacementTypes, WeightTypes } from '../../shared/types'

/**
 * Characters kept at the end of a truncated name. Uploads often differ only in
 * a suffix like `_DE.pdf`, which a plain end-ellipsis would be the first thing
 * to hide, so that tail is held back and the middle gives way instead.
 */
const TAIL_LENGTH = 8

/** Hovering across a list shouldn't flash a tooltip over every row in passing. */
const OPEN_DELAY_MS = 300

/** Grace period for crossing the gap between the name and the bubble, so the
 *  tooltip can be hovered rather than vanishing on the way (WCAG 1.4.13). */
const CLOSE_DELAY_MS = 200

@Component({
  tag: 'ezp-file-name',
  styleUrl: 'ezp-file-name.scss',
  shadow: true,
})
export class EzpFileName {
  @Element() host: HTMLEzpFileNameElement

  private openTimeout?: ReturnType<typeof setTimeout>
  private closeTimeout?: ReturnType<typeof setTimeout>
  /** Invalidates an in-flight open when the pointer leaves. */
  private openGeneration = 0

  /**
   *
   * Properties
   *
   */

  /** The full file name. Always present in the DOM, so screen readers and
   *  copy-paste get it in full however it is truncated on screen. */
  @Prop() name: string = ''

  /** Type scale of the rendered name, passed through to `ezp-label`. */
  @Prop() level: LabelLevelTypes = 'secondary'

  /** Font weight of the rendered name, passed through to `ezp-label`. */
  @Prop() weight: WeightTypes = 'soft'

  /** Side the tooltip opens on. Consumers point it away from the edge their
   *  row sits against — `bottom` for the first row of a list, `top` below it. */
  @Prop() placement: TooltipPlacementTypes = 'top'

  /**
   *
   * States
   *
   */

  /** Set by tapping the name: shows it in full, wrapped over several lines.
   *  This is the touch counterpart of the tooltip, which needs a pointer. */
  @State() expanded: boolean = false

  @State() tooltipOpen: boolean = false

  /**
   *
   * Lifecycle methods
   *
   */

  disconnectedCallback() {
    clearTimeout(this.openTimeout)
    clearTimeout(this.closeTimeout)
  }

  /**
   *
   * Listeners
   *
   */

  @Listen('keydown', { target: 'document' })
  handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape' && this.tooltipOpen) {
      event.stopPropagation()
      this.closeTooltip()
    }
  }

  /**
   *
   * Private methods
   *
   */

  /** Tooltips need a pointer; touch devices get the tap-to-expand path instead.
   *  Tapping fires a synthetic `mouseenter` in most mobile browsers, so without
   *  this check a tooltip would open on every tap. */
  private get hasHover(): boolean {
    return window.matchMedia?.('(hover: hover)').matches ?? false
  }

  /** Whether anything is actually hidden. A name that fits needs no tooltip —
   *  repeating text the reader can already see is just noise in the way. */
  private async isClipped(): Promise<boolean> {
    const head = this.host.shadowRoot?.querySelector('.head') as HTMLEzpLabelElement | null
    if (!head) return false
    await head.componentOnReady?.()
    return head.isTruncated()
  }

  private openTooltip = () => {
    if (!this.hasHover || this.expanded) return
    clearTimeout(this.openTimeout)
    const generation = ++this.openGeneration
    this.openTimeout = setTimeout(async () => {
      const clipped = await this.isClipped()
      // Measuring yields, and the pointer may have moved on in the meantime —
      // opening now would leave a tooltip behind with nothing to dismiss it.
      if (clipped && generation === this.openGeneration) this.tooltipOpen = true
    }, OPEN_DELAY_MS)
  }

  private closeTooltip = () => {
    this.openGeneration++
    clearTimeout(this.openTimeout)
    clearTimeout(this.closeTimeout)
    this.tooltipOpen = false
  }

  /** Leaves the tooltip up briefly so the pointer can reach it. */
  private scheduleClose = () => {
    clearTimeout(this.openTimeout)
    clearTimeout(this.closeTimeout)
    this.closeTimeout = setTimeout(this.closeTooltip, CLOSE_DELAY_MS)
  }

  private cancelScheduledClose = () => {
    clearTimeout(this.closeTimeout)
  }

  private toggleExpanded = () => {
    this.expanded = !this.expanded
    // The full name is on screen now; a tooltip repeating it is just in the way.
    if (this.expanded) this.closeTooltip()
  }

  /**
   *
   * Render method
   *
   */

  render() {
    // Splitting is a rendering device only: `head` holds everything but the last
    // few characters and is the part CSS is allowed to clip, so the two labels
    // together still spell out the whole name.
    const split = !this.expanded && this.name.length > TAIL_LENGTH
    const head = split ? this.name.slice(0, -TAIL_LENGTH) : this.name
    const tail = split ? this.name.slice(-TAIL_LENGTH) : ''

    return (
      <Host class={{ expanded: this.expanded, [`place-${this.placement}`]: true }}>
        <button
          type="button"
          id="trigger"
          /* The split puts the name in two elements, and name computation joins
             them with a space — "Short.pdf" would be read as "S hort.pdf". The
             label states the name once, exactly as it is. */
          aria-label={this.name}
          aria-expanded={this.expanded ? 'true' : 'false'}
          onClick={this.toggleExpanded}
          onMouseEnter={this.openTooltip}
          onMouseLeave={this.scheduleClose}
          onFocus={this.openTooltip}
          onBlur={this.closeTooltip}
        >
          <ezp-label
            class="head"
            ellipsis={split}
            level={this.level}
            weight={this.weight}
            text={head}
          />
          {split && <ezp-label class="tail" level={this.level} weight={this.weight} text={tail} />}
        </button>
        {/* Purely a visual aid: the button's own label already states the name,
            so announcing the bubble too would just repeat it. It stays hoverable
            (WCAG 1.4.13), hence the handlers rather than `pointer-events: none`. */}
        {this.tooltipOpen && (
          <div
            id="tooltip"
            aria-hidden="true"
            onMouseEnter={this.cancelScheduledClose}
            onMouseLeave={this.closeTooltip}
          >
            {this.name}
          </div>
        )}
      </Host>
    )
  }
}
