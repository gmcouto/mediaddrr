/*
Example response:
{
  "adult": false,
  "backdrop_path": null,
  "belongs_to_collection": null,
  "budget": 0,
  "genres": [
    {
      "id": 18,
      "name": "Drama"
    }
  ],
  "homepage": "",
  "id": 283917,
  "imdb_id": "tt0233749",
  "origin_country": [
    "US"
  ],
  "original_language": "en",
  "original_title": "Francesca di Rimini; or, The Two Brothers",
  "overview": "Francesca, surrounded by ladies-in-waiting at the palace. Her father enters, and together they read a letter from Lanciotto, asking for the hand of Francesca. Both are overjoyed at the union of the two great houses in marriage, and the daughter retires to dress for Lanciotto's arrival.",
  "popularity": 0.0822,
  "poster_path": "/634VEbYCTG95t20juCETEa38Hqa.jpg",
  "production_companies": [
    {
      "id": 15634,
      "logo_path": null,
      "name": "Vitagraph Company of America",
      "origin_country": "US"
    }
  ],
  "production_countries": [
    {
      "iso_3166_1": "US",
      "name": "United States of America"
    }
  ],
  "release_date": "1908-02-08",
  "revenue": 0,
  "runtime": 12,
  "spoken_languages": [
    {
      "english_name": "No Language",
      "iso_639_1": "xx",
      "name": "No Language"
    }
  ],
  "status": "Released",
  "tagline": "",
  "title": "Francesca di Rimini; or, The Two Brothers",
  "video": false,
  "vote_average": 0,
  "vote_count": 0
}
*/
export type TmdbMovieDetail = {
  readonly adult: boolean;
  readonly backdrop_path: string | null;
  /**
   * The type of belongs_to_collection is not specified in the example. Replace 'object' with a more specific type if known.
   */
  readonly belongs_to_collection: object | null;
  readonly budget: number;
  readonly genres: ReadonlyArray<{
    readonly id: number;
    readonly name: string;
  }>;
  readonly homepage: string;
  readonly id: number;
  readonly imdb_id: string | null;
  readonly origin_country: ReadonlyArray<string>;
  readonly original_language: string;
  readonly original_title: string;
  readonly overview: string;
  readonly popularity: number;
  readonly poster_path: string | null;
  readonly production_companies: ReadonlyArray<{
    readonly id: number;
    readonly logo_path: string | null;
    readonly name: string;
    readonly origin_country: string;
  }>;
  readonly production_countries: ReadonlyArray<{
    readonly iso_3166_1: string;
    readonly name: string;
  }>;
  readonly release_date: string;
  readonly revenue: number;
  readonly runtime: number | null;
  readonly spoken_languages: ReadonlyArray<{
    readonly english_name: string;
    readonly iso_639_1: string;
    readonly name: string;
  }>;
  readonly status: string;
  readonly tagline: string;
  readonly title: string;
  readonly video: boolean;
  readonly vote_average: number;
  readonly vote_count: number;
  year: number;
};
