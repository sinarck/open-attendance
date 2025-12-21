import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/ui/theme-toggle";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      Placeholder page
      <ThemeToggle />
      <Button>Check in</Button>
    </div>
  );
}
