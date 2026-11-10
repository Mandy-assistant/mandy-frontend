"use client";

import { Toast } from "@base-ui/react/toast";
import type { ReactNode } from "react";
import { Toaster } from "@/components/ui/toaster";

export const ToastProvider = ({ children }: { children: ReactNode }) => (
  <Toast.Provider>
    {children}
    <Toaster />
  </Toast.Provider>
);
