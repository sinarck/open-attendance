import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import { Navbar } from "@/components/navbar";
import { Toaster } from "@/components/ui/sonner";
import { TRPCProvider } from "@/trpc/client";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BPA Attendance",
  description: "Simple QR-based attendance system for CTSO chapters",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-background antialiased flex flex-col`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <TRPCProvider>
            <Navbar />
            <main className="mx-auto w-full max-w-screen-2xl px-4 md:px-6 lg:px-8 py-8 flex-1">
              {children}
            </main>
            <footer className="mt-auto border-t">
              <div className="mx-auto w-full max-w-screen-2xl px-4 md:px-6 lg:px-8 py-6 text-center text-sm text-muted-foreground">
                Designed and built by Aadi Sanghvi
              </div>
            </footer>
            <Toaster richColors position="top-center" />
          </TRPCProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
