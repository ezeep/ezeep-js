import { NgModule } from "@angular/core";
import { defineCustomElements } from "@ezeep/ezeep-js";

import {EzpAuth, EzpBackdrop, EzpIcon, EzpIconButton, EzpPrinterSelection, EzpPrinting, EzpProgress, EzpSelect, EzpTextButton, EzpUserMenu } from "./directives/proxies";

defineCustomElements(window);

const DECLARATIONS = [
  // proxies
  EzpPrinting,
  EzpAuth,
  EzpBackdrop,
  EzpIcon,
  EzpIconButton,
  EzpPrinterSelection,
  EzpPrinting,
  EzpProgress,
  EzpSelect,
  EzpTextButton,
  EzpUserMenu,
];

@NgModule({
  declarations: DECLARATIONS,
  exports: DECLARATIONS,
  imports: [],
  providers: []
})
export class EzeepJSAngularModule { }
