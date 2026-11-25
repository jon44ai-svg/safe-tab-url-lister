import { describe, expect, it } from "vitest";
import { formatExport } from "./format";
import type { ListedTab } from "../../domain/types";

const tab: ListedTab = {
  key: "1",
  source: "saved",
  title: "=cmd",
  urlDisplay: "javascript:alert(1)",
  host: "javascript",
  path: "",
  tags: [],
  folderId: null,
  sensitive: true,
};

describe("export", () => {
  it("keeps dangerous schemes out of markdown links and neutralizes formulas", () => {
    const markdown = formatExport([tab], "markdown", false);
    expect(markdown.startsWith("[")).toBe(false);
    expect(markdown).toContain("`javascript:alert\\(1\\)`");
    const csv = formatExport([{ ...tab, urlDisplay: "https://ex.com", title: "=1+1" }], "csv", false);
    expect(csv).toContain(`"'=1+1"`);
  });
});
