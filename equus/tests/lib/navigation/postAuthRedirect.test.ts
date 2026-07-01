import { describe, expect, it } from "vitest";
import {
  DEFAULT_POST_AUTH_PATH,
  USER_HOME_PATH,
  buildSignInPath,
  resolvePostAuthPath,
} from "@/lib/navigation/postAuthRedirect.ts";

describe("resolvePostAuthPath", () => {
  it("defaults to the user home page", () => {
    expect(DEFAULT_POST_AUTH_PATH).toBe(USER_HOME_PATH);
    expect(resolvePostAuthPath(null)).toBe(USER_HOME_PATH);
    expect(resolvePostAuthPath("")).toBe(USER_HOME_PATH);
    expect(resolvePostAuthPath("   ")).toBe(USER_HOME_PATH);
  });

  it("accepts safe relative paths", () => {
    expect(resolvePostAuthPath("/my/horses")).toBe("/my/horses");
    expect(resolvePostAuthPath("/create/horse")).toBe("/create/horse");
    expect(resolvePostAuthPath("/profile")).toBe("/profile");
  });

  it("maps guest landing to user home", () => {
    expect(resolvePostAuthPath("/")).toBe(USER_HOME_PATH);
  });

  it("maps legacy /me path to user home", () => {
    expect(resolvePostAuthPath("/me")).toBe(USER_HOME_PATH);
    expect(buildSignInPath("/me")).toBe("/signin");
  });

  it("rejects open redirects and auth loops", () => {
    expect(resolvePostAuthPath("https://evil.test")).toBe(USER_HOME_PATH);
    expect(resolvePostAuthPath("//evil.test")).toBe(USER_HOME_PATH);
    expect(resolvePostAuthPath("/signin")).toBe(USER_HOME_PATH);
    expect(resolvePostAuthPath("/signup?ref=abc")).toBe(USER_HOME_PATH);
  });
});

describe("buildSignInPath", () => {
  it("returns plain /signin when next is absent or resolves to the default", () => {
    expect(buildSignInPath(null)).toBe("/signin");
    expect(buildSignInPath(undefined)).toBe("/signin");
    expect(buildSignInPath("")).toBe("/signin");
    expect(buildSignInPath(USER_HOME_PATH)).toBe("/signin");
    expect(buildSignInPath("/")).toBe("/signin");
  });

  it("includes next when the destination differs from the default", () => {
    expect(buildSignInPath("/profile")).toBe("/signin?next=%2Fprofile");
    expect(buildSignInPath("/create/horse")).toBe("/signin?next=%2Fcreate%2Fhorse");
  });
});
