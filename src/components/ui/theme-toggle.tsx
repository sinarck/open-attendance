"use client";

import { Check, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Menu, MenuItem, MenuPopup, MenuTrigger } from "@/components/ui/menu";

const themes = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
] as const;

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();

  return (
    <Menu>
      <MenuTrigger
        render={
          <Button aria-label="Toggle theme" size="icon" variant="outline" />
        }
      >
        <Sun className="scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
        <Moon className="absolute scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
      </MenuTrigger>
      <MenuPopup align="end">
        {themes.map((t) => (
          <MenuItem key={t.value} onClick={() => setTheme(t.value)}>
            {t.label}
            {theme === t.value && (
              <span className="ml-auto text-muted-foreground">
                <Check />
              </span>
            )}
          </MenuItem>
        ))}
      </MenuPopup>
    </Menu>
  );
};

export default ThemeToggle;
