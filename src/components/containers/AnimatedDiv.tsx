import React from 'react';
import { useAutoAnimate } from '@formkit/auto-animate/react';

export function AnimatedDiv({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const [ref] = useAutoAnimate<HTMLDivElement>();
  return (
    <div ref={ref} {...props}>
      {children}
    </div>
  );
}
