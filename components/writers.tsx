import { useUser } from 'lib/context/user';

export default function Writers(): JSX.Element {
  const { user } = useUser();

  return (
    <ul>
      {user.subscriptions.map((writer) => (
        <li>{writer}</li>
      ))}
      <style jsx>{`
        ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }
      `}</style>
    </ul>
  );
}
