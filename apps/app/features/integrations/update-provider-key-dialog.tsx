"use client";

import {
  ElevenLabsIcon,
  FALAIIcon,
  GoogleCloud,
  HumeAIIcon,
  Replicate,
} from "@/components/icons/provider-icons";
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
import { updateProviderKey } from "./actions";

interface UpdateProviderKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  provider: "replicate" | "fal" | "google-cloud" | "hume" | "elevenlabs";
  currentKeyPrefix: string | null;
}

const validationSchema = Yup.object({
  apiKey: Yup.string().required("API Key is required"),
});

export function UpdateProviderKeyDialog({
  open,
  onOpenChange,
  provider,
  currentKeyPrefix,
}: UpdateProviderKeyDialogProps) {
  const [error, setError] = useState<string | null>(null);

  const getProviderDisplayName = () => {
    switch (provider) {
      case "replicate":
        return "Replicate";
      case "fal":
        return "FAL.ai";
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

  const getProviderIcon = () => {
    const iconClass = "h-6 w-6";
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

  const getPlaceholder = () => {
    switch (provider) {
      case "replicate":
        return "r8_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx";
      case "fal":
        return "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx";
      case "google-cloud":
        return "xxxxxxxxxxxxxxxxxxxxxxxxxxxxx";
      case "hume":
        return "xxxxxxxxxxxxxxxxxxxxxxxxxxxxx";
      case "elevenlabs":
        return "xxxxxxxxxxxxxxxxxxxxxxxxxxxxx";
      default:
        return "";
    }
  };

  const getInstructions = () => {
    switch (provider) {
      case "replicate":
        return (
          <>
            Get your API key from{" "}
            <a
              href="https://replicate.com/account/api-tokens"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              https://replicate.com/account/api-tokens
            </a>
          </>
        );
      case "fal":
        return (
          <>
            Get your API key from{" "}
            <a
              href="https://fal.ai/dashboard/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              https://fal.ai/dashboard/keys
            </a>
          </>
        );
      case "google-cloud":
        return (
          <>
            Get your API key from{" "}
            <a
              href="https://console.cloud.google.com/apis/credentials"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Google Cloud Console
            </a>
          </>
        );
      case "hume":
        return (
          <>
            Get your API key from{" "}
            <a
              href="https://platform.hume.ai/settings"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              https://platform.hume.ai/settings
            </a>
          </>
        );
      case "elevenlabs":
        return (
          <>
            Get your API key from{" "}
            <a
              href="https://elevenlabs.io/app/settings/api-keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              https://elevenlabs.io/app/settings/api-keys
            </a>
          </>
        );
      default:
        return "";
    }
  };

  const handleClose = () => {
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto p-0">
        <Formik
          initialValues={{
            apiKey: "",
          }}
          validationSchema={validationSchema}
          onSubmit={async (values, { setSubmitting, resetForm }) => {
            try {
              setError(null);
              await updateProviderKey({ provider, apiKey: values.apiKey });
              resetForm();
              handleClose();
              window.location.reload();
            } catch (err) {
              console.error("Error updating provider key:", err);
              setError(
                err instanceof Error ? err.message : "Failed to update key"
              );
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {({ isSubmitting, resetForm, handleSubmit }) => (
            <CardRoot spacing="none" className="p-0">
              <CardRootHeader>
                <div className="flex gap-2 items-start">
                  {getProviderIcon()}

                  <div>
                    <CardRootTitle>
                      <div className="flex items-center gap-3">
                        Configure {getProviderDisplayName()}
                      </div>
                    </CardRootTitle>
                    <CardRootText>
                      {currentKeyPrefix
                        ? `Update your ${getProviderDisplayName()} API key. Your current key starts with ${currentKeyPrefix}•••••••••••••••`
                        : `Add your ${getProviderDisplayName()} API key to enable this integration.`}
                    </CardRootText>
                  </div>
                </div>
              </CardRootHeader>

              <Card>
                <CardContent className="space-y-4">
                  <Form>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="apiKey">API Key</Label>
                        <InputForm
                          name="apiKey"
                          type="password"
                          placeholder={getPlaceholder()}
                          autoComplete="off"
                          className="font-mono"
                        />
                        <p className="text-sm text-secondary mt-2">
                          {getInstructions()}
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
                  Save Key
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
