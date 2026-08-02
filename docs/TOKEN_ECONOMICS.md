# Token 经济学

本文档分析 Free Vision Skill 的 Token 消耗和节省效果。

## 📊 对比：传统方案 vs Free Vision Skill

| 方案 | Token 消耗 | 成本（按 $0.001/1K tokens） |
|------|-----------|--------------------------|
| **传统方案**（完整视觉描述） | 2000-5000 | $0.002-0.005/次 |
| **Free Vision Skill**（VEP） | **50-150** | **$0.00005-0.00015/次** |
| **节省比例** | **90-95%** | **95-97%** 💰 |

---

## 📈 VEP 格式大小

### 字段级别分析

| 字段 | 典型大小 | Token 估算 | 说明 |
|------|---------|-----------|------|
| `VEP/1\|src=zhipu/glm-4.6v-flash` | 35 chars | ~10 tokens | Provider + 模型 |
| `m=error` | 8 chars | ~2 tokens | 模式 |
| `a="Cannot find module"` | 26 chars | ~7 tokens | 答案 |
| `t="src/app.ts:42"` | 17 chars | ~5 tokens | OCR 文本 |
| `o=[button,input,modal]` | 23 chars | ~6 tokens | 对象列表 |
| `e=[overlapping,clipped]` | 27 chars | ~7 tokens | 错误列表 |
| `v=[45200,58300,72100]` | 25 chars | ~6 tokens | 数值列表 |
| `c=0.97` | 6 chars | ~2 tokens | 置信度 |
| `cache=hit` | 10 chars | ~3 tokens | 缓存状态（可选） |

**总计：** ~150-500 chars → **~40-130 tokens**

---

## 🎯 场景对比

### 场景 1：错误提取

| 维度 | 传统方案 | Free Vision Skill |
|------|---------|------------------|
| **Token 消耗** | 2000+ | **~50** |
| **输出内容** | 完整错误分析 | 精确错误 + 文件名 + 行号 |
| **包含推理** | ✅ 是 | ❌ 否（主模型负责） |
| **节省比例** | - | **97%** ✨ |

**VEP 输出示例：**
```
VEP/1|src=zhipu/glm-4.6v-flash|m=error|
a="Cannot find module 'lodash'"|
t="webpack.config.js:15"|
e=[module resolution error]|
c=0.98
```

---

### 场景 2：UI 审查

| 维度 | 传统方案 | Free Vision Skill |
|------|---------|------------------|
| **Token 消耗** | 3000+ | **~80** |
| **输出内容** | 完整 UI 描述 | UI 元素列表 + 问题类型 |
| **节省比例** | - | **97%** ✨ |

**VEP 输出示例：**
```
VEP/1|src=zhipu/glm-4.6v-flash|m=ui|
o=[{name:"Submit",issue:"disabled"},{name:"Avatar",issue:"clipped"}]|
c=0.95
```

---

### 场景 3：OCR 表格

| 维度 | 传统方案 | Free Vision Skill |
|------|---------|------------------|
| **Token 消耗** | 4000+ | **~120** |
| **输出内容** | 完整表格描述 | 结构化表格数据 |
| **节省比例** | - | **97%** ✨ |

**VEP 输出示例：**
```
VEP/1|src=zhipu/glm-4.6v-flash|m=ocr|
a="Q3 销售报表"|
t=[["产品","销售额","增长率"],["A",12000,"15%"],["B",8500,"8%"]]|
c=0.92
```

---

### 场景 4：图表分析

| 维度 | 传统方案 | Free Vision Skill |
|------|---------|------------------|
| **Token 消耗** | 2500+ | **~70** |
| **输出内容** | 完整图表描述 | 标题 + 趋势 + 关键数值 |
| **节省比例** | - | **97%** ✨ |

**VEP 输出示例：**
```
VEP/1|src=zhipu/glm-4.6v-flash|m=chart|
a="月度营收增长"|
v=[45200,58300,72100]|
c=0.96
```

---

## 💰 成本对比（月度估算）

假设每天 10 次图片分析：

