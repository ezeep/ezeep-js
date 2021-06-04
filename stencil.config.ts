import { Config } from '@stencil/core'
import { sass } from '@stencil/sass'
import fs from 'fs';

export const config: Config = {
  namespace: 'ezeep-js',
  globalStyle: 'src/shared/global.scss',
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
      copy: [{ src: 'assets' }, { src: 'data' }],
    },
  ],
  devServer: {
    port: 3333,
    https: {
      cert: fs.readFileSync('certificate.pem', 'utf-8'),
      key: fs.readFileSync('key.pem', 'utf-8')
    }
  }
}
