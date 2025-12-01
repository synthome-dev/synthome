"use client";

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
import { HardDrive } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { deleteStorageIntegration } from "./actions";
import { UpdateStorageIntegrationDialog } from "./update-storage-integration-dialog";

interface StorageIntegrationInfo {
  id: string;
  endpoint: string | null;
  region: string | null;
  bucket: string | null;
  cdnUrl: string | null;
  hasCredentials: boolean;
  isActive: boolean;
  lastUsedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export function StorageIntegrationCard({
  storageIntegration,
}: {
  storageIntegration: StorageIntegrationInfo | null;
}) {
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to remove your storage integration?")) {
      return;
    }

    try {
      await deleteStorageIntegration();
      toast.success("Storage integration removed successfully");
      window.location.reload();
    } catch (error) {
      toast.error("Failed to remove storage integration");
      console.error("Error removing storage integration:", error);
    }
  };

  const isConfigured = storageIntegration?.hasCredentials;

  return (
    <>
      <CardRoot>
        <table className="w-full table-fixed">
          <TableHeader>
            <TableHeadRow>
              <TableHead>Provider</TableHead>
              <TableHead>Configuration</TableHead>
              <TableHead>Last Used</TableHead>
              <TableHead className="w-[200px]"></TableHead>
            </TableHeadRow>
          </TableHeader>
          <Card asChild>
            <TableBody className="bg-transparent">
              <TableRow className="group/row relative">
                <TableCell className="font-medium">
                  <div className="flex items-center gap-3">
                    <HardDrive className="h-5 w-5" />
                    S3 Storage
                  </div>
                </TableCell>
                <TableCell className="text-sm text-secondary">
                  {isConfigured ? (
                    <div className="space-y-1">
                      <div>
                        <span className="text-muted-foreground">Bucket:</span>{" "}
                        {storageIntegration.bucket}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Region:</span>{" "}
                        {storageIntegration.region}
                      </div>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">
                      Not configured
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-secondary">
                  {isConfigured && storageIntegration.lastUsedAt
                    ? new Date(
                        storageIntegration.lastUsedAt,
                      ).toLocaleDateString("en-US", {
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
                      onClick={() => setIsUpdateDialogOpen(true)}
                    >
                      {isConfigured ? "Update" : "Configure"}
                    </Button>
                    {isConfigured && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={handleDelete}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Card>
        </table>
      </CardRoot>

      <UpdateStorageIntegrationDialog
        open={isUpdateDialogOpen}
        onOpenChange={setIsUpdateDialogOpen}
        currentConfig={storageIntegration}
      />
    </>
  );
}
