import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import useSWR, { mutate } from 'swr';
import cn from 'classnames';
import to from 'await-to-js';

import ConfusedEmoji from 'components/emojis/confused';
import CryEmoji from 'components/emojis/cry';
import GrinEmoji from 'components/emojis/grin';
import HighlightIcon from 'components/icons/highlight';
import LoadingDots from 'components/loading-dots';
import StarEmoji from 'components/emojis/star';
import TweetIcon from 'components/icons/tweet';

import { Emoji, Feedback } from 'lib/model/feedback';
import { Highlight, HighlightWithMessage } from 'lib/model/highlight';
import { Message } from 'lib/model/message';
import { fetcher } from 'lib/fetch';
import fromNode from 'lib/xpath';
import highlightHTML from 'lib/highlight';
import numid from 'lib/utils/numid';
import useFetch from 'lib/hooks/fetch';
import { useUser } from 'lib/context/user';

interface Position {
  x: number;
  y: number;
  containerX: number;
  containerY: number;
}

export interface ArticleProps {
  message?: Message;
  scroll: number;
}

export default function Article({ message }: ArticleProps): JSX.Element {
  const { user } = useUser();
  const { data } = useSWR<Highlight[]>(
    message ? `/api/messages/${message.id}/highlights` : null
  );
  const { mutateAll, mutateSingle } = useFetch<HighlightWithMessage>(
    'highlight',
    '/api/highlights'
  );

  const [highlight, setHighlight] = useState<Highlight>();
  const [position, setPosition] = useState<Position>();
  const articleRef = useRef<HTMLElement>(null);
  const buttonsRef = useRef<HTMLDivElement>(null);
  const feedbackRef = useRef<HTMLDivElement>(null);
  const feedbackTextAreaRef = useRef<HTMLTextAreaElement>(null);
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
      if (feedbackRef.current?.contains(evt.target as Node)) return;
      if ((evt.target as Node).nodeName === 'MARK') return;
      setHighlight(undefined);
    }
    window.addEventListener('pointerdown', listener);
    return () => window.removeEventListener('pointerdown', listener);
  }, []);
  useEffect(() => {
    function listener(evt: PointerEvent): void {
      if (!articleRef.current || !message || !user?.id) return;
      if (buttonsRef.current?.contains(evt.target as Node)) return;
      if (feedbackRef.current?.contains(evt.target as Node)) return;
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
      await Promise.all([
        mutate(url, add, false),
        mutateSingle({ ...highlight, message }, false),
      ]);
      await fetcher(url, 'post', highlight);
      await Promise.all([mutateAll(), mutate(url)]);
    } else {
      window.analytics?.track('Highlight Deleted');
      const url = `/api/messages/${message.id}/highlights`;
      const deleted = { ...highlight, deleted: true };
      const remove = (p?: Highlight[]) => {
        const idx = p?.findIndex((h) => h.id === highlight.id);
        if (!p || !idx || idx < 0) return p;
        return [...p.slice(0, idx), deleted, ...p.slice(idx + 1)];
      };
      await Promise.all([
        mutate(url, remove, false),
        mutateSingle({ ...deleted, message }, false),
      ]);
      await fetcher(`/api/highlights/${highlight.id}`, 'delete');
      await Promise.all([mutateAll(), mutate(url)]);
    }
  }, [message, highlight, data, mutateAll, mutateSingle]);
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
  const [feedback, setFeedback] = useState<string>('');
  const [emoji, setEmoji] = useState<Emoji | null>(null);
  const [sending, setSending] = useState<boolean>(false);
  const [sent, setSent] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const onFeedback = useCallback(
    async (evt: FormEvent) => {
      evt.preventDefault();
      if (!message || !user) return;
      setSending(true);
      const body: Feedback = {
        feedback,
        emoji,
        message: message.id,
        user: user.id,
        id: 0,
      };
      window.analytics?.track('Feedback Sent', body);
      const url = `/api/messages/${message.id}/feedback`;
      const [err] = await to(fetcher(url, 'post', body));
      setSending(false);
      if (err) {
        setError(err.message);
      } else {
        setSent(true);
      }
    },
    [message, feedback, emoji, user]
  );

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
      <div className={cn('feedback', { open: false, sent, error })}>
        <div className='wrapper' ref={feedbackRef}>
          <div className='error'>
            <p>Hmm, it looks like we hit a snag.</p>
            <p>{error}</p>
          </div>
          <div className='confirmation'>
            <p>Your feedback has been received!</p>
            <p>Thank you for your help.</p>
          </div>
          <form onSubmit={onFeedback}>
            <textarea
              disabled={sending}
              ref={feedbackTextAreaRef}
              placeholder='What do you think of the newsletter so far?'
              value={feedback}
              onChange={(evt) => setFeedback(evt.currentTarget.value)}
            />
            <div className='actions'>
              <div className='emojis'>
                <button
                  className={cn('reset emoji', { active: emoji === 'star' })}
                  onClick={() => setEmoji('star')}
                  type='button'
                >
                  <StarEmoji />
                </button>
                <button
                  className={cn('reset emoji', { active: emoji === 'grin' })}
                  onClick={() => setEmoji('grin')}
                  type='button'
                >
                  <GrinEmoji />
                </button>
                <button
                  className={cn('reset emoji', {
                    active: emoji === 'confused',
                  })}
                  onClick={() => setEmoji('confused')}
                  type='button'
                >
                  <ConfusedEmoji />
                </button>
                <button
                  className={cn('reset emoji', { active: emoji === 'cry' })}
                  onClick={() => setEmoji('cry')}
                  type='button'
                >
                  <CryEmoji />
                </button>
              </div>
              <button
                className={cn('reset send', { sending })}
                disabled={sending || !feedback}
                type='submit'
              >
                {sending ? <LoadingDots /> : 'Send'}
              </button>
            </div>
          </form>
        </div>
      </div>
      <style jsx>{`
        .feedback {
          position: absolute;
          visibility: hidden;
          opacity: 0;
          transform: translateX(-5px);
          transition: opacity 0.2s ease-out 0s, transform 0.2s ease-out 0s;
          right: 0;
          top: 50%;
        }

        .feedback.open {
          visibility: visible;
          transform: translateX(0px);
          opacity: 1;
        }

        .feedback .wrapper {
          position: absolute;
          top: 0;
          left: 0;
          border: 1px solid var(--accents-2);
          box-shadow: 0 1px 24px rgba(0, 0, 0, 0.08);
          background: var(--background);
          border-radius: 8px;
          overflow: hidden;
          min-width: 100%;
        }

        @media (max-width: 1200px) {
          .feedback {
            border: 1px solid var(--accents-2);
            border-radius: 8px;
            position: unset;
            width: 100%;
          }

          .feedback .wrapper {
            position: unset;
          }
        }

        .feedback .confirmation,
        .feedback .error {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: var(--background);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          z-index: 1;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.2s ease 0s;
        }

        .feedback.sent .confirmation,
        .feedback.error .error {
          opacity: 1;
          pointer-events: unset;
        }

        .feedback .confirmation p,
        .feedback .error p {
          opacity: 0;
          transition: opacity 0.4s ease 0s;
          margin: 4px 8px;
          font-size: 0.85rem;
          line-height: 1.25;
          text-align: center;
        }

        .feedback .error p {
          color: var(--error);
        }

        .feedback.sent .confirmation p,
        .feedback.error .error p {
          opacity: 1;
        }

        .feedback.sent .confirmation p:nth-of-type(1),
        .feedback.error .confirmation p:nth-of-type(1) {
          transition-delay: 0.4s;
        }

        .feedback.sent .confirmation p:nth-of-type(2),
        .feedback.error .confirmation p:nth-of-type(2) {
          transition-delay: 0.8s;
        }

        .feedback form {
          padding: 0;
          margin: 0;
        }

        .feedback textarea {
          display: block;
          font-family: var(--font-sans);
          font-weight: 400;
          font-size: 0.85rem;
          color: var(--on-background);
          appearance: none;
          background: none;
          border: none;
          border-radius: 0;
          padding: 12px;
          margin: 0;
          width: 100%;
          min-width: 250px;
          min-height: 100px;
        }

        .feedback textarea:focus {
          outline: none;
        }

        .feedback .actions {
          display: flex;
          justify-content: space-between;
          padding: 8px;
          border-top: 1px solid var(--accents-2);
          background: var(--accents-1);
        }

        .feedback .emojis {
          display: flex;
          margin-right: 8px;
        }

        button.emoji {
          width: 32px;
          height: 32px;
          border: 1px solid var(--accents-2);
          padding: 5px;
          border-radius: 100%;
          margin: 0 2px;
          transition: all 0.2s cubic-bezier(0.5, -1, 0.5, 2);
        }

        button.emoji:hover {
          background: var(--background);
          transform: scale(1.08);
        }

        button.emoji.active {
          background: var(--background);
          border-color: var(--warning);
          transform: scale(1.12);
        }

        button.emoji:first-child {
          margin-left: 0;
        }

        button.emoji:last-child {
          margin-right: 0;
        }

        button.emoji :global(svg) {
          width: 20px;
          height: 20px;
        }

        button.send {
          font-size: 0.75rem;
          font-weight: 400;
          padding: 4px 8px;
          border-radius: 4px;
          border: 1px solid var(--on-background);
          background: var(--on-background);
          color: var(--background);
          transition: all 0.2s ease 0s;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 50px;
        }

        button.send:hover {
          background: var(--background);
          color: var(--on-background);
        }

        button.send:disabled {
          cursor: not-allowed;
          background: var(--accents-1);
          border: 1px solid var(--accents-2);
          color: var(--accents-4);
          filter: grayscale(1);
        }

        button.send.sending {
          cursor: wait;
        }

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
