import type { Metadata, Viewport } from "next"
import { Space_Grotesk, Inter } from "next/font/google"
import { AuthProvider } from "@/lib/auth-context"
import "./globals.css"

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
})

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Muster.club — Your Next Quest Awaits",
  description:
    "Guild-based career gig platform. Take quests, rank up, and build your career — from Rookie to Master.",
  keywords: [
    "gig work",
    "freelance",
    "career progression",
    "quests",
    "guild",
    "Singapore",
    "rank up",
  ],
  openGraph: {
    title: "Muster.club — Your Next Quest Awaits",
    description:
      "Guild-based career gig platform. Take quests, rank up, and build your career.",
    siteName: "Muster.club",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Muster.club — Your Next Quest Awaits",
    description:
      "Guild-based career gig platform. Take quests, rank up, and build your career.",
  },
}

export const viewport: Viewport = {
  themeColor: "#0F0D15",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-visual",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${inter.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-bg-dark text-text-primary-dark antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
