import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pickleball Sweatshow",
  description: "Who's playing, who came, and who still owes for the court.",
  // Lets everyone "Add to Home Screen" and get a full-screen, app-like window.
  appleWebApp: { capable: true, title: "Sweatshow", statusBarStyle: "default" },
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/apple-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Deliberately not locking zoom — the inputs are already 16px so iOS will
  // not auto-zoom, and pinch-to-zoom stays available for anyone who needs it.
  viewportFit: "cover",
  themeColor: "#059669",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
