import Header from "@/components/header";
import Providers from "@/components/providers";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../index.css";

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
  description:
    "Custom built attendance system for a Business Professionals of America chapter",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <div className="grid grid-rows-[auto_1fr_auto] min-h-svh">
            <Header />
            {children}
            <footer className="text-xs sm:text-sm md:text-base text-muted-foreground px-3 py-3 text-center">
              Designed and built by Aadi Sanghvi
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}

