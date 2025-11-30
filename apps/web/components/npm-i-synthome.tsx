"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

export const NpmISynthome = () => {
  const [copied, setCopied] = useState(false);
  const command = "npm i @synthome/sdk";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="ring-foreground/5 relative z-20 col-span-2 row-span-2 gap-2 self-center rounded-md border border-transparent bg-zinc-50 p-2 shadow ring-1 font-mono h-9 flex items-center cursor-pointer hover:bg-zinc-100 transition-colors"
    >
      <span className="text-foreground/70 text-xs">{command}</span>
      {copied ? (
        <Check className="size-3.5 text-foreground/70" />
      ) : (
        <Copy className="size-3.5 text-foreground/70" />
      )}
    </button>
  );
};
