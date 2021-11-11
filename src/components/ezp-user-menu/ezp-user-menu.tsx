import { Component, Host, Prop, Event, Element, EventEmitter, Watch, h } from '@stencil/core'
import authStore from '../../services/auth'
import userStore from '../../services/user'
import { IconNameTypes, ThemeTypes, AppearanceTypes } from '../../shared/types'

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
      icon: 'account',
      href: 'https://app.ezeep.com',
    },
    {
      title: 'Help & Support',
      icon: 'help',
      href: 'https://support.ezeep.com',
    },
  ]
  private themes = ['pink', 'red', 'orange', 'green', 'cyan', 'blue', 'violet']
  private appearances = [
    { title: 'System', name: 'system' },
    { title: 'Light', name: 'light' },
    { title: 'Dark', name: 'dark' },
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

  private handleTheme = (theme) => {
    userStore.state.theme = theme as ThemeTypes
  }

  private handleAppearance = (appearance) => {
    userStore.state.appearance = appearance as AppearanceTypes
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
          <ezp-label ellipsis id="name" weight="strong" text={this.name} />
          <ezp-icon-button id="close" level="tertiary" icon="close" onClick={this.handleClose} />
        </div>
        <div id="links">
          {this.links.map((link) => (
            <a class="link" href={link.href} target="_blank" rel="noopener noreferrer">
              <ezp-icon class="link__icon" name={link.icon as IconNameTypes} />
              <ezp-label text={link.title} />
            </a>
          ))}
          <a class="link" onClick={this.logOut}>
            <ezp-icon class="link__icon" name="logout" />
            <ezp-label text="Logout" />
          </a>
        </div>
        <div id="theme">
          <ezp-label text="Color Theme:" weight="strong" />
          <div id="swatches">
            {this.themes.map((theme) => (
              <button
                class={`swatch swatch--${theme} ${
                  theme === userStore.state.theme ? 'selected' : ''
                }`}
                onClick={() => this.handleTheme(theme)}
              >
                <span class="dot" />
              </button>
            ))}
          </div>
        </div>
        <div id="appearance">
          <ezp-label text="Appearance:" weight="strong" />
          <div id="tabs">
            {this.appearances.map((appearance) => (
              <button
                class={`tab ${appearance.name === userStore.state.appearance ? 'selected' : ''}`}
                onClick={() => this.handleAppearance(appearance.name)}
              >
                <ezp-icon name={appearance.name as IconNameTypes} />
                <ezp-label text={appearance.title} level="tertiary" weight="strong" />
              </button>
            ))}
          </div>
        </div>
      </Host>
    )
  }
}
