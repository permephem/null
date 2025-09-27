import { describe, expect, it } from "vitest";
import { canonicalizeJSON, commitPolicy } from "./crypto.js";

describe("canonicalizeJSON", () => {
  it("sorts object keys recursively", () => {
    const policy = {
      z: 1,
      nested: {
        beta: "two",
        alpha: "one",
      },
      a: 0,
    };

    const canonical = canonicalizeJSON(policy);
    expect(canonical).toBe(
      JSON.stringify({
        a: 0,
        nested: {
          alpha: "one",
          beta: "two",
        },
        z: 1,
      })
    );
  });

  it("keeps array order but canonicalizes objects inside", () => {
    const value = {
      list: [
        { b: 2, a: 1 },
        5,
        [{ d: 4, c: 3 }],
      ],
    };

    const canonical = canonicalizeJSON(value);
    expect(canonical).toBe(
      JSON.stringify({
        list: [
          { a: 1, b: 2 },
          5,
          [{ c: 3, d: 4 }],
        ],
      })
    );
  });
});

describe("commitPolicy", () => {
  it("produces identical commitments for differently ordered objects", () => {
    const policyA = {
      issuer: "null",
      rules: {
        maxTickets: 4,
        nested: {
          allowed: true,
          tiers: [
            { name: "vip", price: 100 },
            { price: 50, name: "general" },
          ],
        },
      },
      version: 1,
    };

    const policyB = {
      version: 1,
      rules: {
        nested: {
          tiers: [
            { price: 100, name: "vip" },
            { name: "general", price: 50 },
          ],
          allowed: true,
        },
        maxTickets: 4,
      },
      issuer: "null",
    };

    const commitmentA = commitPolicy(policyA);
    const commitmentB = commitPolicy(policyB);

    expect(commitmentA).toBe(commitmentB);
  });
});
