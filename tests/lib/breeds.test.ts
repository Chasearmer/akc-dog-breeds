import { breedGroups, findBreed, findGroup, getAllBreeds } from "@/lib/breeds";

describe("breeds data", () => {
  it("exposes groups and breeds", () => {
    expect(breedGroups.length).toBeGreaterThan(0);
    const allBreeds = getAllBreeds();
    expect(allBreeds.length).toBeGreaterThan(150);
  });

  it("finds breeds by slug and returns their group", () => {
    const result = findBreed("australian-cattle-dog");
    expect(result).toBeDefined();
    expect(result?.breed.name).toBe("Australian Cattle Dog");
    expect(result?.group.slug).toBe("herding");
  });

  it("finds groups by slug", () => {
    const group = findGroup("hound");
    expect(group?.name).toBe("Hound Group");
    expect(findGroup("not-a-group")).toBeUndefined();
  });

  it("assigns unique, normalized slugs", () => {
    const allBreeds = getAllBreeds();
    const slugs = allBreeds.map(b => b.slug);
    const uniqueSlugs = new Set(slugs);
    expect(uniqueSlugs.size).toBe(slugs.length);
    for (const slug of slugs) {
      expect(slug).toMatch(/^[a-z0-9-]+$/);
      expect(slug.startsWith("-")).toBe(false);
      expect(slug.endsWith("-")).toBe(false);
    }
  });

  it("ensures api and wiki fields are consistent", () => {
    const allBreeds = getAllBreeds();
    const hasWikiFallback = allBreeds.some(b => !b.apiBreed && b.wikiTitle);
    expect(hasWikiFallback).toBe(true);
    for (const breed of allBreeds) {
      if (breed.apiBreed) {
        expect(breed.wikiTitle).toBeUndefined();
      }
    }
  });
});
