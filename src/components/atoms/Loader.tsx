import { LoaderCircle } from "lucide-react";
import { cn } from "@/utils/cn";

type LoaderProps = { label?: string; fullScreen?: boolean; className?: string };

export const Loader = ({ label = "Loading…", fullScreen = false, className }: LoaderProps) => (
  <div
    role="status"
    className={cn("flex items-center justify-center gap-2 text-sm text-body", fullScreen && "min-h-dvh", className)}
  >
    <LoaderCircle className="size-5 animate-spin" aria-hidden />
    <span>{label}</span>
  </div>
);
