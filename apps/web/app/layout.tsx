import { ClerkProvider } from "@clerk/nextjs";
import { RootProvider } from "fumadocs-ui/provider/next";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Synthome",
  description: "AI media pipelines as code",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className="dark" suppressHydrationWarning>
        <head>
          <link
            rel="icon"
            type="image/png"
            href="/favicon-96x96.png"
            sizes="96x96"
          />
          <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
          <link rel="shortcut icon" href="/favicon.ico" />
          <link
            rel="apple-touch-icon"
            sizes="180x180"
            href="/apple-touch-icon.png"
          />
          <meta name="apple-mobile-web-app-title" content="Synthome" />
          <link rel="manifest" href="/site.webmanifest" />
          <meta
            property="og:title"
            content="Synthome – AI Media Pipelines for Developers"
          />
          <meta
            property="og:description"
            content="Build AI video, image, and audio pipelines with a simple composable API"
          />
          <meta
            property="og:image"
            content="https://synthome.dev/social-preview.png"
          />
          <meta property="og:url" content="https://synthome.dev" />
          <meta property="og:type" content="website" />

          <meta name="twitter:card" content="summary_large_image" />
          <meta
            name="twitter:title"
            content="Synthome – AI Media Pipelines for Developers"
          />
          <meta
            name="twitter:description"
            content="Build AI video, image, and audio pipelines with a simple composable API"
          />
          <meta
            name="twitter:image"
            content="https://synthome.dev/social-preview.png"
          />
          <script
            defer
            data-website-id="dfid_nPdHu4ZXG6oDcOPzMm6Bd"
            data-domain="synthome.dev"
            src="https://datafa.st/js/script.js"
          />
        </head>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <RootProvider>{children}</RootProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
