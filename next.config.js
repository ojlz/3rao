/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["sharp", "whatsapp-web.js"],
  },
  images: {
    domains: [],
    unoptimized: true,
  },
}

module.exports = nextConfig
