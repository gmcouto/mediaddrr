import type { Pattern } from '../settings/schema';
import { logger } from '~/logger';

/**
 * Extracts all occurrences of a specific tag from XML string.
 * Returns an array of the tag contents.
 *
 * @param xml - The XML string to search
 * @param tag - The tag name to extract (e.g., 'title')
 * @returns Array of tag contents
 *
 * @example
 * extractTags('<title>title1</title><title>title2</title>', 'title')
 * // Returns: ['title1', 'title2']
 */
export const extractTags = async (xml: string, tag: string): Promise<string[]> => {
  const regex = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, 'g');
  const matches: string[] = [];
  let match;

  while ((match = regex.exec(xml)) !== null) {
    matches.push(match[1] ?? '');
  }

  return matches;
};

export const processVariables = async (entry: string, pattern: Pattern) => {
  const outputVariables: Record<string, string> = {};
  const firstVariable = pattern.variables[0];
  if (!firstVariable) {
    logger.warn('No variables found in pattern');
    return null;
  }
  const regex = new RegExp(firstVariable.regex);
  if (!regex.test(entry)) {
    logger.debug(`First variable ${firstVariable.name} not found in source ${entry}`);
    return null;
  }
  for (const variable of pattern.variables) {
    const source = variable.from ? (outputVariables[variable.from] ?? entry) : entry;
    const regex = new RegExp(variable.regex);
    outputVariables[variable.name] = source.replace(regex, variable.replaceWith).trim();
  }
  return outputVariables;
};

export const processOutput = async (output: string, outputVariables: Record<string, string>) => {
  const usedVars = output.match(/\$\{(\w+)\}/g) ?? [];
  for (const match of usedVars) {
    const regex = /\$\{(\w+)\}/;
    const varName = regex.exec(match)?.[1];
    if (!varName) continue;
    output = output.replace(match, outputVariables[varName] ?? '');
  }
  return output;
};

export const processTag = async (xml: string, tag: string, pattern: Pattern) => {
  const tags = await extractTags(xml, tag);
  let xmlOutput = xml;
  for (const tagContent of tags) {
    const variables = await processVariables(tagContent, pattern);
    if (!variables) continue;
    const output = await processOutput(pattern.output, variables);
    xmlOutput = xmlOutput.replace(
      `<${tag}>${tagContent}</${tag}>`,
      `<${tag}>${output}</${tag}>`,
    );
  }
  return xmlOutput;
};

export const processXml = async (
  xml: string,
  tags: Record<string, string>,
  patterns: Record<string, Pattern>,
) => {
  let xmlOutput = xml;
  for (const [tagName, patternId] of Object.entries(tags)) {
    const pattern = patterns[patternId];
    if (!pattern) {
      logger.warn(`Pattern ${patternId} not found for tag ${tagName}`);
      continue;
    }
    xmlOutput = await processTag(xmlOutput, tagName, pattern);
  }
  return xmlOutput;
};
