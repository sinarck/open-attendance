"use client";

import Avatar from "boring-avatars";
import { cn } from "@/lib/utils";

const PALETTE = ["#6366f1", "#0ea5e9", "#14b8a6", "#f59e0b", "#ef4444"];

interface UserAvatarProps {
  name: string;
  size?: number;
  className?: string;
}

export function UserAvatar({ name, size = 32, className }: UserAvatarProps) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full",
        className,
      )}
    >
      <Avatar name={name} size={size} variant="geometric" colors={PALETTE} />
    </span>
  );
}
