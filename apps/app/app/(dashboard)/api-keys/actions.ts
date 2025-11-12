"use server";

import { auth } from "@clerk/nextjs/server";
import { apiKeyService } from "@repo/api-keys";
import { revalidatePath } from "next/cache";

export async function createApiKey(data: {
  name: string;
  environment: "test" | "production";
}) {
  const { orgId } = await auth();

  if (!orgId) {
    return {
      success: false,
      error: "No organization found. Please select an organization.",
    };
  }

  try {
    const result = await apiKeyService.generateApiKey(
      orgId,
      data.environment,
      data.name,
    );

    // Revalidate the API keys page to show the new key
    revalidatePath("/api-keys");

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("Error creating API key:", error);
    return {
      success: false,
      error: "Failed to create API key. Please try again.",
    };
  }
}

export async function revokeApiKey(keyId: string) {
  const { orgId } = await auth();

  if (!orgId) {
    return {
      success: false,
      error: "No organization found. Please select an organization.",
    };
  }

  try {
    // Pass orgId to verify ownership
    await apiKeyService.revokeApiKey(keyId, orgId);

    // Revalidate the API keys page to update the list
    revalidatePath("/api-keys");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error revoking API key:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to revoke API key. Please try again.",
    };
  }
}
