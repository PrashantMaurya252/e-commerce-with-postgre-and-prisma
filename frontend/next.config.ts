import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: "export",
  images: {
    domains: ["images.unsplash.com","res.cloudinary.com"],
  },
};

export default nextConfig;
