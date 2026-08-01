import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // 支持 Node.js 原生 test 模块
    include: ["**/*.test.ts", "**/*.spec.ts"],
    // 不要转换 node:test 和 node:assert
    deps: {
      inline: ["node:test", "node:assert"]
    }
  }
});
