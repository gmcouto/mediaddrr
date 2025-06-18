// logger.ts
import * as rfs from 'rotating-file-stream';
import fs from 'fs';

const logDirectory = './config/logs';

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
  info: (msg: string) => stream.write(format('info', msg)),
  warn: (msg: string) => stream.write(format('warn', msg)),
  error: (msg: string, err?: unknown) => stream.write(format('error', msg, err)),
};
