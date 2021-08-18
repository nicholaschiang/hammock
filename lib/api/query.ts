import { User } from 'lib/model/user';

const confirmSubjects = [
  'complete your signup',
  'email disabled',
  'confirming your subscription',
  "you're on the list",
];

export default function getQuery(user: User): string {
  const filters = [
    `-subject:(${confirmSubjects.map((s) => `"${s}"`).join(' OR ')})`,
    `from:(${user.subscriptions.map((s) => s.email).join(' OR ')})`,
  ];
  return filters.join(' ');
}
