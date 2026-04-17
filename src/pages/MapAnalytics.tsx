import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { DistrictMap } from "@/components/DistrictMap";
import { InsightsPanel } from "@/components/InsightsPanel";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { DISTRICTS } from "@/data/bangladesh-districts";
import { supabase } from "@/integrations/supabase/client";
import { canonicalizeDistrictName } from "@/lib/district-geo";

interface Student {
  id: string;
  name: string | null;
  department: string;
  district: string | null;
  verification_status: string;
  merit_rank: number;
}

export default function MapAnalytics() {
  const { t } = useTranslation();
  const [students, setStudents] = useState<Student[]>([]);
  const [deptFilter, setDeptFilter] = useState("all");
  const [meritRange, setMeritRange] = useState([0, 2000]);
  const [verifiedOnly, setVerifiedOnly] = useState(true);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);

  useEffect(() => {
    const fetchStudents = async () => {
      const { data } = (await supabase
        .from("students")
        .select("id, name, department, district, verification_status, merit_rank")) as {
        data: Student[] | null;
      };

      setStudents(data ?? []);

      if (data && data.length > 0) {
        const maxRank = Math.max(...data.map((student) => student.merit_rank));
        setMeritRange([0, maxRank]);
      }
    };

    void fetchStudents();
  }, []);

  const baseFiltered = useMemo(
    () =>
      students.filter((student) => {
        if (deptFilter !== "all" && student.department !== deptFilter) return false;
        if (student.merit_rank < meritRange[0] || student.merit_rank > meritRange[1]) return false;
        if (verifiedOnly && student.verification_status !== "verified") return false;
        return true;
      }),
    [deptFilter, meritRange, students, verifiedOnly],
  );

  const districtCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    DISTRICTS.forEach((district) => {
      counts[district.name] = 0;
    });

    baseFiltered.forEach((student) => {
      if (student.verification_status === "verified" && student.district) {
        const districtName = canonicalizeDistrictName(student.district);
        counts[districtName] = (counts[districtName] ?? 0) + 1;
      }
    });

    return counts;
  }, [baseFiltered]);

  const departmentCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    baseFiltered.forEach((student) => {
      counts[student.department] = (counts[student.department] ?? 0) + 1;
    });
    return counts;
  }, [baseFiltered]);

  const districtStudents = useMemo(() => {
    if (!selectedDistrict) return [];
    return baseFiltered
      .filter((student) => canonicalizeDistrictName(student.district ?? "") === selectedDistrict)
      .sort((left, right) => left.merit_rank - right.merit_rank);
  }, [baseFiltered, selectedDistrict]);

  const departments = useMemo(
    () => Array.from(new Set(students.map((student) => student.department))).sort(),
    [students],
  );

  const maxRank = students.length > 0 ? Math.max(...students.map((student) => student.merit_rank)) : 2000;
  const selectedDistrictCount = selectedDistrict ? districtCounts[selectedDistrict] ?? 0 : 0;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 pb-8">
      <div className="rounded-3xl border border-border/50 bg-card px-4 py-5 shadow-sm sm:px-6">
        <h2 className="text-xl font-bold text-foreground sm:text-2xl">{t("map.title")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("map.description")} Tap any district to view people from that district.
        </p>
      </div>

      <Card className="rounded-3xl border-border/50">
        <CardContent className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-[0.14em]">Department</Label>
            <Select value={deptFilter} onValueChange={setDeptFilter}>
              <SelectTrigger className="h-11 rounded-2xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All departments</SelectItem>
                {departments.map((department) => (
                  <SelectItem key={department} value={department}>
                    {department}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 sm:col-span-2 lg:col-span-2">
            <Label className="text-xs uppercase tracking-[0.14em]">
              Merit range: {meritRange[0]} - {meritRange[1]}
            </Label>
            <div className="rounded-2xl border border-border/60 px-4 py-4">
              <Slider min={0} max={maxRank} step={10} value={meritRange} onValueChange={setMeritRange} />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-2xl border border-border/60 px-4 py-3">
              <Label className="text-xs uppercase tracking-[0.14em]">Verified only</Label>
              <Switch checked={verifiedOnly} onCheckedChange={setVerifiedOnly} />
            </div>
            <div className="rounded-2xl border border-border/60 bg-muted/20 px-4 py-3 text-xs text-muted-foreground">
              Showing {baseFiltered.length} of {students.length} students
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5">
          <DistrictMap
            districtCounts={districtCounts}
            mode="analytics"
            onDistrictClick={(districtName) =>
              setSelectedDistrict(selectedDistrict === districtName ? null : districtName)
            }
            selectedDistrict={selectedDistrict}
          />

          <Card className="rounded-3xl border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                {selectedDistrict ? `${selectedDistrict} district students` : "Select a district on the map"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {selectedDistrict ? (
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{selectedDistrictCount} verified on map</Badge>
                  <button
                    type="button"
                    onClick={() => setSelectedDistrict(null)}
                    className="text-xs font-medium text-accent hover:underline"
                  >
                    Clear district
                  </button>
                </div>
              ) : null}

              {selectedDistrict ? (
                districtStudents.length > 0 ? (
                  <div className="grid gap-2">
                    {districtStudents.slice(0, 16).map((student) => (
                      <div
                        key={student.id}
                        className="flex items-center justify-between rounded-xl border border-border/60 bg-background px-3 py-2"
                      >
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium text-foreground">
                            {student.name ?? "Unknown student"}
                          </div>
                          <div className="truncate text-xs text-muted-foreground">{student.department}</div>
                        </div>
                        <Badge variant="outline">#{student.merit_rank}</Badge>
                      </div>
                    ))}
                    {districtStudents.length > 16 ? (
                      <div className="text-xs text-muted-foreground">
                        Showing first 16 of {districtStudents.length} students for this district.
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div className="rounded-xl border border-border/60 bg-muted/20 px-3 py-3 text-sm text-muted-foreground">
                    No students found for this district under the current filters.
                  </div>
                )
              ) : (
                <div className="rounded-xl border border-border/60 bg-muted/20 px-3 py-3 text-sm text-muted-foreground">
                  Tap a district name on the map to see people from that district.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <InsightsPanel districtCounts={districtCounts} departmentCounts={departmentCounts} />
        </div>
      </div>
    </div>
  );
}
