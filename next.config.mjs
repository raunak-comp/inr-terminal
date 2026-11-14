/** @type {import('next').NextConfig} */
const STATIC = process.env.STATIC_EXPORT === "1";
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  allowedDevOrigins: ["*.e2b.app", "*.e2b.dev"],
  experimental: { optimizePackageImports: ["lucide-react", "echarts"] },
  // GitHub Pages build: `STATIC_EXPORT=1 NEXT_PUBLIC_STATIC=1 BASE_PATH=/inr-terminal next build` (without app/api)
  ...(STATIC ? { output: "export", trailingSlash: true, images: { unoptimized: true }, basePath: process.env.BASE_PATH || "" } : {}),
};
export default nextConfig;
