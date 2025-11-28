import type { NextConfig } from "next";

const isStaticExport = process.env.STATIC_EXPORT === 'true';

const nextConfig: NextConfig = {
  reactCompiler: true,

  ...(isStaticExport && {
    output: 'export',
    trailingSlash: true,
    images: {
      unoptimized: true,
    },
    basePath: '/shai-hulud-scan',
    assetPrefix: '/shai-hulud-scan',
    // Exclude API routes (which are .ts) from the build when exporting statically
    pageExtensions: ['tsx'],
  }),
};

export default nextConfig;
