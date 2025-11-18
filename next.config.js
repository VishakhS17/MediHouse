/** @type {import('next').NextConfig} */
const nextConfig = {
  // Removed 'output: export' to enable API routes
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  reactStrictMode: true,
  // Performance optimizations
  compress: true, // Enable gzip compression
  poweredByHeader: false, // Remove X-Powered-By header for security
  // Note: swcMinify is enabled by default in Next.js 16, no need to specify
  // Note: optimizeCss requires critters package, removed to avoid build errors
}

module.exports = nextConfig

