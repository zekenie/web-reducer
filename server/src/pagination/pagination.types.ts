export type PaginatedTokenResponse<T> = {
  nextToken: string | null;
  objects: T[];
};

export type PaginationQueryArgs = {
  token?: string;
  pageSize: 5 | 10 | 20 | 40 | 80;
};
