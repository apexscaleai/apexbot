import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { MicrophoneContextProvider } from "./context/MicrophoneContextProvider";
import { VoiceBotContextProvider } from "./context/VoiceBotContextProvider";

const inter = Inter({ subsets: ["latin"] });

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#0d0d0d',
};

export const metadata: Metadata = {
  title: "Apex Scale AI - Intelligent Voice Assistant",
  description: "Experience Lexy, our advanced AI assistant that combines voice and text interactions for intelligent business automation.",
  keywords: "AI assistant, voice chat, chatbot, business automation, Apex Scale AI",
  authors: [{ name: "Apex Scale AI" }],
  metadataBase: new URL('https://aibot.apexscaleai.com'),
  openGraph: {
    title: "Apex Scale AI - Intelligent Voice Assistant",
    description: "Experience Lexy, our advanced AI assistant",
    url: "https://aibot.apexscaleai.com",
    siteName: "Apex Scale AI",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Apex Scale AI - Intelligent Voice Assistant",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Apex Scale AI - Intelligent Voice Assistant",
    description: "Experience Lexy, our advanced AI assistant",
    images: ["/og-image.png"],
  },
  robots: "index, follow",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <MicrophoneContextProvider>
          <VoiceBotContextProvider>
            {children}
          </VoiceBotContextProvider>
        </MicrophoneContextProvider>
      </body>
    </html>
  );
}