"use client";

import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryProvider } from "./QueryProvider";

export const Providers = ({ children }: { children: ReactNode }) => (
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
    <QueryProvider>
      <TooltipProvider delay={300}>
        {children}
        <Toaster position="bottom-center" richColors closeButton />
      </TooltipProvider>
    </QueryProvider>
  </ThemeProvider>
);
