# VEP/1 — Visual Evidence Packet

VEP is a compact, line-oriented protocol for transferring visual facts to a text-only model.

## Example

```text
VEP/1|src=zhipu/glm-4.6v-flash|m=error|
a="Cannot find module ethers"|
t="src/app.ts:42"|
e=[dependency error]|
c=0.97
```

## Fields

| Field | Meaning |
|---|---|
| `src` | Provider/model |
| `m` | Visual task mode |
| `a` | Direct factual answer |
| `t` | Exact OCR text |
| `s` | Short visible summary |
| `o` | Objects or UI elements |
| `e` | Errors or visible issues |
| `v` | Important values |
| `c` | Confidence between 0 and 1 |
| `cache` | Local cache status |

## Design Rules

- One line by default
- No chain-of-thought
- No recommendations unless explicitly visible in the image
- No hidden assumptions
- Evidence is task-scoped
- Output size is bounded

## Why Not Large JSON?

JSON keys and repeated structural punctuation consume more context.
VEP retains readability while keeping the main model input compact.

Use `--json` only for debugging or programmatic integration.
