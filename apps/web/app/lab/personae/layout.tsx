import type { Metadata } from "next";

// Override the site manifest on this route so an install here becomes a
// focused "Personae" app (its own name/icon/start_url), separate from damoa.
export const metadata: Metadata = {
  title: "Personae",
  manifest: "/personae.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Personae",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      { url: "/icons/personae.svg", type: "image/svg+xml" },
      { url: "/icons/personae-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/icons/personae-apple.png", sizes: "180x180" }],
  },
};

export default function PersonaeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Handwriting face for the letter view. The woff2 (incl. Korean glyphs)
          is fetched lazily via unicode-range only when a letter is opened. */}
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Nanum+Pen+Script&display=swap"
      />
      {children}
    </>
  );
}
