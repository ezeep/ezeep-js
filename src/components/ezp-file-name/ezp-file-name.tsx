import { Component, Element, Host, Listen, Prop, State, Watch, h } from '@stencil/core'
import {
  LabelLevelTypes,
  TooltipAnchorTypes,
  TooltipPlacementTypes,
  WeightTypes,
} from '../../shared/types'
import { pickTooltipSide } from '../../utils/utils'

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
  /** Everything the open tooltip listens to for scrolling, to detach on close. */
  private scrollTargets: EventTarget[] = []

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

  /** What the tooltip is placed against.
   *
   *  `container`: the nearest positioned ancestor, by CSS alone. The consumer
   *  makes the row that ancestor, and the bubble opens at the row's edge.
   *
   *  `parent`: the row the name sits in, measured when the tooltip opens — the
   *  closest ancestor marked `data-tooltip-row`, or else the name's parent
   *  element. For rows inside a scroll container, which would clip a bubble
   *  anchored to the row. The consumer puts the positioned ancestor outside the
   *  scroller instead, and the bubble spans that ancestor but lines up with
   *  the row. */
  @Prop() anchor: TooltipAnchorTypes = 'container'

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
    // Closing also drops the listeners. A node that is moved comes back with
    // its tooltip shut, rather than open with nothing left to close it.
    this.closeTooltip()
    this.stopWatchingScroll()
  }

  componentDidRender() {
    if (this.tooltipOpen && this.anchor === 'parent') this.placeTooltip()
  }

  /**
   *
   * Watchers
   *
   */

  /** A measured bubble stays where it was put, so once the row scrolls away
   *  under it, it would point at the wrong name. Closing it is the honest fix. */
  @Watch('tooltipOpen')
  watchTooltipOpen(open: boolean) {
    if (open && this.anchor === 'parent') this.watchScroll()
    else this.stopWatchingScroll()
  }

  /**
   *
   * Listeners
   *
   */

  /**
   * Escape dismisses the tooltip, and only the tooltip.
   *
   * Listening globally catches the key however the tooltip was opened,
   * including by hover, when nothing here has focus. It has to run in the
   * capture phase: stopping propagation on the way back up happens after every
   * ancestor has already seen the key, so a host app that closes its dialog on
   * Escape would close it as the tooltip was dismissed.
   *
   * `window` rather than `document`, because dialog libraries capture on the
   * document themselves — Radix's `DismissableLayer` does — and register before
   * a component mounted inside them, so they would still see the key first.
   * Capture runs window before document, so this transient layer consumes the
   * key first, and only while it is actually open.
   */
  @Listen('keydown', { target: 'window', capture: true })
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

  /** Lines the bubble up with the row the name sits in. Its containing block
   *  is somewhere further out, so `top: 0` shows where that block starts, and
   *  the offset is taken from there. Measurements are in screen pixels, which
   *  differ from CSS pixels when a host scales the dialog with a transform, so
   *  the offset is converted back before it is applied.
   *
   *  `placement` is a preference here: a row near the edge of whatever clips
   *  the bubble may not have room on that side, so it opens on the other. */
  private placeTooltip() {
    const tooltip = this.host.shadowRoot?.querySelector('#tooltip') as HTMLElement | null
    const row = this.host.closest('[data-tooltip-row]') ?? this.host.parentElement
    if (!tooltip || !row) return

    tooltip.style.bottom = 'auto'
    tooltip.style.top = '0px'
    const bubble = tooltip.getBoundingClientRect()
    const scale = tooltip.offsetHeight > 0 ? bubble.height / tooltip.offsetHeight : 1
    const rowRect = row.getBoundingClientRect()
    const gap =
      (parseFloat(getComputedStyle(tooltip).getPropertyValue('--ezp-spacing-2')) || 6) * scale
    const side = pickTooltipSide(
      this.placement,
      rowRect,
      bubble.height + gap,
      this.visibleArea(tooltip),
    )
    const top = side === 'top' ? rowRect.top - gap - bubble.height : rowRect.bottom + gap
    tooltip.style.top = `${(top - bubble.top) / (scale || 1)}px`
  }

  /** The part of the screen the bubble can show in: the viewport, narrowed by
   *  every ancestor of its containing block that clips overflow — the host's
   *  scrolling body, say. The scroller the rows sit in isn't among them, as the
   *  bubble is anchored beyond it. */
  private visibleArea(tooltip: HTMLElement): { top: number; bottom: number } {
    let top = 0
    let bottom = window.innerHeight
    let node: Element | null = tooltip.offsetParent
    while (node) {
      if (getComputedStyle(node).overflowY !== 'visible') {
        const rect = node.getBoundingClientRect()
        top = Math.max(top, rect.top)
        bottom = Math.min(bottom, rect.bottom)
      }
      node = node.parentElement ?? ((node.getRootNode() as ShadowRoot).host || null)
    }
    return { top, bottom }
  }

  /** Scroll events don't bubble, so every ancestor is listened to directly —
   *  across shadow roots, since the scroll container is usually the consumer's.
   *  A window resize re-wraps the bubble just the same, so it closes it too. */
  private watchScroll() {
    this.stopWatchingScroll()
    const targets: EventTarget[] = [window]
    let node: Node | null = this.host.parentNode
    while (node) {
      if (node.nodeType === Node.ELEMENT_NODE) targets.push(node)
      node = node instanceof ShadowRoot ? node.host : node.parentNode
    }
    targets.forEach((target) =>
      target.addEventListener('scroll', this.closeTooltip, { passive: true }),
    )
    window.addEventListener('resize', this.closeTooltip, { passive: true })
    this.scrollTargets = targets
  }

  private stopWatchingScroll() {
    this.scrollTargets.forEach((target) => target.removeEventListener('scroll', this.closeTooltip))
    this.scrollTargets = []
    window.removeEventListener('resize', this.closeTooltip)
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
