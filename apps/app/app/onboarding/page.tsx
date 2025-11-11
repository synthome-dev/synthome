"use client";

import { CreateOrganization } from "@clerk/nextjs";

export default function OnboardingPage() {
  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center">
      <div className="w-full max-w-xl flex items-center justify-center mb-8">
        <h1 className="text-2xl font-semibold text-center">
          Create Your Organization
        </h1>
      </div>
      <div className="flex items-center justify-center">
        <CreateOrganization
          afterCreateOrganizationUrl="/"
          skipInvitationScreen={true}
        />
      </div>
    </div>
  );
}
