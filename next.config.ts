import type { NextConfig } from "next";

// The browser calls /api/v1 on the frontend's own origin and Next forwards it to FastAPI.
// That keeps the auth cookies first-party and avoids CORS in the browser.
const apiTarget = process.env.API_PROXY_TARGET ?? "http://localhost:8000";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async rewrites() {
    return [{ source: "/api/v1/:path*", destination: `${apiTarget}/api/v1/:path*` }];
  },
};

export default nextConfig;
