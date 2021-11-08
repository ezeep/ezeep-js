/* eslint-disable */
/* tslint:disable */
/**
 * This is an autogenerated file created by the Stencil compiler.
 * It contains typing information for all components that exist in this project.
 */
import { HTMLStencilElement, JSXBase } from "@stencil/core/internal";
import { IconButtonLevelTypes, IconButtonTypeTypes, IconNameTypes, IconSizeTypes, LabelLevelTypes, SelectFlowTypes, SelectOptionType, TextButtonLevelTypes, TextButtonTypeTypes, WeightTypes } from "./shared/types";
export namespace Components {
    interface EzpAuth {
        "clientID": string;
        "hidelogin": boolean;
        "redirectURI": string;
    }
    interface EzpBackdrop {
        "visible": boolean;
    }
    interface EzpIcon {
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
        "filename": string;
        "filetype": string;
        "fileurl": string;
        "redirectURI": string;
    }
    interface EzpPrinting {
        "authapihosturl": string;
        "clientid": string;
        "custom": boolean;
        "filename": string;
        "filetype": string;
        "fileurl": string;
        "hidelogin": boolean;
        /**
          * Public methods
         */
        "open": () => Promise<void>;
        "printapihosturl": string;
        "redirecturi": string;
    }
    interface EzpProgress {
        /**
          * Status...
         */
        "status": string;
    }
    interface EzpSelect {
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
    interface EzpStepper {
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
        "type": TextButtonTypeTypes;
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
    interface HTMLEzpProgressElement extends Components.EzpProgress, HTMLStencilElement {
    }
    var HTMLEzpProgressElement: {
        prototype: HTMLEzpProgressElement;
        new (): HTMLEzpProgressElement;
    };
    interface HTMLEzpSelectElement extends Components.EzpSelect, HTMLStencilElement {
    }
    var HTMLEzpSelectElement: {
        prototype: HTMLEzpSelectElement;
        new (): HTMLEzpSelectElement;
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
    interface HTMLEzpUserMenuElement extends Components.EzpUserMenu, HTMLStencilElement {
    }
    var HTMLEzpUserMenuElement: {
        prototype: HTMLEzpUserMenuElement;
        new (): HTMLEzpUserMenuElement;
    };
    interface HTMLElementTagNameMap {
        "ezp-auth": HTMLEzpAuthElement;
        "ezp-backdrop": HTMLEzpBackdropElement;
        "ezp-icon": HTMLEzpIconElement;
        "ezp-icon-button": HTMLEzpIconButtonElement;
        "ezp-label": HTMLEzpLabelElement;
        "ezp-printer-selection": HTMLEzpPrinterSelectionElement;
        "ezp-printing": HTMLEzpPrintingElement;
        "ezp-progress": HTMLEzpProgressElement;
        "ezp-select": HTMLEzpSelectElement;
        "ezp-stepper": HTMLEzpStepperElement;
        "ezp-text-button": HTMLEzpTextButtonElement;
        "ezp-user-menu": HTMLEzpUserMenuElement;
    }
}
declare namespace LocalJSX {
    interface EzpAuth {
        "clientID"?: string;
        "hidelogin"?: boolean;
        "onAuthCancel"?: (event: CustomEvent<MouseEvent>) => void;
        "onPrintShow"?: (event: CustomEvent<any>) => void;
        "redirectURI"?: string;
    }
    interface EzpBackdrop {
        "onBackdropHideEnd"?: (event: CustomEvent<any>) => void;
        "onBackdropHideStart"?: (event: CustomEvent<any>) => void;
        "visible"?: boolean;
    }
    interface EzpIcon {
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
        "filename"?: string;
        "filetype"?: string;
        "fileurl"?: string;
        /**
          * Description...
         */
        "onPrintCancel"?: (event: CustomEvent<MouseEvent>) => void;
        /**
          * Description...
         */
        "onPrintSubmit"?: (event: CustomEvent<MouseEvent>) => void;
        "redirectURI"?: string;
    }
    interface EzpPrinting {
        "authapihosturl"?: string;
        "clientid"?: string;
        "custom"?: boolean;
        "filename"?: string;
        "filetype"?: string;
        "fileurl"?: string;
        "hidelogin"?: boolean;
        "printapihosturl"?: string;
        "redirecturi"?: string;
    }
    interface EzpProgress {
        /**
          * Status...
         */
        "status"?: string;
    }
    interface EzpSelect {
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
    interface EzpStepper {
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
        "type"?: TextButtonTypeTypes;
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
        "ezp-icon": EzpIcon;
        "ezp-icon-button": EzpIconButton;
        "ezp-label": EzpLabel;
        "ezp-printer-selection": EzpPrinterSelection;
        "ezp-printing": EzpPrinting;
        "ezp-progress": EzpProgress;
        "ezp-select": EzpSelect;
        "ezp-stepper": EzpStepper;
        "ezp-text-button": EzpTextButton;
        "ezp-user-menu": EzpUserMenu;
    }
}
export { LocalJSX as JSX };
declare module "@stencil/core" {
    export namespace JSX {
        interface IntrinsicElements {
            "ezp-auth": LocalJSX.EzpAuth & JSXBase.HTMLAttributes<HTMLEzpAuthElement>;
            "ezp-backdrop": LocalJSX.EzpBackdrop & JSXBase.HTMLAttributes<HTMLEzpBackdropElement>;
            "ezp-icon": LocalJSX.EzpIcon & JSXBase.HTMLAttributes<HTMLEzpIconElement>;
            "ezp-icon-button": LocalJSX.EzpIconButton & JSXBase.HTMLAttributes<HTMLEzpIconButtonElement>;
            "ezp-label": LocalJSX.EzpLabel & JSXBase.HTMLAttributes<HTMLEzpLabelElement>;
            "ezp-printer-selection": LocalJSX.EzpPrinterSelection & JSXBase.HTMLAttributes<HTMLEzpPrinterSelectionElement>;
            "ezp-printing": LocalJSX.EzpPrinting & JSXBase.HTMLAttributes<HTMLEzpPrintingElement>;
            "ezp-progress": LocalJSX.EzpProgress & JSXBase.HTMLAttributes<HTMLEzpProgressElement>;
            "ezp-select": LocalJSX.EzpSelect & JSXBase.HTMLAttributes<HTMLEzpSelectElement>;
            "ezp-stepper": LocalJSX.EzpStepper & JSXBase.HTMLAttributes<HTMLEzpStepperElement>;
            "ezp-text-button": LocalJSX.EzpTextButton & JSXBase.HTMLAttributes<HTMLEzpTextButtonElement>;
            "ezp-user-menu": LocalJSX.EzpUserMenu & JSXBase.HTMLAttributes<HTMLEzpUserMenuElement>;
        }
    }
}
