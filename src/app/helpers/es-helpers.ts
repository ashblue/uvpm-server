import { IEsRequestBodySearch } from '../interfaces/elastic-search/i-es-request-body-search';
import { IEsPackageHit } from '../models/package/i-es-package-hit';

export class EsHelpers {
  /**
   * Override the search results on the package's elastic search with a stub
   * @param model
   * @param error
   * @param results
   */
  public setSearchResults (model: any, error: any, results?: IEsRequestBodySearch<IEsPackageHit>) {
    model.search = (query, callback: (err, res) => void) => {
      callback(error, results);
    };
  }
}

export const esHelpers = new EsHelpers();
