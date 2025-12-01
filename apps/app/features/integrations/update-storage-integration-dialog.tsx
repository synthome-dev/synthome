"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardRoot,
  CardRootFooter,
  CardRootHeader,
  CardRootText,
  CardRootTitle,
} from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { InputForm } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, Formik } from "formik";
import { useState } from "react";
import * as Yup from "yup";
import { updateStorageIntegration } from "./actions";

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

interface UpdateStorageIntegrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentConfig: StorageIntegrationInfo | null;
}

const validationSchema = Yup.object({
  accessKey: Yup.string()
    .required("Access Key ID is required")
    .min(10, "Access Key ID must be at least 10 characters"),
  secretKey: Yup.string()
    .required("Secret Access Key is required")
    .min(10, "Secret Access Key must be at least 10 characters"),
  endpoint: Yup.string()
    .required("Endpoint is required")
    .url("Must be a valid URL"),
  region: Yup.string().required("Region is required"),
  bucket: Yup.string().required("Bucket name is required"),
  cdnUrl: Yup.string().url("Must be a valid URL").nullable(),
});

export function UpdateStorageIntegrationDialog({
  open,
  onOpenChange,
  currentConfig,
}: UpdateStorageIntegrationDialogProps) {
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto p-0">
        <Formik
          initialValues={{
            accessKey: "",
            secretKey: "",
            endpoint: currentConfig?.endpoint || "",
            region: currentConfig?.region || "",
            bucket: currentConfig?.bucket || "",
            cdnUrl: currentConfig?.cdnUrl || "",
          }}
          validationSchema={validationSchema}
          onSubmit={async (values, { setSubmitting, resetForm }) => {
            try {
              setError(null);
              await updateStorageIntegration({
                accessKey: values.accessKey,
                secretKey: values.secretKey,
                endpoint: values.endpoint,
                region: values.region,
                bucket: values.bucket,
                cdnUrl: values.cdnUrl || undefined,
              });
              resetForm();
              handleClose();
              window.location.reload();
            } catch (err) {
              console.error("Error updating storage integration:", err);
              setError(
                err instanceof Error
                  ? err.message
                  : "Failed to update storage integration"
              );
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {({ isSubmitting, resetForm, handleSubmit }) => (
            <CardRoot spacing="none" className="p-0">
              <CardRootHeader>
                <CardRootTitle>Configure Storage</CardRootTitle>
                <CardRootText>
                  {currentConfig?.hasCredentials
                    ? "Update your S3-compatible storage configuration."
                    : "Add your S3-compatible storage configuration to enable custom storage."}
                </CardRootText>
              </CardRootHeader>

              <Card>
                <CardContent className="space-y-4">
                  <Form>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="accessKey">Access Key ID</Label>
                          <InputForm
                            name="accessKey"
                            placeholder="AKIAIOSFODNN7EXAMPLE"
                            autoComplete="off"
                            className="font-mono"
                          />
                        </div>
                        <div>
                          <Label htmlFor="secretKey">Secret Access Key</Label>
                          <InputForm
                            name="secretKey"
                            placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                            autoComplete="off"
                            className="font-mono"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="endpoint">Endpoint URL</Label>
                        <InputForm
                          name="endpoint"
                          type="text"
                          placeholder="https://s3.amazonaws.com"
                          autoComplete="off"
                        />
                        <p className="text-sm text-secondary mt-1">
                          S3-compatible endpoint URL (e.g., AWS S3, Cloudflare
                          R2, MinIO)
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="region">Region</Label>
                          <InputForm
                            name="region"
                            type="text"
                            placeholder="us-east-1"
                            autoComplete="off"
                          />
                        </div>
                        <div>
                          <Label htmlFor="bucket">Bucket Name</Label>
                          <InputForm
                            name="bucket"
                            type="text"
                            placeholder="my-bucket"
                            autoComplete="off"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="cdnUrl">CDN URL (Optional)</Label>
                        <InputForm
                          name="cdnUrl"
                          type="text"
                          placeholder="https://cdn.example.com"
                          autoComplete="off"
                        />
                        <p className="text-sm text-secondary mt-1">
                          Public URL for accessing files. If not provided, the
                          endpoint URL will be used.
                        </p>
                      </div>
                    </div>
                  </Form>
                </CardContent>
              </Card>

              {error && (
                <div className="px-6 py-2">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              <CardRootFooter className="flex gap-2">
                <Button
                  type="button"
                  isLoading={isSubmitting}
                  onClick={() => handleSubmit()}
                  disabled={isSubmitting}
                >
                  Save Configuration
                </Button>
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => {
                    resetForm();
                    handleClose();
                  }}
                >
                  Cancel
                </Button>
              </CardRootFooter>
            </CardRoot>
          )}
        </Formik>
      </DialogContent>
    </Dialog>
  );
}
