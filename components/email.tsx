import { Message } from 'lib/model/message';
import { User } from 'lib/model/user';

const fontFamily = [
  '-apple-system',
  'BlinkMacSystemFont',
  '"Segoe UI"',
  '"Roboto"',
  '"Oxygen"',
  '"Ubuntu"',
  '"Cantarell"',
  '"Fira Sans"',
  '"Droid Sans"',
  '"Helvetica Neue"',
  'sans-serif',
].join(',');
const colors = {
  background: '#ffffff',
  onBackground: '#000000',
  accents1: '#fafafa',
  accents2: '#eaeaea',
  accents3: '#999999',
  accents4: '#888888',
  accents5: '#666666',
  accents6: '#444444',
};

interface MessagesProps {
  messages: Message[];
}

function Messages({ messages }: MessagesProps): JSX.Element {
  return (
    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
      {messages.map((message) => (
        <a
          key={message.id}
          style={{ textDecoration: 'none' }}
          href={`https://readhammock.com/messages/${message.id}`}
        >
          <li style={{ margin: '40px 0' }}>
            <p
              style={{
                fontFamily,
                fontSize: '16px',
                lineHeight: '24px',
                height: '24px',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
                color: colors.accents5,
                margin: 0,
              }}
            >
              <img
                style={{
                  marginRight: '8px',
                  borderRadius: '100%',
                  verticalAlign: 'middle',
                  border: `1px solid ${colors.accents5}`,
                }}
                src={message.from.photo}
                height={24}
                width={24}
                alt=''
              />
              {message.from.name}
            </p>
            <h3
              style={{
                fontFamily,
                fontSize: '18px',
                lineHeight: '24px',
                height: '24px',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
                color: colors.accents6,
                margin: '12px 0 8px',
              }}
            >
              {message?.subject}
              <span
                style={{
                  fontFamily,
                  fontSize: '12px',
                  fontWeight: 600,
                  color: colors.accents6,
                  backgroundColor: colors.accents2,
                  borderRadius: '12px',
                  marginLeft: '12px',
                  padding: '4px 12px',
                  verticalAlign: 'text-bottom',
                }}
              >
                {`${message.time} min`}
              </span>
            </h3>
            <p
              style={{
                fontFamily,
                fontSize: '16px',
                lineHeight: 1.65,
                color: colors.accents6,
                margin: 0,
              }}
            >
              {message.snippet}
            </p>
          </li>
        </a>
      ))}
    </ul>
  );
}

interface LinkProps {
  href: string;
  children: string;
}

function Link({ href, children }: LinkProps): JSX.Element {
  return (
    <a
      href={href}
      style={{
        fontFamily,
        color: '#067df7 !important',
        textDecoration: 'none',
      }}
    >
      {children}
    </a>
  );
}

export interface EmailProps {
  user: User;
  messages: Message[];
}

export default function Email({ user, messages }: EmailProps): JSX.Element {
  // TODO: Ensure that this email formatting works both in the browser (b/c I'm
  // reusing the same `Section` component) and in Gmail (we only have to care
  // about the Gmail email client b/c we know all our users are on Gmail).
  return (
    <div style={{ backgroundColor: colors.background, padding: '24px' }}>
      <table
        style={{
          borderCollapse: 'collapse',
          borderSpacing: 0,
          tableLayout: 'fixed',
          width: '100%',
          display: 'table',
          marginLeft: 'auto',
          marginRight: 'auto',
          maxWidth: '600px',
          padding: '24px',
          verticalAlign: 'top',
        }}
      >
        <tbody>
          <tr style={{ padding: '0px !important', margin: '0px !important' }}>
            <td>
              <p
                style={{
                  fontFamily,
                  fontSize: '18px',
                  lineHeight: 1.65,
                  color: colors.onBackground,
                  margin: 0,
                }}
              >
                Hi {user.firstName},
              </p>
              <p
                style={{
                  fontFamily,
                  fontSize: '18px',
                  lineHeight: 1.65,
                  color: colors.onBackground,
                  margin: '8px 0',
                }}
              >
                Here are some of the latest newsletters from your writers.
                Simply click on a newsletter to open it in Hammock.
              </p>
              <Messages messages={messages} />
              <hr
                style={{
                  border: 'none',
                  borderTop: `1px solid ${colors.accents2}`,
                  margin: '26px 0',
                  width: '100%',
                }}
              />
              <p
                style={{
                  fontFamily,
                  fontSize: '16px',
                  lineHeight: 1.65,
                  color: colors.accents5,
                  margin: '8px 0',
                }}
              >
                Hammock -{' '}
                <Link href='https://readhammock.com'>readhammock.com</Link>
              </p>
              <p
                style={{
                  fontFamily,
                  fontSize: '16px',
                  lineHeight: 1.65,
                  color: colors.accents5,
                  margin: 0,
                }}
              >
                If this message contains spam or unwanted messages let us know
                at{' '}
                <Link href='mailto:team@readhammock.com'>
                  team@readhammock.com
                </Link>{' '}
                or by simply replying to this email.
              </p>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
