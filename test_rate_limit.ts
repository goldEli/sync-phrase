import { RateLimitedExecutor } from "./rateLimiter";

async function testRateLimit() {
  console.log("Starting Rate Limit Test...");
  const executor = new RateLimitedExecutor();

  // Hack private fields for testing
  (executor as any).maxRequestsPerWindow = 5;
  (executor as any).windowSizeMs = 1000 * 60; // 1 second window
  (executor as any).maxConcurrent = 2;

  const start = Date.now();
  const tasks = [];

  for (let i = 0; i < 10; i++) {
    tasks.push(
      executor.execute(async () => {
        const now = Date.now();
        console.log(`Task ${i} started at ${now - start}ms`);
        await new Promise((resolve) => setTimeout(resolve, 100)); // 100ms task
        console.log(`Task ${i} finished at ${Date.now() - start}ms`);
      }),
    );
  }

  await Promise.all(tasks);
  console.log("All tasks completed");
}

testRateLimit().catch(console.error);
