export interface AppConfig {
  port: number;
  businessDate: string;
}

export function loadAppConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const rawPort = env.PORT ?? '3000';
  const port = Number(rawPort);
  if (
    !/^\d+$/.test(rawPort) ||
    !Number.isInteger(port) ||
    port < 1 ||
    port > 65535
  ) {
    throw new Error('PORT must be an integer between 1 and 65535.');
  }

  const businessDate = env.BUSINESS_DATE ?? '2026-05-15';
  const timestamp = Date.parse(`${businessDate}T00:00:00.000Z`);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(businessDate) ||
    !Number.isFinite(timestamp) ||
    new Date(timestamp).toISOString().slice(0, 10) !== businessDate
  ) {
    throw new Error(
      'BUSINESS_DATE must be a valid calendar date in YYYY-MM-DD format.',
    );
  }

  return { port, businessDate };
}
