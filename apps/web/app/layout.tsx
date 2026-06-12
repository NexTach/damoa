import type { Metadata } from "next";
import { JetBrains_Mono, Syne } from "next/font/google";
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
      </body>
    </html>
  );
}
