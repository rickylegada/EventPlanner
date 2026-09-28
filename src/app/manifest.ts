import type { MetadataRoute } from "next";

/**
 * Lets everyone add the app to their phone's home screen and open it without
 * browser chrome, which is how this will mostly be used — one-handed, at the
 * court, updating who turned up.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Pickle — group events",
    short_name: "Pickle",
    description: "Who's playing, who came, and who still owes for the court.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f5f5f4",
    theme_color: "#059669",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
