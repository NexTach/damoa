import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Syne } from "next/font/google";
import { SwRegister } from "@/components/sw-register";
import { themeBootScript } from "@/lib/theme";
import "./globals.css";

const syne = Syne({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--type-display",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--type-mono",
});

export const metadata: Metadata = {
  title: "damoa — lab",
  description: "Next.js로 만든 인터랙티브 실험들. 휠을 돌려 둘러보세요.",
  applicationName: "damoa",
  appleWebApp: {
    capable: true,
    title: "damoa",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      { url: "/icons/icon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#08080a" },
    { media: "(prefers-color-scheme: light)", color: "#f3f2ec" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="ko"
      className={`${syne.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Apply persisted theme before first paint to avoid a flash. */}
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: trusted inline boot script */}
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body>
        {children}
        <div className="vignette" aria-hidden />
        <div className="grain" aria-hidden />
        <SwRegister />
      </body>
    </html>
  );
}
