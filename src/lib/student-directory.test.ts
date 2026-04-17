import { describe, expect, it } from "vitest";
import {
  createSearchableStudentDirectory,
  searchStudentDirectory,
  type StudentDirectoryEntry,
} from "@/lib/student-directory";

const students: StudentDirectoryEntry[] = [
  {
    id: "1",
    name: "ALICE RAHMAN",
    department: "CSE",
    merit_rank: 12,
    admission_roll: "500123",
    application_id: "700111",
    district: null,
    is_locked: false,
    verification_status: "unverified",
  },
  {
    id: "2",
    name: "ALIF RASHID",
    department: "EEE",
    merit_rank: 8,
    admission_roll: "400222",
    application_id: "700222",
    district: null,
    is_locked: false,
    verification_status: "unverified",
  },
  {
    id: "3",
    name: "MARIA KHAN",
    department: "CE",
    merit_rank: 3,
    admission_roll: "300999",
    application_id: "701999",
    district: null,
    is_locked: false,
    verification_status: "unverified",
  },
];

describe("student directory search", () => {
  const searchable = createSearchableStudentDirectory(students);

  it("ranks exact prefix name matches ahead of weaker matches", () => {
    const results = searchStudentDirectory(searchable, "ali");

    expect(results.map((student) => student.id)).toEqual(["2", "1"]);
  });

  it("matches by admission roll and application id", () => {
    expect(searchStudentDirectory(searchable, "500123")[0]?.id).toBe("1");
    expect(searchStudentDirectory(searchable, "701999")[0]?.id).toBe("3");
  });

  it("uses merit rank as the tie breaker", () => {
    const tiedResults = searchStudentDirectory(searchable, "al");

    expect(tiedResults[0]?.merit_rank).toBeLessThan(tiedResults[1]?.merit_rank ?? Infinity);
  });
});
