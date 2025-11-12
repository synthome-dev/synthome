import type { SVGProps } from "react"

export const ArrowLeft = (props: SVGProps<SVGSVGElement>) => {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24">
      <path
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
        d="M10.25 6.75L4.75 12L10.25 17.25"></path>
      <path
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
        d="M19.25 12H5"></path>
    </svg>
  )
}
