import test from "node:test";
import assert from "node:assert/strict";
import { inferMode } from "../src/prompt.js";

test("infers error mode", () => {
  assert.equal(inferMode("提取截图中的错误和行号"), "error");
});

test("infers OCR mode", () => {
  assert.equal(inferMode("读取海报里的文字和价格"), "ocr");
});

test("infers chart mode", () => {
  assert.equal(inferMode("总结图表趋势和关键指标"), "chart");
});

test("infers UI mode", () => {
  assert.equal(inferMode("哪个按钮被禁用了？"), "ui");
});
