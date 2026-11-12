import { Component, Host, h, Prop, State, Event, EventEmitter, Listen } from '@stencil/core'
import { EzpAuthorizationService } from '../../services/auth'
import authStore from '../../services/auth'
import { subscribeToLanguageChange } from '../../utils/utils'
import i18next from 'i18next'
@Component({
  tag: 'ezp-auth',
  styleUrl: 'ezp-auth.scss',
  shadow: true,
})
export class EzpAuth {
  @Prop({ mutable: true }) clientID: string
  @Prop({ mutable: true }) redirectURI: string
  @Prop() hidelogin: boolean
  @Prop() trigger: string
  @Prop() code: string

  @State() auth: EzpAuthorizationService
  @State() authURI: string
  @State() accessToken: string
  /** True when the browser blocked the sign-in popup; shows the popup-blocked dialog. */
  @State() isPopupBlocked: boolean = false

  @Event() authCancel: EventEmitter<MouseEvent>
  @Event() authSuccess: EventEmitter<void>
  @Event() userCancel: EventEmitter<void>
  /**
   * Emitted when the browser blocks the sign-in popup (e.g. iOS Safari with
   * "Block Pop-ups" on). Host apps can listen to layer additional UI on top.
   */
  @Event({ bubbles: true, composed: true }) popupBlocked: EventEmitter<void>

  @Listen('dialogAction')
  listenDialogAction(event: CustomEvent<string>) {
    if (event.detail === 'popup-blocked') {
      this.handleRetry()
      return
    }
    this.openSignInWindow(this.auth.authURI.toString(), 'ezeep Login')
  }

  @Listen('dialogClose')
  listenDialogClose(event: CustomEvent<string>) {
    if (event.detail === 'popup-blocked') {
      // Dismissing the blocked-popup dialog cancels like the screen it replaced:
      // the sign-in status (hidelogin) or the login dialog.
      this.isPopupBlocked = false
      if (this.showsSignInStatus()) {
        this.listenStatusCancel()
        return
      }
    }
    this.authCancel.emit()
  }

  @Listen('statusCancel')
  listenStatusCancel() {
    // Cancelling sign-in from the file trigger aborts the whole flow and clears
    // the selected files (parity with the pre-redesign Cancel button). The button
    // trigger has no pending selection, so it just closes the auth dialog.
    if (this.trigger === 'file') {
      this.userCancel.emit()
    } else {
      this.authCancel.emit()
    }
  }

  oauthPopupWindow: Window | null = null
  previousUrl: string | null = null
  private unsubscribeLanguage?: () => void

  connectedCallback() {
    this.unsubscribeLanguage = subscribeToLanguageChange(this)
  }

  disconnectedCallback() {
    this.unsubscribeLanguage?.()
    // Don't leave the message listener behind when the component is removed.
    window.removeEventListener('message', this.receiveMessage)
  }

  openSignInWindow(url: string, name: string) {
    if (authStore.state.isAuthorized) {
      this.authCancel.emit()
      this.authSuccess.emit()
      return
    }

    // remove any existing event listeners
    window.removeEventListener('message', this.receiveMessage)

    // window features
    const windowFeatures = 'toolbar=no, menubar=no, width=600, height=7000, top=100, left=100'

    if (this.oauthPopupWindow === null || this.oauthPopupWindow.closed) {
      /* if the pointer to the window object in memory does not exist
      or if such pointer exists but the window was closed */

      this.oauthPopupWindow = window.open(url, name, windowFeatures)
      if (this.isWindowBlocked(this.oauthPopupWindow)) {
        this.handlePopupBlocked()
        return
      }
    } else if (this.previousUrl !== this.auth.authURI.toString()) {
      /* if the resource to load is different,
      then we load it in the already opened secondary window and then
      we bring such window back on top/in front of its parent window. */

      const previousPopup = this.oauthPopupWindow
      this.oauthPopupWindow = window.open(url, name, windowFeatures)
      if (this.isWindowBlocked(this.oauthPopupWindow)) {
        // The still-open popup carries the outdated auth URL (and PKCE
        // challenge), so finishing sign-in there could never succeed. Close it
        // so the user goes through the retry dialog with a fresh window.
        previousPopup?.close()
        this.handlePopupBlocked()
        return
      }

      this.oauthPopupWindow?.focus()
    } else {
      /* else the window reference must exist and the window
     is not closed; therefore, we can bring it back on top of any other
     window with the focus() method. There would be no need to re-create
     the window or to reload the referenced resource. */

      this.oauthPopupWindow.focus()
    }

    // add the listener for receiving a message from the popup (same bound
    // reference used by removeEventListener above, so it never stacks)
    window.addEventListener('message', this.receiveMessage, false)

    // Store the string form: it is compared against authURI.toString() above.
    this.previousUrl = this.auth.authURI.toString()
  }

  private showsSignInStatus(): boolean {
    return this.hidelogin && (this.trigger === 'button' || this.trigger === 'file')
  }

