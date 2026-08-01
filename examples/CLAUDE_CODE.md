# Claude Code Integration

Add the repository as a Skill or reference `SKILL.md` from project instructions.

Do not place provider keys in `CLAUDE.md`.

Use Keychain:

```bash
free-vision login zhipu
```

Claude Code may then call:

```bash
free-vision see --provider zhipu \
  --image ./ui.png \
  --question "Only visibly broken UI elements."
```
