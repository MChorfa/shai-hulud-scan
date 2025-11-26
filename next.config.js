/** @type {import('next').NextConfig} */
const isProduction = process.env.NODE_ENV === 'production';

const nextConfig = {
  // Only apply static export in production
  ...(isProduction && {
    output: 'export',
    trailingSlash: true,
    images: {
      unoptimized: true,
    },
    // Only apply assetPrefix and basePath in production
    ...(process.env.GITHUB_PAGES && {
      assetPrefix: '/shai-hulud-security',
      basePath: '/shai-hulud-security',
    }),
  }),
  
  // Disable rewrites only in production
  ...(isProduction && {
    async rewrites() {
      return [];
    },
  }),
  
  // Exclude API routes from static export
  ...(isProduction && {
    excludeDefaultMomentLocales: false,
  }),
};

module.exports = nextConfig;
