import React from 'react';
import clsx from 'clsx';

const shimmerStyle = {
  backgroundImage: 'linear-gradient(90deg, rgba(226,232,240,0) 0%, rgba(226,232,240,0.8) 50%, rgba(226,232,240,0) 100%)',
  backgroundSize: '200% 100%'
};

export default function LoadingSkeleton({
  variant = 'block',
  lines = 1,
  className = '',
  ariaLabel = 'טוען תוכן'
}) {
  if (variant === 'lines') {
    return (
      <div role="status" aria-label={ariaLabel} className="space-y-2">
        {Array.from({ length: lines }).map((_, idx) => (
          <div
            key={idx}
            className={clsx('h-3 rounded-full overflow-hidden relative bg-gray-200/80', className)}
            style={{ ...shimmerStyle, animation: 'shimmer 1.5s linear infinite' }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-label={ariaLabel}
      className={clsx('relative overflow-hidden rounded-xl bg-gray-100/80 animate-pulse', className)}
      style={{ ...shimmerStyle, animation: 'shimmer 1.5s linear infinite' }}
    >
      <span className="sr-only">{ariaLabel}</span>
    </div>
  );
}

if (typeof document !== 'undefined' && !document.getElementById('razarto-shimmer-style')) {
  const style = document.createElement('style');
  style.id = 'razarto-shimmer-style';
  style.innerHTML = `@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`;
  document.head.appendChild(style);
}