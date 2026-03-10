import type { NextConfig } from "next";

const isStaticExport = process.env.STATIC_EXPORT === 'true';

// Content Security Policy for security hardening
const cspHeader = [
  "default-src 'self'",
  // Scripts: allow self and Next.js inline scripts (required for hydration)
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  // Styles: allow self and inline styles (Tailwind/framer-motion use inline styles)
  "style-src 'self' 'unsafe-inline'",
  // Images: allow self and data URIs
  "img-src 'self' data: blob:",
  // Fonts: allow self and Google Fonts
  "font-src 'self'",
  // Connect: allow self + Hugging Face CDN for model downloads
  "connect-src 'self' https://huggingface.co https://cdn-lfs.huggingface.co",
  // Workers: needed for @huggingface/transformers WASM workers
  "worker-src 'self' blob:",
  // Frames: disallow framing
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: cspHeader },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

const nextConfig: NextConfig = {
  reactCompiler: true,

  // Security headers for the server-rendered / API mode
  ...(!isStaticExport && {
    async headers() {
      return [
        {
          source: '/(.*)',
          headers: securityHeaders,
        },
      ];
    },
  }),

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
