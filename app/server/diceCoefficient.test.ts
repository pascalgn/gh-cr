import { describe, expect, it } from "vitest";
import { diceCoefficient } from "./diceCoefficient";

describe("diceCoefficient", () => {
  it("scores identical strings as 1", () => {
    expect(diceCoefficient("const total = 1;", "const total = 1;")).toBe(1);
    expect(diceCoefficient("", "")).toBe(1);
  });

  it("scores strings with no shared bigrams as 0", () => {
    expect(diceCoefficient("abcd", "wxyz")).toBe(0);
  });

  it("scores strings shorter than a bigram as 0 unless equal", () => {
    expect(diceCoefficient("a", "b")).toBe(0);
    expect(diceCoefficient("a", "abc")).toBe(0);
  });

  it("scores a light rewording well above the relocation threshold", () => {
    const score = diceCoefficient(
      "Example locations (with the default `nodejs` [suffix](#suffix)):",
      "Example locations (with the default `nodejs` suffix):",
    );

    expect(score).toBeGreaterThan(0.6);
    expect(score).toBeCloseTo(0.887, 2);
  });

  it("scores a short boilerplate line against an unrelated line far below it", () => {
    expect(
      diceCoefficient("});", 'const paths = envPaths("MyApp", {suffix: ""});'),
    ).toBeLessThan(0.2);
  });

  it("is symmetric", () => {
    expect(diceCoefficient("alpha beta", "beta alpha")).toBe(
      diceCoefficient("beta alpha", "alpha beta"),
    );
  });
});
