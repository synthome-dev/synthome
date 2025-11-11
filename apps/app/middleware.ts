import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/blog(.*)",
  "/changelog(.*)",
  "/pricing",
  "/api/stripe",
  "/privacy",
  "/onboarding(.*)",
]);

export default clerkMiddleware(async (auth, request) => {
  const { userId, orgId, redirectToSignIn } = await auth();
  const { pathname } = request.nextUrl;

  // If user is not authenticated and trying to access a protected route
  if (!isPublicRoute(request) && !userId) {
    return redirectToSignIn();
  }

  // If user is authenticated but has no organization
  // and is not already on the onboarding page
  if (userId && !orgId && pathname !== "/onboarding") {
    const onboardingUrl = new URL("/onboarding", request.url);
    return NextResponse.redirect(onboardingUrl);
  }

  // If user is authenticated, has an organization, but is on onboarding page
  // redirect them to home
  if (userId && orgId && pathname === "/onboarding") {
    const homeUrl = new URL("/", request.url);
    return NextResponse.redirect(homeUrl);
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|mp4|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
