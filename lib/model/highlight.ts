import { isJSON } from 'lib/model/json';

export interface Highlight {
  message: string;
  user: number;
  id: number;
  start: string;
  startOffset: number;
  end: string;
  endOffset: number;
  text: string;
  deleted: boolean;
}

export function isHighlight(highlight: unknown): highlight is Highlight {
  if (!isJSON(highlight)) return false;
  return (
    typeof highlight.message === 'string' &&
    typeof highlight.user === 'number' &&
    typeof highlight.id === 'number' &&
    typeof highlight.start === 'string' &&
    typeof highlight.startOffset === 'number' &&
    typeof highlight.end === 'string' &&
    typeof highlight.endOffset === 'number' &&
    typeof highlight.text === 'string' &&
    (highlight.deleted === undefined || typeof highlight.deleted === 'boolean')
  );
}
