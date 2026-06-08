import { NgModule } from "@angular/core";

import {EzpAuth, EzpBackdrop, EzpIcon, EzpIconButton, EzpPrinterSelection, EzpPrinting, EzpStatus, EzpSelect, EzpTextButton, EzpUserMenu } from "./directives/proxies";

// No defineCustomElements(window) here: with includeImportCustomElements the
// generated proxies import and define their own element from the
// custom-elements build, so the consumer's bundler includes the code statically.

const DECLARATIONS = [
  // proxies
  EzpPrinting,
  EzpAuth,
  EzpBackdrop,
  EzpIcon,
  EzpIconButton,
  EzpPrinterSelection,
  EzpPrinting,
  EzpStatus,
  EzpSelect,
  EzpTextButton,
  EzpUserMenu,
];

@NgModule({
  // Stencil's generated proxies are standalone components under Angular 14+,
  // so they are imported (and re-exported) rather than declared.
  imports: DECLARATIONS,
  exports: DECLARATIONS,
})
export class EzeepJSAngularModule { }
