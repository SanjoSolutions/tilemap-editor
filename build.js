import { build } from 'esbuild'
import { config } from './esbuild.config.js'

build({
  ...config,
  define: {
    'window.IS_DEVELOPMENT': 'false',
  },
})
