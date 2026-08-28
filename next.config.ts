import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@prisma/client",
    "@prisma/client-pg",
    "pdfkit",
    "fontkit",
    "nodemailer",
  ],
  experimental: {
    serverActions: {
      bodySizeLimit: "16mb",
    },
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@prisma/client-pg": path.join(
        process.cwd(),
        "node_modules/@prisma/client-pg"
      ),
    };
    return config;
  },
};

export default nextConfig;
