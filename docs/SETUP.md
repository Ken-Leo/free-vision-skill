# Setup

## Node

```bash
node --version
# Node 20+
```

## Install

```bash
npm install
npm run check
```

## `.env` Mode

```bash
cp .env.example .env
```

Fill one provider key.

## Keychain Mode

macOS:

```bash
free-vision login zhipu
```

Linux:

```bash
sudo apt install libsecret-tools
free-vision login zhipu
```

## Test Without Spending Quota

```bash
free-vision doctor
free-vision providers
```

## Real Test

```bash
free-vision see \
  --image ./assets/cover.png \
  --question "Only return the main English title."
```
