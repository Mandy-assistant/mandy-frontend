"use client";

import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export const ReloadButton = () => (
  <Button onClick={() => window.location.reload()} size="lg">
    <RefreshCw data-icon="inline-start" aria-hidden /> Try again
  </Button>
);
