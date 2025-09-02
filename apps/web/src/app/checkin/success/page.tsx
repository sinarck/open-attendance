"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Confetti from "react-confetti";

export default function CheckinSuccess() {
  const params = useSearchParams();
  const name = params.get("name");

  const [size, setSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    const update = () =>
      setSize({ width: window.innerWidth, height: window.innerHeight });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return (
    <div className="min-h-svh flex items-center justify-center p-6">
      <Confetti
        width={size.width}
        height={size.height}
        numberOfPieces={300}
        gravity={1}
        recycle={false}
      />
      <div className="w-full max-w-md text-center space-y-4 relative">
        <h1 className="text-2xl font-semibold">Check-in Successful</h1>
        <p className="text-muted-foreground">
          You’re all set{name ? `, ${name}` : ""}. You can close this tab.
        </p>
      </div>
    </div>
  );
}

