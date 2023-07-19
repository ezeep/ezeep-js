/* eslint-disable */
/* tslint:disable */
/**
 * This is an autogenerated file created by the Stencil compiler.
 * It contains typing information for all components that exist in this project.
 */
import { HTMLStencilElement, JSXBase } from "@stencil/core/internal";
import { AppearanceTypes, IconButtonLevelTypes, IconButtonTypeTypes, IconNameTypes, IconSizeTypes, LabelLevelTypes, SelectFlowTypes, SelectOptionType, TextButtonLevelTypes, TextButtonTypeTypes, ThemeTypes, TriggerTypes, WeightTypes } from "./shared/types";
export namespace Components {
    interface EzpAuth {
        "clientID": string;
        "code": string;
        "hidelogin": boolean;
        "redirectURI": string;
        "trigger": string;
    }
    interface EzpBackdrop {
        "visible": boolean;
    }
    interface EzpDialog {
        "action": string;
        "description": string;
        /**
          * Properties
         */
        "heading": string;
        "iconFramed": boolean;
        "iconName"?: IconNameTypes;
        "iconSize": IconSizeTypes;
        "instance": string;
    }
    interface EzpIcon {
        /**
          * Description...
         */
        "framed": boolean;
        /**
          * Description...
         */
        "name": IconNameTypes;
        /**
          * Description...
         */
        "size": IconSizeTypes;
    }
    interface EzpIconButton {
        /**
          * Description...
         */
        "blank": boolean;
        /**
          * Description...
         */
        "disabled": boolean;
        /**
          * Description...
         */
        "href": string;
        /**
          * Description...
         */
        "icon": IconNameTypes;
        /**
          * Description...
         */
        "level": IconButtonLevelTypes;
        /**
          * Description...
         */
        "type": IconButtonTypeTypes;
    }
    interface EzpInput {
        /**
          * Description...
         */
        "eventType": string;
        /**
          * Description...
         */
        "icon": IconNameTypes;
        /**
          * Description...
         */
        "label": string;
        /**
          * Description...
         */
        "suffix": string;
        /**
          * Description...
         */
        "type": string;
        /**
          * Description...
         */
        "value": number | string;
    }
    interface EzpLabel {
        /**
          * Description...
         */
        "ellipsis": boolean;
        /**
          * Description...
         */
        "level": LabelLevelTypes;
        /**
          * Description...
         */
        "noWrap": boolean;
        /**
          * Description...
         */
        "text": string;
        /**
          * Description...
         */
        "weight": WeightTypes;
    }
    interface EzpPrinterSelection {
        /**
          * Properties
         */
        "clientID": string;
        "file": File;
        "fileid": string;
        "filename": string;
        "filetype": string;
        "fileurl": string;
        "hideheader": boolean;
        "hidemenu": boolean;
        "redirectURI": string;
        "seamless": boolean;
    }
    interface EzpPrinting {
        "appearance": AppearanceTypes;
        "authapihosturl": string;
        "checkAuth": () => Promise<boolean>;
        "clientid": string;
        "code": string;
        "custom": boolean;
        "filedata": string;
        "fileid": string;
        "filename": string;
        "filetype": string;
        "fileurl": string;
        "getAuthUri": () => Promise<string>;
        "getSasUri": () => Promise<string>;
        "hideheader": boolean;
        "hidelogin": boolean;
        "hidemenu": boolean;
        "language": string;
        "logOut": () => Promise<void>;
        /**
          * Public methods
         */
        "open": () => Promise<void>;
        "printapihosturl": string;
        "redirecturi": string;
        "seamless": boolean;
        "theme": ThemeTypes;
        "trigger": TriggerTypes;
    }
    interface EzpSelect {
        /**
          * Description...
         */
        "disabled": boolean;
        /**
          * Description...
         */
        "icon": IconNameTypes;
        /**
          * Description...
         */
        "label": string;
        /**
          * Description...
         */
        "optionFlow": SelectFlowTypes;
        /**
          * Description...
         */
        "options": SelectOptionType[];
        /**
          * Description...
         */
        "placeholder": string;
        /**
          * Description...
         */
        "preSelected": any;
        /**
          * Description...
         */
        "toggleFlow": SelectFlowTypes;
    }
    interface EzpStatus {
        "cancel"?: string | boolean;
        "close"?: string | boolean;
        /**
          * Properties
         */
        "description": string;
        "icon"?: IconNameTypes;
        "instance": string;
        "processing": boolean;
        "retry"?: string | boolean;
    }
    interface EzpStepper {
        /**
          * Description...
         */
        "icon": IconNameTypes;
        /**
          * Description...
         */
        "label": string;
        /**
          * Description...
         */
        "max": number;
        /**
          * Description...
         */
        "min": number;
    }
    interface EzpTextButton {
        /**
          * Description...
         */
        "blank": boolean;
        /**
          * Description...
         */
        "disabled": boolean;
        /**
          * Description...
         */
        "href": string;
        /**
          * Description...
         */
        "label": string;
        /**
          * Description...
         */
        "level": TextButtonLevelTypes;
        /**
          * Description...
         */
        "small": boolean;
        /**
          * Description...
         */
        "type": TextButtonTypeTypes;
    }
    interface EzpUpload {
    }
    interface EzpUserMenu {
        "name": string;
        "open": boolean;
    }
}
declare global {
    interface HTMLEzpAuthElement extends Components.EzpAuth, HTMLStencilElement {
    }
    var HTMLEzpAuthElement: {
        prototype: HTMLEzpAuthElement;
        new (): HTMLEzpAuthElement;
    };
    interface HTMLEzpBackdropElement extends Components.EzpBackdrop, HTMLStencilElement {
    }
    var HTMLEzpBackdropElement: {
        prototype: HTMLEzpBackdropElement;
        new (): HTMLEzpBackdropElement;
    };
    interface HTMLEzpDialogElement extends Components.EzpDialog, HTMLStencilElement {
    }
    var HTMLEzpDialogElement: {
        prototype: HTMLEzpDialogElement;
        new (): HTMLEzpDialogElement;
    };
    interface HTMLEzpIconElement extends Components.EzpIcon, HTMLStencilElement {
    }
    var HTMLEzpIconElement: {
        prototype: HTMLEzpIconElement;
        new (): HTMLEzpIconElement;
    };
    interface HTMLEzpIconButtonElement extends Components.EzpIconButton, HTMLStencilElement {
    }
    var HTMLEzpIconButtonElement: {
        prototype: HTMLEzpIconButtonElement;
        new (): HTMLEzpIconButtonElement;
    };
    interface HTMLEzpInputElement extends Components.EzpInput, HTMLStencilElement {
    }
    var HTMLEzpInputElement: {
        prototype: HTMLEzpInputElement;
        new (): HTMLEzpInputElement;
    };
    interface HTMLEzpLabelElement extends Components.EzpLabel, HTMLStencilElement {
    }
    var HTMLEzpLabelElement: {
        prototype: HTMLEzpLabelElement;
        new (): HTMLEzpLabelElement;
    };
    interface HTMLEzpPrinterSelectionElement extends Components.EzpPrinterSelection, HTMLStencilElement {
    }
    var HTMLEzpPrinterSelectionElement: {
        prototype: HTMLEzpPrinterSelectionElement;
        new (): HTMLEzpPrinterSelectionElement;
    };
    interface HTMLEzpPrintingElement extends Components.EzpPrinting, HTMLStencilElement {
    }
    var HTMLEzpPrintingElement: {
        prototype: HTMLEzpPrintingElement;
        new (): HTMLEzpPrintingElement;
    };
    interface HTMLEzpSelectElement extends Components.EzpSelect, HTMLStencilElement {
    }
    var HTMLEzpSelectElement: {
        prototype: HTMLEzpSelectElement;
        new (): HTMLEzpSelectElement;
    };
    interface HTMLEzpStatusElement extends Components.EzpStatus, HTMLStencilElement {
    }
    var HTMLEzpStatusElement: {
        prototype: HTMLEzpStatusElement;
        new (): HTMLEzpStatusElement;
    };
    interface HTMLEzpStepperElement extends Components.EzpStepper, HTMLStencilElement {
    }
    var HTMLEzpStepperElement: {
        prototype: HTMLEzpStepperElement;
        new (): HTMLEzpStepperElement;
    };
    interface HTMLEzpTextButtonElement extends Components.EzpTextButton, HTMLStencilElement {
    }
    var HTMLEzpTextButtonElement: {
        prototype: HTMLEzpTextButtonElement;
        new (): HTMLEzpTextButtonElement;
    };
    interface HTMLEzpUploadElement extends Components.EzpUpload, HTMLStencilElement {
    }
    var HTMLEzpUploadElement: {
        prototype: HTMLEzpUploadElement;
        new (): HTMLEzpUploadElement;
    };
    interface HTMLEzpUserMenuElement extends Components.EzpUserMenu, HTMLStencilElement {
    }
    var HTMLEzpUserMenuElement: {
        prototype: HTMLEzpUserMenuElement;
        new (): HTMLEzpUserMenuElement;
    };
    interface HTMLElementTagNameMap {
        "ezp-auth": HTMLEzpAuthElement;
        "ezp-backdrop": HTMLEzpBackdropElement;
        "ezp-dialog": HTMLEzpDialogElement;
        "ezp-icon": HTMLEzpIconElement;
        "ezp-icon-button": HTMLEzpIconButtonElement;
        "ezp-input": HTMLEzpInputElement;
        "ezp-label": HTMLEzpLabelElement;
        "ezp-printer-selection": HTMLEzpPrinterSelectionElement;
        "ezp-printing": HTMLEzpPrintingElement;
        "ezp-select": HTMLEzpSelectElement;
        "ezp-status": HTMLEzpStatusElement;
        "ezp-stepper": HTMLEzpStepperElement;
        "ezp-text-button": HTMLEzpTextButtonElement;
        "ezp-upload": HTMLEzpUploadElement;
        "ezp-user-menu": HTMLEzpUserMenuElement;
    }
}
declare namespace LocalJSX {
    interface EzpAuth {
        "clientID"?: string;
        "code"?: string;
        "hidelogin"?: boolean;
        "onAuthCancel"?: (event: CustomEvent<MouseEvent>) => void;
        "onAuthSuccess"?: (event: CustomEvent<any>) => void;
        "redirectURI"?: string;
        "trigger"?: string;
    }
    interface EzpBackdrop {
        "onBackdropHideEnd"?: (event: CustomEvent<any>) => void;
        "onBackdropHideStart"?: (event: CustomEvent<any>) => void;
        "visible"?: boolean;
    }
    interface EzpDialog {
        "action"?: string;
        "description"?: string;
        /**
          * Properties
         */
        "heading"?: string;
        "iconFramed"?: boolean;
        "iconName"?: IconNameTypes;
        "iconSize"?: IconSizeTypes;
        "instance"?: string;
        "onDialogAction"?: (event: CustomEvent<any>) => void;
        /**
          * Events
         */
        "onDialogClose"?: (event: CustomEvent<any>) => void;
    }
    interface EzpIcon {
        /**
          * Description...
         */
        "framed"?: boolean;
        /**
          * Description...
         */
        "name": IconNameTypes;
        /**
          * Description...
         */
        "size"?: IconSizeTypes;
    }
    interface EzpIconButton {
        /**
          * Description...
         */
        "blank"?: boolean;
        /**
          * Description...
         */
        "disabled"?: boolean;
        /**
          * Description...
         */
        "href"?: string;
        /**
          * Description...
         */
        "icon": IconNameTypes;
        /**
          * Description...
         */
        "level"?: IconButtonLevelTypes;
        /**
          * Description...
         */
        "type"?: IconButtonTypeTypes;
    }
    interface EzpInput {
        /**
          * Description...
         */
        "eventType"?: string;
        /**
          * Description...
         */
        "icon"?: IconNameTypes;
        /**
          * Description...
         */
        "label"?: string;
        /**
          * Events
         */
        "onInputValueChanged"?: (event: CustomEvent<any>) => void;
        /**
          * Description...
         */
        "suffix"?: string;
        /**
          * Description...
         */
        "type"?: string;
        /**
          * Description...
         */
        "value"?: number | string;
    }
    interface EzpLabel {
        /**
          * Description...
         */
        "ellipsis"?: boolean;
        /**
          * Description...
         */
        "level"?: LabelLevelTypes;
        /**
          * Description...
         */
        "noWrap"?: boolean;
        /**
          * Description...
         */
        "text"?: string;
        /**
          * Description...
         */
        "weight"?: WeightTypes;
    }
    interface EzpPrinterSelection {
        /**
          * Properties
         */
        "clientID"?: string;
        "file"?: File;
        "fileid"?: string;
        "filename"?: string;
        "filetype"?: string;
        "fileurl"?: string;
        "hideheader"?: boolean;
        "hidemenu"?: boolean;
        "onLogout"?: (event: CustomEvent<MouseEvent>) => void;
        /**
          * Description...
         */
        "onPrintCancel"?: (event: CustomEvent<MouseEvent>) => void;
        /**
          * Description...
         */
        "onPrintSubmit"?: (event: CustomEvent<MouseEvent>) => void;
        "redirectURI"?: string;
        "seamless"?: boolean;
    }
    interface EzpPrinting {
        "appearance"?: AppearanceTypes;
        "authapihosturl"?: string;
        "clientid"?: string;
        "code"?: string;
        "custom"?: boolean;
        "filedata"?: string;
        "fileid"?: string;
        "filename"?: string;
        "filetype"?: string;
        "fileurl"?: string;
        "hideheader"?: boolean;
        "hidelogin"?: boolean;
        "hidemenu"?: boolean;
        "language"?: string;
        /**
          * Events
         */
        "onPrintFinished"?: (event: CustomEvent<any>) => void;
        "printapihosturl"?: string;
        "redirecturi"?: string;
        "seamless"?: boolean;
        "theme"?: ThemeTypes;
        "trigger"?: TriggerTypes;
    }
    interface EzpSelect {
        /**
          * Description...
         */
        "disabled"?: boolean;
        /**
          * Description...
         */
        "icon"?: IconNameTypes;
        /**
          * Description...
         */
        "label"?: string;
        "onSelectSelection"?: (event: CustomEvent<any>) => void;
        /**
          * Events
         */
        "onSelectToggle"?: (event: CustomEvent<any>) => void;
        /**
          * Description...
         */
        "optionFlow"?: SelectFlowTypes;
        /**
          * Description...
         */
        "options"?: SelectOptionType[];
        /**
          * Description...
         */
        "placeholder"?: string;
        /**
          * Description...
         */
        "preSelected"?: any;
        /**
          * Description...
         */
        "toggleFlow"?: SelectFlowTypes;
    }
    interface EzpStatus {
        "cancel"?: string | boolean;
        "close"?: string | boolean;
        /**
          * Properties
         */
        "description"?: string;
        "icon"?: IconNameTypes;
        "instance"?: string;
        /**
          * Events
         */
        "onStatusCancel"?: (event: CustomEvent<any>) => void;
        "onStatusClose"?: (event: CustomEvent<any>) => void;
        "onStatusRetry"?: (event: CustomEvent<any>) => void;
        "processing"?: boolean;
        "retry"?: string | boolean;
    }
    interface EzpStepper {
        /**
          * Description...
         */
        "icon"?: IconNameTypes;
        /**
          * Description...
         */
        "label"?: string;
        /**
          * Description...
         */
        "max"?: number;
        /**
          * Description...
         */
        "min"?: number;
        /**
          * Events
         */
        "onStepperChanged"?: (event: CustomEvent<any>) => void;
    }
    interface EzpTextButton {
        /**
          * Description...
         */
        "blank"?: boolean;
        /**
          * Description...
         */
        "disabled"?: boolean;
        /**
          * Description...
         */
        "href"?: string;
        /**
          * Description...
         */
        "label"?: string;
        /**
          * Description...
         */
        "level"?: TextButtonLevelTypes;
        /**
          * Description...
         */
        "small"?: boolean;
        /**
          * Description...
         */
        "type"?: TextButtonTypeTypes;
    }
    interface EzpUpload {
        /**
          * Events
         */
        "onUploadFile"?: (event: CustomEvent<any>) => void;
    }
    interface EzpUserMenu {
        "name"?: string;
        "onLogoutEmitter"?: (event: CustomEvent<any>) => void;
        /**
          * Events
         */
        "onUserMenuClosure"?: (event: CustomEvent<any>) => void;
        "open"?: boolean;
    }
    interface IntrinsicElements {
        "ezp-auth": EzpAuth;
        "ezp-backdrop": EzpBackdrop;
        "ezp-dialog": EzpDialog;
        "ezp-icon": EzpIcon;
        "ezp-icon-button": EzpIconButton;
        "ezp-input": EzpInput;
        "ezp-label": EzpLabel;
        "ezp-printer-selection": EzpPrinterSelection;
        "ezp-printing": EzpPrinting;
        "ezp-select": EzpSelect;
        "ezp-status": EzpStatus;
        "ezp-stepper": EzpStepper;
        "ezp-text-button": EzpTextButton;
        "ezp-upload": EzpUpload;
        "ezp-user-menu": EzpUserMenu;
    }
}
export { LocalJSX as JSX };
declare module "@stencil/core" {
    export namespace JSX {
        interface IntrinsicElements {
            "ezp-auth": LocalJSX.EzpAuth & JSXBase.HTMLAttributes<HTMLEzpAuthElement>;
            "ezp-backdrop": LocalJSX.EzpBackdrop & JSXBase.HTMLAttributes<HTMLEzpBackdropElement>;
            "ezp-dialog": LocalJSX.EzpDialog & JSXBase.HTMLAttributes<HTMLEzpDialogElement>;
            "ezp-icon": LocalJSX.EzpIcon & JSXBase.HTMLAttributes<HTMLEzpIconElement>;
            "ezp-icon-button": LocalJSX.EzpIconButton & JSXBase.HTMLAttributes<HTMLEzpIconButtonElement>;
            "ezp-input": LocalJSX.EzpInput & JSXBase.HTMLAttributes<HTMLEzpInputElement>;
            "ezp-label": LocalJSX.EzpLabel & JSXBase.HTMLAttributes<HTMLEzpLabelElement>;
            "ezp-printer-selection": LocalJSX.EzpPrinterSelection & JSXBase.HTMLAttributes<HTMLEzpPrinterSelectionElement>;
            "ezp-printing": LocalJSX.EzpPrinting & JSXBase.HTMLAttributes<HTMLEzpPrintingElement>;
            "ezp-select": LocalJSX.EzpSelect & JSXBase.HTMLAttributes<HTMLEzpSelectElement>;
            "ezp-status": LocalJSX.EzpStatus & JSXBase.HTMLAttributes<HTMLEzpStatusElement>;
            "ezp-stepper": LocalJSX.EzpStepper & JSXBase.HTMLAttributes<HTMLEzpStepperElement>;
            "ezp-text-button": LocalJSX.EzpTextButton & JSXBase.HTMLAttributes<HTMLEzpTextButtonElement>;
            "ezp-upload": LocalJSX.EzpUpload & JSXBase.HTMLAttributes<HTMLEzpUploadElement>;
            "ezp-user-menu": LocalJSX.EzpUserMenu & JSXBase.HTMLAttributes<HTMLEzpUserMenuElement>;
        }
    }
}
