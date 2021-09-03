import { isJSON } from 'lib/model/json';

export const EMOJIS: Record<Emoji, string> = {
  star: '🤩',
  grin: '😀',
  confused: '😕',
  cry: '😭',
};
export type Emoji = 'star' | 'grin' | 'confused' | 'cry';
export function isEmoji(emoji: unknown): emoji is Emoji {
  if (typeof emoji !== 'string') return false;
  return Object.keys(EMOJIS).includes(emoji);
}

export interface Feedback {
  message: string;
  user: number;
  id: number;
  feedback: string;
  emoji: Emoji | null;
}
export function isFeedback(feedback: unknown): feedback is Feedback {
  if (!isJSON(feedback)) return false;
  return (
    typeof feedback.message === 'string' &&
    typeof feedback.user === 'number' &&
    typeof feedback.id === 'number' &&
    typeof feedback.feedback === 'string' &&
    (feedback.emoji === null || isEmoji(feedback.emoji))
  );
}
