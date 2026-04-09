import { useState, useEffect, useMemo } from "react";
import { StatsCards } from "@/components/StatsCards";
import { supabase } from "@/integrations/supabase/client";

interface Student {
  id: string;
  department: string;
  district: string | null;
  verification_status: string;
  merit_rank: number;
}

export default function DashboardHome() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudents = async () => {
      const { data } = await supabase
        .from("students")
        .select("id, department, district, verification_status, merit_rank") as { data: Student[] | null };
      setStudents(data || []);
      setLoading(false);
    };
    fetchStudents();
  }, []);

  const stats = useMemo(() => {
    const verifiedCount = students.filter(
      (s) => s.verification_status === "verified"
    ).length;

    const districtCounts: Record<string, number> = {};
    const deptCounts: Record<string, number> = {};
    students.forEach((s) => {
      if (s.district) districtCounts[s.district] = (districtCounts[s.district] || 0) + 1;
      deptCounts[s.department] = (deptCounts[s.department] || 0) + 1;
    });

    const topDistrict = Object.entries(districtCounts).sort(
      ([, a], [, b]) => b - a
    )[0]?.[0] || "";
    const topDepartment = Object.entries(deptCounts).sort(
      ([, a], [, b]) => b - a
    )[0]?.[0] || "";

    return { verifiedCount, topDistrict, topDepartment };
  }, [students]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Dashboard</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Overview of RUET admission data and verification status
        </p>
      </div>

      <StatsCards
        totalStudents={students.length}
        verifiedCount={stats.verifiedCount}
        topDistrict={stats.topDistrict}
        topDepartment={stats.topDepartment}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-border/50 bg-card p-6">
          <h3 className="font-semibold text-foreground mb-3">Quick Actions</h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• Navigate to <strong>Map & Analytics</strong> to explore geographic distribution</p>
            <p>• Use <strong>Student Verification</strong> to verify your district</p>
            <p>• Access <strong>Admin Panel</strong> to upload admission data</p>
          </div>
        </div>
        <div className="rounded-lg border border-border/50 bg-card p-6">
          <h3 className="font-semibold text-foreground mb-3">Data Summary</h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            {loading ? (
              <p>Loading...</p>
            ) : (
              <>
                <p>Total students: <strong>{students.length}</strong></p>
                <p>Verified: <strong>{stats.verifiedCount}</strong></p>
                <p>Unverified: <strong>{students.length - stats.verifiedCount}</strong></p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
