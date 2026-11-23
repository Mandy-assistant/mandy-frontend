import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Mandy — personal assistant",
    short_name: "Mandy",
    description: "Your daily brief, study tasks, job tracker, roadmaps and tech news in one place.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    display_override: ["window-controls-overlay", "standalone"],
    orientation: "portrait-primary",
    categories: ["productivity", "news", "education"],
    shortcuts: [
      { name: "Tech news", short_name: "News", url: "/news", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      {
        name: "Discover jobs",
        short_name: "Jobs",
        url: "/jobs/discover",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
      { name: "Tasks", short_name: "Tasks", url: "/tasks", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
    background_color: "#0b0a12",
    theme_color: "#7c5cff",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
