import Image from 'next/image';
import Link from 'next/link';
import { ReactNode } from 'react';
import cn from 'classnames';

import FooterLink from 'components/footer-link';
import Page from 'components/page';
import Screenshot from 'components/screenshot';

interface ContainerProps {
  children: ReactNode;
  className?: string;
}

function Container({ className, children }: ContainerProps): JSX.Element {
  return (
    <div className={cn(className, 'w-container', 'light')}>
      {children}
      <style jsx>{`
        .w-container {
          margin-left: auto;
          margin-right: auto;
          max-width: 940px;
          margin-bottom: 0px;
          padding-bottom: 0px;
          padding-left: 0px;
          text-align: center;
          background: var(--background);
        }

        .w-container:before,
        .w-container:after {
          content: ' ';
          display: table;
          grid-column-start: 1;
          grid-row-start: 1;
          grid-column-end: 2;
          grid-row-end: 2;
        }

        .w-container:after {
          clear: both;
        }

        @media (max-width: 991px) {
          .w-container {
            max-width: 728px;
          }
        }

        @media (max-width: 479px) {
          .w-container {
            max-width: none;
          }
        }
      `}</style>
    </div>
  );
}

interface ButtonProps {
  href: string;
  children: string;
}

function Button({ href, children }: ButtonProps): JSX.Element {
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

function Paragraph({ children }: { children: ReactNode }): JSX.Element {
  return (
    <p>
      {children}
      <style jsx>{`
        p {
          overflow: visible;
          margin-top: 10px;
          margin-bottom: 20px;
          padding-top: 0px;
          padding-bottom: 0px;
          color: var(--accents-6);
          font-size: 20px;
          line-height: 30px;
          text-align: center;
          letter-spacing: -0.01px;
          text-indent: 0px;
          white-space: break-spaces;
          object-fit: fill;
        }

        p > :global(span.highlight) {
          background-color: var(--highlight);
          color: var(--on-highlight);
        }

        @media (max-width: 767px) {
          p {
            padding-right: 10px;
            padding-left: 10px;
          }
        }

        @media (max-width: 479px) {
          p {
            margin-top: 0px;
            margin-bottom: 0px;
            padding-right: 20px;
            padding-bottom: 0px;
            padding-left: 20px;
            font-size: 20px;
            line-height: 25px;
            text-indent: 0px;
            column-count: 0;
          }
        }
      `}</style>
    </p>
  );
}

function Header(): JSX.Element {
  return (
    <div className='section light'>
      <Container>
        <div className='logo'>
          <Image
            src='/images/logo.png'
            height={75}
            width={75}
            priority
            alt=''
          />
        </div>
        <h1>Hammock</h1>
        <Paragraph>
          A place where you can enjoy{' '}
          <span className='highlight'>reading and learning</span> from
          newsletters.
          <br />
          So you spend less time in your inbox.
        </Paragraph>
        <Button href='https://form.typeform.com/to/PezpoULN'>
          Join waitlist
        </Button>
        <div>
          <a
            href='https://readhammock.notion.site/Return-of-the-Newsletter-524563869f6242baaa60250299536654'
            rel='noopener noreferrer'
            target='_blank'
          >
            Read about why we&#x27;re building this
          </a>
        </div>
        <div className='screenshot'>
          <Screenshot />
        </div>
      </Container>
      <style jsx>{`
        .screenshot {
          margin-top: 40px;
          border-radius: 10px;
          background-color: var(--accents-1);
          border: 1px solid var(--accents-2);
        }

        .screenshot :global(svg) {
          height: 100%;
          max-width: 85%;
          margin-left: 0px;
          padding-top: 40px;
          padding-bottom: 40px;
          padding-left: 0px;
          border: 0;
          vertical-align: middle;
          display: inline-block;
        }

        a {
          transition: color 0.2s ease 0s;
          color: var(--accents-5);
          font-size: 18px;
          text-decoration: none;
        }

        a::after {
          content: '->';
          display: inline-block;
          transform: translate(6px);
          transition: transform 0.2s ease 0s;
        }

        a:hover::after {
          transform: translate(8px);
        }

        a:hover {
          color: var(--on-background);
        }

        .section {
          overflow: visible;
          padding-top: 40px;
          padding-bottom: 0px;
          background: var(--background);
        }

        .logo {
          max-width: 100%;
          vertical-align: middle;
          display: inline-block;
          height: 75px;
          width: 75px;
          border: 0;
        }

        h1 {
          margin-top: 10px;
          margin-bottom: 40px;
          font-size: 60px;
          line-height: 45px;
          font-weight: 700;
          text-align: center;
          letter-spacing: -0.01px;
          white-space: normal;
          color: var(--on-background);
        }

        @media (max-width: 728px) {
          .screenshot {
            width: 100%;
            border-radius: 0;
            border-left: none;
            border-right: none;
          }
        }

        @media (max-width: 479px) {
          .screenshot :global(svg) {
            margin-right: 0px;
            margin-left: 0px;
            padding-top: 40px;
            padding-right: 10px;
            padding-left: 10px;
          }

          h1 {
            margin-top: 0px;
            margin-bottom: 30px;
            padding-right: 10px;
            padding-left: 10px;
            font-size: 50px;
            line-height: 55px;
            text-indent: 0px;
            white-space: break-spaces;
          }
        }
      `}</style>
    </div>
  );
}

function Benefits(): JSX.Element {
  return (
    <div className='section-benefits light'>
      <Container>
        <div className='columns w-row'>
          <div className='benefit-column w-col'>
            <h2>Dedicated space for newsletters</h2>
            <p>
              Login with your Gmail and get all your newsletters you want to
              read. No need for a new email address or lengthy setup.
            </p>
          </div>
          <div className='benefit-column w-col'>
            <h2>Minimalist reading experience</h2>
            <p>
              Read content from your favorite writers and domain experts without
              the overwhelm of your inbox and whenever it suits you.
            </p>
          </div>
          <div className='benefit-column w-col'>
            <h2>Remember what you read</h2>
            <p>
              Highlight what you want to remember or share, and export to your
              favorite note taking tools, like Roam or Notion.
            </p>
          </div>
        </div>
        <Paragraph>Good writing should be enjoyed and savored.</Paragraph>
        <Button href='https://form.typeform.com/to/PezpoULN'>
          Join waitlist
        </Button>
      </Container>
      <style jsx>{`
        .section-benefits {
          padding: 40px 0;
          background: var(--background);
        }

        .columns {
          margin-top: 20px;
          margin-bottom: 80px;
        }

        .w-row {
          margin-left: -10px;
          margin-right: -10px;
        }

        .w-row:before,
        .w-row:after {
          content: ' ';
          display: table;
          grid-column-start: 1;
          grid-row-start: 1;
          grid-column-end: 2;
          grid-row-end: 2;
        }

        .w-row:after {
          clear: both;
        }

        .w-col {
          position: relative;
          float: left;
          width: 100%;
          min-height: 1px;
          padding-left: 10px;
          padding-right: 10px;
          width: 33.33333333%;
        }

        .benefit-column {
          padding-right: 20px;
          padding-left: 20px;
          text-align: left;
        }

        .benefit-column p {
          margin-top: 0;
          margin-bottom: 10px;
          margin-right: -8px;
          font-size: 14px;
          line-height: 20px;
          color: var(--on-background);
        }

        .benefit-column h2 {
          margin-right: -7px;
          padding-right: 0px;
          font-weight: 700;
          font-size: 18px;
          line-height: 24px;
          margin-bottom: 10px;
          margin-top: 10px;
          color: var(--on-background);
        }

        @media (max-width: 767px) {
          .w-row {
            margin-left: 0;
            margin-right: 0;
          }

          .w-col {
            width: 100%;
            left: auto;
            right: auto;
          }
        }

        @media (max-width: 479px) {
          .columns {
            margin-top: 0px;
            margin-bottom: 60px;
          }

          .benefit-column p {
            margin-bottom: 20px;
          }

          .benefit-column h2 {
            margin-bottom: 5px;
          }

          .w-col {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}

function Footer(): JSX.Element {
  return (
    <footer className='footer light'>
      <Container>
        <div className='w-layout-grid footer-grid'>
          <div className='wrapper'>
            <div className='text-block'>
              <FooterLink href='mailto:team@readhammock.com'>
                Get in touch
              </FooterLink>
            </div>
          </div>
          <div className='wrapper'>
            <div className='text-block'>
              <FooterLink href='https://readhammock.notion.site/Terms-and-Privacy-7bab80b48fd74fe9aa9bbb72be490f27'>
                Terms &amp; Privacy
              </FooterLink>
            </div>
          </div>
          <div className='wrapper'>
            <div className='text-block'>
              <FooterLink href='https://returnofthenewsletter.substack.com/'>
                Substack
              </FooterLink>
            </div>
          </div>
          <div className='wrapper'>
            <div className='text-block-right'>
              Built by{' '}
              <FooterLink href='https://twitter.com/MartinSrna'>
                @martinsrna
              </FooterLink>{' '}
              <FooterLink href='https://twitter.com/JurajPal'>
                @jurajpal
              </FooterLink>{' '}
              <FooterLink href='https://github.com/nicholaschiang'>
                @nicholaschiang
              </FooterLink>
            </div>
          </div>
        </div>
      </Container>
      <style jsx>{`
        .w-layout-grid {
          display: grid;
          grid-auto-columns: 1fr;
          grid-template-columns: 1fr 1fr;
          grid-template-rows: auto auto;
          grid-row-gap: 16px;
          grid-column-gap: 16px;
        }

        .text-block,
        .text-block-right {
          font-size: 14px;
          line-height: 20px;
        }

        .text-block {
          margin-left: 0px;
          padding-right: 0px;
          padding-left: 0px;
          text-align: left;
        }

        .text-block-right {
          margin-left: 0px;
          padding-right: 0px;
          padding-left: 0px;
          text-align: right;
        }

        .footer {
          padding-top: 40px;
          padding-bottom: 40px;
          align-items: flex-start;
          transition: opacity 775ms ease;
          text-align: center;
          display: block;
          background: var(--background);
        }

        .footer-grid {
          -ms-grid-columns: 0.5fr 0.5fr 0.5fr 2fr;
          grid-template-columns: 0.5fr 0.5fr 0.5fr 2fr;
          -ms-grid-rows: auto;
          grid-template-rows: auto;
        }

        @media (max-width: 991px) {
          .footer {
            padding-right: 20px;
            padding-left: 20px;
          }

          .text-block {
            text-align: left;
          }

          .text-block-right {
            text-align: right;
          }
        }

        @media (max-width: 767px) {
          .footer {
            padding: 40px 20px;
          }

          .footer-grid {
            justify-items: center;
            grid-template-columns: 1fr;
            grid-template-rows: auto auto auto auto;
          }
        }

        @media (max-width: 479px) {
          .footer {
            padding: 20px 0px;
            text-align: left;
          }

          .footer-grid {
            justify-items: center;
            grid-template-columns: 1fr;
            grid-template-rows: auto auto auto auto;
          }

          .text-block {
            margin-left: 0px;
            padding-right: 0px;
            padding-left: 0px;
          }

          .text-block-right {
            margin-left: 0px;
            padding-right: 0px;
            padding-left: 0px;
            text-align: center;
          }
        }
      `}</style>
    </footer>
  );
}

export default function AboutPage(): JSX.Element {
  return (
    <Page title='Hammock - Newsletter Reader' name='About'>
      <Header />
      <Benefits />
      <Footer />
    </Page>
  );
}
