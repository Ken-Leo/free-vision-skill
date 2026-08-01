# FAQ

## Does this give DeepSeek native vision?

No. It adds a tool that DeepSeek or another text model can call when visual evidence is needed.

## Is the image sent to DeepSeek?

No. The image is sent to the selected visual provider. DeepSeek receives only compact VEP text.

## Is it always free?

No provider can be guaranteed permanently free. The project targets legitimate free models, free tiers and trial quotas.

## Why not use an unknown mirror?

Screenshots often contain private code and credentials. Unknown relays create unacceptable privacy and supply-chain risk.

## Can I use a local model?

Yes. Add an OpenAI-compatible local endpoint, such as an Ollama visual model, through `VISION_BASE_URL` and `VISION_MODEL`.

## Why is the result so short?

The visual model is not the reasoning model. It extracts only the evidence needed for the current question.

## Can the Agent automatically call it?

Yes. Install `SKILL.md` into an Agent that supports Skills, or copy the trigger and command rules into the Agent's instructions.
