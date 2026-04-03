"use client";

import { useSyncExternalStore } from "react";

const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
  "3xl": 1600,
  "4xl": 2000,
} as const;

type Breakpoint = keyof typeof BREAKPOINTS;
type BreakpointQuery = Breakpoint | `max-${Breakpoint}` | `${Breakpoint}:max-${Breakpoint}`;

interface MediaQueryInput {
  min?: Breakpoint | number;
  max?: Breakpoint | number;
  pointer?: "coarse" | "fine";
}

function isRawMediaQuery(query: string) {
  return query.startsWith("(");
}

function resolveBreakpoint(value: Breakpoint | number) {
  return typeof value === "number" ? value : BREAKPOINTS[value];
}

function buildMediaQuery(query: MediaQueryInput | string) {
  if (typeof query === "string") {
    if (isRawMediaQuery(query)) {
      return query;
    }

    if (query.startsWith("max-")) {
      const breakpoint = query.slice(4) as Breakpoint;
      return `(max-width: ${resolveBreakpoint(breakpoint) - 0.02}px)`;
    }

    const rangeMatch = query.match(/^(sm|md|lg|xl|2xl|3xl|4xl):max-(sm|md|lg|xl|2xl|3xl|4xl)$/);

    if (rangeMatch) {
      const [, min, max] = rangeMatch as [string, Breakpoint, Breakpoint];
      return `(min-width: ${resolveBreakpoint(min)}px) and (max-width: ${resolveBreakpoint(max) - 0.02}px)`;
    }

    return `(min-width: ${resolveBreakpoint(query as Breakpoint)}px)`;
  }

  const clauses = [];

  if (query.min !== undefined) {
    clauses.push(`(min-width: ${resolveBreakpoint(query.min)}px)`);
  }

  if (query.max !== undefined) {
    clauses.push(`(max-width: ${resolveBreakpoint(query.max) - 0.02}px)`);
  }

  if (query.pointer !== undefined) {
    clauses.push(`(pointer: ${query.pointer})`);
  }

  return clauses.join(" and ");
}

function subscribe(query: string, onStoreChange: () => void) {
  const mediaQueryList = window.matchMedia(query);

  mediaQueryList.addEventListener("change", onStoreChange);

  return () => {
    mediaQueryList.removeEventListener("change", onStoreChange);
  };
}

function getSnapshot(query: string) {
  return window.matchMedia(query).matches;
}

function getServerSnapshot() {
  return false;
}

export function useMediaQuery(query: BreakpointQuery): boolean;
export function useMediaQuery(query: MediaQueryInput): boolean;
export function useMediaQuery(query: string): boolean;
export function useMediaQuery(query: MediaQueryInput | string) {
  const mediaQuery = buildMediaQuery(query);

  return useSyncExternalStore(
    (onStoreChange) => subscribe(mediaQuery, onStoreChange),
    () => getSnapshot(mediaQuery),
    getServerSnapshot,
  );
}

export function useIsMobile() {
  return useMediaQuery("max-md");
}
