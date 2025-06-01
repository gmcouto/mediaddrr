// logger.ts
import * as rfs from 'rotating-file-stream';
import fs from 'fs';

const logDirectory = './config/logs';

// Ensure log directory exists
fs.mkdirSync(logDirectory, { recursive: true });

const stream = rfs.createStream('app.log', {
  interval: '1d',
  size: '10M',
  maxFiles: 7,
  compress: 'gzip',
  path: logDirectory,
});

function format(level: string, message: string) {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${level.toUpperCase()}] ${message}\n`;
}

export const logger = {
  info: (msg: string) => stream.write(format('info', msg)),
  warn: (msg: string) => stream.write(format('warn', msg)),
  error: (msg: string) => stream.write(format('error', msg)),
};
