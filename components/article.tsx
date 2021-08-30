import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import useSWR, { mutate } from 'swr';
import cn from 'classnames';

import HighlightIcon from 'components/icons/highlight';
import TweetIcon from 'components/icons/tweet';

import { Highlight } from 'lib/model/highlight';
import { Message } from 'lib/model/message';
import { fetcher } from 'lib/fetch';
import fromNode from 'lib/xpath';
import highlightHTML from 'lib/highlight';
import numid from 'lib/utils/numid';
import { useUser } from 'lib/context/user';

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
  const { user } = useUser();
  const { data } = useSWR<Highlight[]>(
    message ? `/api/messages/${message.id}/highlights` : null
  );

  const [highlight, setHighlight] = useState<Highlight>();
  const [position, setPosition] = useState<Position>();
  const articleRef = useRef<HTMLElement>(null);
  const buttonsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // TODO: Perhaps add a `mouseout` event listener that will hide the dialog
    // when the user's mouse exits the highlight and w/in ~100px of dialog.
    function listener(evt: PointerEvent): void {
      if (!evt.target || (evt.target as Node).nodeName !== 'MARK') return;
      const target = evt.target as HTMLElement;
      const id = Number(target.dataset.highlight);
      if (id === highlight?.id || target.dataset.deleted === '') return;
      setPosition({
        x: evt.offsetX,
        y: evt.offsetY,
        containerX: target.offsetLeft,
        containerY: target.offsetTop,
      });
      setHighlight((prev) => data?.find((x) => x.id === id) || prev);
    }
    window.addEventListener('pointerover', listener);
    return () => window.removeEventListener('pointerover', listener);
  }, [data, highlight]);
  useEffect(() => {
    function listener(evt: PointerEvent): void {
      if (buttonsRef.current?.contains(evt.target as Node)) return;
      if ((evt.target as Node).nodeName === 'MARK') return;
      setHighlight(undefined);
    }
    window.addEventListener('pointerdown', listener);
    return () => window.removeEventListener('pointerdown', listener);
  }, []);
  useEffect(() => {
    function listener(evt: PointerEvent): void {
      if (!articleRef.current || !message || !user?.id) return;
      const sel = window.getSelection() || document.getSelection();
      if (!sel || sel.isCollapsed) return;
      const range = sel.getRangeAt(0);
      if (!range || range.collapsed) return;
      setPosition({
        x: evt.offsetX,
        y: evt.offsetY,
        containerX: (evt.target as HTMLElement).offsetLeft,
        containerY: (evt.target as HTMLElement).offsetTop,
      });
      setHighlight({
        start: fromNode(range.startContainer, articleRef.current),
        end: fromNode(range.endContainer, articleRef.current),
        startOffset: range.startOffset,
        endOffset: range.endOffset,
        text: range.toString(),
        user: Number(user.id),
        message: message.id,
        deleted: false,
        id: numid(),
      });
    }
    window.addEventListener('pointerup', listener);
    return () => window.removeEventListener('pointerup', listener);
  }, [message, user]);
  const html = useMemo(
    () => (message ? highlightHTML(message.html, data || []) : ''),
    [message, data]
  );
  const onHighlight = useCallback(async () => {
    setHighlight(undefined);
    if (!message || !highlight) return;
    if (!data?.some((h) => h.id === highlight.id)) {
      window.analytics?.track('Highlight Created');
      const url = `/api/messages/${message.id}/highlights`;
      const add = (p?: Highlight[]) => (p ? [...p, highlight] : [highlight]);
      await mutate(url, add, false);
      await fetcher(url, 'post', highlight);
      await mutate(url);
    } else {
      window.analytics?.track('Highlight Deleted');
      const url = `/api/messages/${message.id}/highlights`;
      const remove = (p?: Highlight[]) => {
        const idx = p?.findIndex((h) => h.id === highlight.id);
        if (!p || !idx || idx < 0) return p;
        const deleted = { ...highlight, deleted: true };
        return [...p.slice(0, idx), deleted, ...p.slice(idx + 1)];
      };
      await mutate(url, remove, false);
      await fetcher(`/api/highlights/${highlight.id}`, 'delete');
      await mutate(url);
    }
  }, [message, highlight, data]);
  const [tweet, setTweet] = useState<string>('');
  useEffect(() => {
    setTweet((prev) =>
      highlight
        ? `“${highlight?.text || ''}” — ${
            message?.name || 'Newsletter'
          }\n\nvia @readhammock\nhttps://readhammock.com/try`
        : prev
    );
  }, [message, highlight]);
  const onTweet = useCallback(async () => {
    setHighlight(undefined);
    if (!message || !highlight) return;
    window.analytics?.track('Highlight Tweeted');
    if (!data?.some((h) => h.id === highlight.id)) {
      window.analytics?.track('Highlight Created');
      const url = `/api/messages/${message.id}/highlights`;
      const add = (p?: Highlight[]) => (p ? [...p, highlight] : [highlight]);
      await mutate(url, add, false);
      await fetcher(url, 'post', highlight);
      await mutate(url);
    }
  }, [message, highlight, data]);

  return (
    <>
      <div className={cn('dialog', { open: highlight && position })}>
        <div className='buttons' ref={buttonsRef}>
          <button
            className={cn('reset button', {
              highlighted: data?.some((x) => x.id === highlight?.id),
            })}
            type='button'
            onClick={onHighlight}
          >
            <HighlightIcon />
          </button>
          <a
            className='reset button'
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
              tweet
            )}`}
            target='_blank'
            rel='noopener noreferrer'
            onClick={onTweet}
          >
            <TweetIcon />
          </a>
        </div>
        <div className='shadows'>
          <div className='shadow' />
          <div className='shadow' />
        </div>
      </div>
      {message && (
        <article ref={articleRef} dangerouslySetInnerHTML={{ __html: html }} />
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
          left: ${(position?.containerX || 0) + 10}px;
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

        .button.highlighted :global(svg) {
          fill: var(--highlight-hover);
          transition: none;
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
          cursor: pointer;
          transition: background 0.2s ease 0s;
        }

        article
          :global(mark[data-highlight='${highlight ? highlight.id : ''}']) {
          background: var(--highlight-hover);
        }

        article :global(mark[data-deleted='']) {
          background: inherit;
          cursor: inherit;
          color: inherit;
        }

        article :global(a mark) {
          color: var(--accents-5);
        }
      `}</style>
    </>
  );
}
