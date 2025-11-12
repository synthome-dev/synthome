"use client";

import { revokeApiKey } from "@/app/(dashboard)/api-keys/actions";
import { Card, CardRoot } from "@/components/ui/card";
import { DeleteButton } from "@/components/ui/delete-button";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableHeadRow,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useState } from "react";
import { toast } from "sonner";

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

interface ApiKeysTableProps {
  keys: ApiKey[];
}

interface CopyState {
  [keyId: string]: boolean;
}

export function ApiKeysTable({ keys }: ApiKeysTableProps) {
  const [copiedStates, setCopiedStates] = useState<CopyState>({});

  const handleCopyKey = async (keyId: string, fullKey: string) => {
    await navigator.clipboard.writeText(fullKey);

    setCopiedStates((prev) => ({ ...prev, [keyId]: true }));
    setTimeout(() => {
      setCopiedStates((prev) => ({ ...prev, [keyId]: false }));
    }, 2000);
  };

  const formatKeyDisplay = (fullKey: string, prefix: string) => {
    // Show prefix + first 4 chars after prefix + ****
    const afterPrefix = fullKey.substring(prefix.length);
    const firstFour = afterPrefix.substring(0, 4);
    return `${prefix}${firstFour}****`;
  };

  const handleDeleteKey = async (keyId: string) => {
    try {
      const result = await revokeApiKey(keyId);

      if (result.success) {
        toast.success("API key revoked successfully");
      } else {
        toast.error(result.error || "Failed to revoke API key");
      }
    } catch (error) {
      toast.error("Failed to revoke API key");
      console.error("Error revoking API key:", error);
    }
  };

  return (
    <CardRoot>
      <table className="w-full table-fixed">
        <TableHeader>
          <TableHeadRow>
            <TableHead>Name</TableHead>
            <TableHead>Key</TableHead>
            <TableHead>Last Used</TableHead>
            <TableHead className="w-[100px]"></TableHead>
          </TableHeadRow>
        </TableHeader>
        <Card asChild>
          <TableBody className="bg-transparent">
            {keys.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center">
                  <p className="text-secondary  h-[100px]">
                    No API keys found. Create your first API key to get started.
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              keys.map((key) => (
                <TableRow key={key.id} className="group/row relative">
                  <TableCell className="font-medium">
                    {key.name || "Unnamed Key"}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    <TooltipProvider>
                      <Tooltip open={copiedStates[key.id] ? true : undefined}>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() =>
                              handleCopyKey(key.id, key.decryptedKey)
                            }
                            className="text-left hover:text-primary transition-colors cursor-pointer truncate block max-w-[300px]"
                          >
                            {formatKeyDisplay(key.decryptedKey, key.keyPrefix)}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {copiedStates[key.id] ? "Copied!" : "Click to copy"}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell className="text-secondary">
                    {key.lastUsedAt
                      ? new Date(key.lastUsedAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })
                      : "Never"}
                  </TableCell>
                  <TableCell className="w-[100px] max-w-[100px]">
                    <div className="flex justify-end max-w-[100px] flex-none">
                      <div className="max-w-[100px] flex-none w-[100px]">
                        <DeleteButton
                          onConfirm={() => handleDeleteKey(key.id)}
                          size="icon-sm"
                          variant="ghost"
                        />
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Card>
      </table>
    </CardRoot>
  );
}
