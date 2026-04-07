"use client";

import { getSessionCookie } from "better-auth/cookies";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { proxy } from "./proxy";

vi.mock("better-auth/cookies", () => ({
  getSessionCookie: vi.fn(),
}));

const getSessionCookieMock = vi.mocked(getSessionCookie);

describe("proxy", () => {
  beforeEach(() => {
    getSessionCookieMock.mockReset();
  });

  it("redirects anonymous protected requests to sign-in", () => {
    getSessionCookieMock.mockReturnValue(null);

    const response = proxy(new NextRequest("https://example.com/dashboard"));

    expect(response.headers.get("location")).toBe("https://example.com/sign-in");
    expect(response.status).toBe(307);
  });

  it("redirects authenticated auth-page requests to dashboard", () => {
    getSessionCookieMock.mockReturnValue("session-token");

    const response = proxy(new NextRequest("https://example.com/sign-in"));

    expect(response.headers.get("location")).toBe("https://example.com/dashboard");
    expect(response.status).toBe(307);
  });

  it("allows authenticated protected requests through", () => {
    getSessionCookieMock.mockReturnValue("session-token");

    const response = proxy(new NextRequest("https://example.com/reports"));

    expect(response.headers.get("location")).toBeNull();
    expect(response.status).toBe(200);
  });
});
