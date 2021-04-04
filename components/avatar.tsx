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
  return (
    <div className={cn('avatar', { loading })}>
      {!loading && (
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
      `}</style>
    </div>
  );
}
