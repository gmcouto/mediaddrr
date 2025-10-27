import path from 'path';
import fs from 'fs/promises';
import z from 'zod';
import { logger } from '~/logger';
import { pick } from '~/lib/utils';
// Having this issue with native fetch in alpine linux: https://www.answeroverflow.com/m/1392840860021821620
// import fetch from 'cross-fetch';

const CACHED_RSS_ENTRY_SCHEMA = z.object({
  date: z.preprocess((val) => {
    if (typeof val === 'string') {
      return new Date(val);
    }
    if (typeof val === 'number') {
      return new Date(val);
    }
    if (val instanceof Date) {
      return val;
    }
    logger.error('Invalid date', val);
    throw new Error(`Invalid date: ${String(val)}`);
  }, z.date()),
  content: z.string(),
  headers: z.record(z.string(), z.string()),
});

const LOAD_RSS_RESULTS_SCHEMA = z.object({
  content: z.string(),
  headers: z.record(z.string(), z.string()),
});

export type LoadRssResults = z.infer<typeof LOAD_RSS_RESULTS_SCHEMA>;

const CACHE_TIME = 1000 * 60 * 5; // 5 minutes

const OMIT_REQUEST_HEADERS = ['accept-encoding']; // not supporting compression for now
const PICK_RESPONSE_HEADERS = ['content-type'];

export const loadRssFeed = async (
  id: string,
  url: string,
  reqHeaders: Record<string, string> = {},
): Promise<LoadRssResults> => {
  OMIT_REQUEST_HEADERS.forEach((header) => {
    delete reqHeaders[header];
  });
  const now = Date.now();
  const cachePath = path.resolve(process.cwd(), `config/cache/rss/${id}.json`);

  // Check if cache file exists
  const cacheExists = await fs
    .access(cachePath)
    .then(() => true)
    .catch(() => false);

  if (cacheExists) {
    try {
      const cachedData = await fs.readFile(cachePath, 'utf-8');
      const cachedJson: unknown = JSON.parse(cachedData);
      const parsedCache = CACHED_RSS_ENTRY_SCHEMA.safeParse(cachedJson);

      if (parsedCache.success) {
        const cached = parsedCache.data;
        const age = now - cached.date.getTime();

        // Use cache if it's still fresh
        if (age < CACHE_TIME) {
          if (!cached.content.includes('<?xml')) {
            logger.error('Cached RSS feed is invalid', { url, headers: cached.headers, xmlContent: cached.content });
            throw new Error('Cached RSS feed is invalid');
          }
          const outputHeaders = pick(cached.headers, PICK_RESPONSE_HEADERS);
          return LOAD_RSS_RESULTS_SCHEMA.parse({
            content: cached.content,
            headers: outputHeaders,
          });
        }
      } else {
        logger.error('cached RSS feed is invalid', cachedJson);
      }
    } catch (error: unknown) {
      logger.error('cache read failed', error);
    }
  }

  logger.info(`RSS feed ${id}: Fetching fresh data from ${url}`);
  // Fetch fresh data
  const response = await fetch(url, {
    method: 'GET',
  });
  const responseHeaders = Object.fromEntries(response.headers.entries());
  const responseXml = await response.text();
  logger.info(`RSS feed ${id}: Fetched ${responseXml.length} characters from ${url}`);

  if (!responseXml.includes('<?xml')) {
    logger.error('RSS feed is invalid', { url, resHeaders: responseHeaders, xmlContent: responseXml });
    // Save to cache to rate limit future requests
    const dataToCache = { date: new Date(), content: '', headers: responseHeaders };
    await fs.writeFile(cachePath, JSON.stringify(dataToCache, null, 2));
    throw new Error('RSS feed is invalid. Will retry in 5 minutes.');
  }

  // Save to cache
  try {
    const cacheDir = path.dirname(cachePath);
    await fs.mkdir(cacheDir, { recursive: true });
    const dataToCache = { date: new Date(), content: responseXml, headers: responseHeaders };
    await fs.writeFile(cachePath, JSON.stringify(dataToCache, null, 2));
  } catch {
    // If cache write fails, still return the data
    // (error is silently ignored)
  }

  const outputHeaders = pick(responseHeaders, PICK_RESPONSE_HEADERS);
  return { content: responseXml, headers: outputHeaders };
};
