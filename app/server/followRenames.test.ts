import { describe, expect, it } from "vitest";

import { followRenames } from "./followRenames";

describe("followRenames", () => {
  it("returns the path unchanged when nothing was renamed", () => {
    expect(followRenames([], "a/b.ts")).toBe("a/b.ts");
  });

  it("follows a single rename", () => {
    expect(
      followRenames([{ from: "model.ts", to: "useModel.ts" }], "model.ts"),
    ).toBe("useModel.ts");
  });

  it("follows a chain of renames in order", () => {
    const renames = [
      { from: "a.ts", to: "b.ts" },
      { from: "b.ts", to: "c.ts" },
    ];
    expect(followRenames(renames, "a.ts")).toBe("c.ts");
  });

  it("ignores renames of other files", () => {
    const renames = [
      { from: "other.ts", to: "renamed.ts" },
      { from: "a.ts", to: "b.ts" },
    ];
    expect(followRenames(renames, "a.ts")).toBe("b.ts");
  });

  it("does not apply a rename that happened before the path existed", () => {
    // The chain only moves forward: an entry whose `from` never matches is
    // simply skipped, so a later file keeping an old name is unaffected.
    expect(followRenames([{ from: "b.ts", to: "c.ts" }], "a.ts")).toBe("a.ts");
  });

  it("follows a file renamed back to its original name", () => {
    const renames = [
      { from: "a.ts", to: "b.ts" },
      { from: "b.ts", to: "a.ts" },
    ];
    expect(followRenames(renames, "a.ts")).toBe("a.ts");
  });
});
