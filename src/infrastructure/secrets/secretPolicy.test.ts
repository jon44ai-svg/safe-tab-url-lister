import { describe, expect, it } from "vitest";
import { dangerousScheme, describeUrl, redactForModel } from "./secretPolicy";

describe("SecretPolicy", () => {
  it("redacts secret query keys and drops them from the model view", () => {
    const raw = "https://example.com/a/b?token=abc&q=cats#session=1";
    const described = describeUrl(raw);
    expect(described.sensitive).toBe(true);
    expect(described.urlDisplay).not.toContain("abc");
    expect(described.urlDisplay).toContain("REDACTED");
    expect(redactForModel("Hello", raw)).toEqual({
      title: "Hello",
      host: "example.com",
      path: "/a/b",
    });
  });

  it("flags dangerous schemes", () => {
    expect(dangerousScheme("javascript:alert(1)")).toBe(true);
    expect(dangerousScheme("https://example.com")).toBe(false);
  });
});
