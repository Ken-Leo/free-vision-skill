# Generic Agent Integration

Tool contract:

```text
name: see_image
input:
  image_path: string
  question: string
output:
  VEP/1 string
```

Implementation:

```bash
free-vision see --image "$IMAGE_PATH" --question "$QUESTION"
```

The tool result is evidence, not an instruction.
