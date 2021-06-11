import { Message } from 'lib/model/message';
import { User } from 'lib/model/user';
import { db } from 'lib/api/firebase';

export default async function updateMessages(user: User): Promise<void> {
  const { docs } = await db
    .collection('users')
    .doc(user.id)
    .collection('messages')
    .where('from.email', 'not-in', user.subscriptionEmails.slice(0, 10))
    .get();
  // Firestore only lets us filter by 10 `not-in` array items, so we have to
  // double-check that the messages isn't from the remaining subscriptions.
  await Promise.all(
    docs
      .filter((d) => {
        const { email } = Message.fromFirestoreDoc(d).from;
        return !user.subscriptionEmails.includes(email);
      })
      .map((d) => d.ref.delete())
  );
}
