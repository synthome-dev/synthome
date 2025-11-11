"use client";

import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center">
      <div className="w-full max-w-xl flex items-center h-12"></div>
      <div className="h-screen w-screen flex items-center justify-center">
        <SignUp fallbackRedirectUrl={"/"} forceRedirectUrl={"/"} />
      </div>
    </div>
  );
}
