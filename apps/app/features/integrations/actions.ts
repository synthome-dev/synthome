"use server";

import { auth } from "@clerk/nextjs/server";
import { providerKeyService } from "@repo/api-keys";
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
