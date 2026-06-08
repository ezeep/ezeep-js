/* tslint:disable */
/* auto-generated angular directive proxies */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, Output, NgZone } from '@angular/core';

import { ProxyCmp } from './angular-component-lib/utils';

import type { Components } from '@ezeep/ezeep-js/dist/components';

import { defineCustomElement as defineEzpAuth } from '@ezeep/ezeep-js/dist/components/ezp-auth.js';
import { defineCustomElement as defineEzpBackdrop } from '@ezeep/ezeep-js/dist/components/ezp-backdrop.js';
import { defineCustomElement as defineEzpDialog } from '@ezeep/ezeep-js/dist/components/ezp-dialog.js';
import { defineCustomElement as defineEzpIcon } from '@ezeep/ezeep-js/dist/components/ezp-icon.js';
import { defineCustomElement as defineEzpIconButton } from '@ezeep/ezeep-js/dist/components/ezp-icon-button.js';
import { defineCustomElement as defineEzpInput } from '@ezeep/ezeep-js/dist/components/ezp-input.js';
import { defineCustomElement as defineEzpLabel } from '@ezeep/ezeep-js/dist/components/ezp-label.js';
import { defineCustomElement as defineEzpPrinterSelection } from '@ezeep/ezeep-js/dist/components/ezp-printer-selection.js';
import { defineCustomElement as defineEzpPrinting } from '@ezeep/ezeep-js/dist/components/ezp-printing.js';
import { defineCustomElement as defineEzpSelect } from '@ezeep/ezeep-js/dist/components/ezp-select.js';
import { defineCustomElement as defineEzpStatus } from '@ezeep/ezeep-js/dist/components/ezp-status.js';
import { defineCustomElement as defineEzpStepper } from '@ezeep/ezeep-js/dist/components/ezp-stepper.js';
import { defineCustomElement as defineEzpTextButton } from '@ezeep/ezeep-js/dist/components/ezp-text-button.js';
import { defineCustomElement as defineEzpUpload } from '@ezeep/ezeep-js/dist/components/ezp-upload.js';
import { defineCustomElement as defineEzpUserMenu } from '@ezeep/ezeep-js/dist/components/ezp-user-menu.js';
@ProxyCmp({
  defineCustomElementFn: defineEzpAuth,
  inputs: ['clientID', 'code', 'hidelogin', 'redirectURI', 'trigger']
})
@Component({
  selector: 'ezp-auth',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['clientID', 'code', 'hidelogin', 'redirectURI', 'trigger'],
  outputs: ['authCancel', 'authSuccess', 'userCancel'],
})
export class EzpAuth {
  protected el: HTMLEzpAuthElement;
  @Output() authCancel = new EventEmitter<CustomEvent<MouseEvent>>();
  @Output() authSuccess = new EventEmitter<CustomEvent<any>>();
  @Output() userCancel = new EventEmitter<CustomEvent<any>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface EzpAuth extends Components.EzpAuth {

  authCancel: EventEmitter<CustomEvent<MouseEvent>>;

  authSuccess: EventEmitter<CustomEvent<any>>;

  userCancel: EventEmitter<CustomEvent<any>>;
}


@ProxyCmp({
  defineCustomElementFn: defineEzpBackdrop,
  inputs: ['visible']
})
@Component({
  selector: 'ezp-backdrop',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['visible'],
  outputs: ['backdropHideStart', 'backdropHideEnd'],
})
export class EzpBackdrop {
  protected el: HTMLEzpBackdropElement;
  @Output() backdropHideStart = new EventEmitter<CustomEvent<any>>();
  @Output() backdropHideEnd = new EventEmitter<CustomEvent<any>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface EzpBackdrop extends Components.EzpBackdrop {

  backdropHideStart: EventEmitter<CustomEvent<any>>;

  backdropHideEnd: EventEmitter<CustomEvent<any>>;
}


@ProxyCmp({
  defineCustomElementFn: defineEzpDialog,
  inputs: ['action', 'description', 'heading', 'iconFramed', 'iconName', 'iconSize', 'instance']
})
@Component({
  selector: 'ezp-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['action', 'description', 'heading', 'iconFramed', 'iconName', 'iconSize', 'instance'],
  outputs: ['dialogClose', 'dialogAction'],
})
export class EzpDialog {
  protected el: HTMLEzpDialogElement;
  @Output() dialogClose = new EventEmitter<CustomEvent<any>>();
  @Output() dialogAction = new EventEmitter<CustomEvent<any>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface EzpDialog extends Components.EzpDialog {
  /**
   * 
Events
   */
  dialogClose: EventEmitter<CustomEvent<any>>;

  dialogAction: EventEmitter<CustomEvent<any>>;
}


@ProxyCmp({
  defineCustomElementFn: defineEzpIcon,
  inputs: ['framed', 'name', 'size']
})
@Component({
  selector: 'ezp-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['framed', { name: 'name', required: true }, 'size'],
})
export class EzpIcon {
  protected el: HTMLEzpIconElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface EzpIcon extends Components.EzpIcon {}


@ProxyCmp({
  defineCustomElementFn: defineEzpIconButton,
  inputs: ['blank', 'disabled', 'href', 'icon', 'level', 'type']
})
@Component({
  selector: 'ezp-icon-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['blank', 'disabled', 'href', { name: 'icon', required: true }, 'level', 'type'],
})
export class EzpIconButton {
  protected el: HTMLEzpIconButtonElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface EzpIconButton extends Components.EzpIconButton {}


@ProxyCmp({
  defineCustomElementFn: defineEzpInput,
  inputs: ['eventType', 'icon', 'label', 'placeholder', 'suffix', 'type', 'value']
})
@Component({
  selector: 'ezp-input',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['eventType', 'icon', 'label', 'placeholder', 'suffix', 'type', 'value'],
  outputs: ['inputValueChanged'],
})
export class EzpInput {
  protected el: HTMLEzpInputElement;
  @Output() inputValueChanged = new EventEmitter<CustomEvent<any>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface EzpInput extends Components.EzpInput {
  /**
   * 
Events
   */
  inputValueChanged: EventEmitter<CustomEvent<any>>;
}


@ProxyCmp({
  defineCustomElementFn: defineEzpLabel,
  inputs: ['ellipsis', 'level', 'noWrap', 'text', 'weight']
})
@Component({
  selector: 'ezp-label',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['ellipsis', 'level', 'noWrap', 'text', 'weight'],
})
export class EzpLabel {
  protected el: HTMLEzpLabelElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface EzpLabel extends Components.EzpLabel {}


@ProxyCmp({
  defineCustomElementFn: defineEzpPrinterSelection,
  inputs: ['clientID', 'fileid', 'filename', 'files', 'filetype', 'fileurl', 'hideheader', 'hidemenu', 'redirectURI', 'seamless']
})
@Component({
  selector: 'ezp-printer-selection',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['clientID', 'fileid', 'filename', 'files', 'filetype', 'fileurl', 'hideheader', 'hidemenu', 'redirectURI', 'seamless'],
  outputs: ['printCancel', 'printSubmit', 'logout'],
})
export class EzpPrinterSelection {
  protected el: HTMLEzpPrinterSelectionElement;
  @Output() printCancel = new EventEmitter<CustomEvent<MouseEvent>>();
  @Output() printSubmit = new EventEmitter<CustomEvent<MouseEvent>>();
  @Output() logout = new EventEmitter<CustomEvent<MouseEvent>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface EzpPrinterSelection extends Components.EzpPrinterSelection {
  /**
   * Description...
   */
  printCancel: EventEmitter<CustomEvent<MouseEvent>>;
  /**
   * Description...
   */
  printSubmit: EventEmitter<CustomEvent<MouseEvent>>;

  logout: EventEmitter<CustomEvent<MouseEvent>>;
}


@ProxyCmp({
  defineCustomElementFn: defineEzpPrinting,
  inputs: ['appearance', 'authapihosturl', 'clientid', 'code', 'custom', 'filedata', 'fileid', 'filename', 'filetype', 'fileurl', 'hideheader', 'hidelogin', 'hidemenu', 'language', 'printapihosturl', 'redirecturi', 'seamless', 'theme', 'trigger'],
  methods: ['open', 'logOut', 'getSasUri', 'getAuthUri', 'setAuthRefreshToken', 'checkAuth']
})
@Component({
  selector: 'ezp-printing',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['appearance', 'authapihosturl', 'clientid', 'code', 'custom', 'filedata', 'fileid', 'filename', 'filetype', 'fileurl', 'hideheader', 'hidelogin', 'hidemenu', 'language', 'printapihosturl', 'redirecturi', 'seamless', 'theme', 'trigger'],
  outputs: ['printFinished'],
})
export class EzpPrinting {
  protected el: HTMLEzpPrintingElement;
  @Output() printFinished = new EventEmitter<CustomEvent<any>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface EzpPrinting extends Components.EzpPrinting {
  /**
   * Events
   */
  printFinished: EventEmitter<CustomEvent<any>>;
}


@ProxyCmp({
  defineCustomElementFn: defineEzpSelect,
  inputs: ['disabled', 'icon', 'label', 'optionFlow', 'options', 'placeholder', 'preSelected', 'toggleFlow']
})
@Component({
  selector: 'ezp-select',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['disabled', 'icon', 'label', 'optionFlow', 'options', 'placeholder', 'preSelected', 'toggleFlow'],
  outputs: ['selectToggle', 'selectSelection'],
})
export class EzpSelect {
  protected el: HTMLEzpSelectElement;
  @Output() selectToggle = new EventEmitter<CustomEvent<any>>();
  @Output() selectSelection = new EventEmitter<CustomEvent<any>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface EzpSelect extends Components.EzpSelect {
  /**
   * 
Events
   */
  selectToggle: EventEmitter<CustomEvent<any>>;

  selectSelection: EventEmitter<CustomEvent<any>>;
}


@ProxyCmp({
  defineCustomElementFn: defineEzpStatus,
  inputs: ['cancel', 'close', 'description', 'icon', 'instance', 'processing', 'retry']
})
@Component({
  selector: 'ezp-status',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['cancel', 'close', 'description', 'icon', 'instance', 'processing', 'retry'],
  outputs: ['statusCancel', 'statusClose', 'statusRetry'],
})
export class EzpStatus {
  protected el: HTMLEzpStatusElement;
  @Output() statusCancel = new EventEmitter<CustomEvent<any>>();
  @Output() statusClose = new EventEmitter<CustomEvent<any>>();
  @Output() statusRetry = new EventEmitter<CustomEvent<any>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface EzpStatus extends Components.EzpStatus {
  /**
   * 
Events
   */
  statusCancel: EventEmitter<CustomEvent<any>>;

  statusClose: EventEmitter<CustomEvent<any>>;

  statusRetry: EventEmitter<CustomEvent<any>>;
}


@ProxyCmp({
  defineCustomElementFn: defineEzpStepper,
  inputs: ['icon', 'label', 'max', 'min']
})
@Component({
  selector: 'ezp-stepper',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['icon', 'label', 'max', 'min'],
  outputs: ['stepperChanged'],
})
export class EzpStepper {
  protected el: HTMLEzpStepperElement;
  @Output() stepperChanged = new EventEmitter<CustomEvent<any>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface EzpStepper extends Components.EzpStepper {
  /**
   * 
Events
   */
  stepperChanged: EventEmitter<CustomEvent<any>>;
}


@ProxyCmp({
  defineCustomElementFn: defineEzpTextButton,
  inputs: ['blank', 'disabled', 'href', 'label', 'level', 'small', 'type']
})
@Component({
  selector: 'ezp-text-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['blank', 'disabled', 'href', 'label', 'level', 'small', 'type'],
})
export class EzpTextButton {
  protected el: HTMLEzpTextButtonElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface EzpTextButton extends Components.EzpTextButton {}


@ProxyCmp({
  defineCustomElementFn: defineEzpUpload
})
@Component({
  selector: 'ezp-upload',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: [],
  outputs: ['uploadFile'],
})
export class EzpUpload {
  protected el: HTMLEzpUploadElement;
  @Output() uploadFile = new EventEmitter<CustomEvent<any>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface EzpUpload extends Components.EzpUpload {
  /**
   * 
Events
   */
  uploadFile: EventEmitter<CustomEvent<any>>;
}


@ProxyCmp({
  defineCustomElementFn: defineEzpUserMenu,
  inputs: ['name', 'open']
})
@Component({
  selector: 'ezp-user-menu',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['name', 'open'],
  outputs: ['userMenuClosure', 'logoutEmitter'],
})
export class EzpUserMenu {
  protected el: HTMLEzpUserMenuElement;
  @Output() userMenuClosure = new EventEmitter<CustomEvent<any>>();
  @Output() logoutEmitter = new EventEmitter<CustomEvent<any>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface EzpUserMenu extends Components.EzpUserMenu {
  /**
   * 
Events
   */
  userMenuClosure: EventEmitter<CustomEvent<any>>;

  logoutEmitter: EventEmitter<CustomEvent<any>>;
}


