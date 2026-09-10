export interface Query {
  page?: number;
  limit?: number;
  sortBy?: string;
  search?: string;
  [key: string]: string | number | undefined;
}
