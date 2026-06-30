import { describe, expect, it } from "vitest";
import { splitHomepageNomineeRows } from "../src/lib/homepage-nominees";

const nominees = Array.from({ length: 18 }, (_, index) => ({
  title: `Award ${index + 1}`,
  name: `Nominee ${index + 1}`,
  image: `/nominee-${index + 1}.webp`,
}));

describe("splitHomepageNomineeRows", () => {
  it("returns one strong row when there are not enough nominees for a moving second row", () => {
    const result = splitHomepageNomineeRows(nominees.slice(0, 8));

    expect(result.featured).toHaveLength(8);
    expect(result.entries).toHaveLength(0);
  });

  it("balances two animated rows when there is enough nominee data", () => {
    const result = splitHomepageNomineeRows(nominees);

    expect(result.featured).toHaveLength(9);
    expect(result.entries).toHaveLength(9);
  });

  it("limits the homepage preview to the configured maximum", () => {
    const result = splitHomepageNomineeRows([...nominees, ...nominees], { limit: 18 });

    expect(result.featured).toHaveLength(9);
    expect(result.entries).toHaveLength(9);
  });
});
