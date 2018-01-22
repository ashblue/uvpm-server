export interface IEsRequestBodySearch<HIT> {
  took: number;
  hits: {
    total: number;
    max_score: number;
    hits: Array<{
      _index: string;
      _type: string;
      _id: string;
      _score: number;
      _source: HIT;
    }>;
  };
}
