import { describe, it, expect } from "vitest";
import { inferMode } from "../src/prompt.js";

describe("Prompt Mode Inference", () => {
  it("infers error mode", () => {
    expect(inferMode("提取截图中的错误和行号")).toBe("error");
  });

  it("infers OCR mode", () => {
    expect(inferMode("读取海报里的文字和价格")).toBe("ocr");
  });

  it("infers chart mode", () => {
    expect(inferMode("总结图表趋势和关键指标")).toBe("chart");
  });

  it("infers UI mode", () => {
    expect(inferMode("哪个按钮被禁用了？")).toBe("ui");
  });
});
