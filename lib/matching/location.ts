const REGION_ALIASES: Record<string, string[]> = {
  "united states": ["us", "usa", "u s", "united states", "america"],
  "united kingdom": ["uk", "u k", "united kingdom", "great britain", "england", "britain"],
  canada: ["canada"],
  europe: ["europe", "eu", "european union", "emea"],
  nigeria: ["nigeria"],
  germany: ["germany"],
  india: ["india"],
};

const ANYWHERE = /\b(anywhere|worldwide|global|any location)\b/i;

export function normalizePlace(value: string) {
  return ` ${value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()} `;
}

function mentions(text: string, phrase: string) {
  return normalizePlace(text).includes(normalizePlace(phrase));
}

export function regionsIn(location: string) {
  return Object.entries(REGION_ALIASES)
    .filter(([, aliases]) => aliases.some((alias) => mentions(location, alias)))
    .map(([region]) => region);
}

export function isOpenToAnywhere(location: string) {
  return ANYWHERE.test(location);
}

export function placesOverlap(location: string, places: string[]) {
  const postingRegions = regionsIn(location);

  return places.some((place) => {
    const city = place.split(",")[0]?.trim() ?? "";

    return (
      (city.length > 1 && mentions(location, city)) ||
      regionsIn(place).some((region) => postingRegions.includes(region))
    );
  });
}
