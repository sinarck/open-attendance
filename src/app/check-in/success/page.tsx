"use client";

import { CheckCircle2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import Confetti from "react-confetti";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function CheckinSuccess() {
  const params = useSearchParams();
  const name = params.get("name");
  const firstName = name?.trim().split(/\s+/)[0] ?? null;
  const message = firstName
    ? `You’re all set, ${firstName}. You can close this tab.`
    : "You’re all set. You can close this tab.";

  return (
    <div className="flex-1 flex items-center justify-center p-6 relative">
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 30%, hsl(var(--primary)/0.12), transparent 70%)",
        }}
      />

      <Confetti
        width={typeof window !== "undefined" ? window.innerWidth : 0}
        height={typeof window !== "undefined" ? window.innerHeight : 0}
        numberOfPieces={160}
        gravity={0.9}
        recycle={false}
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 50,
        }}
      />

      <Card className="w-full max-w-md sm:max-w-lg text-center rounded-2xl shadow-xl bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60 border">
        <CardHeader className="space-y-2">
          <div className="mx-auto grid place-items-center">
            <div className="rounded-full bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/20 p-3">
              <CheckCircle2 className="h-8 w-8" />
            </div>
          </div>
          <CardTitle className="text-2xl sm:text-3xl">
            Check-in Successful
          </CardTitle>
          <CardDescription className="text-base sm:text-lg">
            {message}
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
