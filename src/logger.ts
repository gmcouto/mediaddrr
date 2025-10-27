// logger.ts
import * as rfs from 'rotating-file-stream';
import fs from 'fs';

const logDirectory = './config/logs';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'none';
export let LOG_LEVEL: LogLevel = 'info';

export const setLogLevel = (level: LogLevel) => {
  LOG_LEVEL = level;
};
// Ensure log directory exists
fs.mkdirSync(logDirectory, { recursive: true });

const stream = rfs.createStream('app.log', {
  interval: '1d',
  size: '10M',
  maxFiles: 14,
  path: logDirectory,
});

function format(level: string, message: string, err?: unknown) {
  const timestamp = new Date().toISOString();

  if (err) {
    let errorMessage = '';
    if (err instanceof Error) {
      errorMessage = `\nError: ${err.message}\n${err.stack}\n`;
    } else if (typeof err === 'object') {
      errorMessage = `\nError: ${JSON.stringify(err)}\n`;
    } else {
      // eslint-disable-next-line @typescript-eslint/no-base-to-string
      errorMessage = `\nError: ${String(err)}\n`;
    }
    return `[${timestamp}] [${level.toUpperCase()}] ${message}\n${errorMessage}`;
  }

  return `[${timestamp}] [${level.toUpperCase()}] ${message}\n`;
}

export const logger = {
  debug: (msg: string) => {
    if (LOG_LEVEL === 'none' || LOG_LEVEL === 'error' || LOG_LEVEL === 'warn' || LOG_LEVEL === 'info') return;
    console.log(format('debug', msg));
    return stream.write(format('debug', msg));
  },
  info: (msg: string) => {
    if (LOG_LEVEL === 'none' || LOG_LEVEL === 'error' || LOG_LEVEL === 'warn') return;
    console.log(format('info', msg));
    return stream.write(format('info', msg));
  },
  warn: (msg: string) => {
    if (LOG_LEVEL === 'none' || LOG_LEVEL === 'error') return;
    console.log(format('warn', msg));
    return stream.write(format('warn', msg));
  },
  error: (msg: string, err?: unknown) => {
    if (LOG_LEVEL === 'none') return;
    console.log(format('error', msg, err));
    return stream.write(format('error', msg, err));
  },
};
