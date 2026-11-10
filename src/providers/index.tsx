import type { ReactNode } from "react";
import { QueryProvider } from "./QueryProvider";
import { ToastProvider } from "./ToastProvider";

export const Providers = ({ children }: { children: ReactNode }) => (
  <QueryProvider>
    <ToastProvider>{children}</ToastProvider>
  </QueryProvider>
);
