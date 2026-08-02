# 使用场景

Free Vision Skill 适用于文本模型需要"看见"的场景。

## 📸 场景 1：错误截图

### 问题

终端报错、编译错误、运行时异常等错误信息通常在截图中。

### 传统方案

手动描述错误信息 → 低效、容易遗漏细节

### Free Vision Skill 方案

```bash
free-vision see --image ./error.png \
  --question "只提取错误信息、文件名和行号"
```

**VEP 输出：**
```
VEP/1|src=zhipu/glm-4.6v-flash|m=error|
a="Cannot find module 'lodash'"|
t="webpack.config.js:15"|
e=[module resolution error]|
c=0.98
```

**优势：**
- ✅ 自动提取精确错误信息
- ✅ 包含文件名和行号
- ✅ 50 tokens vs 传统 2000+ tokens

---

## 🎨 场景 2：UI 截图分析

### 问题

审查 UI 设计、检查布局问题、发现可访问性问题。

### 使用

```bash
free-vision see --image ./ui-screenshot.png \
  --question "列出被裁切、重叠、禁用或异常的 UI 元素"
```

**VEP 输出：**
```
VEP/1|src=zhipu/glm-4.6v-flash|m=ui|
o=[{name:"Submit",issue:"disabled"},{name:"Avatar",issue:"clipped"}]|
c=0.95
```

**优势：**
- ✅ 快速识别 UI 问题
- ✅ 结构化输出（元素名 + 问题类型）
- ✅ 适合批量审查

---

## 📊 场景 3：图表和仪表盘

### 问题

从图表中提取关键数据点、趋势、指标。

### 使用

```bash
free-vision see --image ./dashboard.png \
  --question "返回标题、趋势和三个关键指标"
```

**VEP 输出：**
```
VEP/1|src=zhipu/glm-4.6v-flash|m=chart|
a="月度营收增长"|
v=[45200,58300,72100]|
c=0.96
```

**优势：**
- ✅ 快速提取关键数值
- ✅ 适合数据分析和报告

---

## 📝 场景 4：OCR 和表格识别

### 问题

从图片中提取文本、表格结构、发票信息。

### 使用

```bash
free-vision see --image ./invoice.png \
  --question "提取发票金额、日期和供应商"
```

**VEP 输出：**
```
VEP/1|src=zhipu/glm-4.6v-flash|m=ocr|
a="Q3 销售报表"|
t=[["产品","销售额"],["A",12000],["B",8500]]|
c=0.92
```

**优势：**
- ✅ 表格结构保持
- ✅ 适合发票、报表、文档处理

---

## 🏷️ 场景 5：Logo 和品牌识别

### 问题

识别图片中的品牌 Logo、确认设计资产。

### 使用

```bash
free-vision see --image ./logo.png \
  --question "识别品牌名称和颜色方案"
```

---

## 🔍 场景 6：代码截图

### 问题

从 IDE 截图或代码片段中提取代码内容。

### 使用

```bash
free-vision see --image ./code-screenshot.png \
  --question "提取代码内容，保持格式"
```

---

## 📸 场景 7：截图对比

### 问题

对比 UI 改版前后、A/B 测试结果。

### 使用

```bash
# 分析改版前
free-vision see --image ./before.png \
  --question "列出所有 UI 问题"

# 分析改版后
free-vision see --image ./after.png \
  --question "列出所有 UI 问题"

# 对比结果
```

---

## 🎯 最佳实践

### ✅ 推荐做法

1. **使用聚焦式问题**
   ```bash
   # ✅ 好：只提取错误信息
   --question "只提取错误信息和行号"

   # ❌ 避免：要求完整分析
   --question "详细分析并提供完整解决方案"
   ```

2. **利用缓存**
   ```bash
   # 相同图片+问题自动命中缓存
   # 无需额外配置，默认启用
   ```

3. **选择合适的 Provider**
   ```bash
   # 国内用户
   VISION_REGION=cn

   # 全球用户
   VISION_REGION=global
   ```

### ❌ 避免做法

1. **不要发送通用问题**
   ```bash
   # ❌ 避免：浪费 tokens
   --question "描述这张图片的所有内容"

   # ✅ 只问你需要的信息
   --question "列出所有 UI 问题"
   ```

2. **不要依赖视觉模型推理**
   ```bash
   # ❌ 避免：要求视觉模型做决策
   --question "这个 bug 怎么修复？"

   # ✅ 正确：提取事实，主模型推理
   --question "只提取错误信息"
   ```

---

## 🔄 工作流示例

### 场景：调试错误

```bash
# 1. 截图错误
# 2. 提取错误信息
free-vision see --image ./error.png \
  --question "只提取错误信息和行号"

# 3. 基于 VEP 继续推理
# 4. 生成修复方案
```

### 场景：UI 审查

```bash
# 1. 截图 UI
# 2. 检查 UI 问题
free-vision see --image ./ui.png \
  --question "列出所有 UI 问题"

# 3. 基于 VEP 生成修复建议
# 4. 实施修复
```

---

**更多场景？** 查看 [FAQ](./FAQ.md) 或 [提交 Issue](https://github.com/lora-sys/free-vision-skill/issues)。
