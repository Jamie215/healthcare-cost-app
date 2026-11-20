import { ONTARIO_HOSPITALS, type Hospital } from './hospitals';
import { MEDICATION_SUGGESTIONS } from './medications';

export const normalize = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

/** Matches hospital names, cities and aliases after two characters, like the prototype. */
export function searchHospitals(query: string, limit = 6): Hospital[] {
  const q = normalize(query);
  if (q.length < 2) return [];
  const terms = q.split(' ');
  return ONTARIO_HOSPITALS.filter((h) => {
    const haystack = normalize(`${h.name} ${h.city} ${h.aliases}`);
    return terms.every((t) => haystack.includes(t));
  })
    .sort(
      (a, b) =>
        Number(normalize(b.name).startsWith(q)) - Number(normalize(a.name).startsWith(q)) ||
        a.name.localeCompare(b.name),
    )
    .slice(0, limit);
}

/** Filters medication suggestions by brand or generic name. Empty query returns all. */
export function searchMedications(query: string): string[] {
  const q = normalize(query);
  const terms = q.split(' ').filter(Boolean);
  return MEDICATION_SUGGESTIONS.filter((m) => terms.every((t) => normalize(m).includes(t))).sort(
    (a, b) =>
      Number(normalize(b).startsWith(q)) - Number(normalize(a).startsWith(q)) || a.localeCompare(b),
  );
}
