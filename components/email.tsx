import { Fragment } from 'react';

import { Message } from 'lib/model/message';
import { User } from 'lib/model/user';
import { caps } from 'lib/utils';

const fontFamily = [
  'Google Sans',
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
  primary: '#0070f3',
  onPrimary: '#ffffff',
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
    <ul style={{ listStyle: 'none', padding: 0, margin: '36px 0' }}>
      {messages.map((message) => (
        <Fragment key={message.id}>
          <hr
            style={{
              border: 'none',
              borderTop: `1px solid ${colors.accents2}`,
              margin: '24px 0',
              width: '100%',
            }}
          />
          <a
            style={{ textDecoration: 'none' }}
            href={`https://app.readhammock.com/messages/${message.id}?ref=email`}
          >
            <li style={{ margin: '36px 0 0' }}>
              <p
                style={{
                  fontFamily,
                  fontSize: '16px',
                  lineHeight: '24px',
                  height: '24px',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                  textDecoration: 'none',
                  color: colors.accents5,
                  margin: 0,
                }}
              >
                <img
                  style={{
                    marginRight: '8px',
                    borderRadius: '100%',
                    verticalAlign: 'middle',
                  }}
                  src={message.photo}
                  height={24}
                  width={24}
                  alt=''
                />
                {message.name}
              </p>
              <h3
                style={{
                  fontFamily,
                  fontSize: '18px',
                  fontWeight: 600,
                  lineHeight: '24px',
                  height: '24px',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                  textDecoration: 'none',
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
                    textDecoration: 'none',
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
                  textDecoration: 'none',
                  margin: 0,
                }}
              >
                {message.snippet}
              </p>
            </li>
          </a>
        </Fragment>
      ))}
    </ul>
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
                  fontSize: '16px',
                  lineHeight: 1.65,
                  color: colors.onBackground,
                  margin: 0,
                }}
              >
                Hi {caps(user.name.split(' ')[0] || '')},
              </p>
              <p
                style={{
                  fontFamily,
                  fontSize: '16px',
                  lineHeight: 1.65,
                  color: colors.onBackground,
                  margin: '8px 0',
                }}
              >
                Here are some of the latest newsletters from your writers.
                Simply click on a newsletter to open it in Hammock.
              </p>
              <Messages messages={messages} />
              <table width='100%'>
                <tbody>
                  <tr>
                    <td align='center' style={{ padding: 0 }}>
                      <div>
                        <a
                          href='https://app.readhammock.com'
                          style={{
                            fontFamily,
                            borderRadius: '4px',
                            lineHeight: '48px',
                            fontSize: '16px',
                            textDecoration: 'none',
                            color: colors.onPrimary,
                            backgroundColor: colors.primary,
                            display: 'inline-block',
                            fontWeight: 600,
                            width: '100%',
                            textAlign: 'center',
                          }}
                        >
                          See more in Hammock
                        </a>
                        <p
                          style={{
                            fontFamily,
                            fontSize: '16px',
                            lineHeight: 1.65,
                            color: colors.accents5,
                            margin: '24px 0 36px',
                          }}
                        >
                          If you have any feedback, simply reply to this email.
                        </p>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
              <table width='100%'>
                <tbody>
                  <tr>
                    <td
                      align='center'
                      style={{
                        padding: '16px 0',
                        backgroundColor: colors.accents1,
                        borderRadius: '4px',
                        border: `1px solid ${colors.accents2}`,
                      }}
                    >
                      <p
                        style={{
                          fontFamily,
                          fontSize: '16px',
                          lineHeight: 1.65,
                          color: colors.accents5,
                          margin: '8px 0',
                        }}
                        dangerouslySetInnerHTML={{
                          __html:
                            'Hammock - <a href="<%asm_group_unsubscribe_raw_url%>" style="color:#666666">Unsubscribe</a>',
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
                        1164 Montgomery St, San Francisco, CA 94133 USA
                      </p>
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
