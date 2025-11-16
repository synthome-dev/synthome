"use client";

import {
  ElevenLabsIcon,
  FALAIIcon,
  GoogleCloud,
  HumeAIIcon,
  Replicate,
} from "@/components/icons/provider-icons";
import { Button } from "@/components/ui/button";
import { Card, CardRoot } from "@/components/ui/card";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableHeadRow,
  TableRow,
} from "@/components/ui/table";
import { useState } from "react";
import { toast } from "sonner";
import { deleteProviderKey } from "./actions";
import { UpdateProviderKeyDialog } from "./update-provider-key-dialog";

interface ProviderKey {
  id: string;
  provider: "replicate" | "fal" | "google-cloud" | "hume" | "elevenlabs";
  keyPrefix: string | null;
  isActive: boolean;
  lastUsedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export function IntegrationsTable({ keys }: { keys: ProviderKey[] }) {
  const [selectedKey, setSelectedKey] = useState<ProviderKey | null>(null);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);

  // Define provider order
  const providerOrder = [
    "replicate",
    "fal",
    "google-cloud",
    "elevenlabs",
    "hume",
  ];

  // Sort keys by provider order
  const sortedKeys = [...keys].sort((a, b) => {
    return (
      providerOrder.indexOf(a.provider) - providerOrder.indexOf(b.provider)
    );
  });

  const handleUpdate = (key: ProviderKey) => {
    setSelectedKey(key);
    setIsUpdateDialogOpen(true);
  };

  const handleDelete = async (provider: string, providerName: string) => {
    if (
      !confirm(
        `Are you sure you want to remove your ${providerName} integration?`,
      )
    ) {
      return;
    }

    try {
      await deleteProviderKey(
        provider as
          | "replicate"
          | "fal"
          | "google-cloud"
          | "hume"
          | "elevenlabs",
      );
      toast.success(`${providerName} integration removed successfully`);
    } catch (error) {
      toast.error(`Failed to remove ${providerName} integration`);
      console.error("Error removing integration:", error);
    }
  };

  const getProviderDisplayName = (provider: string) => {
    switch (provider) {
      case "replicate":
        return "Replicate";
      case "fal":
        return "fal";
      case "google-cloud":
        return "Google Cloud";
      case "hume":
        return "Hume AI";
      case "elevenlabs":
        return "ElevenLabs";
      default:
        return provider;
    }
  };

  const getProviderIcon = (provider: string) => {
    const iconClass = "h-5 w-5";
    switch (provider) {
      case "replicate":
        return <Replicate className={iconClass} />;
      case "fal":
        return <FALAIIcon className={iconClass} />;
      case "google-cloud":
        return <GoogleCloud className={iconClass} />;
      case "hume":
        return <HumeAIIcon className={iconClass} />;
      case "elevenlabs":
        return <ElevenLabsIcon className={iconClass} />;
      default:
        return null;
    }
  };

  return (
    <>
      <CardRoot>
        <table className="w-full table-fixed">
          <TableHeader>
            <TableHeadRow>
              <TableHead>Provider</TableHead>
              <TableHead>API Key</TableHead>
              <TableHead>Last Used</TableHead>
              <TableHead className="w-[200px]"></TableHead>
            </TableHeadRow>
          </TableHeader>
          <Card asChild>
            <TableBody className="bg-transparent">
              {sortedKeys.map((key) => (
                <TableRow key={key.id} className="group/row relative">
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      {getProviderIcon(key.provider)}
                      {getProviderDisplayName(key.provider)}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm text-secondary">
                    {key.keyPrefix ? `${key.keyPrefix}•••••••••••••••` : ""}
                  </TableCell>
                  <TableCell className="text-secondary">
                    {key.keyPrefix && key.lastUsedAt
                      ? new Date(key.lastUsedAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })
                      : ""}
                  </TableCell>
                  <TableCell className="w-[200px] max-w-[200px]">
                    <div className="flex justify-end gap-2 max-w-[200px] flex-none">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleUpdate(key)}
                      >
                        {key.keyPrefix ? "Update" : "Configure"}
                      </Button>
                      {key.keyPrefix && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() =>
                            handleDelete(
                              key.provider,
                              getProviderDisplayName(key.provider),
                            )
                          }
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Card>
        </table>
      </CardRoot>

      {selectedKey && (
        <UpdateProviderKeyDialog
          open={isUpdateDialogOpen}
          onOpenChange={setIsUpdateDialogOpen}
          provider={selectedKey.provider}
          currentKeyPrefix={selectedKey.keyPrefix}
        />
      )}
    </>
  );
}
