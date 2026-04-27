import { z } from 'zod';

const ConfigSchema = z.object({
  port: z
    .number()
    .int()
    .min(1)
    .max(65535)
    .default(3000)
    .describe('Port for the local proxy server to listen on'),
  targetUrl: z
    .string()
    .url()
    .describe('Target URL to forward incoming webhook requests to'),
  hookdeckSourceUrl: z
    .string()
    .url()
    .optional()
    .describe('Hookdeck source URL to poll or connect to'),
  logLevel: z
    .enum(['debug', 'info', 'warn', 'error'])
    .default('info')
    .describe('Logging verbosity level'),
  requestHistoryLimit: z
    .number()
    .int()
    .min(1)
    .max(1000)
    .default(100)
    .describe('Maximum number of requests to keep in memory for replay'),
});

export type Config = z.infer<typeof ConfigSchema>;

export function loadConfig(overrides: Partial<Config> = {}): Config {
  const raw = {
    port: process.env.PORT ? parseInt(process.env.PORT, 10) : undefined,
    targetUrl: process.env.TARGET_URL,
    hookdeckSourceUrl: process.env.HOOKDECK_SOURCE_URL,
    logLevel: process.env.LOG_LEVEL,
    requestHistoryLimit: process.env.REQUEST_HISTORY_LIMIT
      ? parseInt(process.env.REQUEST_HISTORY_LIMIT, 10)
      : undefined,
    ...overrides,
  };

  const result = ConfigSchema.safeParse(
    Object.fromEntries(Object.entries(raw).filter(([, v]) => v !== undefined))
  );

  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid configuration:\n${issues}`);
  }

  return result.data;
}
