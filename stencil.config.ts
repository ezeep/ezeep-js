require('dotenv').config()

import { Config } from '@stencil/core'
import { sass } from '@stencil/sass'
import replacePlugin from '@rollup/plugin-replace'
import fs from 'fs'

export const config: Config = {
  namespace: 'ezeep',
  globalScript: 'src/shared/global.ts',
  plugins: [sass()],
  outputTargets: [
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
  devServer: {
    address: process.env.DEV_SERVER_ADDRESS,
    port: parseInt(process.env.DEV_SERVER_PORT),
    https: {
      cert: fs.readFileSync('certificate.pem', 'utf-8'),
      key: fs.readFileSync('key.pem', 'utf-8'),
    },
  },
  rollupPlugins: {
    after: [
      replacePlugin({
        preventAssignment: true,
        delimiters: ['<%', '%>'],
      }),
    ],
  },
}
