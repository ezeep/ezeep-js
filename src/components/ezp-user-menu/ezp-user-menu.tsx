import { Component, Host, Prop, Event, EventEmitter, h } from '@stencil/core'
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
      href: '#',
    },
    {
      title: 'Help & Support',
      icon: 'question',
      href: '#',
    },
    {
      title: 'Logout',
      icon: 'off',
      href: '#',
    },
  ]

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
  ]

  @Prop() name: string = 'John Doe'
  @Prop({ mutable: true }) open: boolean = false

  /**
   *
   * Events
   *
   */

  @Event() userMenuClosure: EventEmitter

  /**
   *
   * Privatre methods
   *
   */

  private handleClose = () => {
    this.userMenuClosure.emit()
  }

  /**
   *
   * Render method
   *
   */

  render() {
    return (
      <Host class={this.open ? 'is-open' : ''}>
        <div id="container" data-select-container>
          <div id="header">
            <cap-label id="name" level="primary" weight="strong">
              {this.name}
            </cap-label>
            <ezp-icon-button
              id="close"
              level="quaternary"
              icon="cross"
              onClick={this.handleClose}
            />
          </div>
          <ezp-select
            id="organizations"
            label="Organization"
            placeholder="Select orgnaization"
            toggleFlow="vertical"
            options={this.organizations.map((organization) => ({
              id: organization.id,
              title: organization.name,
              meta: '',
            }))}
          />
          <div id="links">
            {this.links.map((link) => (
              <a class="link" href={link.href}>
                <ezp-icon class="link__icon" name={link.icon as IconNameTypes} />
                <cap-label>{link.title}</cap-label>
              </a>
            ))}
          </div>
        </div>
      </Host>
    )
  }
}
