import type { Metadata } from "next";
import { Suspense } from "react";
import { Shimmer } from "@/components/shared/skeletons";
import { ResumeEditor } from "@/features/resumes/components/ResumeEditor";

export const metadata: Metadata = { title: "Edit resume" };

export default function ResumeEditorPage({ params }: PageProps<"/resumes/[id]">) {
  return (
    <Suspense fallback={<Shimmer className="h-[68px] rounded-xl" />}>
      {params.then(({ id }) => (
        <ResumeEditor id={id} />
      ))}
    </Suspense>
  );
}
