import puppeteer, { type Browser, type Page, type CookieData } from 'puppeteer';
import { logger } from '~/logger';

export async function pressThanksButton(url: string, cookies?: CookieData[]): Promise<unknown> {
  if (!cookies) {
    throw new Error('Cookies are required');
  }
  const browser: Browser = await puppeteer.launch({ headless: true });
  await browser.setCookie(...cookies);
  const page: Page = await browser.newPage();

  // Navigate to page
  await page.goto(url, { waitUntil: 'networkidle0' });

  // Run Livewire script
  const result = await page.evaluate(() => {
    // Livewire is injected by the page, so we must use unknown and type guards
    const win = window as unknown as { Livewire?: unknown };
    if (!win.Livewire || typeof win.Livewire !== 'object') {
      throw new Error('Livewire is not available on the page');
    }
    const livewire = win.Livewire as {
      all: () => unknown[];
      find: (id: unknown) => { call: (action: string) => unknown } | undefined;
    };
    if (typeof livewire.all !== 'function' || typeof livewire.find !== 'function') {
      throw new Error('Livewire methods are not available');
    }
    const all = livewire.all();
    const thankButton = all.find(
      (a: unknown) =>
        typeof a === 'object' && a !== null && 'name' in a && (a as { name?: string }).name === 'thank-button',
    ) as { id?: unknown } | undefined;
    if (!thankButton?.id) {
      throw new Error('Could not find thank-button component');
    }
    const comp = livewire.find(thankButton.id);
    if (!comp || typeof comp.call !== 'function') {
      throw new Error('Could not find Livewire component or call method');
    }
    return comp.call('store');
  });

  logger.info(`Livewire action result: ${JSON.stringify(result)}`);

  await browser.close();
  return result;
}

export const getDomainFromUrl = (url: string) => {
  const urlObj = new URL(url);
  return urlObj.hostname;
};

// export const getCookiesFromUrl = async (url: string) => {
//   const cookies = await import('config/cookies');
//   return cookies.cookiesByDomain[getDomainFromUrl(url)] ?? [];
// };

// pressThanksButton(urlToLoad, getCookiesFromUrl(urlToLoad)).catch(console.error);
