# 安装方式对比

Free Vision Skill 支持多种安装方式，根据你的使用场景选择最合适的一种。

## 🎯 快速对比

| 方式 | 命令 | 适用场景 | 级别 |
|------|------|---------|------|
| **npx（临时）** | `npx skills add lora-sys/free-vision-skill` | 一次性试用 | 项目 |
| **skills CLI** | `skills add lora-sys/free-vision-skill` | 永久使用 | 项目 |
| **全局安装** | `skills add lora-sys/free-vision-skill -g` | 跨项目使用 | 全局 |
| **一键全 Agent** | `skills add lora-sys/free-vision-skill --all` | 安装到所有支持的 Agent | 全局 |
| **npm 包** | `npm install -g free-vision-skill` | 仅需要 CLI 工具 | 全局 |
| **手动复制** | `cp SKILL.md ~/.claude/skills/` | Claude Code 专用 | 用户 |

## 📦 推荐方式

### 🥇 最佳：npx + skills CLI（无需全局安装）

```bash
# 临时测试（推荐先试这个）
npx skills add lora-sys/free-vision-skill

# 确定好用后，永久安装到当前项目
skills add lora-sys/free-vision-skill

# 或全局安装（所有项目可用）
skills add lora-sys/free-vision-skill -g
```

**优势：**
- ✅ 自动安装到正确的 Agent 目录
- ✅ 自动检测已安装的 Agent（Claude Code、Codex、Cursor 等）
- ✅ 管理方便：`skills list`、`skills update`、`skills remove`
- ✅ 支持版本更新

### 🥈 备选：npm 全局包

如果你只需要 CLI 工具，不需要 Agent Skill 功能：

```bash
npm install -g free-vision-skill
free-vision --version
```

## 🔍 验证安装

```bash
# 查看已安装的 skills
skills list              # 项目级
skills list -g           # 全局
skills list -a claude-code  # 特定 Agent

# 检查 free-vision 是否在列表中
skills ls --json | grep free-vision
```

## 🗑️ 卸载

```bash
# 从当前项目移除
skills remove free-vision

# 从全局移除
skills remove free-vision -g

# 交互式移除（推荐）
skills remove
```

## 📚 更多信息

- [skills CLI 文档](https://skills.sh)
- [Free Vision Skill GitHub](https://github.com/lora-sys/free-vision-skill)
- [Agent 集成示例](../examples/)
