# Roadmap

## ✅ v0.1.0 — MVP（已完成）

- [x] Provider registry（13 个 Provider）
- [x] VEP/1 协议
- [x] Auto-fallback 降级
- [x] SHA-256 本地缓存
- [x] .env 和 Keychain
- [x] Agent Skill 文档
- [x] GitHub 发布
- [x] 完整中文文档
- [x] 英文文档框架

## 🚧 v0.2 — 集成增强版（已完成 ✅）

### ✅ P0 — 必须完成

- [x] **Claude Code Hook** — 自动检测图片并调用
  - [x] 创建 Hook 脚本
  - [x] 实现图片检测
  - [x] 智能问题生成（8 种图片类型）
- [x] **Provider 健康检查** — `free-vision doctor` 增强
  - [x] 创建 `src/health.ts`
  - [x] 实时健康检查
  - [x] 彩色输出
  - [x] 延迟测量

### ✅ P1 — 应该完成

- [x] **Codex 一键安装** — `codex install free-vision`
  - [x] 创建安装脚本
  - [x] 配置合并和备份
  - [x] 交互式测试
- [x] **OpenCode Agent** — 集成文档和配置
  - [x] 完整配置示例
  - [x] 故障排除指南
- [ ] **图片自动裁剪** — `--auto-crop` 基础功能（延迟到 v0.3）

### 🟢 P2 — 可以完成

- [ ] **新 Provider** — 2-3 个国内 Provider（SiliconFlow 等）
- [ ] **性能优化** — 缓存策略改进
- [ ] **错误处理** — 更友好的错误提示

### 📊 v0.2 工作量

- P0 必须：5-7 小时
- P1 应该：8-13 小时
- P2 可以：2-9 小时
- **建议范围：** P0 + P1 = 13-20 小时

**最小可行版本：** 2-3 天（P0 + 部分 P1）
**完整版本：** 1-2 周（P0 + P1 + 部分 P2）

**详细规划见：** [docs/V02_ROADMAP.md](docs/V02_ROADMAP.md)

---

## 🔮 v0.3 — 高级功能

- [ ] Windows Credential Manager
- [ ] 本地 Secret Broker daemon
- [ ] GUI 设置页
- [ ] Provider 用量统计
- [ ] VEP Schema Validator package
- [ ] Provider community registry
- [ ] 多模态对话支持

---

## 💡 v1.0 — 生产就绪

- [ ] 全面的错误处理和恢复
- [ ] 完整的测试覆盖（>80%）
- [ ] 性能监控和日志
- [ ] 企业级安全审计
- [ ] 完整的 API 文档
- [ ] 插件系统
- [ ] 多语言支持（日文、韩文等）
