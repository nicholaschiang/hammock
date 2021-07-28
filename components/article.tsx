import { useEffect, useMemo, useRef, useState } from 'react';

import { XPath, fromNode } from 'lib/xpath';
import { Message } from 'lib/model/message';
import highlight from 'lib/highlight';

export interface ArticleProps {
  message?: Message;
}

// Handles highlighting and other annotations.
export default function Article({ message }: ArticleProps): JSX.Element {
  const [xpaths, setXPaths] = useState<XPath[]>([]);
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    function listener(): void {
      const sel = window.getSelection() || document.getSelection();
      const range = sel?.getRangeAt(0);
      console.log('Range:', range);
      setXPaths((prev) => {
        if (!range || !ref.current) return prev;
        const { startContainer, endContainer, startOffset, endOffset } = range;
        const start = fromNode(startContainer, ref.current);
        const end = fromNode(endContainer, ref.current);
        return [...prev, { start, end, startOffset, endOffset }];
      });
    }
    window.addEventListener('mouseup', listener);
    return () => window.removeEventListener('mouseup', listener);
  }, []);
  const html = useMemo(
    () => (message ? highlight(message.html, xpaths) : ''),
    [xpaths, message]
  );

  return (
    <>
      {message && (
        <article ref={ref} dangerouslySetInnerHTML={{ __html: html }} />
      )}
      {!message && (
        <article>
          <p className='loading' />
          <p className='loading' />
          <p className='loading' />
        </article>
      )}
      <style jsx>{`
        p.loading {
          border-radius: 6px;
        }

        p.loading:nth-child(1) {
          height: 45px;
        }

        p.loading:nth-child(2) {
          height: 90px;
        }

        p.loading:nth-child(3) {
          height: 500px;
        }

        article :global(img) {
          max-width: 100%;
          height: auto;
          border: 1px solid var(--accents-2);
          background-color: var(--accents-1);
          display: block;
          margin: 1rem 0;
        }

        article :global(p) {
          font-size: 1rem;
          font-weight: 400;
          margin: 1rem 0;
        }

        article :global(a) {
          color: var(--accents-5);
        }

        article :global(strong) {
          font-weight: 600;
        }

        article :global(b) {
          font-weight: 600;
        }

        article :global(h1),
        article :global(h2),
        article :global(h3),
        article :global(h4),
        article :global(h5),
        article :global(h6) {
          font-size: 1rem;
          font-weight: 600;
          margin: 1rem 0;
        }

        article :global(h1) {
          font-size: 1.3rem;
        }

        article :global(h2) {
          font-size: 1.2rem;
        }

        article :global(h3) {
          font-size: 1.1rem;
        }

        article :global(mark) {
          color: var(--on-highlight);
          background: var(--highlight);
          user-select: none;
        }

        article :global(a mark) {
          color: var(--accents-5);
        }
      `}</style>
    </>
  );
}
