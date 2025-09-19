"use client";

import { useSearchParams } from "next/navigation";
import Confetti from "react-confetti";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function CheckinSuccess() {
  const params = useSearchParams();
  const name = params.get("name");
  const firstName = name?.trim().split(/\s+/)[0] ?? null;

  return (
    <div className="min-h-svh flex items-center justify-center p-6 relative overflow-hidden">
      <Confetti
        width={typeof window !== "undefined" ? window.innerWidth : 0}
        height={typeof window !== "undefined" ? window.innerHeight : 0}
        numberOfPieces={100}
        gravity={1}
        recycle={false}
      />
      <Card className="w-full max-w-md text-center">
        <CardHeader className="space-y-3">
          <CardTitle>Check-in Successful</CardTitle>
          <CardDescription>
            {firstName
              ? `You’re all set, ${firstName}. You can close this tab.`
              : "You’re all set. You can close this tab."}
          </CardDescription>
        </CardHeader>
        <CardContent />
      </Card>
    </div>
  );
}
