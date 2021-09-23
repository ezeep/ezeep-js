import { Component, Host, Prop, Event, Element, EventEmitter, Watch, h } from '@stencil/core'
import authStore from '../../services/auth'
import { IconNameTypes } from '../../shared/types'

@Component({
  tag: 'ezp-user-menu',
  styleUrl: 'ezp-user-menu.scss',
  shadow: true,
})
export class EzpUserMenu {
  @Element() component!: HTMLEzpUserMenuElement

  private container: HTMLDivElement
  private backdrop: HTMLEzpBackdropElement = document.createElement('ezp-backdrop')
  private links = [
    {
      title: 'Manage Account',
      icon: 'user',
      href: 'https://app.ezeep.com',
    },
    {
      title: 'Help & Support',
      icon: 'question',
      href: 'https://support.ezeep.com',
    },
    /* {
      title: 'Logout',
      icon: 'off',
      href: '#',
    }, */
  ]
  /* 
  private organizations = [
    {
      id: 1,
      name: 'Organization 1',
    },
    {
      id: 2,
      name: 'Organization 2',
    },
    {
      id: 3,
      name: 'Organization 3',
    },
  ] */

  @Prop() name: string = 'John Doe'
  @Prop({ mutable: true }) open: boolean = false

  /**
   *
   * Events
   *
   */

  @Event() userMenuClosure: EventEmitter
  @Event() logoutEmitter: EventEmitter
  /**
   *
   * Privatre methods
   *
   */

  /**
   *
   * Watchers
   *
   */

  @Watch('open')
  watchOpen() {
    if (this.open) {
      this.backdrop.visible = true
      this.container.appendChild(this.backdrop)
    } else {
      this.backdrop.visible = false
      this.userMenuClosure.emit()
    }
  }

  private handleClose = () => {
    this.userMenuClosure.emit()
  }

  private logOut = () => {
    localStorage.clear()
    authStore.state.isAuthorized = false
    this.logoutEmitter.emit()
  }

  /**
   *
   * Render method
   *
   */

  componentWillLoad() {
    this.container = this.component.closest('[data-backdrop-surface]')

    this.backdrop.addEventListener('backdropHideStart', () => {
      this.open = false
    })

    this.backdrop.addEventListener('backdropHideEnd', () => {
      this.container.removeChild(this.backdrop)
    })
  }

  /**
   *
   * Render method
   *
   */

  render() {
    return (
      <Host class={this.open ? 'is-open' : ''}>
        <div id="header">
          <cap-label id="name" level="primary" weight="strong">
            {this.name}
          </cap-label>
          <ezp-icon-button id="close" level="quaternary" icon="cross" onClick={this.handleClose} />
        </div>
        <div id="links">
          {this.links.map((link) => (
            <a class="link" href={link.href} target="_blank" rel="noopener noreferrer">
              <ezp-icon class="link__icon" name={link.icon as IconNameTypes} />
              <cap-label>{link.title}</cap-label>
            </a>
          ))}
          <a class="logout" onClick={this.logOut}>
            <ezp-icon class="link__icon" name="off"></ezp-icon>
            <cap-label>Logout</cap-label>
          </a>
        </div>
      </Host>
    )
  }
}
