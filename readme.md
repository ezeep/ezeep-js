# ezeep.js

[<img src="https://img.shields.io/badge/-Built%20With%20Stencil-16161d.svg?logo=data%3Aimage%2Fsvg%2Bxml%3Bbase64%2CPD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPCEtLSBHZW5lcmF0b3I6IEFkb2JlIElsbHVzdHJhdG9yIDE5LjIuMSwgU1ZHIEV4cG9ydCBQbHVnLUluIC4gU1ZHIFZlcnNpb246IDYuMDAgQnVpbGQgMCkgIC0tPgo8c3ZnIHZlcnNpb249IjEuMSIgaWQ9IkxheWVyXzEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4IgoJIHZpZXdCb3g9IjAgMCA1MTIgNTEyIiBzdHlsZT0iZW5hYmxlLWJhY2tncm91bmQ6bmV3IDAgMCA1MTIgNTEyOyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI%2BCjxzdHlsZSB0eXBlPSJ0ZXh0L2NzcyI%2BCgkuc3Qwe2ZpbGw6I0ZGRkZGRjt9Cjwvc3R5bGU%2BCjxwYXRoIGNsYXNzPSJzdDAiIGQ9Ik00MjQuNywzNzMuOWMwLDM3LjYtNTUuMSw2OC42LTkyLjcsNjguNkgxODAuNGMtMzcuOSwwLTkyLjctMzAuNy05Mi43LTY4LjZ2LTMuNmgzMzYuOVYzNzMuOXoiLz4KPHBhdGggY2xhc3M9InN0MCIgZD0iTTQyNC43LDI5Mi4xSDE4MC40Yy0zNy42LDAtOTIuNy0zMS05Mi43LTY4LjZ2LTMuNkgzMzJjMzcuNiwwLDkyLjcsMzEsOTIuNyw2OC42VjI5Mi4xeiIvPgo8cGF0aCBjbGFzcz0ic3QwIiBkPSJNNDI0LjcsMTQxLjdIODcuN3YtMy42YzAtMzcuNiw1NC44LTY4LjYsOTIuNy02OC42SDMzMmMzNy45LDAsOTIuNywzMC43LDkyLjcsNjguNlYxNDEuN3oiLz4KPC9zdmc%2BCg%3D%3D&colorA=16161d&style=flat-square">](https://stenciljs.com/docs/introduction) [![Node.js Build](https://github.com/ezeep/ezeep-js/actions/workflows/node.js.yml/badge.svg?branch=main)](https://github.com/ezeep/ezeep-js/actions/workflows/node.js.yml)

## Overview

The ezeep.js JavaScript library implements the [ezeep Blue API](https://apidocs.ezeep.com/) to easily offer printing capabilities to any web application. Integrate a printing feature to your web application with just a few steps.

## Integration Guide

### Getting started

1. Sign up for an ezeep Blue account. This creates an **administrator account** and a new **ezeep organization**.
   [Sign up here](https://www.ezeep.com/blue/)

2. Register your web application to receive your **Client-ID**. Contact the ezeep team at <helpdesk@ezeep.com> and provide the **Redirect Uri** of your web application. This Uri must host the ezeep.js component.

### Usage

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

### Example

To get started, you can use the default ezeep print button within your web app:

```html
<!DOCTYPE html>
<html dir="ltr" lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=1.0" />
    <script type="module" src="https://cdn.ezeep.com/libs/js/ezeep/ezeep.esm.js"></script>
    <script nomodule src="https://cdn.ezeep.com/libs/js/esm/ezeep.js"></script>
    <title>ezeep-js</title>
  </head>
  <body>
    <ezp-printing
      clientid="your-client-id"
      redirecturi="https://your-site.com/"
      fileurl="https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
      filename="dummypdf"
      filetype="pdf"
    >
    </ezp-printing>
  </body>
</html>
```

### Example with a custom button

If you want to bind the printing process to a custom html element, you can use this example:

```html
<!DOCTYPE html>
<html dir="ltr" lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=1.0" />
    <script type="module" src="https://cdn.ezeep.com/libs/js/ezeep/ezeep.esm.js"></script>
    <script nomodule src="https://cdn.ezeep.com/libs/js/esm/ezeep.js"></script>
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
      filename="dummypdf"
      fileurl="https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
      filetype="pdf"
      custom
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

## Contribution Guide

Make sure you follow the [GitHub flow](https://guides.github.com/introduction/flow/) if you want to contribute. Clone and create a branch for your contribution. When finished, create a pull request for the main branch.

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
