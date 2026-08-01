import { spawn } from "node:child_process";
import readline from "node:readline";

const SERVICE_PREFIX = "free-vision";

function run(
  command: string,
  args: string[],
  input?: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: ["pipe", "pipe", "pipe"]
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", chunk => { stdout += String(chunk); });
    child.stderr.on("data", chunk => { stderr += String(chunk); });
    child.on("error", reject);
    child.on("close", code => {
      if (code === 0) resolve(stdout.trim());
      else reject(new Error(`${command} exited with ${code}: ${stderr.trim()}`));
    });

    if (input !== undefined) child.stdin.end(input);
    else child.stdin.end();
  });
}

export async function readSecret(promptText: string): Promise<string> {
  if (!process.stdin.isTTY) {
    throw new Error("Interactive secret input requires a TTY.");
  }

  return new Promise((resolve, reject) => {
    const stdin = process.stdin;
    const stdout = process.stdout;
    let value = "";

    stdout.write(promptText);
    stdin.setRawMode?.(true);
    stdin.resume();
    stdin.setEncoding("utf8");

    const onData = (char: string) => {
      if (char === "\u0003") {
        cleanup();
        reject(new Error("Cancelled."));
        return;
      }

      if (char === "\r" || char === "\n") {
        stdout.write("\n");
        cleanup();
        resolve(value.trim());
        return;
      }

      if (char === "\u007f") {
        value = value.slice(0, -1);
        return;
      }

      value += char;
    };

    const cleanup = () => {
      stdin.off("data", onData);
      stdin.setRawMode?.(false);
      stdin.pause();
    };

    stdin.on("data", onData);
  });
}

function accountName(): string {
  return process.env.USER || process.env.USERNAME || "default";
}

function serviceName(providerId: string): string {
  return `${SERVICE_PREFIX}:${providerId}`;
}

export async function storeProviderKey(
  providerId: string,
  apiKey: string
): Promise<void> {
  if (!apiKey) throw new Error("API key cannot be empty.");

  if (process.platform === "darwin") {
    await run("security", [
      "add-generic-password",
      "-U",
      "-a", accountName(),
      "-s", serviceName(providerId),
      "-w", apiKey
    ]);
    return;
  }

  if (process.platform === "linux") {
    await run(
      "secret-tool",
      [
        "store",
        `--label=Free Vision Skill (${providerId})`,
        "service", SERVICE_PREFIX,
        "provider", providerId
      ],
      apiKey
    );
    return;
  }

  throw new Error(
    "OS Keychain login currently supports macOS Keychain and Linux Secret Service. " +
    "On Windows, use a process environment variable or .env outside the repository."
  );
}

export async function loadProviderKey(
  providerId: string,
  envName: string
): Promise<string | undefined> {
  const envValue = process.env[envName]?.trim();
  if (envValue) return envValue;

  try {
    if (process.platform === "darwin") {
      return await run("security", [
        "find-generic-password",
        "-a", accountName(),
        "-s", serviceName(providerId),
        "-w"
      ]);
    }

    if (process.platform === "linux") {
      return await run("secret-tool", [
        "lookup",
        "service", SERVICE_PREFIX,
        "provider", providerId
      ]);
    }
  } catch {
    return undefined;
  }

  return undefined;
}

export async function deleteProviderKey(providerId: string): Promise<void> {
  if (process.platform === "darwin") {
    await run("security", [
      "delete-generic-password",
      "-a", accountName(),
      "-s", serviceName(providerId)
    ]);
    return;
  }

  if (process.platform === "linux") {
    await run("secret-tool", [
      "clear",
      "service", SERVICE_PREFIX,
      "provider", providerId
    ]);
    return;
  }

  throw new Error("Keychain logout is not supported on this platform.");
}
