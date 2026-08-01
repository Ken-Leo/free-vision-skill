# Provider Guide

The provider registry is stored in `registry/providers.json`.

Free quotas and model IDs change frequently. Always verify the live console before publishing a tutorial.

## China-first

Recommended order:

1. Zhipu
2. ModelScope
3. SiliconFlow
4. Alibaba Model Studio trial

## Global

Recommended order:

1. OpenRouter explicit `:free` visual model
2. Groq visual model
3. NVIDIA NIM
4. Gemini free tier
5. Mistral / Cohere / Cloudflare / Ollama Cloud / SambaNova

## Adding a Provider

A provider PR must include:

- official company/project name
- official API documentation
- official base URL
- image input example
- current model ID
- free/free-tier explanation
- region constraints
- privacy/data-use note

Do not hard-code a model that has already been retired.