  /** A blocked window.open() returns null, or a window that is closed / has no `closed` flag. */
  private isWindowBlocked(popup: Window | null): boolean {
    return !popup || popup.closed || typeof popup.closed === 'undefined'
  }

  private handlePopupBlocked() {
    // Drop the dead reference so a retry goes through the fresh-open branch.
    this.oauthPopupWindow = null
    this.isPopupBlocked = true
    this.popupBlocked.emit()
  }

  /** "Try again" on the popup-blocked dialog: runs from a user gesture, so the popup may now open. */
  handleRetry() {
    this.isPopupBlocked = false
    this.openSignInWindow(this.auth.authURI.toString(), 'ezeep Login')
  }

  // Bound once (arrow property) so add/removeEventListener share the same
  // reference. An inline `(e) => this.receiveMessage(e)` never matches on
  // remove, so listeners stacked across retried sign-ins and the popup's single
  // code got exchanged once per accumulated listener.
  receiveMessage = (event: MessageEvent) => {
    // Defense in depth #1: the code must come from the popup we opened — not any
    // other window, frame or tab, even one served from the redirect origin.
    if (this.oauthPopupWindow && event.source && event.source !== this.oauthPopupWindow) {
      // eslint-disable-next-line no-console
      console.warn('[ezeep] Ignored auth message from an unexpected source window.')
      return
    }

    // Defense in depth #2: only accept the code from the expected redirect
    // origin — otherwise any page could postMessage a forged code into the
    // token exchange. Fail *open* if redirectURI can't be parsed so a config
    // quirk can never silently block sign-in; the source-window check above
    // still guards against forgery in that case. Warn on any rejection so a
    // real mismatch is debuggable.
    let expectedOrigin: string | null = null
    try {
      expectedOrigin = new URL(this.redirectURI).origin
    } catch {
      expectedOrigin = null
    }
    if (expectedOrigin && event.origin !== expectedOrigin) {
      // eslint-disable-next-line no-console
      console.warn(
        `[ezeep] Ignored auth message from unexpected origin "${event.origin}" (expected "${expectedOrigin}").`,
      )
      return
    }

    authStore.state.code = event.data
    this.exchangeCode()
  }

  /**
   * Exchange the code in the auth store for tokens and, only if that worked,
   * move on to the print step. A rejected code or an unreachable token
   * endpoint leaves the sign-in screen up so the user can try again — moving
   * on regardless opened the print options without a token, where every call
   * failed and the user was told they had no printers.
   */
  private async exchangeCode(): Promise<boolean> {
    let signedIn = false
    try {
      signedIn = (await this.auth.getAccessToken()) === true
    } catch {
      signedIn = false
    }
    if (!signedIn) {
      // eslint-disable-next-line no-console
      console.warn('[ezeep] Sign-in failed: the authorization code could not be exchanged.')
      return false
    }
    this.authCancel.emit()
    this.authSuccess.emit()
    return true
  }

  async componentWillLoad() {
    this.auth = new EzpAuthorizationService(this.redirectURI, this.clientID)

    if (this.code) {
      authStore.state.code = this.code
      await this.exchangeCode()
    }

    if (authStore.state.isAuthorized === false) {
      this.auth.generateCodeVerifier()
      await this.auth.generateCodeChallenge(authStore.state.codeVerifier)
      this.auth.buildAuthURI()
    }

    if (this.hidelogin && (this.trigger === 'button' || this.trigger === 'file')) {
      if (authStore.state.isAuthorized) {
        // Already signed in: no sign-in popup is needed, so skip straight to the
        // print options. Mirrors the authorized branch of openSignInWindow
        // (authURI isn't built when already authorized, so we can't call it here).
        this.authCancel.emit()
        this.authSuccess.emit()
      } else {
        // Not signed in: trigger sign-in directly so the "Continue to print
        // options" click leads to sign-in, without an extra confirmation button.
        this.openSignInWindow(this.auth.authURI.toString(), 'ezeep Login')
      }
    }
  }

  render() {
    return (
      <Host>
        {this.isPopupBlocked ? (
          <ezp-dialog
            heading={i18next.t('popup_blocked_dialog.heading')}
            description={i18next.t('popup_blocked_dialog.description')}
            action={i18next.t('popup_blocked_dialog.action')}
            iconName="exclamation-mark"
            instance="popup-blocked"
            key="popup-blocked"
          />
        ) : this.showsSignInStatus() ? (
          <ezp-status description={i18next.t('login_dialog.action')} processing cancel></ezp-status>
        ) : (
          <ezp-dialog
            heading={i18next.t('login_dialog.heading')}
            description={i18next.t('login_dialog.description')}
            action={i18next.t('login_dialog.action')}
            iconName="logo"
            iconSize="huge"
            iconFramed={false}
            instance="login"
            key="login"
          />
        )}
      </Host>
    )
  }
}
