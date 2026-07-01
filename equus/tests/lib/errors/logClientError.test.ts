import { describe, expect, it, vi, afterEach } from "vitest";
import { logClientError } from "@/lib/errors/logClientError.ts";

describe("logClientError", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("logs Error instances with source context", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    logClientError(new Error("Render failed"), {
      source: "error-boundary",
      componentStack: "at Page",
      digest: "abc123",
    });

    expect(consoleError).toHaveBeenCalledWith(
      "[error-boundary]",
      "Render failed",
      expect.objectContaining({
        digest: "abc123",
        componentStack: "at Page",
      }),
    );
  });

  it("normalizes non-Error values", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    logClientError("boom", { source: "route-error" });

    expect(consoleError).toHaveBeenCalledWith(
      "[route-error]",
      "boom",
      expect.objectContaining({ digest: undefined }),
    );
  });
});
