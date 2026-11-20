import Link from "next/link";
import { Orb } from "@/components/shared/Orb";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center px-4">
      <section className="flex max-w-md flex-col items-center gap-4 text-center">
        <div className="relative">
          <Orb size={96} />
          <span className="absolute inset-0 grid place-items-center font-mono text-xl font-bold text-white">404</span>
        </div>
        <h1 className="text-2xl font-bold">This page wandered off</h1>
        <p className="text-muted-foreground">The link may be old, or the item was deleted.</p>
        <Link
          href="/"
          className="inline-flex h-10 items-center rounded-md bg-primary px-4 font-medium text-primary-foreground shadow-glow transition hover:-translate-y-px"
        >
          Back to your daily brief
        </Link>
      </section>
    </main>
  );
}
