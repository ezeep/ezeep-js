import { Config } from '@stencil/core'
import { sass } from '@stencil/sass'

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
  /* devServer: {
    basePath: '/code',
    port: 3000
  } */
}
