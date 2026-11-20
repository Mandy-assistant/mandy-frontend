import { Orb } from "@/components/shared/Orb";

/** Full-screen dark stage with aurora blobs, shared by unlock, setup and recover. */
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="dark relative grid min-h-dvh place-items-center overflow-hidden bg-stage px-4 py-24 text-stage-foreground">
      <div aria-hidden className="aurora -top-[16vmax] -right-[10vmax] size-[46vmax] bg-[#7c5cff] opacity-45" />
      <div aria-hidden className="aurora -bottom-[14vmax] -left-[10vmax] size-[36vmax] bg-[#22d3ee] opacity-30 [animation-delay:-5s]" />
      <div aria-hidden className="aurora -top-[6vmax] left-[12vmax] size-[22vmax] bg-[#e05bd0] opacity-15 [animation-delay:-9s]" />

      <div className="absolute top-[max(28px,env(safe-area-inset-top))] left-7 flex items-center gap-2.5 font-semibold">
        <Orb size={28} />
        Mandy
      </div>

      <main className="relative w-full max-w-[420px]">{children}</main>

      <p className="absolute right-4 bottom-[max(24px,env(safe-area-inset-bottom))] left-4 text-center text-xs text-stage-muted">
        Passwordless. Passkeys use Face ID, Touch ID or Windows Hello, and only a public key is stored on the server.
      </p>
    </div>
  );
}
