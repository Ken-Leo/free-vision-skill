# Release Checklist

## Pre-Release

- [ ] Verify all tests pass: `npm run check`
- [ ] Build succeeds: `npm run build`
- [ ] Test on fresh environment: `npm install -g .`
- [ ] Verify CLI commands work: `free-vision --version`
- [ ] Test with real API key (if available)
- [ ] Update version in `package.json`
- [ ] Update `CHANGELOG.md` with release date
- [ ] Update `SKILL.md` version metadata

## Documentation

- [ ] README.md renders correctly on GitHub
- [ ] All links are valid (internal + external)
- [ ] Screenshots/demos are up to date
- [ ] Installation instructions tested on macOS/Linux
- [ ] API provider list current (free tier status verified)
- [ ] FAQ covers recent questions

## GitHub Repository

- [ ] Repository description set
- [ ] Topics/tags added (agent-skill, vision, deepseek, low-token, etc.)
- [ ] Enable GitHub Pages (if using)
- [ ] Set up issue templates
- [ ] Set up PR template
- [ ] Enable Discussions
- [ ] Add repository rules (CODEOWNERS, branch protection)
- [ ] Verify `.gitignore` covers `.env`, `.vision-cache`, `dist/`

## npm Package

- [ ] `npm pack` produces correct tarball
- [ ] `files` field in package.json is correct
- [ ] `bin` entry point exists
- [ ] Keywords are relevant
- [ ] License field is correct (MIT)
- [ ] Test install: `npm install -g free-vision-skill`
- [ ] Verify global CLI: `free-vision --help`

## Community

- [ ] Draft GitHub release notes
- [ ] Prepare social media posts (Twitter/X, 小红书, 抖音)
- [ ] Post to relevant communities (Hacker News, Reddit, V2EX)
- [ ] Update personal website/blog (if applicable)

## Post-Release

- [ ] Monitor issues for first 48 hours
- [ ] Respond to feedback
- [ ] Update ROADMAP.md based on feedback
- [ ] Tag release in git: `git tag v0.1.0`
- [ ] Push tags: `git push origin v0.1.0`
