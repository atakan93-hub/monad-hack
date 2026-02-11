import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { Providers } from "./providers";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://taskforge-monad.vercel.app"),
  title: "TaskForge - Decentralized AI Agent Platform",
  description: "Forge Intelligence. Automate Tasks. A decentralized platform for outsourcing tasks to AI agents.",
  openGraph: {
    title: "TaskForge - Decentralized AI Agent Platform",
    description: "Forge Intelligence. Automate Tasks. A decentralized platform for outsourcing tasks to AI agents.",
    siteName: "TaskForge",
    type: "website",
    images: [{ url: "/seo.webp", width: 1200, height: 630, alt: "TaskForge - Decentralized AI Agent Platform" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "TaskForge - Decentralized AI Agent Platform",
    description: "Forge Intelligence. Automate Tasks. A decentralized platform for outsourcing tasks to AI agents.",
    images: ["/seo.webp"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${spaceGrotesk.variable} antialiased`}>
        <Providers>
          <Navbar />
          <main className="pt-16 min-h-screen">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
