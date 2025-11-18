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
  // Optimize production builds
  swcMinify: true, // Use SWC minifier (faster than Terser)
  // Experimental features for better performance
  experimental: {
    optimizeCss: true, // Optimize CSS
  },
}

module.exports = nextConfig

