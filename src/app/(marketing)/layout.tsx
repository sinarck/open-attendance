import type { ReactNode } from "react";
import { Footer } from "@/components/navigation/footer";
import { Navbar } from "@/components/navigation/navbar";

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Navbar />
      {children}
      <Footer />
    </>
  );
}
