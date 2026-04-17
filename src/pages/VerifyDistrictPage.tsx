import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertCircle, CheckCircle2, Loader2, Lock, ShieldCheck } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DistrictMap } from "@/components/DistrictMap";
import { DistrictSearchPicker } from "@/components/DistrictSearchPicker";
import { StudentDirectorySearch } from "@/components/StudentDirectorySearch";
import { useToast } from "@/hooks/use-toast";
import { useAuthStatus } from "@/hooks/use-auth-status";
import { supabase } from "@/integrations/supabase/client";
import {
  createSearchableStudentDirectory,
  searchStudentDirectory,
  type SearchableStudentDirectoryEntry,
  type StudentDirectoryEntry,
} from "@/lib/student-directory";
import { canonicalizeDistrictName } from "@/lib/district-geo";

interface VerificationResult {
  department: string;
  district: string;
  merit_rank: number;
  name: string;
}

export default function VerifyDistrictPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { session, aal, loading } = useAuthStatus();

  const [directory, setDirectory] = useState<StudentDirectoryEntry[]>([]);
  const [directoryLoading, setDirectoryLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<SearchableStudentDirectoryEntry | null>(null);
  const [department, setDepartment] = useState("");
  const [meritRank, setMeritRank] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [successDistrict, setSuccessDistrict] = useState<string | null>(null);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);

  useEffect(() => {
    if (!loading && (!session || aal !== "aal2")) {
      navigate("/auth?next=/verify", { replace: true });
    }
  }, [aal, loading, navigate, session]);

  useEffect(() => {
    let cancelled = false;

    const loadDirectory = async () => {
      if (!session || aal !== "aal2") return;

      setDirectoryLoading(true);

      try {
        const { data, error } = await supabase
          .from("students")
          .select(
            "id, name, department, merit_rank, admission_roll, application_id, district, is_locked, verification_status",
          )
          .order("merit_rank", { ascending: true });

        if (error) throw error;

        if (!cancelled) {
          setDirectory((data ?? []) as StudentDirectoryEntry[]);
        }
      } catch (error) {
        if (!cancelled) {
          toast({
            title: "Unable to load student directory",
            description: error instanceof Error ? error.message : "Please try again later.",
            variant: "destructive",
          });
        }
      } finally {
        if (!cancelled) {
          setDirectoryLoading(false);
        }
      }
    };

    void loadDirectory();

    return () => {
      cancelled = true;
    };
  }, [aal, session, toast]);

  useEffect(() => {
    if (!successDistrict) return;

    const timeoutId = window.setTimeout(() => {
      setSuccessDistrict(null);
    }, 1600);

    return () => window.clearTimeout(timeoutId);
  }, [successDistrict]);

  const searchableDirectory = useMemo(
    () => createSearchableStudentDirectory(directory),
    [directory],
  );

  const suggestions = useMemo(
    () => searchStudentDirectory(searchableDirectory, query, 8),
    [query, searchableDirectory],
  );

  const districtCounts = useMemo(() => {
    const counts: Record<string, number> = {};

    directory.forEach((student) => {
      if (student.verification_status === "verified" && student.district) {
        const districtName = canonicalizeDistrictName(student.district);
        counts[districtName] = (counts[districtName] ?? 0) + 1;
      }
    });

    return counts;
  }, [directory]);

  const departmentMismatch =
    selectedStudent && department ? department !== selectedStudent.department : false;
  const meritMismatch =
    selectedStudent && meritRank ? Number(meritRank) !== selectedStudent.merit_rank : false;

  const handleQueryChange = (value: string) => {
    setQuery(value);
    setVerificationResult(null);

    if (selectedStudent && value !== selectedStudent.name) {
      setSelectedStudent(null);
      setDepartment("");
      setMeritRank("");
    }
  };

  const handleSelectStudent = (student: SearchableStudentDirectoryEntry) => {
    setSelectedStudent(student);
    setQuery(student.name);
    setDepartment("");
    setMeritRank("");
    setSelectedDistrict(student.district ? canonicalizeDistrictName(student.district) : null);
    setVerificationResult(null);
  };

  const handleSubmit = async () => {
    if (!selectedStudent) {
      toast({
        title: "Select your record",
        description: "Choose the correct student entry from the directory first.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedDistrict || !department || !meritRank) {
      toast({
        title: "Missing details",
        description: "Confirm department, merit rank, and district before submitting.",
        variant: "destructive",
      });
      return;
    }

    if (selectedStudent.is_locked) {
      toast({
        title: "Record already locked",
        description: "This student entry already has a verified district.",
        variant: "destructive",
      });
      return;
    }

    if (departmentMismatch || meritMismatch) {
      toast({
        title: "Confirmation mismatch",
        description: "Department or merit rank does not match the selected record.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke("submit-verification", {
        body: {
          studentId: selectedStudent.id,
          department,
          meritRank: Number(meritRank),
          district: selectedDistrict,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setVerificationResult(data.student as VerificationResult);
      setSuccessDistrict(selectedDistrict);
      setDirectory((current) =>
        current.map((student) =>
          student.id === selectedStudent.id
            ? {
                ...student,
                district: selectedDistrict,
                is_locked: true,
                verification_status: "verified",
              }
            : student,
        ),
      );

      toast({
        title: "District locked successfully",
        description: "Your district is now saved for analytics and verification.",
      });
    } catch (error) {
      toast({
        title: "Verification failed",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || (!session && !loading)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Preparing district verification...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-8 md:px-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Verify and lock your home district</h1>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
              Choose your RUET admission record, confirm department and merit, then select your district on the Bangladesh map.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="default" className="gap-1">
              <ShieldCheck className="h-3.5 w-3.5" />
              AAL2 session
            </Badge>
            <Button asChild variant="outline">
              <Link to="/">Back to analytics</Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
          <div className="space-y-6">
            <Card className="border-border/60">
              <CardHeader>
                <CardTitle>Student record</CardTitle>
                <CardDescription>
                  This list is loaded directly from the `students` table seeded by the admin upload flow.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <StudentDirectorySearch
                  disabled={directoryLoading}
                  query={query}
                  selectedStudent={selectedStudent}
                  suggestions={suggestions}
                  onQueryChange={handleQueryChange}
                  onSelect={handleSelectStudent}
                />

                {selectedStudent ? (
                  <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="text-base font-semibold text-foreground">{selectedStudent.name}</div>
                        <div className="mt-1 text-sm text-muted-foreground">
                          {selectedStudent.department} · Merit #{selectedStudent.merit_rank}
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          Roll {selectedStudent.admission_roll}
                          {selectedStudent.application_id
                            ? ` · Application ${selectedStudent.application_id}`
                            : ""}
                        </div>
                      </div>
                      <Badge
                        variant={
                          selectedStudent.verification_status === "verified" ? "default" : "secondary"
                        }
                      >
                        {selectedStudent.verification_status}
                      </Badge>
                    </div>

                    {selectedStudent.is_locked ? (
                      <div className="mt-4 flex items-center gap-2 rounded-xl bg-background/80 px-3 py-2 text-sm text-muted-foreground">
                        <Lock className="h-4 w-4" />
                        Locked to {selectedStudent.district ?? "a saved district"}
                      </div>
                    ) : null}
                  </div>
                ) : null}

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="verify-department">Confirm department</Label>
                    <Input
                      id="verify-department"
                      placeholder="Exact department"
                      value={department}
                      onChange={(event) => setDepartment(event.target.value)}
                      disabled={!selectedStudent}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="verify-merit">Confirm merit rank</Label>
                    <Input
                      id="verify-merit"
                      type="number"
                      placeholder="Merit rank"
                      value={meritRank}
                      onChange={(event) => setMeritRank(event.target.value)}
                      disabled={!selectedStudent}
                    />
                  </div>
                </div>

                {departmentMismatch || meritMismatch ? (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Confirmation mismatch</AlertTitle>
                    <AlertDescription>
                      Department or merit rank does not match the student record you selected.
                    </AlertDescription>
                  </Alert>
                ) : null}

                {verificationResult ? (
                  <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4">
                    <div className="flex items-center gap-2 text-primary">
                      <CheckCircle2 className="h-5 w-5" />
                      <span className="font-semibold">District verification complete</span>
                    </div>
                    <p className="mt-2 text-sm text-foreground">
                      {verificationResult.name} is locked to {verificationResult.district}.
                    </p>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <Card className="border-border/60">
              <CardHeader>
                <CardTitle>Submit district</CardTitle>
                <CardDescription>
                  Pick your district on the map, or use the searchable fallback below it.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedDistrict ? (
                  <div className="rounded-2xl border border-border/60 bg-muted/20 p-3 text-sm text-foreground">
                    Selected district: <span className="font-semibold">{selectedDistrict}</span>
                  </div>
                ) : null}

                <Button
                  onClick={handleSubmit}
                  disabled={!selectedStudent || !selectedDistrict || submitting || selectedStudent?.is_locked}
                  className="w-full"
                >
                  {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Confirm and lock district
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <DistrictMap
              districtCounts={districtCounts}
              selectedDistrict={selectedDistrict}
              successDistrict={successDistrict}
              mode="picker"
              onDistrictClick={setSelectedDistrict}
            />

            <Card className="border-border/60">
              <CardContent className="pt-6">
                <DistrictSearchPicker
                  selectedDistrict={selectedDistrict}
                  onSelect={setSelectedDistrict}
                  disabled={submitting}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
