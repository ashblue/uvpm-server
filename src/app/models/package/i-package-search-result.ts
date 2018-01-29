/**
 * Transformed result from an Elastic Search package query
 */
export interface IPackageSearchResult {
  name: string;
  description: string;
  author: string;
  date: Date;
  version: string;
}
