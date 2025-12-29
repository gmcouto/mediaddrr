'use client';

import Link from 'next/link';
import { Button } from '~/components/ui/Button';

type PageInfo = {
  path: string;
  label: string;
};

const PAGES: PageInfo[] = [
  { path: '/settings', label: 'Settings' },
  { path: '/movie-query', label: 'Movie Query' },
  { path: '/patternTester', label: 'Pattern Tester' },
];

export interface PageNavigationProps {
  currentPath: string;
}

/**
 * Navigation component that displays links to all pages, hiding the current page.
 * Pages are displayed in a specific order: Settings, Movie Query, Pattern Tester.
 */
export function PageNavigation({ currentPath }: PageNavigationProps) {
  const pagesToShow = PAGES.filter((page) => page.path !== currentPath);

  if (pagesToShow.length === 0) {
    return null;
  }

  return (
    <div className="mb-4 flex justify-end gap-2">
      {pagesToShow.map((page) => (
        <Link key={page.path} href={page.path}>
          <Button variant="outline" size="sm">
            {page.label}
          </Button>
        </Link>
      ))}
    </div>
  );
}

