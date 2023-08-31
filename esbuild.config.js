import { polyfillNode } from 'esbuild-plugin-polyfill-node'

export const config = {
  entryPoints: ['main.js'],
  bundle: true,
  outdir: 'public',
  plugins: [polyfillNode()],
  format: 'esm',
  target: ['chrome86', 'edge86', 'opera72'],
}
