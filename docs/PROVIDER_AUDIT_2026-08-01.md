# 免费视觉 API 审计清单

核验日期：2026-08-01

## 用于发现的仓库

### cheahjs/free-llm-api-resources

- 地址：https://github.com/cheahjs/free-llm-api-resources
- 优点：长期维护，明确排除逆向聊天接口和其他不合法服务。
- 缺点：模型变化太快，仍需要逐项查看官方文档。

### open-free-llm-api/awesome-freellm-apis

- 地址：https://github.com/open-free-llm-api/awesome-freellm-apis
- 站点：https://freellm.net/
- 优点：机器可读目录、自动刷新、模型/模态筛选。
- 缺点：自动目录仍可能落后于刚发生的停服事件。

### 不再可用：GitHub Models

GitHub Models 已于 2026-07-30 全面关闭。不要继续使用旧教程中的：

```text
https://models.github.ai/...
```

## 当前最值得接入的永久免费/免费层

| Provider | Base URL | 推荐视觉模型 | 免费形式 | 中国大陆 |
|---|---|---|---|---|
| Zhipu | `https://open.bigmodel.cn/api/paas/v4` | `glm-4.6v-flash`, `glm-4v-flash` | 官方免费模型 | 首选 |
| ModelScope | `https://api-inference.modelscope.cn/v1` | `Qwen/Qwen3-VL-8B-Instruct` | 选定模型免费额度 | 首选 |
| OpenRouter | `https://openrouter.ai/api/v1` | `nvidia/nemotron-nano-12b-v2-vl:free`, `nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free`, `openrouter/free` | 免费模型共享限额 | 访问不保证 |
| Groq | `https://api.groq.com/openai/v1` | `qwen/qwen3.6-27b` | Free Plan | 访问不保证 |
| NVIDIA NIM | `https://integrate.api.nvidia.com/v1` | `nvidia/nemotron-nano-12b-v2-vl` | Prototype free endpoint | 访问不保证 |
| Gemini | `https://generativelanguage.googleapis.com/v1beta/openai/` | `gemini-3.5-flash-lite`, `gemini-3.5-flash` | 支持国家的 Free Tier | 无官方中国镜像 |
| Mistral | `https://api.mistral.ai/v1` | `mistral-small-latest` | Studio Free mode | 访问不保证 |
| Cohere | `https://api.cohere.ai/v2` | `command-a-vision-07-2025` | 评估 Key，1000 次/月 | 访问不保证 |
| Cloudflare | `https://api.cloudflare.com/client/v4/accounts/{id}/ai/v1` | Llama 3.2 Vision, Mistral Small 3.1 | 10,000 neurons/day | 访问不保证 |
| Ollama Cloud | `https://ollama.com/v1` | `qwen3-vl:235b-cloud` | Free 轻量使用 | 访问不保证 |
| SambaNova | `https://api.sambanova.ai/v1` | `Llama-4-Maverick-17B-128E-Instruct` | Free Tier | 访问不保证 |

## 免费试用而非永久免费

| Provider | Base URL | 模型 | 说明 |
|---|---|---|---|
| Alibaba Model Studio | `https://dashscope.aliyuncs.com/compatible-mode/v1` | `qwen3-vl-flash` | 北京区新用户免费额度通常只有 90 天 |
| SiliconFlow | `https://api.siliconflow.cn/v1` | 从控制台实时选择免费 VL 模型 | 2026 年多款旧 VL 模型已下线，不应硬编码 |
| Vercel AI Gateway | `https://ai-gateway.vercel.sh/v1` | 动态 | 每月 credits，不是无限免费 |
| Hugging Face Inference Providers | `https://router.huggingface.co/v1` | 动态 | 免费 credits 极少，适合测试 |

## 关于“镜像地址”

本项目不收录以下类型：

- 逆向网页版 Chatbot；
- 共享或泄漏 API Key；
- 无公司主体、无隐私政策的中转站；
- 声称提供无限 GPT/Claude/Gemini 的匿名代理；
- 通过账号农场、信用卡欺诈或模型冒充维持的低价站。

合规替代策略：

```text
OpenRouter / Gemini 在中国不可用
→ Zhipu / ModelScope / SiliconFlow / Alibaba

海外免费模型波动
→ 本地 Ollama + Qwen3-VL / Gemma 3 / Moondream

同一个开源模型需要另一个托管入口
→ OpenRouter / NVIDIA NIM / ModelScope 中选择官方托管
```

## 必须动态检测的内容

每次发布前运行：

```bash
npm run providers
```

并在各平台控制台确认：

- 模型仍在线；
- 账号仍有免费额度；
- 图片输入仍启用；
- 模型 ID 没有更改；
- 数据训练和保留条款可接受；
- 限流满足使用场景。
