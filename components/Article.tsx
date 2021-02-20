import { useEffect, useRef, useState } from 'react'
const utf8 = require('utf8');
import { TUser } from '../utils/auth'
import { fetchInboxMessages, Message, getHeader, parseFrom, exampleMessage1, exampleMessage2, exampleMessage3 } from '../utils/gmail'
import Content from './Content'

type Props = {
  currentMessage: Message,
  onClose: () => void,
  onNext: () => void,
  onPrevious: () => void,
}

export default function Reader({ currentMessage, onClose, onNext, onPrevious }: Props) {
  const [message, setMessage] = useState(currentMessage);
  useEffect(() => {
    setMessage(currentMessage);
  }, [currentMessage]);
  useEffect(() => {
    window.scrollTo(0, 0)
  }, []);

  const from = getHeader(message, 'from');
  const subject = getHeader(message, 'subject');
  const { name, email } = parseFrom(from);
  const domain = email.slice(email.indexOf('@') + 1);
  const googleURL = 'https://www.google.com/s2/favicons?sz=64&domain_url=' + domain;
  const createdAt = new Date(parseInt(message.internalDate));

  return <>
    <Controls onClose={onClose} onNext={onNext} onPrevious={onPrevious} />
    <Content>
      <div className="full-w text-xl text-center pb-2 flex items-center justify-center">
        <img className="rounded-full h-5 w-5 inline-block mr-2" src={googleURL} />
        {name}
      </div>
      <div className="text-lg">
        {subject}
      </div>
      <div className="text-sm text-gray-400 pb-2">
        {createdAt.toDateString()}
      </div>
      <ArticleBody message={message} />
    </Content>
  </>
}

function ArticleBody({ message }: { message: Message }) {
  const iframeRef = useRef(null);

  let bodyData = '';
  if (message.payload.mimeType === 'text/html') {
    bodyData = message.payload.body.data;
  } else {
    // Probably multipart?
    const parts = message.payload.parts;
    const htmlPart = parts.find(p => p.mimeType === 'text/html');
    const textPart = parts.find(p => p.mimeType === 'text/plain');
    if (htmlPart) {
      bodyData = htmlPart.body.data; 
    } else if (textPart) {
      bodyData = textPart.body.data;
    } else if (message.payload.parts.length > 0) {
      // Super multipart?
      const subpart = message.payload.parts[0];
      const subparts = subpart.parts;
      const htmlSubart = subparts.find(p => p.mimeType === 'text/html');
      const textSubpart = subparts.find(p => p.mimeType === 'text/plain');
      if (htmlSubart) {
        bodyData = htmlSubart.body.data;
      } else if (textSubpart) {
        bodyData = textSubpart.body.data;
      }
    }
  }
  let body = atob(bodyData.replace(/-/g, '+').replace(/_/g, '/'));
  body = utf8.decode(body); // TODO: Should probably check it's UTF-8 encoded first
  return (
    <iframe
      width="100%"
      height="1px"
      srcDoc={body}
      ref={iframeRef}
      sandbox="allow-same-origin allow-popups"
      onLoad={() => {
        const i = iframeRef.current;
        const height = i.contentWindow.document.documentElement.scrollHeight;
        i.setAttribute('height', height + 5 + 'px');
      }}
    />
  );
  // return (
  //   <div className="full-w" dangerouslySetInnerHTML={{ __html: body }} />
  // )
}

type ControlsProps = {
  onClose: () => void,
  onNext: () => void,
  onPrevious: () => void,
}

function Controls({ onClose, onNext, onPrevious }: ControlsProps) {
  return (
    <div className="px-4 pt-4 pb-1 fixed top-0">
      <div className="flex">
        <div className="rounded-full shadow-sm hover:shadow w-10 h-10 border-2 flex items-center justify-center mr-2 cursor-pointer">
          <svg
            onClick={() => onClose()}
            xmlns="http://www.w3.org/2000/svg"
            className="w-3 h-3 text-gray-600 hover:text-black"
            viewBox="0 0 24 24"
          >
            <path fill="currentcolor" d="M12 11.293l10.293-10.293.707.707-10.293 10.293 10.293 10.293-.707.707-10.293-10.293-10.293 10.293-.707-.707 10.293-10.293-10.293-10.293.707-.707 10.293 10.293z"/>
          </svg>
        </div>
        <div className="rounded-3xl shadow-sm hover:shadow w-20 h-10 border-2 flex items-center justify-between px-4">
          <svg
            onClick={() => onPrevious()}
            className="w-3 h-3 text-gray-600 hover:text-black cursor-pointer"
            xmlns="http://www.w3.org/2000/svg"
            fill-rule="evenodd"
            clip-rule="evenodd"
            viewBox="0 0 24 24"
          >
            <path fill="currentcolor" d="M20 .755l-14.374 11.245 14.374 11.219-.619.781-15.381-12 15.391-12 .609.755z"/>
          </svg>
          <svg
            onClick={() => onNext()}
            className="w-3 h-3 text-gray-600 hover:text-blac cursor-pointer"
            xmlns="http://www.w3.org/2000/svg"
            fill-rule="evenodd"
            clip-rule="evenodd"
            viewBox="0 0 24 24"
          >
            <path fill="currentcolor" d="M4 .755l14.374 11.245-14.374 11.219.619.781 15.381-12-15.391-12-.609.755z"/>
          </svg>
        </div>
      </div>
    </div>
  );
}