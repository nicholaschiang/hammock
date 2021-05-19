import Button from 'components/marketing-button';
import Container from 'components/container';
import FooterLink from 'components/footer-link';
import Page from 'components/page';

import usePage from 'lib/hooks/page';

export default function StoryPage(): JSX.Element {
  usePage({ name: 'Story' });

  return (
    <Page title='Story - Hammock'>
      <div className='section'>
        <Container className='blog'>
          <div className='text-block-3'>🧙🏽</div>
          <h1 className='heading-story'>Return of the Newsletter</h1>
          <p className='paragraph-long'>
            Hi there! If you&#x27;re reading this, you&#x27;re probably like
            us—you subscribed to a ton of newsletters you were excited to learn
            from, but somehow most of them ended up sitting in your inbox,
            unread.
            <br />‍<br />
            But have you thought why there are suddenly so many newsletters? To
            answer this, let&#x27;s leave the inbox for a moment.
            <br />
            <br />
            It&#x27;s practically in our DNA to read and consume content to keep
            learning. That’s why we pick up books, read blogs and listen to
            podcasts. Now newsletters are becoming the go-to source for this
            knowledge. They arrive in your inbox, like newspaper would show up
            at your front door back in the day, and are written in a more
            personable tone than a blog.
            <br />
            <br />‍
            <a
              href='https://on.substack.com/p/a-better-future-for-news'
              className='link'
            >
              Substack accelerated this by making it simple
            </a>{' '}
            for writers to start their publication. Suddenly, all the inspiring
            ideas and thoughts from domain experts we want to learn from are
            just one ‘Subscribe’ button away from our inbox.
            <br />
            <br />
            And that&#x27;s where we are today:
            <br />
          </p>
          <ol className='list'>
            <li className='list-item'>
              With so many newsletters available to us, we feel overwhelmed and
              are not reading what we came for.
            </li>
            <li className='list-item-2'>
              While email is great for distributing newsletters, your inbox
              isn’t the best place to read.
            </li>
            <li className='list-item-3'>
              Even if we read the newsletter, we often forget what we learned
              the next day.
            </li>
          </ol>
          <p className='paragraph-long'>
            It&#x27;s no wonder that newsletters are more popular than ever
            before. But to get the most out of them, we also need to{' '}
            <span className='highlight'>
              nail the reading and learning experience
            </span>
            . And this is the problem we want to solve with a product we’re
            designing.
          </p>
          <div className='back'>
            <Button href='/'>Go back</Button>
          </div>
        </Container>
      </div>
      <div className='footer'>
        <Container className='blog'>
          <div className='div-block-block'>
            <div className='text-block'>
              <FooterLink href='mailto:team@readhammock.com'>
                Get in touch
              </FooterLink>
            </div>
            <div className='text-block'>
              Written by{' '}
              <FooterLink href='https://twitter.com/MartinSrna'>
                @MartinSrna
              </FooterLink>{' '}
              &amp;{' '}
              <FooterLink href='https://twitter.com/JurajPal'>
                @JurajPal
              </FooterLink>{' '}
              🥃
            </div>
          </div>
        </Container>
      </div>
      <style jsx>{`
        .back {
          margin-top: 60px;
          margin-bottom: 40px;
        }

        .back > :global(a) {
          margin: 0;
        }

        .div-block-block {
          display: flex;
          justify-content: space-between;
        }

        .section {
          overflow: visible;
          padding-top: 40px;
          padding-bottom: 0px;
        }

        .section > :global(.blog),
        .footer > :global(.blog) {
          max-width: 590px;
          margin-bottom: 0px;
          padding-bottom: 0px;
          padding-left: 0px;
          text-align: center;
        }

        .text-block {
          margin-left: 0px;
          padding-right: 0px;
          padding-left: 0px;
          color: #626262;
          text-align: left;
          font-size: 14px;
          line-height: 20px;
        }

        .text-block:hover {
          color: #626262;
        }

        .text-block-3 {
          line-height: 20px;
          display: block;
          margin-top: 40px;
          margin-bottom: 0px;
          padding-bottom: 10px;
          font-size: 60px;
          text-align: left;
        }

        .heading-story {
          margin-top: 20px;
          margin-bottom: 10px;
          padding-left: 0px;
          color: #0c0c0c;
          font-size: 32px;
          line-height: 45px;
          font-weight: 700;
          text-align: left;
          letter-spacing: -0.01px;
          white-space: normal;
        }

        .paragraph-long {
          overflow: visible;
          margin-top: 20px;
          margin-bottom: 0px;
          padding: 0px;
          color: #0c0c0c;
          font-size: 14px;
          line-height: 22px;
          text-align: left;
          letter-spacing: -0.01px;
          text-indent: 0px;
          list-style-type: decimal;
          white-space: break-spaces;
          object-fit: fill;
        }

        .footer {
          padding-top: 40px;
          padding-bottom: 40px;
          align-items: flex-start;
          transition: opacity 775ms ease;
          text-align: center;
        }

        .highlight {
          background-color: #faf3dd;
        }

        a {
          transition: color 0.2s ease 0s;
          color: #626262;
          text-decoration: none;
        }

        a:hover {
          color: #0c0c0c;
        }

        .list {
          display: block;
          margin-top: 5px;
          padding-right: 0px;
          padding-left: 15px;
          font-family: Inter, sans-serif;
          color: #0c0c0c;
          font-size: 12px;
          text-align: left;
        }

        .list-item {
          padding-bottom: 5px;
          font-size: 14px;
          line-height: 22px;
        }

        .list-item-2 {
          padding-bottom: 5px;
          font-size: 14px;
          line-height: 22px;
        }

        .list-item-3 {
          padding-bottom: 4px;
          font-size: 14px;
          line-height: 22px;
        }

        @media (max-width: 991px) {
          .footer {
            padding-right: 20px;
            padding-left: 20px;
          }

          .text-block {
            text-align: left;
          }

          .back {
            margin-top: 30px;
            margin-bottom: 30px;
          }
        }

        @media (max-width: 767px) {
          .footer {
            padding: 40px 20px;
          }

          .section > :global(.blog),
          .footer > :global(.blog) {
            padding-right: 10px;
            padding-left: 10px;
          }

          .text-block-3 {
            margin-left: 10px;
          }

          .heading-story {
            padding-left: 10px;
          }

          .paragraph-long {
            padding-right: 10px;
            padding-left: 10px;
          }

          .list {
            padding-left: 25px;
          }

          .div-block-block {
            margin-right: -10px;
            margin-left: -10px;
            padding-left: 0px;
          }

          .back {
            margin-top: 40px;
          }
        }

        @media (max-width: 479px) {
          .footer {
            padding: 20px 0px;
            text-align: left;
          }

          .section > :global(.blog),
          .footer > :global(.blog) {
            padding-right: 10px;
            padding-left: 10px;
          }

          .text-block {
            margin-left: 0px;
            padding-right: 0px;
            padding-left: 0px;
          }

          .text-block-3 {
            margin-top: 20px;
            padding-bottom: 40px;
          }

          .heading-story {
            margin-top: 0px;
            margin-bottom: 30px;
            padding-right: 10px;
            padding-left: 10px;
            font-size: 35px;
            line-height: 40px;
            text-indent: 0px;
            white-space: break-spaces;
          }

          .paragraph-long {
            margin-top: 0px;
            margin-bottom: 10px;
            padding-right: 10px;
            padding-bottom: 0px;
            padding-left: 10px;
            font-size: 14px;
            line-height: 20px;
            text-indent: 0px;
            column-count: 0;
          }

          .list {
            padding-left: 30px;
          }

          .list-item {
            font-size: 14px;
          }

          .list-item-2 {
            font-size: 14px;
          }

          .list-item-3 {
            font-size: 14px;
          }

          .div-block-block {
            margin-right: 10px;
            margin-left: 10px;
            padding-right: 0px;
            padding-left: 0px;
          }

          .back {
            margin-top: 40px;
            margin-bottom: 40px;
          }
        }
      `}</style>
    </Page>
  );
}
