import { ReactNode } from 'react';

export interface DialogProps {
  children: ReactNode;
}

export default function Dialog({ children }: DialogProps): JSX.Element {
  return (
    <div className='wrapper'>
      <div className='dialog'>{children}</div>
      <div className='scrim' />
      <style jsx>{`
        .wrapper {
          position: fixed;
          top: 0;
          left: 0;
          display: flex;
          align-items: center;
          justify-content: center;
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
