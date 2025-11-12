import type { SVGProps } from "react"

export const Shrink = (props: SVGProps<SVGSVGElement>) => {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24">
      <path
        d="M18.25 18.25H5.75"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"></path>
    </svg>
  )
}
