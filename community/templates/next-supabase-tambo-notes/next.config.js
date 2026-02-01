/** @type {import('next').NextConfig} */
const webpack = require('webpack')

const nextConfig = {
  webpack: (config, { isServer, dev }) => {
    // Handle external dependencies that might not be properly resolved
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      }
    }
    
    // Ignore missing optional peer dependencies (like 'sury' from @standard-community/standard-json)
    config.plugins = config.plugins || []
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^(sury|@sury\/.*)$/,
      })
    )
    
    // Improve chunk loading in development
    if (dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          ...config.optimization.splitChunks,
          cacheGroups: {
            ...config.optimization.splitChunks?.cacheGroups,
            default: {
              minChunks: 1,
              priority: -20,
              reuseExistingChunk: true,
            },
          },
        },
      }
    }
    
    return config
  },
  // Transpile packages from the monorepo
  transpilePackages: ['@tambo-ai/react', '@tambo-ai/ui-registry'],
  // Optimize package imports
  experimental: {
    optimizePackageImports: ['@tambo-ai/react', '@tambo-ai/ui-registry'],
  },
  // Suppress React DevTools message in production
  reactStrictMode: true,
}

module.exports = nextConfig
