import type { SVGProps } from "react"

export const ExpandFromShrink = (props: SVGProps<SVGSVGElement>) => {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24">
      <path
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M18.25 12.25L5.75 12.25"></path>
    </svg>
  )
}
