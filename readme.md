# ezeep.js

[<img src="https://img.shields.io/badge/-Built%20With%20Stencil-16161d.svg?logo=data%3Aimage%2Fsvg%2Bxml%3Bbase64%2CPD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPCEtLSBHZW5lcmF0b3I6IEFkb2JlIElsbHVzdHJhdG9yIDE5LjIuMSwgU1ZHIEV4cG9ydCBQbHVnLUluIC4gU1ZHIFZlcnNpb246IDYuMDAgQnVpbGQgMCkgIC0tPgo8c3ZnIHZlcnNpb249IjEuMSIgaWQ9IkxheWVyXzEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4IgoJIHZpZXdCb3g9IjAgMCA1MTIgNTEyIiBzdHlsZT0iZW5hYmxlLWJhY2tncm91bmQ6bmV3IDAgMCA1MTIgNTEyOyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI%2BCjxzdHlsZSB0eXBlPSJ0ZXh0L2NzcyI%2BCgkuc3Qwe2ZpbGw6I0ZGRkZGRjt9Cjwvc3R5bGU%2BCjxwYXRoIGNsYXNzPSJzdDAiIGQ9Ik00MjQuNywzNzMuOWMwLDM3LjYtNTUuMSw2OC42LTkyLjcsNjguNkgxODAuNGMtMzcuOSwwLTkyLjctMzAuNy05Mi43LTY4LjZ2LTMuNmgzMzYuOVYzNzMuOXoiLz4KPHBhdGggY2xhc3M9InN0MCIgZD0iTTQyNC43LDI5Mi4xSDE4MC40Yy0zNy42LDAtOTIuNy0zMS05Mi43LTY4LjZ2LTMuNkgzMzJjMzcuNiwwLDkyLjcsMzEsOTIuNyw2OC42VjI5Mi4xeiIvPgo8cGF0aCBjbGFzcz0ic3QwIiBkPSJNNDI0LjcsMTQxLjdIODcuN3YtMy42YzAtMzcuNiw1NC44LTY4LjYsOTIuNy02OC42SDMzMmMzNy45LDAsOTIuNywzMC43LDkyLjcsNjguNlYxNDEuN3oiLz4KPC9zdmc%2BCg%3D%3D&colorA=16161d&style=flat-square">](https://stenciljs.com/docs/introduction) [![Node.js Build](https://github.com/ezeep/ezeep-js/actions/workflows/node.js.yml/badge.svg?branch=main)](https://github.com/ezeep/ezeep-js/actions/workflows/node.js.yml)

## Overview

The ezeep.js JavaScript library implements the [ezeep Blue API](https://apidocs.ezeep.com/) to easily offer printing capabilities to any web application. Integrate a printing feature to your web application with just a few steps.

## Integration Guide

### Getting started

1. Sign up for an ezeep Blue account. This creates an **administrator account** and a new **ezeep organization**.
   [Sign up here](https://www.ezeep.com/blue/). After successfully signup, you can manage your ezeep organization [here](https://app.ezeep.com).

2. Register your web application to receive your **Client-ID**. Contact the ezeep team at <helpdesk@ezeep.com> and provide the **Redirect Uri** of your web application. This Uri must host the ezeep.js component. (Here are more details on [OAuth workflows](https://oauth.net/2/) and [Client-ID](https://www.oauth.com/oauth2-servers/client-registration/client-id-secret/)/[Redirect Uri](https://www.oauth.com/oauth2-servers/redirect-uris/))

3. Download the [ezeep Blue Connector](https://ezeep.io/blueconnectorps) and install it on a machine (e.g. your local machine) with a printer on the same network. After the installation you are prompted to authenticate with your ezeep Account. Your printers in your network will be discovered automatically and advertised to the ezeep Administration Portal.

### Angular Integration
ezeep.js is available as Angular library as well. Instructions on how to setup ezeep.js with Angular can be found [here](https://github.com/ezeep/ezeep-js/tree/ngx-ezeep-js/ezeep-js-angular/projects/ngx-ezeep-js).

### JavaScript Integration

**Important: You need to set up your server with https!**

1. Include ezeep.js to your web app by the following options:

Use **script** tags in your html source:

```html
<!-- use latest version -->
<script type="module" src="https://cdn.ezeep.com/ezeep-js/ezeep.esm.js"></script>
<script nomodule src="https://cdn.ezeep.com/ezeep-js/ezeep.js"></script>

<!-- use specific version -->
<script type="module" src="https://cdn.ezeep.com/ezeep-js/v0.1.50/ezeep.esm.js"></script>
<script nomodule src="https://cdn.ezeep.com/ezeep-js/v0.1.50/ezeep.js"></script>
```

Use npm:

```bash
npm install @ezeep/ezeep-js
```

2. Add the **ezp-printing** tag to your html source.

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

## Contribution Guide

Make sure you follow the [GitHub flow](https://guides.github.com/introduction/flow/) if you want to contribute. Clone and create a branch for your contribution. When finished, create a pull request for the main branch.

#### Important: You need to set up your development server with https!

The stencil.config is already set up to do exactly this in your development environment.

You'll need a certificate and key for this aswell as a .env file placed at the root of the project.

To generate a self signed certificate execute the following command:

```bash
openssl req -newkey rsa:2048 -new -nodes -x509 -days 3650 -keyout key.pem -out certificate.pem
```

and follow the steps to generate a key.pem and certificate.pem.

In your .env file specify the following variables:

```.env
DEV_SERVER_ADDRESS="your-server-address.com"
DEV_SERVER_PORT= portnumber
```

Additionally, you need to uncomment the "devServer" option in the stencil config file.

#### Make sure to comment out the "devServer" option before pushing to the repository!

Clone this repository to a new directory:

```bash
git clone https://github.com/ezeep/ezeep-js.git
cd ezeep-js
```

Install project dependencies and start the project:

```bash
npm install
npm start
```

Build components for production:

```bash
npm run build
```

Format source code:

```bash
npm run format
```
