import { Component, Host, Prop, Event, EventEmitter, h } from '@stencil/core'
import authStore from '../../services/auth'
import { IconNameTypes } from '../../shared/types'

@Component({
  tag: 'ezp-user-menu',
  styleUrl: 'ezp-user-menu.scss',
  shadow: true,
})
export class EzpUserMenu {
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
