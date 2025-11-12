import type { SVGProps } from "react"

export const Minimize = (props: SVGProps<SVGSVGElement>) => {
  return (
    <svg fill="none" viewBox="0 0 24 24" {...props}>
      <path
        d="M10.25 18.25V13.75H5.75"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"></path>
      <path
        d="M13.75 5.75V10.25H18.25"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"></path>
      <path
        d="M4.75 19.25L10.25 13.75"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"></path>
      <path
        d="M19.25 4.75L13.75 10.25"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"></path>
    </svg>
  )
}
