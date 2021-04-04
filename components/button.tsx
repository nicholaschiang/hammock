import cn from 'classnames';

import GoogleIcon from 'components/icons/google';

export interface ButtonProps {
  disabled?: boolean;
  onClick?: () => void;
  children: string;
  google?: boolean;
}

export default function Button({
  disabled,
  onClick,
  children,
  google,
}: ButtonProps): JSX.Element {
  return (
    <button
      className={cn({ google })}
      type='button'
      onClick={onClick}
      disabled={disabled}
    >
      {google && (
        <div className='google'>
          <GoogleIcon />
        </div>
      )}
      {children}
      <style jsx>{`
        button {
          --border-color: var(--primary);
          border: 2px solid var(--border-color);
          background: var(--primary);
          color: var(--on-primary);
          border-radius: 6px;
          position: relative;
          height: 50px;
          text-align: center;
          font-size: 16px;
          font-weight: 600;
          font-family: var(--font-sans);
          transition: all 0.2s ease 0s;
          cursor: pointer;
          display: block;
          padding: 0 24px;
          margin: 0;
        }

        button:disabled {
          --border-color: var(--accents-2);
          cursor: not-allowed;
          background: var(--accents-1);
          border-color: var(--border-color);
          color: var(--accents-4);
          filter: grayscale(1);
          transform: translateZ(0px);
          backface-visibility: hidden;
        }

        button:not(:disabled):hover {
          --border-color: var(--primary);
          color: var(--primary);
          background: var(--on-primary);
          border-color: var(--border-color);
        }

        button > .google {
          position: absolute;
          background: #fff;
          border-top-left-radius: 4px;
          border-bottom-left-radius: 4px;
          border-right: 2px solid var(--border-color);
          transition: all 0.2s ease 0s;
          padding: 3px;
          height: 46px;
          width: 48px;
          left: 0;
          top: 0;
        }

        @media (max-width: 450px) {
          button.google {
            padding-left: 70px;
          }
        }
      `}</style>
    </button>
  );
}
