require('dotenv').config()

import { Config } from '@stencil/core'
import { sass } from '@stencil/sass'
import replacePlugin from '@rollup/plugin-replace'
import { angularOutputTarget } from '@stencil/angular-output-target'
// Use the actively-maintained fork. The old `rollup-plugin-node-polyfills`
// doesn't intercept modern Rollup's resolution order in Stencil 4.
import nodePolyfills from 'rollup-plugin-polyfill-node'

export const config: Config = {
  namespace: 'ezeep',
  globalScript: 'src/shared/global.ts',
  plugins: [sass({ includePaths: ['node_modules'] })],
  outputTargets: [
    angularOutputTarget({
      componentCorePackage: '@ezeep/ezeep-js',
      directivesProxyFile: 'dist/directives/proxies.ts',
    }),
    {
      type: 'dist',
      esmLoaderPath: '../loader',
      copy: [
        { src: 'shared/types.d.ts', dest: 'types/shared/types.d.ts' }
      ]
    },
    {
      // Stencil 4 replacement for `dist-custom-elements-bundle`.
      type: 'dist-custom-elements',
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
  // needs to be commented out for build on github actions to work
  // devServer: {
  //   address: process.env.DEV_SERVER_ADDRESS,
  //   port: parseInt(process.env.DEV_SERVER_PORT),
  //   https: {
  //     cert: fs.readFileSync(process.env.DEV_SERVER_HTTPS_CERT, 'utf8'),
  //     key: fs.readFileSync(process.env.DEV_SERVER_HTTPS_KEY, 'utf8'),
  //   },
  // },
  rollupPlugins: {
    // Run polyfills BEFORE Stencil's internal node-resolve so bare Node
    // built-ins (events/process/buffer) get rewritten to browser shims
    // instead of being preferred as built-ins (which leaks bare imports
    // into the browser bundle).
    before: [nodePolyfills()],
    after: [
      replacePlugin({
        preventAssignment: true,
        delimiters: ['<%', '%>'],
      }),
    ],
  },
  buildEs5: 'prod',
}
