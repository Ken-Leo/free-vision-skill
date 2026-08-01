# Demo: Real-World Usage Examples

This file shows practical examples of using Free Vision Skill in real scenarios.

## Scenario 1: Fixing a Build Error

**Context:** User uploads a screenshot of a failed npm build.

```
User: "这个构建失败了，帮我看看什么问题"

Agent: Let me examine the error screenshot.
```

```bash
free-vision see \
  --image ./build-error.png \
  --question "Only exact error message, file path and line number."
```

**VEP Output:**
```
VEP/1|src=zhipu/glm-4.6v-flash|m=error|a="Module not found: Can't resolve 'lodash'"|t="webpack.config.js:15"|e=[module resolution error]|c=0.98
```

**Agent response:**
"Webpack 在第 15 行找不到 `lodash` 模块。运行 `npm install lodash` 即可修复。"

---

## Scenario 2: UI Design Review

**Context:** User shares a Figma export and asks about spacing issues.

```
User: "帮我检查这个UI设计稿的对齐问题"
```

```bash
free-vision see \
  --image ./design-mockup.png \
  --question "Only report misaligned, clipped, overlapping or broken elements."
```

**VEP Output:**
```
VEP/1|src=zhipu/glm-4.6v-flash|m=ui|o=[{name:"Submit button",issue:"misaligned 8px below"},{name:"Avatar",issue:"clipped on right edge"}]
```

---

## Scenario 3: Extract Meeting Notes

**Context:** Whiteboard photo from a planning session.

```
User: "把这张白板的要点提取出来"
```

```bash
free-vision see \
  --image ./whiteboard.jpg \
  --question "Only title, action items, and deadlines."
```

**VEP Output:**
```
VEP/1|src=zhipu/glm-4.6v-flash|m=ocr|a="Q3 Planning Session"|t=["1. Launch beta by Aug 15","2. Hire 2 engineers","3. Security audit"]|c=0.92
```

---

## Scenario 4: Chart Data Extraction

**Context:** User shares a dashboard screenshot.

```
User: "从这个图表中提取关键指标"
```

```bash
free-vision see \
  --image ./dashboard.png \
  --question "Only chart title, trend direction, and top 3 values."
```

**VEP Output:**
```
VEP/1|src=zhipu/glm-4.6v-flash|m=chart|a="Monthly Revenue Growth"|v=[45200, 58300, 72100]|c=0.96
```

---

## Scenario 5: Cascading Visual Queries

When the first query isn't enough, ask a follow-up:

```bash
# First pass
free-vision see --image ./complex-ui.png \
  --question "List all form fields."

# Second pass on the same image
free-vision see --image ./complex-ui.png \
  --question "Which fields are disabled or read-only?"
```

The cache ensures the second call doesn't waste quota.

---

## Output Format Reference

| Output | When to Use |
|--------|-------------|
| Default one-line VEP | Normal usage — most compact |
| `--json` flag | Debugging or programmatic parsing |
| `--max-chars 300` | Larger output for complex images |
| `--provider openrouter` | Explicitly select a provider |

---

## Token Economics

Typical token usage per visual query:

| Task | Visual Model Output | VEP Size | Main Model Receives |
|------|-------------------|----------|---------------------|
| Error extraction | ~100 tokens | ~150 chars | ~50 tokens |
| UI audit | ~180 tokens | ~400 chars | ~80 tokens |
| OCR | ~220 tokens | ~500 chars | ~120 tokens |
| Chart | ~150 tokens | ~300 chars | ~70 tokens |

Compare with sending raw visual model output: 500–2000 tokens of descriptive text.
