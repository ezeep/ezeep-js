# ezeep-js

[<img src="https://img.shields.io/badge/-Built%20With%20Stencil-16161d.svg?logo=data%3Aimage%2Fsvg%2Bxml%3Bbase64%2CPD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPCEtLSBHZW5lcmF0b3I6IEFkb2JlIElsbHVzdHJhdG9yIDE5LjIuMSwgU1ZHIEV4cG9ydCBQbHVnLUluIC4gU1ZHIFZlcnNpb246IDYuMDAgQnVpbGQgMCkgIC0tPgo8c3ZnIHZlcnNpb249IjEuMSIgaWQ9IkxheWVyXzEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4IgoJIHZpZXdCb3g9IjAgMCA1MTIgNTEyIiBzdHlsZT0iZW5hYmxlLWJhY2tncm91bmQ6bmV3IDAgMCA1MTIgNTEyOyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI%2BCjxzdHlsZSB0eXBlPSJ0ZXh0L2NzcyI%2BCgkuc3Qwe2ZpbGw6I0ZGRkZGRjt9Cjwvc3R5bGU%2BCjxwYXRoIGNsYXNzPSJzdDAiIGQ9Ik00MjQuNywzNzMuOWMwLDM3LjYtNTUuMSw2OC42LTkyLjcsNjguNkgxODAuNGMtMzcuOSwwLTkyLjctMzAuNy05Mi43LTY4LjZ2LTMuNmgzMzYuOVYzNzMuOXoiLz4KPHBhdGggY2xhc3M9InN0MCIgZD0iTTQyNC43LDI5Mi4xSDE4MC40Yy0zNy42LDAtOTIuNy0zMS05Mi43LTY4LjZ2LTMuNkgzMzJjMzcuNiwwLDkyLjcsMzEsOTIuNyw2OC42VjI5Mi4xeiIvPgo8cGF0aCBjbGFzcz0ic3QwIiBkPSJNNDI0LjcsMTQxLjdIODcuN3YtMy42YzAtMzcuNiw1NC44LTY4LjYsOTIuNy02OC42SDMzMmMzNy45LDAsOTIuNywzMC43LDkyLjcsNjguNlYxNDEuN3oiLz4KPC9zdmc%2BCg%3D%3D&colorA=16161d&style=flat-square">](https://stenciljs.com/docs/introduction)

## Getting started as an Integrator

### Requirements

- ezeep Blue administrator account
- Your personal ezeep Client ID and Client Secret

- Redirect Uri

To setup your ezeep administrator account and organization, sign up [here.](https://www.ezeep.com/blue/)

To receive your Client ID,Client Secret and provide your redirect URI(s) contact us at helpdesk@ezeep.com.

For the full documentation on setting up your ezeep Blue account, [check our web documentation.](https://support.ezeep.com/en/support/home)

### Usage

Including ezeep.js as a script tag: (content not yet available)

```html
<script src="https://cdn.cortado.com/ezeep.js"></script>
```

Or via npm: (content not yet available)

```bash
npm install ezeep.js
```

After that, simply add the ezp-printing tag to your .html file:

```html
<ezp-printing></ezp-printing>
```

There are multiple required and optional attributes the ezp-printing element needs in order to provide the print functionality.

| Attribute   | Description                             | Type   | Required |
| ----------- | --------------------------------------- | ------ | -------- |
| clientid    | Your clientID.                          | string | Yes      |
| redirecturi | Your redirectURI.                       | string | Yes      |
| fileurl     | The url to the file you want to print.  | string | Yes      |
| filetype    | The type of the file you want to print. | string | No       |
| filename    | The name of the file you want to print. | string | No       |

### Example

```html
<!DOCTYPE html>
<html dir="ltr" lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=1.0" />
    <title>ezeep-js</title>
  </head>
  <body>
    <ezp-printing
      clientid="your-own-client-id"
      redirecturi="https://your-site.com/"
      filename="dummypdf"
      fileurl="https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
      filetype="pdf"
    >
    </ezp-printing>
  </body>
</html>
```

## Getting started as a contributor

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
