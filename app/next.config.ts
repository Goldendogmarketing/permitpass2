import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
  // Ensure pdfjs-dist canvas module isn't bundled server-side
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push('canvas');
    }
    return config;
  },
};

export default nextConfig;
