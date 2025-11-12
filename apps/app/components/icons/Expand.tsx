import type { SVGProps } from "react"

export const Expand = (props: SVGProps<SVGSVGElement>) => {
  return (
    <svg fill="none" viewBox="0 0 24 24" {...props}>
      <path
        d="M4.75 14.75V19.25H9.25"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"></path>
      <path
        d="M19.25 9.25V4.75H14.75"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"></path>
      <path
        d="M5 19L10.25 13.75"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"></path>
      <path
        d="M19 5L13.75 10.25"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"></path>
    </svg>
  )
}
