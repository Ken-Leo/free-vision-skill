# Architecture

## Goal

Add on-demand vision to text-only models without turning a visual model into the main reasoning engine.

```text
Image + focused question
          │
          ▼
     Visual Router
          │
          ▼
 Vision Provider Adapter
          │
          ▼
 Short structured JSON
          │
          ▼
      VEP Compiler
          │
          ├── character budget
          ├── field priority
          ├── confidence
          └── cache marker
          │
          ▼
 Text-only Main Agent
```

## Components

### Visual Router

Classifies the question into:

- `error`
- `ocr`
- `ui`
- `chart`
- `general`

The router is local and does not call an LLM.

### Provider Registry

`registry/providers.json` stores:

- provider ID
- official base URL
- environment variable name
- default visual model
- region
- fallback priority
- current free-tier note

The registry is discovery metadata, not a guarantee that a free quota remains available.

### Provider Adapter

Most providers expose OpenAI-compatible `chat/completions`.
Provider-specific behavior is isolated in `src/call.ts`.

### VEP Compiler

The raw visual response is parsed locally and compressed according to field priority.

When the character budget is exceeded, the compiler keeps:

1. direct answer
2. exact OCR/error text
3. visible issues
4. key values
5. confidence

### Cache

Cache key:

```text
sha256(image bytes + normalized question + provider + model + prompt version)
```

This prevents repeated usage of scarce free quotas.

### Secret Layer

Credential priority:

```text
process environment / .env
        ↓
macOS Keychain or Linux Secret Service
```

The future Secret Broker will expose only `see`, not raw credentials.
