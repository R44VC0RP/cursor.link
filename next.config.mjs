import { createMDX } from 'fumadocs-mdx/next';


/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  // Exclude cursor-link-cli from build process
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Ignore the cursor-link-cli directory
    config.watchOptions = {
      ...config.watchOptions,
      ignored: ['**/cursor-link-cli/**', '**/node_modules/**']
    }
    return config
  },
}

const withMDX = createMDX();
export default withMDX(nextConfig);
