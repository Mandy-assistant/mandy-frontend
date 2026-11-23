import { Newspaper } from "lucide-react";
import Link from "next/link";
import { NewsMiniList } from "@/features/news";
import type { NewsItem } from "../types";
import { BentoCard } from "./BentoCard";

export const ForYouCard = ({ news }: { news: NewsItem[] }) => (
  <BentoCard title="For you" href="/news" linkLabel="All news" labelledBy="brief-news">
    {news.length ? (
      <NewsMiniList items={news.slice(0, 2)} />
    ) : (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-lg border-[1.5px] border-dashed py-8 text-center">
        <Newspaper className="size-5 text-primary-strong" aria-hidden />
        <p className="font-medium">No news picked yet</p>
        <Link href="/news" className="text-sm text-primary-strong underline-offset-4 hover:underline">
          Browse tech news
        </Link>
      </div>
    )}
  </BentoCard>
);
