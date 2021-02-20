import next from 'next'
import { useEffect, useState } from 'react'
import he from 'he'
import { TUser } from '../utils/auth'
import { fetchInboxMessages, Message, getHeader, parseFrom, exampleMessage1, exampleMessage2, exampleMessage3 } from '../utils/gmail'
import Article from './Article'
import Content from './Content'
import Divider from './Divider'

type Pagination = {
  messageSections: messageSection[],
  nextPageToken: string | null,
  isLoading: boolean,
}

export default function Reader({ user }: { user: TUser}) {
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [pagination, setPagination] = useState<Pagination>({
    messageSections: [],// createMessagesSections([], [exampleMessage1, exampleMessage2, exampleMessage3]),
    nextPageToken: null,
    isLoading: true,
  })

  useEffect(() => {
    const fetch = async () => {
      const [messages, nextPageToken] = await fetchInboxMessages(user.oauth_access_token, user.label_id as string, null);
      // const messages = [exampleMessage1, exampleMessage2, exampleMessage3];
      // const nextPageToken = null;
      setPagination({
        messageSections: createMessagesSections(pagination.messageSections, messages),
        nextPageToken: nextPageToken,
        isLoading: false,
      })
    }
    fetch();
  }, []);

  if (selectedMessage) {
    return (
      <Article
        currentMessage={selectedMessage}
        onClosed={() => setSelectedMessage(null)}
        onNext={() => {
          const nextMessage = findNext(pagination.messageSections, selectedMessage);
          console.log('nextMessage', nextMessage);
          setSelectedMessage(nextMessage);
        }}
      />
    );
  }

  return (
    <Content>
      <div className="text-5xl font-weight-500 pb-2">
        {displayTitle(user.first_name || user.name)}
      </div>

      {pagination.messageSections.map(s => (
        <div className="pt-3 pb-8" key={s.displayDate}>
          <p className="text-lg text-gray-500 pb-1">{s.displayDate}</p>
          <Divider />
          {s.messages.map(m =>
            <EmailRow
              key={m.id}
              message={m}
              onSelect={() => {
                setSelectedMessage(m);
              }}
            />
          )}
        </div>
      ))}
    </Content>
  )
}

function EmailRow({ message, onSelect }: { message: Message, onSelect: () => void }) {
  const from = getHeader(message, 'from');
  const subject = getHeader(message, 'subject');
  const { name, email } = parseFrom(from);
  const domain = email.slice(email.indexOf('@') + 1);
  const googleURL = 'https://www.google.com/s2/favicons?sz=64&domain_url=' + domain;

  return (
    <div className="py-3" onClick={() => onSelect()}>
      <div className="text-sm">
        <img className="rounded-full h-4 w-4 inline-block mr-2" src={googleURL} />
        {name}
      </div>
      <div className="font-bold">
        {subject}
      </div>
      <div>
        {he.decode(message.snippet)}
      </div>
    </div>
  )
}

type messageSection = {
  displayDate: string,
  date: Date,
  messages: Message[],
}

function createMessagesSections(existingSections: messageSection[], newMessages: Message[]): messageSection[] {
  const newSections = [...existingSections];
  const now = new Date();
  for (const message of newMessages) {
    let added = false;
    const createdAt = new Date(parseInt(message.internalDate));
    console.log(message.id, createdAt);
    for (const section of newSections) {
      if (isSameDay(section.date, createdAt)) {
        section.messages.push(message); // Assuming this is already chronological
        added = true;
        break;
      }
    }
    if (added) continue;
    const isToday = isSameDay(now, createdAt);
    newSections.push({
      displayDate: isSameDay(now, createdAt) ? 'Today' : formatDate(createdAt),
      date: createdAt,
      messages: [message],
    });
  }
  console.log(newSections);
  return newSections;
}

function isSameDay(date1: Date, date2: Date): boolean {
  return date1.getDate() === date2.getDate() && date1.getFullYear() === date2.getFullYear() && date1.getMonth() === date2.getMonth();
}

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function formatDate(date: Date): string {
  return `${monthNames[date.getMonth()]} ${date.getDate()}`
}

function findNext(messageSections: messageSection[], message: Message): Message | null {
  for (let i = 0; i < messageSections.length; i++) {
    const s = messageSections[i];
    for (let j = 0; j < s.messages.length; j++) {
      const m = s.messages[j];
      console.log('considering', i, j, m.id);
      if (m.id === message.id) {
        console.log('HI', j, s.messages.length - 1, i, messageSections.length - 1);
        if (j < s.messages.length - 1) {
          return s.messages[j+1];
        }
        if (i < messageSections.length - 1) {
          return messageSections[i+1].messages[0];
        }
        return null;
      }
    }
  }
  return null;
}

function displayTitle(name: string) {
  const hourOfDay = new Date().getHours();
  if (hourOfDay < 12) {
    return `Good morning, ${name}`;
  } else if (hourOfDay < 18) {
    return `Good afternoon, ${name}`;
  } else {
    return `Good evening, ${name}`;
  }
}