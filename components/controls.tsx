import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Router from 'next/router';
import cn from 'classnames';
import { mutate } from 'swr';

import { MessagesRes } from 'pages/api/messages';

import ArchiveIcon from 'components/icons/archive';
import ArrowBackIcon from 'components/icons/arrow-back';

import { Message } from 'lib/model/message';
import { fetcher } from 'lib/fetch';

export interface ControlsProps {
  message: Message;
}

export default function Controls({ message }: ControlsProps): JSX.Element {
  const [visible, setVisible] = useState<boolean>(true);
  const lastScrollPosition = useRef<number>(0);

  useEffect(() => {
    function handleScroll(): void {
      const currentScrollPosition = window.pageYOffset;
      const prevScrollPosition = lastScrollPosition.current;
      lastScrollPosition.current = currentScrollPosition;
      setVisible(() => {
        const scrolledUp = currentScrollPosition < prevScrollPosition;
        const scrolledToTop = currentScrollPosition < 10;
        return scrolledUp || scrolledToTop;
      });
    }
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const [archiving, setArchiving] = useState<boolean>(false);
  const archive = useCallback(async () => {
    if (!message.id) return;
    setArchiving(true);
    const url = `/api/messages/${message.id}`;
    const data = { ...message.toJSON(), archived: true };
    await mutate(url, fetcher(url, 'put', data));
    // TODO: Mutate the data used in `/feed` to match.
    // See: https://github.com/vercel/swr/issues/1156
    await mutate('/api/messages', (messages: MessagesRes = []) => {
      const idx = messages.findIndex((m) => m.id === data.id);
      if (idx < 0) return messages;
      return [...messages.slice(0, idx), ...messages.slice(idx + 1)];
    });
    Router.back();
  }, [message]);

  return (
    <div className={cn('controls', { visible })}>
      <button
        onClick={() => Router.back()}
        className='reset button'
        type='button'
      >
        <ArrowBackIcon />
      </button>
      <button
        onClick={archive}
        disabled={archiving}
        className='reset button'
        type='button'
      >
        <ArchiveIcon />
      </button>
      <style jsx>{`
        .controls {
          position: fixed;
          opacity: 0;
          top: 0;
          left: 60px;
          right: 60px;
          height: 48px;
          display: flex;
          flex-direction: row;
          justify-content: space-between;
          transition: top 0.2s ease 0s, opacity 0.2s ease 0s;
        }

        .controls.visible {
          opacity: 1;
          top: 48px;
        }

        .button {
          display: block;
          width: 48px;
          height: 48px;
          padding: 12px;
          border-radius: 100%;
          background: var(--background);
          transition: background 0.2s ease 0s;
        }

        .button:hover {
          background: var(--accents-2);
        }

        .button :global(svg) {
          fill: var(--accents-5);
          transition: fill 0.2s ease 0s;
        }

        .button:hover :global(svg) {
          fill: var(--on-background);
        }
      `}</style>
    </div>
  );
}
