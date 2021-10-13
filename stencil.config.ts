require('dotenv').config()

import { Config } from '@stencil/core'
import { sass } from '@stencil/sass'
import replacePlugin from '@rollup/plugin-replace'
import { angularOutputTarget } from '@stencil/angular-output-target'
import { reactOutputTarget } from '@stencil/react-output-target'
import fs from 'fs'

export const config: Config = {
  namespace: 'ezeep',
  globalScript: 'src/shared/global.ts',
  plugins: [sass()],
  outputTargets: [
    angularOutputTarget({
      componentCorePackage: '@ezeep/ezeep-js', // name of npm package
      directivesProxyFile: 'ezeep-js-angular/src/index.ts', // output file that gets generated by the outputTarget
    }),
    reactOutputTarget({
      componentCorePackage: '@ezeep/ezeep-js',
      proxiesFile: 'ezeep-js-react/src/index.ts',
    }),
    {
      type: 'dist',
      esmLoaderPath: '../loader',
    },
    {
      type: 'dist-custom-elements-bundle',
    },
    {
      type: 'docs-readme',
      footer: '',
    },
    {
      type: 'www',
      serviceWorker: null,
      copy: [{ src: 'data' }],
    },
  ],
  // devServer: {
  //   address: process.env.DEV_SERVER_ADDRESS,
  //   port: parseInt(process.env.DEV_SERVER_PORT),
  //   https: {
  //     cert: fs.readFileSync('certificate.pem', 'utf-8'),
  //     key: fs.readFileSync('key.pem', 'utf-8'),
  //   },
  // },
  rollupPlugins: {
    after: [
      replacePlugin({
        preventAssignment: true,
        delimiters: ['<%', '%>'],
      }),
    ],
  },
  buildEs5: true,
  extras: {
    cssVarsShim: true,
    dynamicImportShim: true,
    shadowDomShim: true,
    safari10: true,
    scriptDataOpts: true,
    appendChildSlotFix: true,
    cloneNodeFix: true,
    slotChildNodesFix: true,
  },
}
