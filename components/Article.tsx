import { useEffect, useState } from 'react'
import { TUser } from '../utils/auth'
import { fetchInboxMessages, Message, getHeader, parseFrom, exampleMessage1, exampleMessage2, exampleMessage3 } from '../utils/gmail'

export default function Reader({
  currentMessage,
  onClosed,
  onNext,
}: { currentMessage: Message, onClosed: () => void, onNext: () => void }) {
  const [message, setMessage] = useState(currentMessage);
  useEffect(() => {
    setMessage(currentMessage);
  }, [currentMessage]);

  const from = getHeader(message, 'from');
  const subject = getHeader(message, 'subject');
  const { name, email } = parseFrom(from);
  const domain = email.slice(email.indexOf('@') + 1);
  const googleURL = 'https://www.google.com/s2/favicons?sz=64&domain_url=' + domain;
  const createdAt = new Date(parseInt(message.internalDate));

  return (
    <div className="md:container md:mx-auto">
      <div className="flex">
        <div className="" onClick={() => onClosed()}>
          {'x'}
        </div>
        <div className="flex-grow"></div>
        <div className="" onClick={() => onNext()}>
          {'>'}
        </div>
      </div>
      <div className="full-w text-xl text-center pb-2">
        <img className="rounded-full h-5 w-5 inline-block mr-2" src={googleURL} />
        {name}
      </div>
      <div className="text-lg">
        {subject}
      </div>
      <div className="text-sm text-gray-400 pb-2">
        {createdAt.toDateString()}
      </div>
      {getBody(message)}
    </div>
  )
}

function getBody(message: Message) {
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
    }
  }
  const body = atob(bodyData.replace(/-/g, '+').replace(/_/g, '/'));
  return (
    <div className="full-w" dangerouslySetInnerHTML={{ __html: body }} />
  )
}
