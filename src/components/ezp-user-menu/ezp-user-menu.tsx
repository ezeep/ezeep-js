import { Component, Host, Prop, Event, Element, EventEmitter, Watch, h } from '@stencil/core'
import authStore from '../../services/auth'
import userStore from '../../services/user'
import { IconNameTypes, ThemeTypes, AppearanceTypes } from '../../shared/types'
import { initi18n } from '../../utils/utils'
import i18next from 'i18next'

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
      title: i18next.t('user_menu.account'),
      icon: 'account',
      href: 'https://app.ezeep.com',
    },
    {
      title: i18next.t('user_menu.help'),
      icon: 'help',
      href: 'https://support.ezeep.com',
    },
  ]
  private themes = ['pink', 'red', 'orange', 'green', 'cyan', 'blue', 'violet']
  private appearances = [
    { title: i18next.t('user_menu.system'), name: 'system' },
    { title: i18next.t('user_menu.light'), name: 'light' },
    { title: i18next.t('user_menu.dark'), name: 'dark' },
  ]

  @Prop() name: string = 'John Doe'
  @Prop({ mutable: true }) open: boolean = false
  @Prop() hidelogout: boolean

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

  private handleTheme = (theme: ThemeTypes) => {
    userStore.state.theme = theme
  }

  private handleAppearance = (appearance: AppearanceTypes) => {
    userStore.state.appearance = appearance
  }

  /**
   *
   * Render method
   *
   */

  componentWillLoad() {
    initi18n()

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
          <ezp-label ellipsis id="name" weight="heavy" text={this.name} />
          <ezp-icon-button id="close" level="tertiary" icon="close" onClick={this.handleClose} />
        </div>
        <div id="links">
          {this.links.map((link) => (
            <a class="link" href={link.href} target="_blank" rel="noopener noreferrer">
              <ezp-icon class="link__icon" name={link.icon as IconNameTypes} />
              <ezp-label text={link.title} />
            </a>
          ))}
          {!this.hidelogout && (
            <a class="link" onClick={this.logOut}>
              <ezp-icon class="link__icon" name="logout" />
              <ezp-label text={i18next.t('user_menu.logout')} />
            </a>
          )}
        </div>
        <div id="theme">
          <ezp-label class="caption" text={`${i18next.t('user_menu.theme')}:`} weight="heavy" />
          <div id="swatches">
            {this.themes.map((theme) => (
              <button
                class={`swatch swatch--${theme} ${
                  theme === userStore.state.theme ? 'selected' : ''
                }`}
                onClick={() => this.handleTheme(theme as ThemeTypes)}
              >
                <span class="dot" />
              </button>
            ))}
          </div>
        </div>
        <div id="appearance">
          <ezp-label
            class="caption"
            text={`${i18next.t('user_menu.appearance')}:`}
            weight="heavy"
          />
          <div id="tabs">
            {this.appearances.map((appearance) => (
              <button
                class={`tab ${appearance.name === userStore.state.appearance ? 'selected' : ''}`}
                onClick={() => this.handleAppearance(appearance.name as AppearanceTypes)}
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
