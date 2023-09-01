import { polyfillNode } from "esbuild-plugin-polyfill-node"

export const config = {
  entryPoints: ["src/main.ts"],
  bundle: true,
  outdir: "public",
  plugins: [polyfillNode()],
  format: "esm",
  target: ["chrome116"],
}
