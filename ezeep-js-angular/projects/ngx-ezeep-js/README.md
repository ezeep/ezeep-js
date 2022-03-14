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
npm install @ezeep/ngx-ezeep-js
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

| Attribute       | Description                                                                                                                                                                                                                                             | Type    | Required                                             |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | ---------------------------------------------------- |
| **clientid**    | Your registered Client-ID (see above).                                                                                                                                                                                                                  | string  | Yes                                                  |
| **redirecturi** | Your registered Redirect Uri (see above).                                                                                                                                                                                                               | string  | Yes                                                  |
| **trigger**     | _button_: renders a print button that opens the print dialog upon clicking it<br />_custom_: renders no element, but allows create a custom element or trigger to open the print dialog<br />_file_: renders a an area to allow drag and drop of a file | string  | Yes                                                  |
| **fileurl**     | A url pointing to a file that should be printed. E.g. https://your-site.com/myfile.pdf                                                                                                                                                                  | string  | Required, if trigger is set to _button_ or _custom_. |
| filename        | The name of the file that is printed.                                                                                                                                                                                                                   | string  | No. Only used for trigger _button_ and _custom_.     |
| filetype        | The type of the file that is printed.                                                                                                                                                                                                                   | string  | No. Only used for trigger _button_ and _custom_.     |
| hidelogin       | If set to true, no additional info popup is shown before the user authentication.                                                                                                                                                                       | boolean | No                                                   |
| hidemenu      | If set to true, the menu is not shown.                                                                                                                                                                                                         | boolean | No                                                   |
| authapihosturl  | Overrides the default URL of the authentication API.                                                                                                                                                                                                    | string  | No                                                   |
| printapihosturl | Overrides the default URL of the printing API.                                                                                                                                                                                                          | string  | No                                                   |
| theme           | The overall color theme. Possible colors are pink, red, orange, green, cyan, blue and violet.                                                                                                                                                           | string  | No                                                   |
| appearance | Sets the overall appearance to "light", "dark" or the "system" default. | string | No
| language | Overrides the browserlanguage. Possible values are "de" for German and "en" for English. | string | No

### Example with button trigger

To get started, you can use the default ezeep print button within your web app:

**component.html**

```html
<!DOCTYPE html>
<html dir="ltr" lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=1.0" />
    <script type="module" src="https://cdn.ezeep.com/ezeep-js/ezeep.esm.js"></script>
    <script nomodule src="https://cdn.ezeep.com/ezeep-js/ezeep.js"></script>
    <title>ezeep-js</title>
  </head>
  <body>
    <ezp-printing
      clientid="your-client-id"
      redirecturi="https://your-site.com/"
      trigger="button"
      fileurl="https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
      filename="dummypdf"
      filetype="pdf"
    >
    </ezp-printing>
  </body>
</html>
```

### Example with custom trigger

If you want to bind the printing process to a custom html element, you can use this example:

```html
<!DOCTYPE html>
<html dir="ltr" lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=1.0" />
    <script type="module" src="https://cdn.ezeep.com/ezeep-js/ezeep.esm.js"></script>
    <script nomodule src="https://cdn.ezeep.com/ezeep-js/ezeep.js"></script>
    <title>ezeep-js</title>
    <style>
      .customButton {
        background-color: DodgerBlue;
        border: none;
        border-radius: 6px;
        color: white;
        padding: 12px 16px;
        font-size: 16px;
        cursor: pointer;
      }

      .customButton:hover {
        background-color: RoyalBlue;
      }
    </style>
  </head>
  <body>
    <ezp-printing
      clientid="your-own-client-id"
      redirecturi="https://your-site.com/"
      trigger="custom"
      filename="dummypdf"
      fileurl="https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
      filetype="pdf"
    >
      <button class="customButton">My custom styled print button</button>
    </ezp-printing>
    <script>
      const ezpPrinting = document.querySelector('ezp-printing')
      const button = document.querySelector('button')

      button.onclick = async () => await ezpPrinting.open()
    </script>
  </body>
</html>
```

### Example with file trigger (Drag&Drop)

```html
<!DOCTYPE html>
<html dir="ltr" lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=1.0" />
    <script type="module" src="https://cdn.ezeep.com/ezeep-js/ezeep.esm.js"></script>
    <script nomodule src="https://cdn.ezeep.com/ezeep-js/ezeep.js"></script>
    <title>ezeep-js</title>
    <style>
      /*
      you can set the width and height of the upload field, for example like this:
      (if no width or height is set, it defaults to "auto")
      */
      :root {
        --ezp-upload-width: calc(80vw);
        --ezp-upload-height: calc(80vh);
      }
    </style>
  </head>
  <body>
    <ezp-printing
      clientid="oWuvEAndErO3kKCqzaWBOAs2PhOuAbD7MZYWQ9yJ"
      redirecturi="https://develop.dev.azdev.ezeep.com:3333"
      trigger="file"
      theme="blue"
      appearance="system"
    >
    </ezp-printing>
  </body>
</html>
```

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
