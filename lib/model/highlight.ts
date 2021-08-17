import { isJSON } from 'lib/model/json';

/**
 * @typedef {Object} HighlightInterface
 * @property start - The xpath pointing to the range start element.
 * @property end - The xpath pointing to the range end element.
 * @property startOffset - The offset from the start of the start element and
 * the start of the highlight (in characters).
 * @property endOffset - The offset from the start of the end element and the
 * end of the highlight (in characters).
 * @property id - The highlight's ID. Used when an xpath range has to be styled
 * using multiple `<mark>` tags instead of just one.
 * @property text - The selected text content.
 * @property [deleted] - Whether or not this highlight is deleted. We have to
 * keep these highlights and their corresponding `<mark>` tags b/c otherwise we
 * have the possibility of messing up the xpath selectors of highlights made
 * after this one.
 */
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

export interface DBHighlight {
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
