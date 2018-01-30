import { IEsQuery } from './i-es-query';
import { IEsRequestBodySearch } from './i-es-request-body-search';

/**
 * @link https://github.com/mongoosastic/mongoosastic
 */
export interface IEsSearch<HIT> {
  search (query: IEsQuery, callback: (err: Error, results: IEsRequestBodySearch<HIT>) => void): void;
}
