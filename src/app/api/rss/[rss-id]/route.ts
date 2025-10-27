import { type NextRequest, NextResponse } from 'next/server';
import { loadRssFeed } from '~/domain/rss/rssLoader';
import { processXml } from '~/domain/rss/tagProcessor';
import { getSettings } from '~/domain/settings/util';
import { logger } from '~/logger';

export async function GET(request: NextRequest, { params }: { params: Promise<{ 'rss-id': string }> }) {
  try {
    const { 'rss-id': rssId } = await params;
    const settings = await getSettings();
    if (!settings.rssFeeds) {
      return NextResponse.json({ error: 'RSS feeds not configured' }, { status: 404 });
    }
    const rssFeeds = settings.rssFeeds;

    const rssFeed = rssFeeds[rssId];

    if (!rssFeed) {
      return NextResponse.json({ error: 'RSS feed not found' }, { status: 404 });
    }

    if (!rssFeed.url) {
      return NextResponse.json({ error: 'RSS feed URL not configured' }, { status: 500 });
    }
    if (!rssFeed.processors) {
      return NextResponse.json({ error: 'RSS feed processors not configured' }, { status: 500 });
    }
    if (!rssFeed.processors.length) {
      return NextResponse.json({ error: 'RSS feed processors not configured' }, { status: 500 });
    }
    const { content, headers } = await loadRssFeed(rssId, rssFeed.url, Object.fromEntries(request.headers.entries()));
    const processedContent = await processXml(content, rssFeed.processors);
    return new Response(processedContent, { headers });
  } catch (error: unknown) {
    logger.error('Error generating feed', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
