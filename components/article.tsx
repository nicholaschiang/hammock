import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import cn from 'classnames';

import HighlightIcon from 'components/icons/highlight';
import NoteIcon from 'components/icons/note';
import TweetIcon from 'components/icons/tweet';

import { XPath, fromNode } from 'lib/xpath';
import { Message } from 'lib/model/message';
import highlight from 'lib/highlight';

interface Position {
  x: number;
  y: number;
  containerX: number;
  containerY: number;
}

export interface ArticleProps {
  message?: Message;
}

export default function Article({ message }: ArticleProps): JSX.Element {
  const [xpath, setXPath] = useState<XPath>();
  const [xpaths, setXPaths] = useState<XPath[]>([]);
  const [position, setPosition] = useState<Position>();
  const [selection, setSelection] = useState<string>('');
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    function listener(evt: MouseEvent): void {
      const sel = window.getSelection() || document.getSelection();
      const range = sel?.getRangeAt(0);
      console.log('Range:', range);
      setSelection(range?.toString() || '');
      setPosition({
        x: evt.offsetX,
        y: evt.offsetY,
        containerX: (evt.target as HTMLElement).offsetLeft,
        containerY: (evt.target as HTMLElement).offsetTop,
      });
      setXPath(() => {
        if (!range || range.collapsed || !ref.current) return undefined;
        const { startContainer, endContainer, startOffset, endOffset } = range;
        const start = fromNode(startContainer, ref.current);
        const end = fromNode(endContainer, ref.current);
        return { start, end, startOffset, endOffset };
      });
    }
    window.addEventListener('mouseup', listener);
    return () => window.removeEventListener('mouseup', listener);
  }, []);
  useEffect(() => console.log('Position:', position), [position]);
  const html = useMemo(
    () => (message ? highlight(message.html, xpaths) : ''),
    [xpaths, message]
  );
  const onHighlight = useCallback(() => {
    setXPaths((prev) => {
      if (!xpath) return prev;
      return [...prev, xpath];
    });
  }, [xpath]);
  const onNote = useCallback(() => {
    console.log('TODO: Implement notes.');
  }, []);

  return (
    <>
      <div className={cn('dialog', { open: position && xpath })}>
        <div className='buttons'>
          <button className='reset button' type='button' onClick={onHighlight}>
            <HighlightIcon />
          </button>
          <button className='reset button' type='button' onClick={onNote}>
            <NoteIcon />
          </button>
          <a
            className='reset button'
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
              `“${selection}” — ${message?.from.name || 'Newsletter'}`
            )}`}
            target='_blank'
            rel='noopener noreferrer'
          >
            <TweetIcon />
          </a>
        </div>
        <div className='shadows'>
          <div className='shadow' />
          <div className='shadow' />
          <div className='shadow' />
        </div>
      </div>
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
        .dialog {
          position: absolute;
          visibility: hidden;
          left: ${position?.containerX || 0}px;
          top: ${position?.containerY || 0}px;
        }

        .dialog.open {
          visibility: visible;
        }

        .buttons,
        .shadows {
          position: absolute;
          display: flex;
          left: ${position?.x || 0}px;
          top: ${position?.y || 0}px;
        }

        .button {
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--background);
          pointer-events: initial;
          z-index: 4;
        }

        .dialog .button,
        .dialog .shadow {
          opacity: 0;
          transform: translateY(-5px);
        }

        .dialog.open .button,
        .dialog.open .shadow {
          opacity: 1;
          transform: translateY(0px);
        }

        .button:nth-child(1),
        .shadow:nth-child(1) {
          transition: background 0.2s ease 0s, transform 0.2s ease-out 0s,
            opacity 0.2s ease-out 0s;
        }

        .button:nth-child(2),
        .shadow:nth-child(2) {
          transition: background 0.2s ease 0s, transform 0.2s ease-out 0.05s,
            opacity 0.2s ease-out 0.05s;
        }

        .button:nth-child(3),
        .shadow:nth-child(3) {
          transition: background 0.2s ease 0s, transform 0.2s ease-out 0.1s,
            opacity 0.2s ease-out 0.1s;
        }

        .shadow,
        .button {
          margin: 0 2px;
          width: 35px;
          height: 35px;
          border-radius: 25px;
        }

        .shadow {
          box-shadow: var(--shadow-medium);
        }

        .shadow:first-child,
        .button:first-child {
          margin-left: unset;
        }

        .shadow:last-child,
        .button:last-child {
          margin-right: unset;
        }

        .button:hover {
          background: var(--accents-2);
        }

        .button:disabled {
          cursor: not-allowed;
        }

        .button :global(svg) {
          fill: var(--accents-5);
          transition: fill 0.2s ease 0s;
        }

        .button:hover :global(svg) {
          fill: var(--on-background);
        }

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
