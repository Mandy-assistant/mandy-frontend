import type { Metadata } from "next";
import { Suspense } from "react";
import { DetailSkeleton } from "@/components/shared/skeletons";
import { ProfileView } from "@/features/profile/components/ProfileView";

export const metadata: Metadata = { title: "Profile" };

export default function ProfilePage() {
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <ProfileView />
    </Suspense>
  );
}
