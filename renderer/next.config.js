/** @type {import('next').NextConfig} */
module.exports = {
  // output: 'export', // ← この行を削除またはコメントアウト
  distDir: process.env.NODE_ENV === 'production' ? '../app' : '.next',
  trailingSlash: false, // ← true から false に変更
  images: {
    unoptimized: true,
  },
  webpack: (config) => {
    return config
  },
}