# NgxEzeepJs

This library was generated with [Angular CLI](https://github.com/angular/angular-cli) version 12.2.0.

## Overview

The ezeep.js JavaScript library implements the [ezeep Blue API](https://apidocs.ezeep.com/) to easily offer printing capabilities to any web application. Integrate a printing feature to your web application with just a few steps.

## Integration Guide

### Getting started

1. Sign up for an ezeep Blue account. This creates an **administrator account** and a new **ezeep organization**.
   [Sign up here](https://www.ezeep.com/blue/)

2. Register your web application to receive your **Client-ID**. Contact the ezeep team at <helpdesk@ezeep.com> and provide the **Redirect Uri** of your web application. This Uri must host the ezeep.js component.


## Integration in your Angular App
Important: You need to set up your server with https!

1. Inside your Angular App, install the package via npm:

```bash
npm install @ezeep/ezeep-js
```
2. Import the EzeepJSAngularModule in the module of your choice (e.g. app module)

```typescript
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { EzeepJSAngularModule } from '@ezeep/ngx-ezeep-js';

import { AppComponent } from './app.component';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    EzeepJSAngularModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
```

3. The package comes with assets, to use them, do the following:

    3.1 In the angluar.json file of your project, add this:

    ```json
    ...
    "assets": [
      {
        "glob": "**/*",
        "input": "./node_modules/@ezeep/ezeep-js/dist/ezeep/assets",
        "output": "./assets/"
      }
    ],
    ...
    ```
    3.2 Additionally, you need to tell stencil where to find the assets, so add this to your main.ts file

    ```typescript
    ...
    import { setAssetPath } from '@stencil/core'
    ...
    setAssetPath(location.origin)
    ...
    ```

4. Add the **ezp-printing** tag to your html source.

```html
<ezp-printing></ezp-printing>
```

There are multiple required and optional attributes the ezp-printing element needs in order to provide the print functionality.

| Attribute       | Description                                                                                              | Type    | Required |
| --------------- | -------------------------------------------------------------------------------------------------------- | ------- | -------- |
| **clientid**    | Your registered Client-ID (see above).                                                                   | string  | Yes      |
| **redirecturi** | Your registered Redirect Uri (see above).                                                                | string  | Yes      |
| **fileurl**     | A url pointing to a file that should be printed. E.g. https://your-site.com/myfile.pdf                   | string  | Yes      |
| custom          | Needs to be set to true, if a custom html element instead of the ezp-printing tag is used (e.g. button). | boolean | No       |
| filename        | The name of the file that is printed.                                                                    | string  | No       |
| filetype        | The type of the file that is printed.                                                                    | string  | No       |
| hidelogin       | If set to true, no additional info popup is shown before the user authentication.                        | boolean | No       |
| authapihosturl  | Overrides the default URL of the authentication API.                                                     | string  | No       |
| printapihosturl | Overrides the default URL of the printing API.                                                           | string  | No       |
| theme           | The overall color theme. Possible colors are pink, red, orange, green, cyan, blue and violet.            | string  | No       |

### Example

To get started, you can use the default ezeep print button within your angular app:

```html
<ezp-printing
  clientid="your-client-id"
  redirecturi="https://your-site.com/"
  fileurl="https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
  filename="dummypdf"
  filetype="pdf"
>
</ezp-printing>
```

### Example with a custom button

Add the custom attribute to the **ezeep-printing** tag:

**component.html**
```html
<ezp-printing
  clientid="your-client-id"
  redirecturi="https://your-site.com/"
  fileurl="https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
  filename="dummypdf"
  filetype="pdf"
  custom
>
  <button (click)="onClick()">My custom button</button>
</ezp-printing>
```
Call the **open** function on the element:

**component.ts**
```typescript
export class AppComponent implements OnInit {
  ezpPrinting: any; 
  
  ngOnInit() {
    this.ezpPrinting = document.querySelector('ezp-printing');
  }
  
  onClick() {
    this.ezpPrinting.open();
  }
}
```
## Code scaffolding

Run `ng generate component component-name --project ngx-ezeep-js` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module --project ngx-ezeep-js`.
> Note: Don't forget to add `--project ngx-ezeep-js` or else it will be added to the default project in your `angular.json` file. 

## Build

Run `ng build ngx-ezeep-js` to build the project. The build artifacts will be stored in the `dist/` directory.

## Publishing

After building your library with `ng build ngx-ezeep-js`, go to the dist folder `cd dist/ngx-ezeep-js` and run `npm publish`.

## Running unit tests

Run `ng test ngx-ezeep-js` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.
