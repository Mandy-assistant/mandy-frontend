import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Mandy — personal assistant",
    short_name: "Mandy",
    description: "Your daily brief, study tasks, job tracker, roadmaps and tech news in one place.",
    start_url: "/",
    display: "standalone",
    background_color: "#0b0a12",
    theme_color: "#7c5cff",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
