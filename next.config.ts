import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // The floating dev badge sits on top of the bottom nav on a phone-sized
  // screen, which makes the Events tab hard to hit while developing.
  devIndicators: false,
  experimental: {
    // QR screenshots can be a couple of MB; the default action body cap is 1MB.
    serverActions: { bodySizeLimit: "6mb" },
  },
};

export default nextConfig;
