export interface RuetStudentRecord {
  sl: number;
  application_id: string;
  admission_roll: string;
  name: string;
  merit: number;
  department: string;
}

export interface SearchableRuetStudent extends RuetStudentRecord {
  normalizedName: string;
}

export const normalizeStudentName = (value: string) =>
  value
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export async function loadRuetStudents(): Promise<SearchableRuetStudent[]> {
  const response = await fetch("/ruet-student-data-25-batch-1090.json");

  if (!response.ok) {
    throw new Error("Unable to load the RUET admission list.");
  }

  const records = (await response.json()) as RuetStudentRecord[];

  return records.map((student) => ({
    ...student,
    normalizedName: normalizeStudentName(student.name),
  }));
}

export function maskContact(value: string | null | undefined) {
  if (!value) return null;
  if (value.includes("@")) {
    const [local, domain] = value.split("@");
    const safeLocal =
      local.length <= 2
        ? `${local.slice(0, 1)}*`
        : `${local.slice(0, 2)}***${local.slice(-1)}`;

    return `${safeLocal}@${domain}`;
  }

  const digits = value.replace(/\D/g, "");
  if (digits.length < 4) return value;
  return `${"*".repeat(Math.max(0, digits.length - 4))}${digits.slice(-4)}`;
}
