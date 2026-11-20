import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { useOnceTrue } from "@/lib/lazy/use-once-true";

function Probe({ value }: { value: boolean }) {
  return createElement("span", null, String(useOnceTrue(value)));
}

const render = (value: boolean) =>
  renderToStaticMarkup(createElement(Probe, { value }));

describe("useOnceTrue", () => {
  it("stays false until the value is first true", () => {
    expect(render(false)).toBe("<span>false</span>");
  });

  it("is true as soon as the value is true", () => {
    expect(render(true)).toBe("<span>true</span>");
  });
});
