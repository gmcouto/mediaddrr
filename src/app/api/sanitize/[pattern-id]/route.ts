import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSettings } from '../../../../domain/settings/util';
import { processVariables, processOutput } from '../../../../domain/rss/tagProcessor';
import { logger } from '~/logger';

/**
 * Sanitize API endpoint that processes input text using a pattern.
 * Accepts input via query parameter (?input=...) or request body (plain text).
 * Returns the processed output as plain text.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ 'pattern-id': string }> }) {
  try {
    const patternId = (await params)['pattern-id'];
    if (!patternId) {
      return new NextResponse('Pattern ID is required', { status: 400 });
    }

    // Get input from query parameter
    const searchParams = request.nextUrl.searchParams;
    const input = searchParams.get('input');

    if (!input) {
      return new NextResponse('Input is required. Provide ?input=... or send text in POST body', { status: 400 });
    }

    // Load settings to get patterns
    const settings = await getSettings();
    const pattern = settings.patterns[patternId];

    if (!pattern) {
      return new NextResponse(`Pattern "${patternId}" not found`, { status: 404 });
    }

    // Process variables
    const variables = await processVariables(input, pattern);

    if (!variables) {
      return new NextResponse('Pattern processing failed - first variable did not match', { status: 200 });
    }

    // Process output
    const output = await processOutput(pattern.output, variables);

    return new NextResponse(output, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Sanitize API error: ${message}`);
    return new NextResponse(`Error: ${message}`, { status: 500 });
  }
}

/**
 * POST handler for sanitize endpoint.
 * Accepts input as plain text in the request body.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ 'pattern-id': string }> }) {
  try {
    const patternId = (await params)['pattern-id'];
    if (!patternId) {
      return new NextResponse('Pattern ID is required', { status: 400 });
    }

    // Get input from request body (as plain text)
    const input = await request.text();

    if (!input || input.trim() === '') {
      return new NextResponse('Input is required in request body', { status: 400 });
    }

    // Load settings to get patterns
    const settings = await getSettings();
    const pattern = settings.patterns[patternId];

    if (!pattern) {
      return new NextResponse(`Pattern "${patternId}" not found`, { status: 404 });
    }

    // Process variables
    const variables = await processVariables(input, pattern);

    if (!variables) {
      return new NextResponse('Pattern processing failed - first variable did not match', { status: 200 });
    }

    // Process output
    const output = await processOutput(pattern.output, variables);

    return new NextResponse(output, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Sanitize API error: ${message}`);
    return new NextResponse(`Error: ${message}`, { status: 500 });
  }
}

