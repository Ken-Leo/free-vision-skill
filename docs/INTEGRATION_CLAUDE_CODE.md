# Claude Code 集成指南

Free Vision Skill 可以与 Claude Code 无缝集成，让 Claude Code 具备视觉能力！

## 🚀 快速安装

### 方法 1：使用 skills CLI（推荐）

```bash
npx skills add lora-sys/free-vision-skill
```

这会自动安装并配置到 Claude Code。

### 方法 2：手动安装

```bash
# 1. 安装 free-vision CLI
npm install -g free-vision-skill

# 2. 复制 Hook 脚本
mkdir -p ~/.claude/hooks
cp hooks/claude-code/detect-image.sh ~/.claude/hooks/

# 3. 配置 Claude Code
cp examples/claude-settings.json ~/.claude/settings.json
```

## ⚙️ 配置

### 基础配置

编辑 `~/.claude/settings.json`：

```json
{
  "hooks": {
    "on-image-upload": {
      "command": "~/.claude/hooks/detect-image.sh",
      "description": "自动分析图片",
      "timeout": 30000
    }
  }
}
```

### 高级配置

```json
{
  "skills": {
    "free-vision": {
      "enabled": true,
      "auto-detect-images": true,
      "default-provider": "auto",
      "default-region": "cn",
      "max-vep-length": 520,
      "cache-enabled": true
    }
  }
}
```

## 💡 使用方式

### 自动模式

1. 在 Claude Code 中上传图片
2. Claude Code 自动调用 free-vision
3. 返回 VEP 给 Claude Code
4. Claude Code 基于 VEP 继续推理

### 手动模式

```bash
# 在 Claude Code 中手动调用
free-vision see --image ./screenshot.png --question "提取错误信息"
```

## 📝 工作流程

```
用户: "帮我看看这个报错截图"
       ↓ 上传图片
Claude Code: 检测到图片
       ↓ 触发 Hook
Hook: 调用 free-vision see
       ↓ 返回 VEP
Claude Code: 接收 VEP
       ↓ 基于视觉证据推理
Claude Code: "错误是 Cannot find module ethers"
```

## 🎯 VEP 示例

```
VEP/1|src=zhipu/glm-4.6v-flash|m=error|
a="Cannot find module 'lodash'"|
t="webpack.config.js:15"|
e=[module resolution error]|
c=0.98
```

Claude Code 会解析这个 VEP 并给出解决方案。

## 🔧 自定义问题

### 基于图片类型

编辑 `hooks/claude-code/detect-image.sh` 中的 `generate_smart_question()` 函数：

```bash
# 错误截图
question="只提取精确错误、文件名和行号"

# UI 截图
question="只列出被裁切、重叠或禁用的 UI 元素"

# 图表
question="只返回图表标题和三个关键值"
```

### 基于文件名

```bash
# 根据文件名关键词推断类型
if [[ "$filename" == *"error"* ]]; then
  question="只提取错误信息"
elif [[ "$filename" == *"ui"* ]]; then
  question="分析 UI 问题"
fi
```

## 🐛 调试

### 查看 Hook 日志

```bash
# Claude Code 日志
tail -f ~/.claude/logs/hooks.log

# Hook 脚本日志（带 DEBUG 模式）
DEBUG=1 ~/.claude/hooks/detect-image.sh ./test.png
```

### 测试 Hook

```bash
# 手动测试
~/.claude/hooks/detect-image.sh ./assets/cover.png

# 测试输出应该是 VEP 格式
VEP/1|src=...
```

## ⚠️ 故障排除

### Hook 不触发

1. 检查 Claude Code 配置：
   ```bash
   cat ~/.claude/settings.json | grep -A 5 hooks
   ```

2. 检查 Hook 脚本权限：
   ```bash
   chmod +x ~/.claude/hooks/detect-image.sh
   ```

3. 检查环境变量：
   ```bash
   echo $CLAUDE_IMAGE_PATH
   ```

### free-vision 未找到

1. 确保已安装：
   ```bash
   npm install -g free-vision-skill
   which free-vision
   ```

2. 或修改 Hook 脚本中的 `FREE_VISION_CLI` 变量

### API Key 问题

1. 检查 Keychain：
   ```bash
   free-vision doctor
   ```

2. 或配置环境变量：
   ```bash
   export ZHIPU_API_KEY=your_key
   ```

## 📚 更多信息

- [VEP 协议](docs/VEP.md)
- [Provider 指南](docs/PROVIDERS.md)
- [安全策略](docs/SECURITY.md)

## 🤝 贡献

如果你有更好的 Hook 实现或检测逻辑，欢迎提交 PR！
