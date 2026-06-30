export type HomepageNomineeRows<T> = {
  featured: T[];
  entries: T[];
};

export type HomepageNomineeRowOptions = {
  limit?: number;
  minSecondRowItems?: number;
};

const DEFAULT_HOMEPAGE_NOMINEE_LIMIT = 18;
const DEFAULT_MIN_SECOND_ROW_ITEMS = 6;

export function splitHomepageNomineeRows<T>(
  nominees: T[],
  options: HomepageNomineeRowOptions = {},
): HomepageNomineeRows<T> {
  const limit = Math.max(0, options.limit ?? DEFAULT_HOMEPAGE_NOMINEE_LIMIT);
  const minSecondRowItems = Math.max(1, options.minSecondRowItems ?? DEFAULT_MIN_SECOND_ROW_ITEMS);
  const homepageNominees = nominees.slice(0, limit);

  if (homepageNominees.length < minSecondRowItems * 2) {
    return {
      featured: homepageNominees,
      entries: [],
    };
  }

  const featuredCount = Math.ceil(homepageNominees.length / 2);

  return {
    featured: homepageNominees.slice(0, featuredCount),
    entries: homepageNominees.slice(featuredCount),
  };
}
