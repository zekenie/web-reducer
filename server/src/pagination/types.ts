export type PaginatedResponse<T> = {
  hasNext: boolean;
  objects: T[];
};

export type PaginationQueryArgs = {
  after: string;
  afterColumn: string;
  pageSize: 5 | 10 | 20 | 40 | 80;
};
