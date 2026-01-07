/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['raw.githubusercontent.com'],
  },
  serverExternalPackages: ['firebase-admin'],
}

module.exports = nextConfig
