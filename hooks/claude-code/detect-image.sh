#!/bin/bash

# Claude Code Hook: 自动检测并分析用户上传的图片
#
# 这个 Hook 会在 Claude Code 检测到图片时自动触发
# 使用方法：
#   1. 在 Claude Code 中上传图片
#   2. Hook 自动调用 free-vision 分析图片
#   3. 返回 VEP 给 Claude Code

set -e

# 配置
FREE_VISION_CLI="${FREE_VISION_CLI:-npx tsx src/cli.ts}"
DEFAULT_PROVIDER="${VISION_PROVIDER:-auto}"
DEFAULT_REGION="${VISION_REGION:-cn}"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[Free Vision Hook]${NC} $1" >&2
}

log_success() {
    echo -e "${GREEN}[Free Vision Hook]${NC} $1" >&2
}

log_warn() {
    echo -e "${YELLOW}[Free Vision Hook]${NC} $1" >&2
}

log_error() {
    echo -e "${RED}[Free Vision Hook]${NC} $1" >&2
}

# 检测图片路径
# Claude Code 可能通过环境变量或参数传递图片路径
detect_image() {
    local image_path=""

    # 方法 1: 从环境变量获取
    if [ -n "$CLAUDE_IMAGE_PATH" ]; then
        image_path="$CLAUDE_IMAGE_PATH"
    fi

    # 方法 2: 从命令行参数获取
    if [ -z "$image_path" ] && [ $# -gt 0 ]; then
        image_path="$1"
    fi

    # 方法 3: 从临时目录检测最新的图片文件
    if [ -z "$image_path" ]; then
        local temp_dirs=(
            "/tmp/claude-uploads"
            "$TMPDIR/claude-uploads"
            "/tmp"
        )

        for dir in "${temp_dirs[@]}"; do
            if [ -d "$dir" ]; then
                # 查找最近 5 分钟内创建的图片文件
                image_path=$(find "$dir" -type f \( -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" -o -name "*.gif" -o -name "*.webp" \) -mmin -5 2>/dev/null | head -1)
                if [ -n "$image_path" ]; then
                    break
                fi
            fi
        done
    fi

    echo "$image_path"
}

# 根据图片特征生成智能问题
generate_smart_question() {
    local image_path="$1"

    # 如果是临时文件或未知来源，使用通用问题
    if [ -z "$image_path" ]; then
        echo "Describe what you see in one sentence"
        return
    fi

    # 获取图片信息
    local file_info=$(file "$image_path" 2>/dev/null || echo "")

    # TODO: 这里可以添加更智能的检测逻辑
    # 例如：检测图片尺寸、颜色分布、文件名等
    #
    # 当前版本：使用通用问题
    # 未来版本：可以根据 filename 关键词（error, ui, chart）推断类型

    echo "Describe what you see briefly"
}

# 调用 free-vision
call_free_vision() {
    local image_path="$1"
    local question="$2"
    local provider="$3"

    log_info "Analyzing image: $(basename "$image_path")"
    log_info "Provider: $provider"
    log_info "Question: $question"

    # 调用 free-vision CLI
    local vep_output
    vep_output=$($FREE_VISION_CLI see \
        --image "$image_path" \
        --question "$question" \
        --provider "$provider" \
        --region "$DEFAULT_REGION" \
        --max-chars 300 2>&1)

    local exit_code=$?

    if [ $exit_code -eq 0 ]; then
        log_success "Analysis complete"
        echo "$vep_output"
        return 0
    else
        log_error "Analysis failed: $vep_output"
        return 1
    fi
}

# 主函数
main() {
    log_info "Claude Code Hook triggered"

    # 检测图片
    local image_path
    image_path=$(detect_image "$@")

    if [ -z "$image_path" ]; then
        log_warn "No image detected. Hook exiting."
        exit 0
    fi

    # 验证图片文件存在
    if [ ! -f "$image_path" ]; then
        log_error "Image file not found: $image_path"
        exit 1
    fi

    # 生成智能问题
    local question
    question=$(generate_smart_question "$image_path")

    # 调用 free-vision
    local vep
    vep=$(call_free_vision "$image_path" "$question" "$DEFAULT_PROVIDER")

    if [ $? -eq 0 ]; then
        # 输出 VEP（只输出 VEP，不含日志）
        echo "$vep"
        exit 0
    else
        exit 1
    fi
}

# 运行主函数
main "$@"
