import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DISTRICTS } from "@/data/bangladesh-districts";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Lock, UserCheck, LogIn } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface StudentRecord {
  id: string;
  name: string;
  department: string;
  merit_rank: number;
  admission_roll: string;
  district: string | null;
  verification_status: string;
  is_locked: boolean;
}

export function VerificationForm() {
  const [step, setStep] = useState<"login" | "verify">("login");
  const [admissionRoll, setAdmissionRoll] = useState("");
  const [meritRank, setMeritRank] = useState("");
  const [student, setStudent] = useState<StudentRecord | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleLogin = async () => {
    if (!admissionRoll || !meritRank) {
      toast({
        title: "Missing fields",
        description: "Please enter both Admission Roll and Merit Rank.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("students")
        .select("id, name, department, merit_rank, admission_roll, district, verification_status, is_locked")
        .eq("admission_roll", admissionRoll.trim())
        .eq("merit_rank", parseInt(meritRank))
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        toast({
          title: "Not found",
          description: "No student matches that Admission Roll + Merit Rank combination.",
          variant: "destructive",
        });
        return;
      }

      setStudent(data as StudentRecord);
      setStep("verify");
      if (data.district) setSelectedDistrict(data.district);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Login failed",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!selectedDistrict) {
      toast({
        title: "Select district",
        description: "Please select your home district.",
        variant: "destructive",
      });
      return;
    }

    if (!student) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("students")
        .update({
          district: selectedDistrict,
          verification_status: "verified",
          is_locked: true,
          verified_at: new Date().toISOString(),
        })
        .eq("id", student.id)
        .eq("is_locked", false);

      if (error) throw error;

      setStudent({
        ...student,
        district: selectedDistrict,
        verification_status: "verified",
        is_locked: true,
      });

      toast({
        title: "Verified!",
        description: "Your district has been recorded and locked.",
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Verification failed",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (step === "login") {
    return (
      <div className="max-w-md mx-auto">
        <Card className="border-border/50">
          <CardHeader className="text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <LogIn className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-xl">Student Verification</CardTitle>
            <CardDescription>
              Enter your Admission Roll and Merit Rank to verify your district.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="roll">Admission Roll</Label>
              <Input
                id="roll"
                placeholder="e.g. 2110001"
                value={admissionRoll}
                onChange={(e) => setAdmissionRoll(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rank">Merit Rank</Label>
              <Input
                id="rank"
                type="number"
                placeholder="e.g. 42"
                value={meritRank}
                onChange={(e) => setMeritRank(e.target.value)}
              />
            </div>
            <Button
              onClick={handleLogin}
              disabled={loading}
              className="w-full"
            >
              {loading ? "Verifying…" : "Log In & Verify"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <Card className="border-border/50">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <UserCheck className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-xl">Your Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Name</span>
              <span className="font-medium">{student?.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Department</span>
              <span className="font-medium">{student?.department}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Merit Rank</span>
              <span className="font-medium">#{student?.merit_rank}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Status</span>
              <Badge
                variant={student?.is_locked ? "default" : "secondary"}
                className="text-xs"
              >
                {student?.is_locked ? (
                  <>
                    <CheckCircle className="mr-1 h-3 w-3" /> Verified
                  </>
                ) : (
                  "Pending"
                )}
              </Badge>
            </div>
          </div>

          {student?.is_locked ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
              <Lock className="h-4 w-4" />
              <span>
                District: <strong>{student.district}</strong> — Locked
              </span>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label>Select Your Home District</Label>
                <Select
                  value={selectedDistrict}
                  onValueChange={setSelectedDistrict}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose district" />
                  </SelectTrigger>
                  <SelectContent>
                    {DISTRICTS.map((d) => (
                      <SelectItem key={d.code} value={d.name}>
                        {d.name} ({d.division})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleVerify}
                disabled={loading || !selectedDistrict}
                className="w-full"
              >
                {loading ? "Submitting…" : "Confirm & Lock District"}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                ⚠️ This action is permanent. You cannot change your district after
                submission.
              </p>
            </>
          )}

          <Button
            variant="ghost"
            className="w-full text-xs"
            onClick={() => {
              setStep("login");
              setStudent(null);
              setAdmissionRoll("");
              setMeritRank("");
            }}
          >
            ← Back to login
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
