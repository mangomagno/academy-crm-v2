import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "@/components/providers";
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
  title: "Academy CRM",
  description: "A CRM for freelance music teachers",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased scanlines relative min-h-screen`}
      >
        <Providers>
          {children}
          <Toaster richColors position="top-right" />

          {/* Authentic 2001 Branding */}
          <div className="fixed bottom-4 left-4 z-[100] scale-75 origin-bottom-left">
            <div className="parental-advisory">
              PARENTAL ADVISORY<br />
              <span className="text-[0.6rem] block leading-none">EXPLICIT CONTENT</span>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
