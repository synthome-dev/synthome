"use server";

import { auth } from "@clerk/nextjs/server";
import { providerKeyService, storageIntegrationService } from "@repo/api-keys";
import { revalidatePath } from "next/cache";

export async function updateProviderKey(params: {
  provider: "replicate" | "fal" | "google-cloud" | "hume" | "elevenlabs";
  apiKey: string;
}) {
  const { orgId } = await auth();
  if (!orgId) throw new Error("Unauthorized");

  await providerKeyService.updateProviderKey({
    organizationId: orgId,
    ...params,
  });

  revalidatePath("/integrations");
}

export async function deleteProviderKey(
  provider: "replicate" | "fal" | "google-cloud" | "hume" | "elevenlabs",
) {
  const { orgId } = await auth();
  if (!orgId) throw new Error("Unauthorized");

  await providerKeyService.deleteProviderKey({
    organizationId: orgId,
    provider,
  });

  revalidatePath("/integrations");
}

export async function updateStorageIntegration(params: {
  accessKey: string;
  secretKey: string;
  endpoint: string;
  region: string;
  bucket: string;
  cdnUrl?: string;
}) {
  const { orgId } = await auth();
  if (!orgId) throw new Error("Unauthorized");

  await storageIntegrationService.updateStorageIntegration({
    organizationId: orgId,
    ...params,
  });

  revalidatePath("/integrations");
}

export async function deleteStorageIntegration() {
  const { orgId } = await auth();
  if (!orgId) throw new Error("Unauthorized");

  await storageIntegrationService.deleteStorageIntegration(orgId);

  revalidatePath("/integrations");
}
