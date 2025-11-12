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
import * as Yup from "yup";
import { createApiKey } from "@/app/(dashboard)/api-keys/actions";
import { useState } from "react";
import { Check, Copy } from "lucide-react";

interface CreateApiKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const validationSchema = Yup.object({
  name: Yup.string().required("Name is required"),
  environment: Yup.string()
    .oneOf(["test", "production"], "Invalid environment")
    .required("Environment is required"),
});

export function CreateApiKeyDialog({
  open,
  onOpenChange,
}: CreateApiKeyDialogProps) {
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCopy = async () => {
    if (generatedKey) {
      await navigator.clipboard.writeText(generatedKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setGeneratedKey(null);
    setError(null);
    setCopied(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto p-0">
        <Formik
          initialValues={{
            name: "",
            environment: "test" as "test" | "production",
          }}
          validationSchema={validationSchema}
          onSubmit={async (values, { setSubmitting, resetForm }) => {
            try {
              setError(null);
              const result = await createApiKey(values);

              if (result.success && result.data) {
                setGeneratedKey(result.data.apiKey);
              } else {
                setError(result.error || "Failed to create API key");
              }
            } catch (error) {
              console.error("Error creating API key:", error);
              setError("An unexpected error occurred");
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {({ isSubmitting, resetForm, handleSubmit }) => (
            <CardRoot spacing="none" className="p-0">
              <CardRootHeader>
                <CardRootTitle>
                  {generatedKey ? "API Key Created" : "Create API Key"}
                </CardRootTitle>
                <CardRootText>
                  {generatedKey
                    ? "Copy your API key now. For security reasons, it won't be shown again."
                    : "Create a new API key to authenticate your requests. Keep your API keys secure and never share them publicly."}
                </CardRootText>
              </CardRootHeader>

              {generatedKey ? (
                <Card>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Your API Key</Label>
                      <div className="flex gap-2 mt-2">
                        <div className="flex-1 flex items-center min-w-0 font-mono text-sm p-3 bg-surface-50 rounded-md overflow-x-auto h-8">
                          <div className="whitespace-nowrap truncate">
                            {generatedKey}
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="secondary"
                          size="icon"
                          onClick={handleCopy}
                          className="shrink-0"
                        >
                          {copied ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="space-y-4">
                    <Form>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="name">Name</Label>
                          <InputForm
                            name="name"
                            placeholder="My API Key"
                            autoComplete="off"
                          />
                        </div>
                      </div>
                    </Form>
                  </CardContent>
                </Card>
              )}

              {error && (
                <div className="px-6 py-2">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              <CardRootFooter className="flex gap-2">
                {generatedKey ? (
                  <Button
                    type="button"
                    onClick={() => {
                      resetForm();
                      handleClose();
                    }}
                  >
                    Done
                  </Button>
                ) : (
                  <>
                    <Button
                      type="button"
                      isLoading={isSubmitting}
                      onClick={() => handleSubmit()}
                      disabled={isSubmitting}
                    >
                      Create Key
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
                  </>
                )}
              </CardRootFooter>
            </CardRoot>
          )}
        </Formik>
      </DialogContent>
    </Dialog>
  );
}
