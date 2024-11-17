import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.clerk.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "localhost.localstack.cloud",
        port: "4566",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;