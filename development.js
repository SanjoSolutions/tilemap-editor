import * as esbuild from "esbuild"
import { config } from "./esbuild.config.js"

const context = await esbuild.context({
  ...config,
  sourcemap: true,
  define: {
    "window.IS_DEVELOPMENT": "true",
  },
})

await context.watch()
const port = 8000
await context.serve({ port, servedir: "public" })
console.log(`Running on http://localhost:${port}.`)
