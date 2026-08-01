# Quick Start

Get Free Vision Skill working in 5 minutes.

## 1. Install

```bash
# As a CLI tool
npm install -g free-vision-skill

# Or clone and use locally
git clone https://github.com/lora-sys/free-vision-skill.git
cd free-vision-skill
npm install
npm run build
```

## 2. Choose a Provider

**For China users (推荐):**
```bash
# Sign up at https://open.bigmodel.cn/
# Copy your API key to .env
echo "ZHIPU_API_KEY=your_key" >> .env
echo "VISION_PROVIDER=auto" >> .env
echo "VISION_REGION=cn" >> .env
```

**For global users:**
```bash
# Sign up at https://openrouter.ai/
echo "OPENROUTER_API_KEY=your_key" >> .env
echo "VISION_PROVIDER=auto" >> .env
echo "VISION_REGION=global" >> .env
```

**Secure alternative (macOS/Linux):**
```bash
free-vision login zhipu
# Follow the prompts to securely store your key
```

## 3. Test It

```bash
# Verify setup
free-vision doctor

# Test with a sample image
free-vision see \
  --image ./assets/cover.png \
  --question "Only return the main title."
```

You should see VEP output like:
```
VEP/1|src=zhipu/glm-4.6v-flash|m=general|a="Free Vision Skill"|s="Cover image for Free Vision Skill project"|c=0.95
```

## 4. Use It

### Error Screenshots
```bash
free-vision see --image ./error.png \
  --question "Only exact error, file path and line number."
```

### UI Screenshots
```bash
free-vision see --image ./ui.png \
  --question "Only disabled, clipped, overlapping or broken elements."
```

### OCR / Tables
```bash
free-vision see --image ./table.png \
  --question "Extract all text and table structure."
```

### Charts
```bash
free-vision see --image ./chart.png \
  --question "Only title, trend and three key values."
```

## 5. Integrate with Your Agent

Add to your Agent's system prompt or skill directory:

```markdown
## Visual Evidence Skill

When the user provides an image, call:

\`\`\`bash
free-vision see --image <path> --question "<narrow visual question>"
\`\`\`

Use only the returned VEP as evidence. The visual model extracts facts; you do the reasoning.
```

For Claude Code, copy `SKILL.md` to `~/.claude/skills/free-vision/`.

## Next Steps

- Read [Architecture](ARCHITECTURE.md) to understand how it works
- Check [Provider Guide](PROVIDERS.md) to compare options
- See [Security Guide](SECURITY.md) for safe usage patterns
- Read [VEP Protocol](VEP.md) to understand the output format

## Troubleshooting

**"Provider not configured"**
```bash
free-vision providers  # Check available providers
free-vision doctor     # Diagnose setup issues
```

**"API quota exceeded"**
The provider has no free quota remaining. Try another provider or wait for reset.

**"Image format not supported"**
Use PNG, JPG, JPEG, GIF, or WebP.

**Cache issues**
Delete `.vision-cache/` to reset the local cache.
