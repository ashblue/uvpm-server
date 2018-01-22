import { appConfig } from './app-config';
import * as curl from 'request';

export class EsHelpers {
  /**
   * @TODO This is an integration test hack to make things work with Elastic Search.
   * This should be re-written to use Mongoosastic or Elastic Search JS driver events
   * to properly wait for async triggers that it's okay to proceed. Currently using
   * timeouts which is terrible.
   */
  public resetElasticSearch (done: () => {}) {
    curl.del(`${appConfig.ELASTIC_SEARCH_URL}/_all`, (err) => {
      if (err) {
        console.error(err);
      }

      // Hack to make sure ElasticSearch actually clears
      setTimeout(done, 800);
    });
  }
}

export const esHelpers = new EsHelpers();
