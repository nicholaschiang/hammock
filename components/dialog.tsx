import { ReactNode } from 'react';

export interface DialogProps {
  children: ReactNode;
  header?: boolean;
}

export default function Dialog({ children, header }: DialogProps): JSX.Element {
  return (
    <div className='wrapper'>
      {header && (
        <header>
          We released some improvements to make Hammock faster and more stable.
          Please log back in to use the latest version. Full changelog{' '}
          <a href='/changelog' target='_blank' rel='noopener noreferrer'>
            here
          </a>
          .
        </header>
      )}
      <div className='dialog'>{children}</div>
      <div className='scrim' />
      <style jsx>{`
        header {
          background: var(--primary);
          color: var(--on-primary);
          text-align: center;
          padding: 8px 48px;
          line-height: 1.25;
        }

        header a {
          color: unset;
        }

        .wrapper {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 1;
        }

        .dialog {
          max-width: 540px;
          max-height: calc(100% - 32px);
          background: var(--background);
          border-radius: 10px;
          box-shadow: var(--shadow-large);
          overflow: auto;
          padding: 0 48px;
          margin: 48px auto;
          position: relative;
        }

        .scrim {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: -1;
          background-color: rgba(0, 0, 0, 0.32);
          backdrop-filter: blur(2px);
          opacity: 1;
        }

        @media (max-width: 540px) {
          .wrapper {
            background: var(--background);
          }

          .dialog {
            box-shadow: none;
            max-height: 100%;
          }

          .scrim {
            display: none;
          }
        }

        @media (max-width: 450px) {
          .dialog {
            padding: 0 24px;
          }

          h1 {
            margin-top: 24px;
          }
        }
      `}</style>
    </div>
  );
}
