import Link from 'next/link';

export interface ButtonProps {
  href: string;
  children: string;
}

export default function Button({ href, children }: ButtonProps): JSX.Element {
  return (
    <Link href={href}>
      <a
        rel={!href.startsWith('/') ? 'noopener noreferrer' : undefined}
        target={!href.startsWith('/') ? '_blank' : undefined}
      >
        {children}
        <style jsx>{`
          a {
            position: static;
            margin-top: 10px;
            margin-bottom: 20px;
            border-radius: 6px;
            background-color: var(--on-background);
            box-shadow: 0 6px 10px 0 transparent;
            transition: transform 350ms ease, box-shadow 350ms ease;
            font-size: 18px;
            font-weight: 700;
            text-decoration: none;
            display: inline-block;
            padding: 10px 15px;
            color: var(--background);
            border: 0;
            line-height: 20px;
            cursor: pointer;
          }

          a:hover {
            transform: scale(0.97);
          }

          @media (max-width: 991px) {
            a {
              margin-top: 30px;
              margin-bottom: 30px;
              padding-top: 10px;
              padding-right: 20px;
              padding-left: 20px;
            }
          }

          @media (max-width: 479px) {
            a {
              margin-bottom: 20px;
            }
          }
        `}</style>
      </a>
    </Link>
  );
}
