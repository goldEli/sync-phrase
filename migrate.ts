import axios from "axios";
import dotenv from "dotenv";
import chalk from "chalk";

dotenv.config();

const API_BASE = "https://api.phrase.com/v2";

// 速率限制执行器：每5分钟最多1000个请求，最多4个并发
// 速率限制执行器：每5分钟最多1000个请求，最多4个并发
export class RateLimitedExecutor {
  private maxConcurrent: number = 4;
  private maxRequestsPerWindow: number = 1000;
  private windowSizeMs: number = 5 * 60 * 1000; // 5分钟
  private requestQueue: Array<() => Promise<void>> = [];
  private activeCount: number = 0;
  private requestTimes: number[] = [];
  private processing: boolean = false;

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push(async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.processing) return;
    this.processing = true;

    while (this.requestQueue.length > 0) {
      // 等待并发槽位 和 速率限制
      while (this.activeCount >= this.maxConcurrent || !this.canMakeRequest()) {
        await this.waitForSlot();
      }

      const task = this.requestQueue.shift()!;
      this.activeCount++;
      this.recordRequestTime();

      task().finally(() => {
        this.activeCount--;
      });
    }

    this.processing = false;
  }

  private canMakeRequest(): boolean {
    const now = Date.now();
    // 清理过期的请求记录
    const windowStart = now - this.windowSizeMs;
    // 优化：只有当请求数接近限制时才进行完整的过滤，或者定期清理
    // 这里为了简单和准确，每次检查前先过滤一下（量大时可能有效率问题，但对于 JS 数组几千个元素还好）
    // 为了性能，可以只在检查是否超限时才过滤
    if (this.requestTimes.length >= this.maxRequestsPerWindow) {
      this.requestTimes = this.requestTimes.filter((t) => t > windowStart);
    }

    // 是否超过最大请求数
    const isOverLimit = this.requestTimes.length >= this.maxRequestsPerWindow;

    // 如果仍然超限，且最早的请求在窗口内（理论上过滤后都是）
    if (isOverLimit) {
      // 可以在这里打印日志，但要注意不要刷屏
      // console.log(`⚠️ 速率限制：当前窗口内已发送 ${this.requestTimes.length} 个请求`);
      return false;
    }

    return true;
  }

  private async waitForSlot() {
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  private recordRequestTime() {
    this.requestTimes.push(Date.now());
  }

  async waitForAll() {
    while (this.requestQueue.length > 0 || this.activeCount > 0) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
}

const executor = new RateLimitedExecutor();

export async function migrateToPhrase(
  projectId: string,
  valuesByLocale: Record<string, Record<string, string>>,
  existingKeys: Set<string>,
) {
  const PHRASE_TOKEN = process.env.PHRASE_TOKEN!;

  const headers = {
    Authorization: `token ${PHRASE_TOKEN}`,
    "Content-Type": "application/json",
  };

  async function getLocales() {
    const res = await axios.get(`${API_BASE}/projects/${projectId}/locales`, {
      headers,
    });
    return res.data;
  }

  async function createKeyIfNotExists(keyName: string) {
    try {
      const res = await axios.post(
        `${API_BASE}/projects/${projectId}/keys`,
        {
          name: keyName,
        },
        { headers },
      );
      return res.data.id;
    } catch (err: any) {
      if (err.response?.status === 422) {
        // key 已存在
        return null;
      }
      throw err;
    }
  }

  async function setTranslation(
    keyId: string,
    localeId: string,
    value: string,
  ) {
    try {
      await axios.post(
        `${API_BASE}/projects/${projectId}/translations`,
        {
          key_id: keyId,
          locale_id: localeId,
          content: value,
        },
        { headers },
      );
    } catch (error) {
      console.error(
        `❌ Error setting translation for key ${keyId} in locale ${localeId}:`,
        error,
      );
    }
  }

  const locales = await getLocales();

  const localeIdMap: Record<string, string> = {};
  locales.forEach((l: any) => {
    localeIdMap[l.code] = l.id;
  });

  // @ts-ignore
  const keys = Object.keys(valuesByLocale["zh-CN"]);
  console.log(chalk.yellow(`Total keys to migrate: ${keys.length}`));

  for (const key of keys) {
    if (existingKeys.has(key)) {
      console.log(
        chalk.red(
          `⚠️  Key "${key}" already exists in source JSON, skip creating`,
        ),
      );
      continue;
    }

    const progress = chalk.yellow(`(${keys.indexOf(key) + 1}/${keys.length})`);

    console.log(`🔑 Processing key: ${key} ${progress}`);
    const keyId = await createKeyIfNotExists(key);

    if (!keyId) {
      console.log(chalk.red(`⚠️  Key "${key}" already exists, skip creating`));
      continue;
    }

    for (const [locale, values] of Object.entries(valuesByLocale)) {
      const localeId = localeIdMap[locale];
      if (!localeId) continue;

      const str = (values as any)[key];

      executor.execute(async () => {
        await setTranslation(keyId, localeId, str);
        console.log(`  ✅ ${locale}`);
      });
    }
    await executor.waitForAll();
  }

  console.log("🎉 Done");
}
