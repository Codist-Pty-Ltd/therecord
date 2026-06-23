/** Paginated envelope from the NestJS API (shared by server + client hooks). */
export interface Paginated<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}
