import next from 'next'
import { useCallback, useEffect, useState, useRef } from 'react'
import he from 'he'
import { TUser } from '../utils/auth'
import { fetchInboxMessages, Message, getHeader, parseFrom, exampleMessage1, exampleMessage2, exampleMessage3 } from '../utils/gmail'
import Article from './Article'
import Content from './Content'
import Divider from './Divider'

type Pagination = {
  messageSections: messageSection[],
  nextPageToken: string | null,
  isInitialized: boolean,
}

export default function Reader({ user }: { user: TUser}) {
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [pagination, setPagination] = useState<Pagination>({
    messageSections: [],// createMessagesSections([], [exampleMessage1, exampleMessage2, exampleMessage3]),
    nextPageToken: null,
    isInitialized: false,
  })
  const [isFetching, setIsFetching] = useState(false);
  const loader = useRef(null);

  useEffect(() => {
    fetch();
    // var options = {root: null, rootMargin: "20px", threshold: 1.0};
    // const observer = new IntersectionObserver(handleObserver, options);
    // if (loader.current) {
    //   observer.observe(loader.current)
    // }
  }, []);

  const fetch = async () => {
    if (isFetching) return;
    if (pagination.isInitialized && !pagination.nextPageToken) return;
    setIsFetching(true);
    const [messages, nextPageToken] = await fetchInboxMessages(user.oauth_access_token, user.label_id as string, pagination.nextPageToken);
    // const messages = [exampleMessage1, exampleMessage2, exampleMessage3];
    // const nextPageToken = null;
    setPagination({
      messageSections: createMessagesSections(pagination.messageSections, messages),
      nextPageToken: nextPageToken,
      isInitialized: true,
    })
    setIsFetching(false);
  }

  // const handleObserver = useCallback(entities => {
  //   const target = entities[0];
  //   if (target && target.isIntersecting) {
  //     console.log(pagination);
  //     fetch();
  //   }
  // }, [pagination]);

  if (selectedMessage) {
    return (
      <Article
        currentMessage={selectedMessage}
        onClose={() => setSelectedMessage(null)}
        onPrevious={() => {
          const nextMessage = findPrevious(pagination.messageSections, selectedMessage);
          setSelectedMessage(nextMessage);
        }}
        onNext={() => {
          const nextMessage = findNext(pagination.messageSections, selectedMessage);
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
      <div ref={loader} onClick={async() => {
        await fetch();
      }}>Load More</div>
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
      if (m.id === message.id) {
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

function findPrevious(messageSections: messageSection[], message: Message): Message | null {
  for (let i = 0; i < messageSections.length; i++) {
    const s = messageSections[i];
    for (let j = 0; j < s.messages.length; j++) {
      const m = s.messages[j];
      if (m.id === message.id) {
        if (j > 0) {
          return s.messages[j-1];
        }
        if (i > 0) {
          return messageSections[i-1].messages[0];
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