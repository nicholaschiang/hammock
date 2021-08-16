export const HITS_PER_PAGE = 10;

export type MessagesQuery = {
  quickRead?: 'true' | 'false';
  archive?: 'true' | 'false';
  resume?: 'true' | 'false';
  writer?: string;
  page?: string;
};
