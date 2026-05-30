export type LogLevel = 'info' | 'warn' | 'error';

export function logEvent(
  level: LogLevel,
  event: string,
  details: Record<string, unknown> = {}
) {
  const payload = {
    level,
    event,
    timestamp: new Date().toISOString(),
    ...details,
  };

  const message = JSON.stringify(payload);

  if (level === 'error') {
    console.error(message);
    return;
  }

  if (level === 'warn') {
    console.warn(message);
    return;
  }

  console.log(message);
}
