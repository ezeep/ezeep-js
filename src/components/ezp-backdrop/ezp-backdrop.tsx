import { Component, Element, Host, Prop, Listen, Event, EventEmitter, h } from '@stencil/core'

@Component({
  tag: 'ezp-backdrop',
  styleUrl: 'ezp-backdrop.scss',
  shadow: true,
})
export class EzpBackdrop {
  @Element() component!: HTMLEzpBackdropElement
  @Prop({ mutable: true }) visible: boolean = true
  @Event() backdropHideStart: EventEmitter
  @Event() backdropHideEnd: EventEmitter

  private handleClick() {
    this.visible = false
    this.backdropHideStart.emit()
  }

  @Listen('animationend')
  listenAnimationEnd() {
    if (!this.visible) {
      this.backdropHideEnd.emit()
    }
  }

  render() {
    return <Host class={{ hide: !this.visible }} onClick={() => this.handleClick()} />
  }
}
