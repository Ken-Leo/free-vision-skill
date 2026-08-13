import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { resolveProviderOrder, providerRuntime } from "./providers.js";
import { callVision } from "./call.js";
import type { Region, CliArgs } from "./types.js";

/**
 * `describe` 完整通读模式
 *
 * 与 `see` 不同，它不套 VEP 压缩 schema、不做字段裁剪：
 * 让视觉模型完整、逐区域地描述整张图片，直接返回原文。
 * 适用于"按图片还原软件 UI / 界面全貌"等需要高精度信息的场景。
 */

export function buildDescribePrompt(): string {
  return [
    "请完整、仔细地识别这张图片并作出尽可能详尽的描述。",
    "如果是软件/GUI/网页界面，请自上而下、逐区域完整通读，不要有任何遗漏：",
    "1) 应用/窗口标题与应用性质",
    "2) 菜单栏/导航栏的每一项",
    "3) 工具栏/按钮（图标或文字名）",
    "4) 左右侧面板及其中的树、列表、条目",
    "5) 主内容区：所有控件、表格的列名与数据、输入框及其当前值、标签",
    "6) 状态栏、页签、弹窗、复选框/单选框等控件状态",
    "7) 布局结构、间距与整体配色",
    "每个可见的标签、数字、开关状态都要写出来；不要用“等等/…”概括省略。默认用中文回答。",
  ].join("\n");
}

function imageMime(filePath: string): string | undefined {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case ".png": return "image/png";
    case ".jpg": case ".jpeg": return "image/jpeg";
    case ".webp": return "image/webp";
    case ".gif": return "image/gif";
    case ".bmp": return "image/bmp";
    case ".avif": return "image/avif";
    default: return undefined;
  }
}

function toDataUrl(bytes: Buffer, mime?: string): string {
  return `data:${mime ?? "image/png"};base64,${bytes.toString("base64")}`;
}

export async function runDescribe(args: CliArgs): Promise<void> {
  const imagePath = typeof args.image === "string" ? args.image : "";
  const imageUrl = typeof args["image-url"] === "string" ? args["image-url"] : "";
  if (!imagePath && !imageUrl) {
    throw new Error(
      "describe requires --image <local-image-path> or --image-url <public-url>"
    );
  }

  const requested =
    typeof args.provider === "string"
      ? args.provider
      : process.env.VISION_PROVIDER || "auto";
  const regionRaw =
    typeof args.region === "string"
      ? args.region
      : process.env.VISION_REGION || "cn";
  const region: Region = regionRaw === "global" ? "global" : "cn";
  const maxTokens = Number(
    (typeof args["max-tokens"] === "string" ? args["max-tokens"] : undefined) ||
    process.env.VISION_MAX_OUTPUT_TOKENS ||
    "4096"
  );
  const timeoutMs = Number(process.env.VISION_TIMEOUT_MS || "300000");
  const prompt =
    typeof args.prompt === "string" && args.prompt.trim()
      ? args.prompt.trim()
      : buildDescribePrompt();

  let imageDataUrl: string;
  if (imageUrl) {
    imageDataUrl = imageUrl;
  } else {
    const absolute = path.resolve(imagePath);
    let data = await readFile(absolute);
    let compressed = false;
    if (data.length > 2 * 1024 * 1024) {
      try {
        const smaller = await sharp(absolute)
          .jpeg({ quality: 85, progressive: true })
          .toBuffer();
        if (smaller.length < data.length) {
          data = Buffer.from(smaller);
          compressed = true;
        }
      } catch {
        /* 压缩失败则使用原图 */
      }
    }
    imageDataUrl = toDataUrl(data, compressed ? "image/jpeg" : imageMime(absolute));
  }

  const providers = resolveProviderOrder(requested, region);
  const errors: string[] = [];

  for (const provider of providers) {
    try {
      const runtime = await providerRuntime(provider);
      const raw = await callVision({
        provider,
        apiKey: runtime.apiKey,
        baseUrl: runtime.baseUrl,
        model: runtime.model,
        prompt,
        imageDataUrl,
        maxTokens,
        timeoutMs
      });
      if (args.json) {
        console.log(
          JSON.stringify(
            { provider: provider.id, model: runtime.model, text: raw },
            null,
            2
          )
        );
      } else {
        console.log(raw);
      }
      return;
    } catch (error) {
      errors.push(
        `${provider.id}: ${error instanceof Error ? error.message : String(error)}`
      );
      if (requested !== "auto") break;
    }
  }

  throw new Error(`All providers failed:\n${errors.join("\n")}`);
}
