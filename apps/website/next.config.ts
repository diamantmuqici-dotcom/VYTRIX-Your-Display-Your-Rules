import type { NextConfig } from "next";

// GitHub Pages project sites are served from /<repo>/. Pin the prefix so
// <Link>, metadata and OG image URLs all resolve under the same path.
const basePath =
  process.env.NEXT_PUBLIC_BASE_PATH ?? "/VYTRIX-Your-Display-Your-Rules";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  output: "export",
  basePath,
  trailingSlash: true,
  // Static hosting has no image optimizer route.
  images: { unoptimized: true },
};

export default nextConfig;
