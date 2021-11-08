/* tslint:disable */
/* auto-generated angular directive proxies */
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  NgZone,
} from '@angular/core'
import { ProxyCmp, proxyOutputs } from './angular-component-lib/utils'

import { Components } from '@ezeep/ezeep-js'

export declare interface EzpAuth extends Components.EzpAuth {}
@ProxyCmp({
  inputs: ['clientID', 'hidelogin', 'redirectURI'],
})
@Component({
  selector: 'ezp-auth',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  inputs: ['clientID', 'hidelogin', 'redirectURI'],
  outputs: ['authCancel', 'printShow'],
})
export class EzpAuth {
  /**  */
  authCancel!: EventEmitter<CustomEvent<MouseEvent>>
  /**  */
  printShow!: EventEmitter<CustomEvent<any>>
  protected el: HTMLElement
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach()
    this.el = r.nativeElement
    proxyOutputs(this, this.el, ['authCancel', 'printShow'])
  }
}

export declare interface EzpBackdrop extends Components.EzpBackdrop {}
@ProxyCmp({
  inputs: ['visible'],
})
@Component({
  selector: 'ezp-backdrop',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  inputs: ['visible'],
  outputs: ['backdropHideStart', 'backdropHideEnd'],
})
export class EzpBackdrop {
  /**  */
  backdropHideStart!: EventEmitter<CustomEvent<any>>
  /**  */
  backdropHideEnd!: EventEmitter<CustomEvent<any>>
  protected el: HTMLElement
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach()
    this.el = r.nativeElement
    proxyOutputs(this, this.el, ['backdropHideStart', 'backdropHideEnd'])
  }
}

export declare interface EzpIcon extends Components.EzpIcon {}
@ProxyCmp({
  inputs: ['name', 'size'],
})
@Component({
  selector: 'ezp-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  inputs: ['name', 'size'],
})
export class EzpIcon {
  protected el: HTMLElement
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach()
    this.el = r.nativeElement
  }
}

export declare interface EzpIconButton extends Components.EzpIconButton {}
@ProxyCmp({
  inputs: ['blank', 'disabled', 'href', 'icon', 'level', 'type'],
})
@Component({
  selector: 'ezp-icon-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  inputs: ['blank', 'disabled', 'href', 'icon', 'level', 'type'],
})
export class EzpIconButton {
  protected el: HTMLElement
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach()
    this.el = r.nativeElement
  }
}

export declare interface EzpLabel extends Components.EzpLabel {}
@ProxyCmp({
  inputs: ['ellipsis', 'level', 'noWrap', 'text', 'weight'],
})
@Component({
  selector: 'ezp-label',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  inputs: ['ellipsis', 'level', 'noWrap', 'text', 'weight'],
})
export class EzpLabel {
  protected el: HTMLElement
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach()
    this.el = r.nativeElement
  }
}

export declare interface EzpPrinterSelection extends Components.EzpPrinterSelection {}
@ProxyCmp({
  inputs: ['clientID', 'filename', 'filetype', 'fileurl', 'redirectURI'],
})
@Component({
  selector: 'ezp-printer-selection',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  inputs: ['clientID', 'filename', 'filetype', 'fileurl', 'redirectURI'],
  outputs: ['printCancel', 'printSubmit'],
})
export class EzpPrinterSelection {
  /** Description... */
  printCancel!: EventEmitter<CustomEvent<MouseEvent>>
  /** Description... */
  printSubmit!: EventEmitter<CustomEvent<MouseEvent>>
  protected el: HTMLElement
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach()
    this.el = r.nativeElement
    proxyOutputs(this, this.el, ['printCancel', 'printSubmit'])
  }
}

export declare interface EzpPrinting extends Components.EzpPrinting {}
@ProxyCmp({
  inputs: [
    'authapihosturl',
    'clientid',
    'custom',
    'filename',
    'filetype',
    'fileurl',
    'hidelogin',
    'printapihosturl',
    'redirecturi',
  ],
  methods: ['open'],
})
@Component({
  selector: 'ezp-printing',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  inputs: [
    'authapihosturl',
    'clientid',
    'custom',
    'filename',
    'filetype',
    'fileurl',
    'hidelogin',
    'printapihosturl',
    'redirecturi',
  ],
})
export class EzpPrinting {
  protected el: HTMLElement
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach()
    this.el = r.nativeElement
  }
}

export declare interface EzpProgress extends Components.EzpProgress {}
@ProxyCmp({
  inputs: ['status'],
})
@Component({
  selector: 'ezp-progress',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  inputs: ['status'],
})
export class EzpProgress {
  protected el: HTMLElement
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach()
    this.el = r.nativeElement
  }
}

export declare interface EzpSelect extends Components.EzpSelect {}
@ProxyCmp({
  inputs: ['icon', 'label', 'optionFlow', 'options', 'placeholder', 'preSelected', 'toggleFlow'],
})
@Component({
  selector: 'ezp-select',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  inputs: ['icon', 'label', 'optionFlow', 'options', 'placeholder', 'preSelected', 'toggleFlow'],
  outputs: ['selectToggle', 'selectSelection'],
})
export class EzpSelect {
  /** Events */
  selectToggle!: EventEmitter<CustomEvent<any>>
  /**  */
  selectSelection!: EventEmitter<CustomEvent<any>>
  protected el: HTMLElement
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach()
    this.el = r.nativeElement
    proxyOutputs(this, this.el, ['selectToggle', 'selectSelection'])
  }
}

export declare interface EzpStepper extends Components.EzpStepper {}
@ProxyCmp({
  inputs: ['label', 'max', 'min'],
})
@Component({
  selector: 'ezp-stepper',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  inputs: ['label', 'max', 'min'],
  outputs: ['stepperChanged'],
})
export class EzpStepper {
  /** Events */
  stepperChanged!: EventEmitter<CustomEvent<any>>
  protected el: HTMLElement
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach()
    this.el = r.nativeElement
    proxyOutputs(this, this.el, ['stepperChanged'])
  }
}

export declare interface EzpTextButton extends Components.EzpTextButton {}
@ProxyCmp({
  inputs: ['blank', 'disabled', 'href', 'label', 'level', 'type'],
})
@Component({
  selector: 'ezp-text-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  inputs: ['blank', 'disabled', 'href', 'label', 'level', 'type'],
})
export class EzpTextButton {
  protected el: HTMLElement
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach()
    this.el = r.nativeElement
  }
}

export declare interface EzpUserMenu extends Components.EzpUserMenu {}
@ProxyCmp({
  inputs: ['name', 'open'],
})
@Component({
  selector: 'ezp-user-menu',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  inputs: ['name', 'open'],
  outputs: ['userMenuClosure', 'logoutEmitter'],
})
export class EzpUserMenu {
  /** Events */
  userMenuClosure!: EventEmitter<CustomEvent<any>>
  /**  */
  logoutEmitter!: EventEmitter<CustomEvent<any>>
  protected el: HTMLElement
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach()
    this.el = r.nativeElement
    proxyOutputs(this, this.el, ['userMenuClosure', 'logoutEmitter'])
  }
}
