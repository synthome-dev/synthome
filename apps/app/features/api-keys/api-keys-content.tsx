"use client";

import { PlusIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { ApiKeysTable } from "./api-keys-table";
import { CreateApiKeyDialog } from "./create-api-key-dialog";

interface ApiKey {
  id: string;
  name: string | null;
  keyPrefix: string;
  environment: "test" | "production";
  isActive: boolean;
  lastUsedAt: Date | null;
  createdAt: Date;
  revokedAt: Date | null;
  expiresAt: Date | null;
  decryptedKey: string;
}

interface ApiKeysContentProps {
  keys: ApiKey[];
}

export function ApiKeysContent({ keys }: ApiKeysContentProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[1.5rem] leading-[2rem] tracking-[-0.01em] font-medium text-primary">
          API Keys
        </h1>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <PlusIcon className="size-5" />
          New Key
        </Button>
      </div>

      <ApiKeysTable keys={keys} />

      <CreateApiKeyDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </>
  );
}
