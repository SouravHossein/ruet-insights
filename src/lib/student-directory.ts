export interface StudentDirectoryEntry {
  id: string;
  name: string;
  department: string;
  merit_rank: number;
  admission_roll: string;
  application_id: string | null;
  district: string | null;
  is_locked: boolean;
  verification_status: string;
}

export interface SearchableStudentDirectoryEntry extends StudentDirectoryEntry {
  normalizedName: string;
  normalizedRoll: string;
  normalizedApplicationId: string;
}

export function normalizeStudentSearch(value: string) {
  return value
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function createSearchableStudentDirectory(entries: StudentDirectoryEntry[]) {
  return entries.map((entry) => ({
    ...entry,
    normalizedName: normalizeStudentSearch(entry.name),
    normalizedRoll: entry.admission_roll.trim(),
    normalizedApplicationId: entry.application_id?.trim() ?? "",
  }));
}

function getStudentSearchRank(student: SearchableStudentDirectoryEntry, query: string) {
  if (!query) return Number.POSITIVE_INFINITY;

  const normalizedNumericQuery = query.replace(/\s+/g, "");

  if (student.normalizedName.startsWith(query)) return 0;
  if (student.normalizedName.includes(query)) return 1;
  if (student.normalizedRoll.startsWith(normalizedNumericQuery)) return 2;
  if (student.normalizedApplicationId.startsWith(normalizedNumericQuery)) return 3;
  if (student.normalizedRoll.includes(normalizedNumericQuery)) return 4;
  if (student.normalizedApplicationId.includes(normalizedNumericQuery)) return 5;

  return Number.POSITIVE_INFINITY;
}

export function searchStudentDirectory(
  entries: SearchableStudentDirectoryEntry[],
  rawQuery: string,
  limit = 8,
) {
  const query = normalizeStudentSearch(rawQuery);

  if (!query) return [];

  return entries
    .map((entry) => ({
      entry,
      rank: getStudentSearchRank(entry, query),
    }))
    .filter((result) => Number.isFinite(result.rank))
    .sort((left, right) => {
      if (left.rank !== right.rank) return left.rank - right.rank;
      if (left.entry.merit_rank !== right.entry.merit_rank) {
        return left.entry.merit_rank - right.entry.merit_rank;
      }
      return left.entry.name.localeCompare(right.entry.name);
    })
    .slice(0, limit)
    .map((result) => result.entry);
}
