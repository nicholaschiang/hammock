import { useRef } from 'react';

import { Message } from 'lib/model/message';

export interface ArticleProps {
  message: Message;
}

export default function Article({ message }: ArticleProps): JSX.Element {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  return (
    <>
      <iframe
        width='100%'
        height='0px'
        ref={iframeRef}
        srcDoc={message.html}
        title={message.subject}
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
