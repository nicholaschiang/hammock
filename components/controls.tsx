import Link from 'next/link';

import ArchiveIcon from 'components/icons/archive';
import ArrowBackIcon from 'components/icons/arrow-back';

export default function Controls(): JSX.Element {
  return (
    <div className='controls'>
      <Link href='/'>
        <a className='button'>
          <ArrowBackIcon />
        </a>
      </Link>
      <button role='button' className='reset button'>
        <ArchiveIcon />
      </button>
      <style jsx>{`
        .controls {
          position: fixed;
          top: 48px;
          left: 48px;
          background: var(--background);
          border: 2px solid var(--accents-2);
          border-radius: 32px;
          height: 64px;
          display: flex;
          flex-direction: row;
          padding: 6px;
        }

        .button {
          display: block;
          width: 48px;
          height: 48px;
          padding: 12px;
          border-radius: 100%;
          transition: background 0.2s ease 0s;
        }

        .button:hover {
          background: var(--accents-2);
        }
      `}</style>
    </div>
  );
}
