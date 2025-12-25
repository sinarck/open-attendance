import type { Metadata } from "next";
import "./globals.css";
import { Footer } from "@/components/navigation/footer";
import { Navbar } from "@/components/navigation/navbar";
import { Providers } from "@/components/providers";
import { siteConfig } from "@/config";
import { cn } from "@/lib/utils";
import { figtree, geistMono } from "./ui/fonts";

export const metadata: Metadata = {
  title: siteConfig.name,
  description: siteConfig.description,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(figtree.variable, geistMono.variable)}
    >
      <body className="antialiased pt-header">
        <Providers>
          <Navbar />
          {children}
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
