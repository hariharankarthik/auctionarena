import { describe, expect, it } from "vitest";
import { loginUrlWithNext, safeNextPath } from "./safe-path";

describe("safeNextPath", () => {
  it("allows normal app paths", () => {
    expect(safeNextPath("/dashboard")).toBe("/dashboard");
    expect(safeNextPath("/room/abc/lobby")).toBe("/room/abc/lobby");
  });

  it("rejects open redirects and protocols", () => {
    expect(safeNextPath("//evil.com")).toBe("/dashboard");
    expect(safeNextPath("https://evil.com")).toBe("/dashboard");
    expect(safeNextPath("http://evil.com")).toBe("/dashboard");
    expect(safeNextPath("dashboard")).toBe("/dashboard");
    expect(safeNextPath("/\\evil")).toBe("/dashboard");
  });

  it("uses fallback", () => {
    expect(safeNextPath(undefined, "/practice")).toBe("/practice");
    expect(safeNextPath(null)).toBe("/dashboard");
  });
});

describe("loginUrlWithNext", () => {
  it("encodes a safe path", () => {
    expect(loginUrlWithNext("/room/abc/lobby")).toBe("/login?next=%2Froom%2Fabc%2Flobby");
  });
});
