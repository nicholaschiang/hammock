import { useEffect, useRef, useState } from 'react';
import Router from 'next/router';
import cn from 'classnames';

import ArchiveIcon from 'components/icons/archive';
import ArrowBackIcon from 'components/icons/arrow-back';

export interface ControlsProps {
  archiving: boolean;
  archive: () => void;
}

export default function Controls({
  archiving,
  archive,
}: ControlsProps): JSX.Element {
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
