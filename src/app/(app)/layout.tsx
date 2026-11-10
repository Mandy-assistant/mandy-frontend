import { TopNavBar } from "@/components/organisms/TopNavBar";
import { ProtectedGuard } from "@/guards/ProtectedGuard";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <ProtectedGuard>
      <TopNavBar />
      <main className="mx-auto w-full max-w-page px-6 py-8">{children}</main>
    </ProtectedGuard>
  );
}
