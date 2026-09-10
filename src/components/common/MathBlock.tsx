import React, { useMemo } from 'react';
import katex from 'katex';

interface MathBlockProps {
  math: string;
  display?: boolean;
  className?: string;
}

export const MathBlock: React.FC<MathBlockProps> = ({ math, display = false, className = '' }) => {
  const html = useMemo(() => {
    try {
      return katex.renderToString(math, {
        displayMode: display,
        throwOnError: false,
        strict: false,
      });
    } catch (err) {
      return `<span class="text-rose-500 font-mono text-xs">Math error: ${math}</span>`;
    }
  }, [math, display]);

  return (
    <span
      className={`${display ? 'block my-3 overflow-x-auto py-1 text-center' : 'inline'} ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};
