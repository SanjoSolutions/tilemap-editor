import * as esbuild from 'esbuild'
import { config } from './esbuild.config.js'

const context = await esbuild.context({
  ...config,
  define: {
    'window.IS_DEVELOPMENT': 'true',
  },
})

await context.watch()
await context.serve({ port: 80, servedir: 'public' })
console.log('Running on http://localhost.')
