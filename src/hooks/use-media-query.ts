"use client";

import { useSyncExternalStore } from "react";

const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const;

type Breakpoint = keyof typeof BREAKPOINTS;
type Pointer = "coarse" | "fine";

type BreakpointQuery = Breakpoint | `max-${Breakpoint}` | `${Breakpoint}:max-${Breakpoint}`;

interface MediaQueryInput {
  min?: Breakpoint | number;
  max?: Breakpoint | number;
  pointer?: Pointer;
}

function getWidthValue(value: Breakpoint | number, type: "min" | "max") {
  const width = typeof value === "number" ? value : BREAKPOINTS[value];

  return type === "max" ? `${width - 0.02}px` : `${width}px`;
}

function buildMediaQuery(query: BreakpointQuery | MediaQueryInput) {
  if (typeof query === "string") {
    if (query.startsWith("(")) {
      return query;
    }

    const rangeMatch = query.match(/^(sm|md|lg|xl|2xl):max-(sm|md|lg|xl|2xl)$/);

    if (rangeMatch) {
      const [, min, max] = rangeMatch as [string, Breakpoint, Breakpoint];

      return `(min-width: ${getWidthValue(min, "min")}) and (max-width: ${getWidthValue(max, "max")})`;
    }

    if (query.startsWith("max-")) {
      const breakpoint = query.slice(4) as Breakpoint;

      return `(max-width: ${getWidthValue(breakpoint, "max")})`;
    }

    return `(min-width: ${getWidthValue(query as Breakpoint, "min")})`;
  }

  const parts: string[] = [];

  if (query.min !== undefined) {
    parts.push(`(min-width: ${getWidthValue(query.min, "min")})`);
  }

  if (query.max !== undefined) {
    parts.push(`(max-width: ${getWidthValue(query.max, "max")})`);
  }

  if (query.pointer !== undefined) {
    parts.push(`(pointer: ${query.pointer})`);
  }

  return parts.join(" and ");
}

function subscribe(query: string, callback: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const mediaQueryList = window.matchMedia(query);
  mediaQueryList.addEventListener("change", callback);

  return () => {
    mediaQueryList.removeEventListener("change", callback);
  };
}

function getSnapshot(query: string) {
  if (typeof window === "undefined") {
    return false;
  }

  return window.matchMedia(query).matches;
}

export function useMediaQuery(query: BreakpointQuery | MediaQueryInput) {
  const mediaQuery = buildMediaQuery(query);

  return useSyncExternalStore(
    (callback) => subscribe(mediaQuery, callback),
    () => getSnapshot(mediaQuery),
    () => false,
  );
}

export function useIsMobile() {
  return useMediaQuery("max-md");
}
