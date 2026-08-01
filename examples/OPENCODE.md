# OpenCode Integration

Create an Agent that can run the `free-vision` executable but cannot read `.env`.

Recommended permissions:

```text
allow: free-vision see *
deny: cat .env
deny: env
```

Pass only the resulting VEP to the main build Agent.
