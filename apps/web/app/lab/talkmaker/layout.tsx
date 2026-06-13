import type { Metadata } from "next";

// Override the site manifest on this route so an install here becomes a
// focused "Personae" app (its own name/icon/start_url), separate from damoa.
export const metadata: Metadata = {
  title: "Personae",
  manifest: "/talkmaker.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Personae",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      { url: "/icons/talkmaker.svg", type: "image/svg+xml" },
      { url: "/icons/talkmaker-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/icons/talkmaker-apple.png", sizes: "180x180" }],
  },
};

export default function TalkmakerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
