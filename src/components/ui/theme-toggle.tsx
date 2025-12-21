"use client";

import { Moon02Icon, Sun02Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Menu, MenuItem, MenuPopup, MenuTrigger } from "@/components/ui/menu";
import { Skeleton } from "./skeleton";

const themes = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
] as const;

const ThemeToggle = () => {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Prevents hydration mismatch, since `theme` is not available during SSR
    return (
      <Skeleton
        className={buttonVariants({ size: "icon", variant: "ghost" })}
      />
    );
  }

  return (
    <Menu>
      <MenuTrigger
        render={
          <Button aria-label="Toggle theme" size="icon" variant="outline" />
        }
      >
        <HugeiconsIcon
          className="size-4 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90"
          icon={Sun02Icon}
        />
        <HugeiconsIcon
          className="absolute size-4 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0"
          icon={Moon02Icon}
        />
      </MenuTrigger>
      <MenuPopup align="end">
        {themes.map((t) => (
          <MenuItem key={t.value} onClick={() => setTheme(t.value)}>
            {t.label}
            {theme === t.value && (
              <span className="ml-auto text-muted-foreground">
                <HugeiconsIcon icon={Tick02Icon} />
              </span>
            )}
          </MenuItem>
        ))}
      </MenuPopup>
    </Menu>
  );
};

export default ThemeToggle;
