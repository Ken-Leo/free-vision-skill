#!/bin/bash

# Free Vision Skill - Codex 一键安装脚本
# 适用于 Codex CLI 用户

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[OK]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

echo "=================================================="
echo "  Free Vision Skill - Codex Installer"
echo "=================================================="
echo ""

# 1. 检查 Node.js
if ! command -v node &> /dev/null; then
    log_error "Node.js not found. Please install Node.js >= 20 first."
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    log_error "Node.js version must be >= 20. Current: $(node --version)"
    exit 1
fi

log_success "Node.js $(node --version) detected"

# 2. 检查 npm
if ! command -v npm &> /dev/null; then
    log_error "npm not found. Please install npm."
    exit 1
fi

log_success "npm $(npm --version) detected"

# 3. 安装 free-vision CLI
echo ""
log_info "Installing Free Vision Skill..."
npm install -g free-vision-skill 2>&1 | tail -5

if ! command -v free-vision &> /dev/null; then
    log_error "Installation failed. free-vision command not found."
    exit 1
fi

log_success "Free Vision Skill installed"

# 4. 验证安装
VERSION=$(free-vision --version 2>&1 || echo "unknown")
log_success "Version: $VERSION"

# 5. 配置 Codex
echo ""
log_info "Configuring Codex..."

CODEX_CONFIG_DIR="$HOME/.codex"
mkdir -p "$CODEX_CONFIG_DIR"

CODEX_CONFIG="$CODEX_CONFIG_DIR/config.json"

# 检查是否已有配置
if [ -f "$CODEX_CONFIG" ]; then
    log_warn "Codex config already exists: $CODEX_CONFIG"

    # 备份现有配置
    cp "$CODEX_CONFIG" "$CODEX_CONFIG/config.json.backup-$(date +%Y%m%d-%H%M%S)"
    log_info "Backed up existing config"

    # 合并配置
    if command -v jq &> /dev/null; then
        # 使用 jq 合并配置
        jq '.skills = (.skills // {}) + {
          "free-vision": {
            "enabled": true,
            "auto-detect-images": true,
            "default-provider": "auto",
            "default-region": "cn",
            "default-question": "Describe what you see briefly"
          }
        }' "$CODEX_CONFIG" > "$CODEX_CONFIG.tmp" && mv "$CODEX_CONFIG.tmp" "$CODEX_CONFIG"
        log_success "Updated Codex config (merged)"
    else
        log_warn "jq not found. Skipping auto-merge. Please manually add free-vision config."
    fi
else
    # 创建新配置
    cat > "$CODEX_CONFIG" << 'EOF'
{
  "skills": {
    "free-vision": {
      "enabled": true,
      "auto-detect-images": true,
      "default-provider": "auto",
      "default-region": "cn",
      "default-question": "Describe what you see briefly"
    }
  }
}
EOF
    log_success "Created Codex config"
fi

# 6. 创建快捷命令
echo ""
log_info "Setting up shell aliases..."

SHELL_CONFIG=""
if [ -f "$HOME/.zshrc" ]; then
    SHELL_CONFIG="$HOME/.zshrc"
elif [ -f "$HOME/.bashrc" ]; then
    SHELL_CONFIG="$HOME/.bashrc"
elif [ -f "$HOME/.bash_profile" ]; then
    SHELL_CONFIG="$HOME/.bash_profile"
fi

if [ -n "$SHELL_CONFIG" ]; then
    if ! grep -q "alias free-vision=" "$SHELL_CONFIG" 2>/dev/null; then
        echo 'alias free-vision="free-vision"' >> "$SHELL_CONFIG"
        echo 'alias fv="free-vision"' >> "$SHELL_CONFIG"
        log_success "Added aliases to $SHELL_CONFIG"
    else
        log_success "Aliases already exist"
    fi
else
    log_warn "No shell config found. You can manually add aliases."
fi

# 7. 创建 .env 配置（可选）
echo ""
log_info "Checking .env configuration..."

ENV_FILE="$HOME/.env"
if [ ! -f "$ENV_FILE" ]; then
    log_warn "No .env file found. Creating template..."

    cat > "$ENV_FILE" << 'EOF'
# Free Vision Skill Configuration
# Uncomment and fill in your API keys

# China Providers (推荐国内用户)
# ZHIPU_API_KEY=your-zhipu-api-key-here

# Global Providers (推荐全球用户)
# OPENROUTER_API_KEY=your-openrouter-api-key-here

# Optional: Override defaults
# VISION_PROVIDER=auto
# VISION_REGION=cn
# VISION_MAX_OUTPUT_TOKENS=220
EOF

    log_success "Created .env template at $ENV_FILE"
    log_info "Please edit $ENV_FILE to add your API key"
else
    log_success ".env file exists"
fi

# 8. 测试（可选）
echo ""
read -p "Run a quick test now? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    log_info "Testing free-vision doctor..."
    free-vision doctor || log_warn "Doctor command failed (this is normal if no API keys configured)"
fi

# 完成
echo ""
echo "=================================================="
echo "  Installation Complete!"
echo "=================================================="
echo ""
echo "Next steps:"
echo ""
echo "  1. Configure your API key:"
echo "     ${YELLOW}free-vision login zhipu${NC}"
echo "     or edit ${BLUE}$ENV_FILE${NC}"
echo ""
echo "  2. Test the installation:"
echo "     ${YELLOW}free-vision --help${NC}"
echo "     ${YELLOW}free-vision doctor${NC}"
echo ""
echo "  3. Try it in Codex:"
echo "     - Upload an image in Codex"
echo "     - Free Vision Skill will auto-analyze it"
echo ""
echo "  4. Shell aliases:"
if [ -n "$SHELL_CONFIG" ]; then
    echo "     ${YELLOW}source $SHELL_CONFIG${NC} to enable 'fv' shortcut"
fi
echo ""
echo "  Codex config: ${BLUE}$CODEX_CONFIG${NC}"
echo "  .env config:   ${BLUE}$ENV_FILE${NC}"
echo "  Cli config:    ${BLUE}$CODEX_CONFIG/config.json.backup-*${NC} (if any)"
echo ""
echo "For help: https://github.com/lora-sys/free-vision-skill"
echo ""
