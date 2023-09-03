import type { Area } from "./Area.js"
export function areAreasDifferent(a: Area, b: Area): boolean {
  return (
    a.x !== b.x || a.y !== b.y || a.width !== b.width || a.height !== b.height
  )
}
