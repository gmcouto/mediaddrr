import { test, expect } from 'bun:test';
import { requestBodySchema } from './schema';

test('should handle string year and string tmdbId', () => {
  const testInput = { query: 'Black War Mission Extreme 2', year: '2023', tmdbId: '123456' };
  const result = requestBodySchema.parse(testInput);
  expect(result).toEqual({
    query: 'Black War Mission Extreme 2',
    year: 2023,
    tmdbId: '123456',
  });
});

test('should handle number year and number tmdbId', () => {
  const testInputWithStringTmdbId = { query: 'Test Movie', year: 2023, tmdbId: 123456 };
  const result = requestBodySchema.parse(testInputWithStringTmdbId);
  expect(result).toEqual({
    query: 'Test Movie',
    year: 2023,
    tmdbId: '123456',
  });
});

test('should handle optional tmdbId', () => {
  const testInputWithoutTmdbId = { query: 'Test Movie', year: 2023 };
  const result = requestBodySchema.parse(testInputWithoutTmdbId);
  expect(result).toEqual({
    query: 'Test Movie',
    year: 2023,
    tmdbId: undefined,
  });
});
