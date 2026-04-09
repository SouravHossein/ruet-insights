import { useState, useEffect, useMemo } from "react";
import { DistrictMap } from "@/components/DistrictMap";
import { InsightsPanel } from "@/components/InsightsPanel";
import { DISTRICTS, DEPARTMENTS } from "@/data/bangladesh-districts";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";

interface Student {
  id: string;
  department: string;
  district: string | null;
  verification_status: string;
  merit_rank: number;
}

export default function MapAnalytics() {
  const [students, setStudents] = useState<Student[]>([]);
  const [deptFilter, setDeptFilter] = useState("all");
  const [meritRange, setMeritRange] = useState([0, 2000]);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);

  useEffect(() => {
    const fetchStudents = async () => {
      const { data } = await supabase
        .from("students")
        .select("id, department, district, verification_status, merit_rank") as { data: Student[] | null };
      setStudents(data || []);
      if (data && data.length > 0) {
        const maxRank = Math.max(...data.map((s) => s.merit_rank));
        setMeritRange([0, maxRank]);
      }
    };
    fetchStudents();
  }, []);

  const filtered = useMemo(() => {
    return students.filter((s) => {
      if (deptFilter !== "all" && s.department !== deptFilter) return false;
      if (s.merit_rank < meritRange[0] || s.merit_rank > meritRange[1])
        return false;
      if (verifiedOnly && s.verification_status !== "verified") return false;
      if (selectedDistrict && s.district !== selectedDistrict) return false;
      return true;
    });
  }, [students, deptFilter, meritRange, verifiedOnly, selectedDistrict]);

  const districtCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    DISTRICTS.forEach((d) => (counts[d.name] = 0));
    filtered.forEach((s) => {
      if (s.district) counts[s.district] = (counts[s.district] || 0) + 1;
    });
    return counts;
  }, [filtered]);

  const departmentCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    filtered.forEach((s) => {
      counts[s.department] = (counts[s.department] || 0) + 1;
    });
    return counts;
  }, [filtered]);

  const maxRank = students.length > 0 ? Math.max(...students.map((s) => s.merit_rank)) : 2000;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Map & Analytics</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Geographic distribution of RUET students across Bangladesh
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-end rounded-lg border border-border/50 bg-card p-4">
        <div className="space-y-1.5">
          <Label className="text-xs">Department</Label>
          <Select value={deptFilter} onValueChange={setDeptFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {DEPARTMENTS.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5 w-[200px]">
          <Label className="text-xs">
            Merit Range: {meritRange[0]} – {meritRange[1]}
          </Label>
          <Slider
            min={0}
            max={maxRank}
            step={10}
            value={meritRange}
            onValueChange={setMeritRange}
          />
        </div>

        <div className="flex items-center gap-2">
          <Switch
            checked={verifiedOnly}
            onCheckedChange={setVerifiedOnly}
          />
          <Label className="text-xs">Verified only</Label>
        </div>

        {selectedDistrict && (
          <button
            onClick={() => setSelectedDistrict(null)}
            className="text-xs text-accent hover:underline"
          >
            Clear district filter: {selectedDistrict} ✕
          </button>
        )}

        <div className="text-xs text-muted-foreground ml-auto">
          Showing {filtered.length} of {students.length} students
        </div>
      </div>

      {/* Map + Insights */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DistrictMap
            districtCounts={districtCounts}
            onDistrictClick={(d) =>
              setSelectedDistrict(selectedDistrict === d ? null : d)
            }
            selectedDistrict={selectedDistrict}
          />
        </div>
        <div>
          <InsightsPanel
            districtCounts={districtCounts}
            departmentCounts={departmentCounts}
          />
        </div>
      </div>
    </div>
  );
}
