# Codex Integration

Install the Skill repository or place `SKILL.md` in the Skills directory used by your Codex workflow.

Suggested Agent rule:

```text
When the user supplies an image and the active model cannot inspect pixels,
call `free-vision see` with one narrow visual question.
Use only the returned VEP as evidence.
```

Example:

```bash
free-vision see \
  --image ./error.png \
  --question "Only exact error, file and line."
```
