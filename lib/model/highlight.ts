import { Message, isMessage } from 'lib/model/message';
import { APIError } from 'lib/model/error';
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
  if (!isJSON(highlight)) throw new APIError('Expected valid JSON body', 400);
  if (typeof highlight.message !== 'string')
    throw new APIError('Expected string "message" field', 400);
  if (typeof highlight.user !== 'number')
    throw new APIError('Expected number "user" field', 400);
  if (typeof highlight.id !== 'number')
    throw new APIError('Expected number "id" field', 400);
  if (typeof highlight.start !== 'string')
    throw new APIError('Expected string "start" field', 400);
  if (typeof highlight.startOffset !== 'number')
    throw new APIError('Expected number "startOffset" field', 400);
  if (typeof highlight.end !== 'string')
    throw new APIError('Expected string "end" field', 400);
  if (typeof highlight.endOffset !== 'number')
    throw new APIError('Expected number "endOffset" field', 400);
  if (typeof highlight.text !== 'string')
    throw new APIError('Expected string "text" field', 400);
  if (highlight.deleted !== undefined && typeof highlight.deleted !== 'boolean')
    throw new APIError('Expected undefined or boolean "deleted" field', 400);
  return true;
}

export type HighlightWithMessage = Omit<Highlight, 'message'> & {
  message: Message;
};

export function isHighlightWithMessage(
  highlight: unknown
): highlight is HighlightWithMessage {
  if (!isJSON(highlight)) throw new APIError('Expected valid JSON body', 400);
  if (!isMessage(highlight.message))
    throw new APIError('Expected message "message" field', 400);
  if (typeof highlight.user !== 'number')
    throw new APIError('Expected number "user" field', 400);
  if (typeof highlight.id !== 'number')
    throw new APIError('Expected number "id" field', 400);
  if (typeof highlight.start !== 'string')
    throw new APIError('Expected string "start" field', 400);
  if (typeof highlight.startOffset !== 'number')
    throw new APIError('Expected number "startOffset" field', 400);
  if (typeof highlight.end !== 'string')
    throw new APIError('Expected string "end" field', 400);
  if (typeof highlight.endOffset !== 'number')
    throw new APIError('Expected number "endOffset" field', 400);
  if (typeof highlight.text !== 'string')
    throw new APIError('Expected string "text" field', 400);
  if (highlight.deleted !== undefined && typeof highlight.deleted !== 'boolean')
    throw new APIError('Expected undefined or boolean "deleted" field', 400);
  return true;
}
