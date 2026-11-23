"use client";

import { AlertTriangle, Home, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { Orb } from "@/components/shared/Orb";
import { Button, buttonVariants } from "@/components/ui/button";

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section role="alert" className="mx-auto flex max-w-md flex-col items-center gap-4 py-20 text-center">
      <div className="relative">
        <Orb size={88} />
        <span className="absolute -right-1 -bottom-1 grid size-9 place-items-center rounded-full border-4 border-background bg-destructive-soft text-destructive">
          <AlertTriangle className="size-4" aria-hidden />
        </span>
      </div>
      <h1 className="text-2xl font-bold">Something went sideways</h1>
      <p className="text-muted-foreground">Mandy hit an unexpected error on this page. Trying again usually fixes it.</p>
      <div className="flex gap-2">
        <Button onClick={reset}>
          <RotateCcw data-icon="inline-start" />
          Retry
        </Button>
        <Link href="/" className={buttonVariants({ variant: "outline" })}>
          <Home data-icon="inline-start" />
          Daily brief
        </Link>
      </div>
    </section>
  );
}
