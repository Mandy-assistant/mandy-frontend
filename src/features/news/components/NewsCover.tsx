"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/utils/cn";
import { categoryMeta } from "../categories";
import type { NewsItem } from "../types";

// Tiny blurred placeholder shown while a remote image loads (gradient cover sits underneath too).
const BLUR =
  "data:image/svg+xml;base64," +
  "PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHZpZXdCb3g9JzAgMCA4IDUnPjxmaWx0ZXIgaWQ9J2InPjxmZUdhdXNzaWFuQmx1ciBzdGREZXZpYXRpb249JzEnLz48L2ZpbHRlcj48cmVjdCB3aWR0aD0nOCcgaGVpZ2h0PSc1JyBmaWxsPSdyZ2IoMTI0IDkyIDI1NSAvIDAuMzUpJyBmaWx0ZXI9J3VybCgjYiknLz48L3N2Zz4=";

type Props = { item: Pick<NewsItem, "image_url" | "category" | "title">; className?: string; compact?: boolean; sizes?: string };

/** Article image with a category gradient fallback (no image, or it failed to load). */
export const NewsCover = ({
  item,
  className,
  compact,
  sizes = "(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw",
}: Props) => {
  const [failed, setFailed] = useState(false);
  const meta = categoryMeta(item.category);
  const showImage = !!item.image_url && !failed;

  return (
    <div className={cn("relative overflow-hidden", meta.cover, className)}>
      {/* soft highlight so flat gradients feel less flat */}
      <span
        aria-hidden
        className="pointer-events-none absolute -top-1/2 -right-1/4 size-[120%] rounded-full bg-white/15 blur-2xl"
      />
      {!showImage && !compact && (
        <b
          aria-hidden
          className="absolute bottom-3 left-4 text-[40px] leading-none font-extrabold tracking-[-0.04em] text-white/90"
        >
          {meta.word}
        </b>
      )}
      {showImage && (
        <Image
          src={item.image_url!}
          alt=""
          fill
          sizes={sizes}
          // RSS images come from any host; see report re: images.remotePatterns.
          unoptimized
          placeholder="blur"
          blurDataURL={BLUR}
          className="object-cover"
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
};
