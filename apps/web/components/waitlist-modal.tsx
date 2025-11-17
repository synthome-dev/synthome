"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent
} from "@/components/ui/dialog";
import { Waitlist } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { useState } from "react";

export function WaitlistModal() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button size="sm" onClick={() => setOpen(true)}>
        Join waitlist
      </Button>
      <DialogContent className="flex items-center justify-center">
        <Waitlist appearance={{ theme: dark }} />
      </DialogContent>
    </Dialog>
  );
}
