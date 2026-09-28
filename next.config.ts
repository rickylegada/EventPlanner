import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // The floating dev badge sits on top of the bottom nav on a phone-sized
  // screen, which makes the Events tab hard to hit while developing.
  devIndicators: false,
};

export default nextConfig;
