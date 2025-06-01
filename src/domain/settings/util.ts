import { promises as fs } from 'fs';
import path from 'path';
import { SettingsSchema } from './schema';
import { logger } from '~/logger';

const settingsPath = path.resolve(process.cwd(), 'config/settings.json');
const settingsBackupPath = path.resolve(process.cwd(), 'config/settings.json.bak');

export const getSettings = async () => {
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

export const setSettings = async (settings: unknown) => {
  const parsed = SettingsSchema.parse(settings);
  try {
    await fs.copyFile(settingsPath, settingsBackupPath);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_) {
    logger.error('Failed to create backup of settings.json');
  }
  await fs.writeFile(settingsPath, JSON.stringify(parsed, null, 2), 'utf-8');
  return parsed;
};

export const getRadarrInstance = async (instanceId: string) => {
  const settings = await getSettings();
  return settings.radarrInstances[instanceId];
};
