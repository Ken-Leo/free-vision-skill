# Contributing

Thank you for improving Free Vision Skill.

## Good Contributions

- Provider adapters backed by official documentation
- VEP compression improvements
- Local visual-model support
- Windows Credential Manager
- Agent integrations
- Tests that do not call paid APIs
- Prompt-injection defenses

## Provider PR Requirements

Include:

- official API docs
- base URL
- visual model ID
- image request example
- free-tier description
- data/privacy note
- region availability

Anonymous proxy endpoints and reverse-engineered chatbot APIs will not be accepted.

## Development

```bash
npm install
npm run check
npm run build
```

Keep changes focused and document user-visible behavior.
