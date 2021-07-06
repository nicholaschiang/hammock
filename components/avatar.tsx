import Image from 'next/image';
import cn from 'classnames';

export interface AvatarProps {
  size: number;
  priority?: boolean;
  loading?: boolean;
  src?: string;
}

export default function Avatar({
  size,
  priority,
  loading,
  src,
}: AvatarProps): JSX.Element {
  const img = src || 'https://assets.tutorbook.org/pngs/profile.png';
  const domain = /([^:]*:\/\/)?([^\/]+\.[^\/]+)/.exec(img);
  const domains = [
    'cdn.substack.com',
    'assets.tutorbook.org',
    'lh3.googleusercontent.com',
    'www.google.com',
  ];

  return (
    <div className={cn('avatar', { loading })}>
      {!loading && (!domain || !domains.includes(domain[2])) && (
        <div className='photo-wrapper'>
          {priority && <link rel='preload' as='image' href={img} />}
          <img className='photo' src={img} alt='' />
        </div>
      )}
      {!loading && domain && domains.includes(domain[2]) && (
        <Image
          priority={priority}
          layout='fixed'
          height={size}
          width={size}
          src={img}
          alt=''
        />
      )}
      <style jsx>{`
        .avatar {
          width: ${size}px;
          height ${size}px;
          overflow: hidden;
          border-radius: 100%;
          background-color: var(--accents-2);

          // Temporary fix to some Next.js <Image /> component styling issues.
          // @see {@link https://github.com/vercel/next.js/issues/18915}
          letter-spacing: 0;
          word-spacing: 0;
          font-size: 0;
        }

        .loading::before {
          content: '';
          display: block;
          padding-top: 100%;
        }

        .photo-wrapper {
          position: relative;
          padding-bottom: 100%;
        }

        .photo {
          visibility: visible;
          position: absolute;
          padding: 0;
          border: medium none;
          margin: auto;
          display: block;
          inset: 0;
          width: 0;
          height: 0;
          min-width: 100%;
          max-width: 100%;
          min-height: 100%;
          max-height: 100%;
          object-fit: cover;
          object-position: center 50%;
        }
      `}</style>
    </div>
  );
}
