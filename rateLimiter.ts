import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

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
