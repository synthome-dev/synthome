import type { SVGProps } from "react"

export const Plus = (props: SVGProps<SVGSVGElement>) => {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24">
      <path
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M12 5.75V18.25"></path>
      <path
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M18.25 12L5.75 12"></path>
    </svg>
  )
}
