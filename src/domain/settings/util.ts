import { promises as fs } from 'fs';
import path from 'path';
import { SettingsSchema } from './schema';
import type { Pattern, Settings } from './schema';
import { logger } from '~/logger';

const settingsPath = path.resolve(process.cwd(), 'config/settings.json');
const settingsBackupPath = path.resolve(process.cwd(), 'config/settings.json.bak');

const CACHE_TTL_MS = 60 * 1000; // 1 minute

interface CacheEntry {
  data: Settings;
  patternAliases: Record<string, Pattern>;
  timestamp: number;
}

let settingsCache: CacheEntry | null = null;

/**
 * Invalidates the settings cache, forcing the next getSettings call to read from disk.
 */
export const invalidateSettingsCache = () => {
  settingsCache = null;
};

/**
 * Loads settings from the file system.
 */
const loadSettingsFromDisk = async (): Promise<Settings> => {
  try {
    const data = await fs.readFile(settingsPath, 'utf-8');
    const json: unknown = JSON.parse(data);
    return SettingsSchema.parse(json);
  } catch (error) {
    logger.error(`Failed to load settings: ${error instanceof Error ? error.message : JSON.stringify(error)}`);
    logger.error('Returning default settings');
    return SettingsSchema.parse({});
  }
};

/**
 * Gets settings, using cache if available and not expired (1 minute TTL).
 */
export const getSettings = async (): Promise<Settings> => {
  const now = Date.now();

  // Check if cache is valid
  if (settingsCache && now - settingsCache.timestamp < CACHE_TTL_MS) {
    return settingsCache.data;
  }

  // Cache miss or expired, load from disk
  const settings = await loadSettingsFromDisk();
  // create a simple map of alias -> pattern
  const patternAliases = Object.fromEntries(
    Object.values(settings.patterns).flatMap((pattern) => pattern.aliases.map((alias) => [alias.toLocaleLowerCase(), pattern])),
  );
  settingsCache = {
    data: settings,
    patternAliases,
    timestamp: now,
  };
  return settings;
};

/**
 * Saves settings to disk and invalidates the cache.
 */
export const setSettings = async (settings: unknown) => {
  const parsed = SettingsSchema.parse(settings);
  try {
    await fs.copyFile(settingsPath, settingsBackupPath);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_) {
    logger.error('Failed to create backup of settings.json');
  }
  await fs.writeFile(settingsPath, JSON.stringify(parsed, null, 2), 'utf-8');

  // create a simple map of alias -> pattern
  const patternAliases = Object.fromEntries(
    Object.values(parsed.patterns).flatMap((pattern) => pattern.aliases.map((alias) => [alias.toLocaleLowerCase(), pattern])),
  );

  // Invalidate cache and update with new data
  settingsCache = {
    data: parsed,
    patternAliases,
    timestamp: Date.now(),
  };

  return parsed;
};

export const getRadarrInstance = async (instanceId: string) => {
  const settings = await getSettings();
  return settings.radarrInstances[instanceId];
};

export const getPatternWithAlias = async (patternIdOrAlias: string) => {
  const settings = await getSettings();
  const pattern = settings.patterns[patternIdOrAlias] || settingsCache?.patternAliases[patternIdOrAlias.toLocaleLowerCase()];
  if (!pattern) {
    throw new Error(`Pattern ${patternIdOrAlias} not found`);
  }
  return pattern;
};
