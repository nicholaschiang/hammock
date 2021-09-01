import { isJSON } from 'lib/model/json';

export interface Note {
  message: string;
  user: number;
  highlight: number;
  id: number;
  text: string;
}

export function isNote(note: unknown): note is Note {
  if (!isJSON(note)) return false;
  return (
    typeof note.message === 'string' &&
    typeof note.user === 'number' &&
    typeof note.highlight === 'number' &&
    typeof note.id === 'number' &&
    typeof note.text === 'string'
  );
}
