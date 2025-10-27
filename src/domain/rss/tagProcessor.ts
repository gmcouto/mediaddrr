import type { Processor } from '../settings/schema';
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

export const processVariables = async (entry: string, processor: Processor) => {
  const outputVariables: Record<string, string> = {};
  const firstVariable = processor.variables[0];
  if (!firstVariable) {
    logger.warn('No variables found in processor');
    return null;
  }
  const regex = new RegExp(firstVariable.regex);
  if (!regex.test(entry)) {
    logger.debug(`First variable ${firstVariable.name} not found in source ${entry}`);
    return null;
  }
  for (const variable of processor.variables) {
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

export const processTag = async (xml: string, processor: Processor) => {
  const tags = await extractTags(xml, processor.tag);
  let xmlOutput = xml;
  for (const tag of tags) {
    const variables = await processVariables(tag, processor);
    if (!variables) continue;
    const output = await processOutput(processor.output, variables);
    xmlOutput = xmlOutput.replace(
      `<${processor.tag}>${tag}</${processor.tag}>`,
      `<${processor.tag}>${output}</${processor.tag}>`,
    );
  }
  return xmlOutput;
};

export const processXml = async (xml: string, processors: Processor[]) => {
  let xmlOutput = xml;
  for (const processor of processors) {
    xmlOutput = await processTag(xmlOutput, processor);
  }
  return xmlOutput;
};
