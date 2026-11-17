import { describe, expect, it } from "vitest";
import { checkImageFile, isSafeHttpsUrl, normalizeContract, normalizeHttpsUrl } from "./site";

describe("link rules", () => {
  it("hides a link when left empty", () => {
    expect(normalizeHttpsUrl("   ")).toEqual({ ok: true, value: null });
  });
  it("accepts https links", () => {
    expect(normalizeHttpsUrl("https://t.me/crazychild")).toEqual({ ok: true, value: "https://t.me/crazychild" });
  });
  it("rejects http links", () => {
    expect(normalizeHttpsUrl("http://t.me/crazychild").ok).toBe(false);
  });
  it("rejects javascript links", () => {
    expect(normalizeHttpsUrl("javascript:alert(1)").ok).toBe(false);
    expect(isSafeHttpsUrl("javascript:alert(1)")).toBe(false);
  });
  it("rejects hosts without a real domain", () => {
    expect(normalizeHttpsUrl("https://localhost/x").ok).toBe(false);
  });
});

describe("contract address", () => {
  it("is optional", () => {
    expect(normalizeContract("")).toEqual({ ok: true, value: null });
  });
  it("accepts a Solana base58 address", () => {
    const addr = "So11111111111111111111111111111111111111112";
    expect(normalizeContract(addr)).toEqual({ ok: true, value: addr });
  });
  it("rejects non-base58 characters", () => {
    expect(normalizeContract("0x0000000000000000000000000000000000000000").ok).toBe(false);
  });
});

describe("gallery images", () => {
  it("allows jpg, png, webp under 3MB", () => {
    expect(checkImageFile({ type: "image/webp", size: 3 * 1024 * 1024 - 1 }).ok).toBe(true);
  });
  it("rejects files of 3MB or more", () => {
    expect(checkImageFile({ type: "image/png", size: 3 * 1024 * 1024 + 1 }).ok).toBe(false);
  });
  it("rejects gif", () => {
    expect(checkImageFile({ type: "image/gif", size: 1000 }).ok).toBe(false);
  });
});