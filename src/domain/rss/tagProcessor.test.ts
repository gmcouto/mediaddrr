import { test, expect } from 'bun:test';
import { extractTags } from './tagProcessor';

test('should extract single tag occurrence', async () => {
  const xml = '<title>Test Movie</title>';
  const result = await extractTags(xml, 'title');
  expect(result).toEqual(['Test Movie']);
});

test('should extract multiple tag occurrences', async () => {
  const xml = '<title>title1</title><title>title2</title><title>title3</title>';
  const result = await extractTags(xml, 'title');
  expect(result).toEqual(['title1', 'title2', 'title3']);
});

test('should extract tags with multiline content', async () => {
  const xml = '<title>First Movie\nSecond Line</title><title>Second Movie</title>';
  const result = await extractTags(xml, 'title');
  expect(result).toEqual(['First Movie\nSecond Line', 'Second Movie']);
});

test('should handle empty tags', async () => {
  const xml = '<title></title><title>Not Empty</title>';
  const result = await extractTags(xml, 'title');
  expect(result).toEqual(['', 'Not Empty']);
});

test('should handle tags with attributes', async () => {
  const xml = '<item id="1"><title>Movie 1</title></item><item id="2"><title>Movie 2</title></item>';
  const result = await extractTags(xml, 'title');
  expect(result).toEqual(['Movie 1', 'Movie 2']);
});

test('should handle self-closing tags', async () => {
  const xml = '<br /><title>Test</title>';
  const result = await extractTags(xml, 'title');
  expect(result).toEqual(['Test']);
});

test('should return empty array for non-existent tag', async () => {
  const xml = '<title>Test</title>';
  const result = await extractTags(xml, 'nonexistent');
  expect(result).toEqual([]);
});

test('should handle empty XML', async () => {
  const xml = '';
  const result = await extractTags(xml, 'title');
  expect(result).toEqual([]);
});

test('should handle different tag types', async () => {
  const xml = '<link>https://example.com</link><link>https://test.com</link>';
  const result = await extractTags(xml, 'link');
  expect(result).toEqual(['https://example.com', 'https://test.com']);
});

test('should extract nested tags correctly', async () => {
  const xml = '<item><title>Nested Title</title></item><item><title>Another Title</title></item>';
  const result = await extractTags(xml, 'title');
  expect(result).toEqual(['Nested Title', 'Another Title']);
});

test('should handle tags with special characters', async () => {
  const xml = '<title>Movie & OVA</title><title>Test &amp; Title</title>';
  const result = await extractTags(xml, 'title');
  expect(result).toEqual(['Movie & OVA', 'Test &amp; Title']);
});

test('should handle tags with whitespace', async () => {
  const xml = '<title>   Padded Title   </title>';
  const result = await extractTags(xml, 'title');
  expect(result).toEqual(['   Padded Title   ']);
});

test('should handle real-world RSS feed data', async () => {
  const xml = `
    <item>
      <title>Griffin in Summer [2024]</title>
      <link>https://example.com/download</link>
      <description>6.44 GB</description>
    </item>
    <item>
      <title>The Wonderfully Weird World of Gumball [2025]</title>
      <link>https://example.com/download2</link>
      <description>15.39 GB</description>
    </item>
  `;
  const titles = await extractTags(xml, 'title');
  const links = await extractTags(xml, 'link');
  const descriptions = await extractTags(xml, 'description');

  expect(titles).toEqual(['Griffin in Summer [2024]', 'The Wonderfully Weird World of Gumball [2025]']);
  expect(links).toEqual(['https://example.com/download', 'https://example.com/download2']);
  expect(descriptions).toEqual(['6.44 GB', '15.39 GB']);
});
