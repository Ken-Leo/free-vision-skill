#!/usr/bin/env bash
# ~/.claude/hooks/post-read-image.sh
#
# PostToolUse hook: when Claude Code reads an image file with the Read tool,
# run free-vision on it and append the VEP so Claude gets visual evidence
# without calling a vision provider itself.
#
# Registered in ~/.claude/settings.json:
#   "PostToolUse" hook on "Read" tool → this script
#
# stdin: JSON from Claude Code (tool_name, tool_input, tool_response)
# stdout: JSON decision (claude code reads this)
# stderr: logs (visible with --debug-file)

set -euo pipefail

# ── config ──────────────────────────────────────────────────────────────────
FREE_VISION_CLI="${FREE_VISION_CLI:-npx tsx /Users/lora/repos/free-vision-skill/src/cli.ts}"
DEFAULT_QUESTION="Extract only the most important visible facts. One sentence per finding."
CACHE_HIT_SKIP="${CACHE_HIT_SKIP:-yes}"   # "yes" = skip if cache hit, "no" = always forward
TIMEOUT_MS="${HOOK_TIMEOUT_MS:-35000}"
MAX_VEP_CHARS="${MAX_VEP_CHARS:-500}"

# image extensions we care about
IMAGE_EXTS='\.(png|jpe?g|gif|webp|bmp|avif)$'

# ── read stdin ───────────────────────────────────────────────────────────────
INPUT=$(cat)

TOOL_NAME=$(echo "$INPUT" | python3 -c "
import json,sys
d=json.load(sys.stdin)
print(d.get('tool_name',''))
" 2>/dev/null || echo "")

FILE_PATH=$(echo "$INPUT" | python3 -c "
import json,sys
d=json.load(sys.stdin)
print(d.get('tool_input',{}).get('file_path',''))
" 2>/dev/null || echo "")

# ── filter: only care about Read tool + image files ──────────────────────────
if [ "$TOOL_NAME" != "Read" ]; then
    # not a Read → pass through
    echo '{"decision":"approve"}'
    exit 0
fi

if [ -z "$FILE_PATH" ]; then
    echo '{"decision":"approve"}'
    exit 0
fi

if ! echo "$FILE_PATH" | grep -qiE "$IMAGE_EXTS"; then
    echo '{"decision":"approve"}'
    exit 0
fi

if [ ! -f "$FILE_PATH" ]; then
    echo '{"decision":"approve"}'
    exit 0
fi

# ── generate smart question from filename ───────────────────────────────────
FILENAME=$(basename "$FILE_PATH" | tr '[:upper:]' '[:lower:]')

case "$FILENAME" in
    *error*|*exception*|*traceback*|*报错*|*错误*)
        QUESTION="Extract only the exact error message, filename, and line number. Ignore stack traces."
        ;;
    *ui*|*screen*|*界面*|*截图*|*screenshot*)
        QUESTION="List only disabled, clipped, overlapping, broken, or visually incorrect UI elements."
        ;;
    *chart*|*graph*|*plot*|*图表*|*图形*)
        QUESTION="Return only the chart title, main trend, and 3 key values."
        ;;
    *table*|*grid*|*表格*)
        QUESTION="Extract all text and table structure. Return as markdown table."
        ;;
    *logo*|*icon*|*图标*)
        QUESTION="Describe the logo or icon in one sentence."
        ;;
    *code*|*snippet*|*代码*)
        QUESTION="Extract only the code content and language. Ignore line numbers if unclear."
        ;;
    *)
        QUESTION="$DEFAULT_QUESTION"
        ;;
esac

# ── run free-vision ─────────────────────────────────────────────────────────
VEP=$($FREE_VISION_CLI see \
    --image "$FILE_PATH" \
    --question "$QUESTION" \
    --max-chars "$MAX_VEP_CHARS" \
    --timeout "$TIMEOUT_MS" \
    2>/dev/null) || {
    # provider failed — pass through silently
    echo '{"decision":"approve"}'
    exit 0
}

# cache hit → optionally skip (avoids redundant notification noise)
if [ "$CACHE_HIT_SKIP" = "yes" ] && echo "$VEP" | grep -q "cache=hit"; then
    echo '{"decision":"approve"}'
    exit 0
fi

# ── format notification for Claude ──────────────────────────────────────────
# Claude Code reads stdout JSON and surfaces it as a notification / context.
# We embed the VEP in a concise "visual evidence" block.
VEP_SHORT=$(echo "$VEP" | cut -c1-400)

cat <<EOF
{"decision":"approve","hookSpecificOutput":{"hookEventName":"PostToolUse","additionalContext":"[Free Vision visual evidence for $FILE_PATH]\n$VEP_SHORT"}}
EOF

exit 0
