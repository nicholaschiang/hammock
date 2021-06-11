export interface FooterLinkProps {
  href: string;
  children: string;
}

export default function FooterLink({
  href,
  children,
}: FooterLinkProps): JSX.Element {
  return (
    <a href={href} rel='noopener noreferrer' target='_blank'>
      {children}
      <style jsx>{`
        a {
          transition: color 0.2s ease 0s;
          color: var(--accents-5);
          text-decoration: none;
        }

        a:hover {
          color: var(--on-background);
        }

        @media (max-width: 479px) {
          a {
            margin-left: 0px;
          }
        }
      `}</style>
    </a>
  );
}