| 方案 | 单次成本 | 月成本 | 年成本 |
|------|---------|--------|--------|
| **传统方案**（3000 tokens/次） | $0.003 | **$0.90** | **$10.95** |
| **Free Vision Skill**（100 tokens/次） | $0.0001 | **$0.03** | **$0.37** |
| **节省（月）** | - | **$0.87** | - |
| **节省（年）** | - | - | **$10.58** |

**使用免费 Provider（如 Zhipu、OpenRouter）：**
- ✅ **零成本**（永久免费额度）

---

## 🎯 Token 节省来源

### 1. **事实优先，不包含推理**

**传统方案：**
```
"这张图片显示了一个 TypeScript 编译错误。错误信息是 
'Cannot find module lodash'，出现在 webpack.config.js 的第 15 行。
这通常意味着 lodash 没有安装或者路径配置错误。
你可以尝试运行 npm install lodash 或者检查 tsconfig.json..."
→ 2000+ tokens
```

**Free Vision Skill：**
```
VEP/1|src=zhipu/glm-4.6v-flash|m=error|
a="Cannot find module 'lodash'"|
t="webpack.config.js:15"|
e=[module resolution error]|
c=0.98
→ ~50 tokens
```

**节省：** 推理留给主模型，不在视觉提取阶段生成。

---

### 2. **结构化格式，无冗余描述**

**传统方案：**
```
"The screenshot shows a terminal window with a red error message 
at the top saying 'Error: Cannot find module...' followed by a 
stack trace showing the file path..."
→ 大量描述性语言
```

**Free Vision Skill：**
```
a="Cannot find module 'lodash'"|t="webpack.config.js:15"
→ 键值对，无冗余
```

**节省：** VEP 协议只包含字段，不包含自然语言描述。

---

### 3. **缓存命中，零额外成本**

**首次请求：**
```
图片 + 问题 → 视觉 API → VEP → 主模型
→ 消耗视觉 API tokens
```

**重复请求（缓存命中）：**
```
图片 + 问题 → 缓存直接返回 VEP → 主模型
→ 零额外成本 ✨
```

**缓存命中率优化：**
- 相同图片 + 相同问题 → 100% 命中
- 开发时重复测试 → 高命中率

---

## 📊 实测数据

基于测试套件的实测数据：

| 场景 | VEP 输出 | VEP 大小 | 主模型接收 | 节省 |
|------|---------|---------|-----------|------|
| **错误提取** | `a="Cannot find module"` | ~150 chars | ~50 tokens | **97%** |
| **UI 审计** | `o=[{name:"Submit",issue:"disabled"}]` | ~400 chars | ~80 tokens | **96%** |
| **OCR 表格** | `t=[["产品","销售额"],["A",12000]]` | ~500 chars | ~120 tokens | **95%** |
| **图表分析** | `v=[45200,58300,72100]` | ~300 chars | ~70 tokens | **97%** |

---

## 🚀 优化 Token 消耗的技巧

### 1. **使用聚焦式问题**

```bash
# ✅ 好：只提取你需要的信息
--question "只提取错误信息和行号"

# ❌ 避免：要求完整分析
--question "详细分析并提供完整解决方案"
```

### 2. **利用缓存**

```bash
# 相同图片+问题自动命中缓存
# 无需额外配置
```

### 3. **选择合适的 Provider**

| Provider | Token 限制 | 适合场景 |
|---------|-----------|---------|
| **Zhipu** | 永久免费 | 国内用户首选 |
| **OpenRouter** | 永久免费 | 全球用户首选 |
| **Groq** | 免费计划 | 高速推理 |

### 4. **跳过缓存（开发时）**

```bash
# 确保每次获取最新结果
free-vision see --image ./test.png --no-cache --question "..."
```

---

## 📚 相关文档

- **[VEP 协议规范](./VEP.md)** — VEP/1 格式详解
- **[Provider 对比](./PROVIDERS.md)** — 13 个 Provider Token 限制
- **[性能优化](./PERFORMANCE.md)** — 缓存策略和并发控制
