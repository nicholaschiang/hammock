import { useMemo, useRef } from 'react';
import atob from 'atob';
import utf8 from 'utf8';

import { Message } from 'lib/model/message';

export interface ArticleProps {
  message: Message;
}

export default function Article({ message }: ArticleProps): JSX.Element {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const body = useMemo(() => {
    let bodyData = '';
    if (message.payload.mimeType === 'text/html') {
      bodyData = message.payload.body.data;
    } else {
      // Probably multipart?
      const { parts } = message.payload;
      const htmlPart = parts.find((p) => p.mimeType === 'text/html');
      const textPart = parts.find((p) => p.mimeType === 'text/plain');
      if (htmlPart) {
        bodyData = htmlPart.body.data;
      } else if (textPart) {
        bodyData = textPart.body.data;
      } else if (message.payload.parts.length > 0) {
        // Super multipart?
        const subpart = message.payload.parts[0];
        const subparts = subpart.parts;
        const htmlSubart = subparts?.find((p) => p.mimeType === 'text/html');
        const textSubpart = subparts?.find((p) => p.mimeType === 'text/plain');
        if (htmlSubart) {
          bodyData = htmlSubart.body.data;
        } else if (textSubpart) {
          bodyData = textSubpart.body.data;
        }
      }
    }
    return utf8.decode(atob(bodyData.replace(/-/g, '+').replace(/_/g, '/')));
  }, [message.payload]);

  return (
    <>
      <iframe
        width='100%'
        height='0px'
        srcDoc={body}
        ref={iframeRef}
        title={message.getHeader('subject')}
        sandbox='allow-same-origin allow-popups'
        onLoad={() => {
          const i = iframeRef.current;
          const height =
            i?.contentWindow?.document.documentElement.scrollHeight;
          if (height) i?.setAttribute('height', `${height + 5}px`);
        }}
      />
      <style jsx>{`
        iframe {
          border: 2px solid var(--accents-2);
          border-radius: 10px;
        }
      `}</style>
    </>
  );
}
