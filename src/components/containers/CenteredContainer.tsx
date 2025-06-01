/**
 * CenteredContainer wraps its children in a visually distinct, centered card with padding and shadow.
 * The background is slightly brighter than the page background.
 */
import React from 'react';

export interface CenteredContainerProps {
  children: React.ReactNode;
}

export function CenteredContainer({ children }: CenteredContainerProps) {
  return <div className="bg-card mx-auto mt-16 w-full max-w-[800px] rounded-lg p-8 shadow">{children}</div>;
}
