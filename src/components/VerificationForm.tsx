import { useDeferredValue, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { AlertCircle, CheckCircle2, Chrome, Loader2, Lock, LogOut, ShieldCheck, Smartphone, UserCheck } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DISTRICTS } from "@/data/bangladesh-districts";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  type SearchableRuetStudent,
  loadRuetStudents,
  maskContact,
  normalizeStudentName,
} from "@/lib/ruet-students";

const MAX_SUGGESTIONS = 8;

interface VerificationResult {
  district: string;
  name: string;
  department: string;
  merit_rank: number;
}

const normalizePhoneNumber = (value: string) => {
  const trimmed = value.trim();

  if (!trimmed) return "";
  if (trimmed.startsWith("+")) return trimmed;
  if (trimmed.startsWith("88")) return `+${trimmed}`;
  if (trimmed.startsWith("01")) return `+88${trimmed}`;
  return trimmed;
};

export function VerificationForm() {
  const { toast } = useToast();
  const [session, setSession] = useState<Session | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [directory, setDirectory] = useState<SearchableRuetStudent[]>([]);
  const [directoryLoading, setDirectoryLoading] = useState(true);
  const [nameQuery, setNameQuery] = useState("");
  const deferredNameQuery = useDeferredValue(nameQuery);
  const [selectedStudent, setSelectedStudent] = useState<SearchableRuetStudent | null>(null);
  const [department, setDepartment] = useState("");
  const [meritRank, setMeritRank] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);

  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    const hydrateSession = async () => {
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();

      if (!mounted) return;
      setSession(currentSession);
      setAuthChecking(false);
    };

    hydrateSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setAuthChecking(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadDirectory = async () => {
      try {
        const records = await loadRuetStudents();
        if (!cancelled) {
          setDirectory(records);
        }
      } catch (error) {
        if (!cancelled) {
          toast({
            title: "Directory unavailable",
            description:
              error instanceof Error
                ? error.message
                : "The RUET admission list could not be loaded.",
            variant: "destructive",
          });
        }
      } finally {
        if (!cancelled) {
          setDirectoryLoading(false);
        }
      }
    };

    loadDirectory();

    return () => {
      cancelled = true;
    };
  }, [toast]);

  const availableDepartments = useMemo(
    () => Array.from(new Set(directory.map((student) => student.department))).sort(),
    [directory],
  );

  const searchTerm = normalizeStudentName(deferredNameQuery);
  const suggestions = useMemo(() => {
    if (!searchTerm || searchTerm.length < 2) return [];

    return directory
      .filter((student) => student.normalizedName.includes(searchTerm))
      .sort((left, right) => {
        const leftStartsWith = left.normalizedName.startsWith(searchTerm) ? 0 : 1;
        const rightStartsWith = right.normalizedName.startsWith(searchTerm) ? 0 : 1;

        if (leftStartsWith !== rightStartsWith) {
          return leftStartsWith - rightStartsWith;
        }

        return left.merit - right.merit;
      })
      .slice(0, MAX_SUGGESTIONS);
  }, [directory, searchTerm]);

  const authProvider = session?.user?.app_metadata?.provider ?? "authenticated";
  const signedInAs = maskContact(session?.user?.email ?? session?.user?.phone);
  const meritMismatch =
    selectedStudent && meritRank ? Number(meritRank) !== selectedStudent.merit : false;
  const departmentMismatch =
    selectedStudent && department ? department !== selectedStudent.department : false;

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);

    try {
      const redirectTo = `${window.location.origin}/verify`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });

      if (error) throw error;
    } catch (error) {
      toast({
        title: "Google sign-in failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
      setGoogleLoading(false);
    }
  };

  const handleSendOtp = async () => {
    const normalizedPhone = normalizePhoneNumber(phoneNumber);

    if (!normalizedPhone) {
      toast({
        title: "Phone required",
        description: "Enter your phone number with country code or a Bangladeshi mobile number.",
        variant: "destructive",
      });
      return;
    }

    setSendingOtp(true);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: normalizedPhone,
      });

      if (error) throw error;

      setPhoneNumber(normalizedPhone);
      setOtpSent(true);
      toast({
        title: "Code sent",
        description: "Enter the 6-digit code sent to your phone.",
      });
    } catch (error) {
      toast({
        title: "OTP send failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      toast({
        title: "Incomplete code",
        description: "Enter the full 6-digit verification code.",
        variant: "destructive",
      });
      return;
    }

    setVerifyingOtp(true);

    try {
      const { error } = await supabase.auth.verifyOtp({
        phone: phoneNumber,
        token: otp,
        type: "sms",
      });

      if (error) throw error;

      setOtp("");
      toast({
        title: "Signed in",
        description: "Your phone number has been verified.",
      });
    } catch (error) {
      toast({
        title: "OTP verification failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setVerificationResult(null);
    setSelectedStudent(null);
    setNameQuery("");
    setDepartment("");
    setMeritRank("");
    setSelectedDistrict("");
    setOtp("");
    setOtpSent(false);
  };

  const handleSelectStudent = (student: SearchableRuetStudent) => {
    setSelectedStudent(student);
    setNameQuery(student.name);
    setDepartment("");
    setMeritRank("");
    setVerificationResult(null);
  };

  const handleSubmitVerification = async () => {
    if (!session?.user) {
      toast({
        title: "Login required",
        description: "Sign in with Google or phone before verifying.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedStudent) {
      toast({
        title: "Select your name",
        description: "Choose your name from the suggestion list first.",
        variant: "destructive",
      });
      return;
    }

    if (!department || !meritRank || !selectedDistrict) {
      toast({
        title: "Missing details",
        description: "Complete department, merit rank, and district before submitting.",
        variant: "destructive",
      });
      return;
    }

    if (department !== selectedStudent.department || Number(meritRank) !== selectedStudent.merit) {
      toast({
        title: "Information does not match",
        description: "Department or merit rank does not match the admission list entry you selected.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke("submit-verification", {
        body: {
          admissionRoll: selectedStudent.admission_roll,
          applicationId: selectedStudent.application_id,
          department: selectedStudent.department,
          district: selectedDistrict,
          meritRank: selectedStudent.merit,
          name: selectedStudent.name,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setVerificationResult(data.student as VerificationResult);
      toast({
        title: "Verification complete",
        description: "Your district has been saved and this admission profile is now locked.",
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Verification could not be completed.";

      toast({
        title: "Verification blocked",
        description: message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Card className="border-border/50">
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="space-y-2">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <UserCheck className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl">Verify your district</CardTitle>
                <CardDescription className="mt-1 max-w-xl">
                  Sign in first, choose your exact RUET admission record from the JSON list,
                  then confirm department, merit, and district.
                </CardDescription>
              </div>
            </div>

            {session ? (
              <div className="rounded-xl border border-border/60 bg-muted/30 px-4 py-3 text-sm">
                <div className="font-medium text-foreground">
                  Signed in with {authProvider === "google" ? "Google" : "phone"}
                </div>
                <div className="text-muted-foreground">{signedInAs ?? "Authenticated user"}</div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 h-8 px-2 text-xs"
                  onClick={handleSignOut}
                >
                  <LogOut className="mr-1 h-3.5 w-3.5" />
                  Sign out
                </Button>
              </div>
            ) : null}
          </div>

          <Alert>
            <ShieldCheck className="h-4 w-4" />
            <AlertTitle>Registration guardrails</AlertTitle>
            <AlertDescription>
              We allow a small number of verifications from the same connection to support shared
              Wi-Fi, but repeated registrations from one IP are blocked. If you are on shared
              hostel or campus internet, switching to another trusted network can help.
            </AlertDescription>
          </Alert>
        </CardHeader>
      </Card>

      {verificationResult ? (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex flex-col gap-4 py-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-primary">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-semibold">Verification completed</span>
              </div>
              <p className="text-sm text-foreground">
                <span className="font-semibold">{verificationResult.name}</span> is locked with{" "}
                <span className="font-semibold">{verificationResult.district}</span>.
              </p>
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                <Badge variant="secondary">{verificationResult.department}</Badge>
                <Badge variant="secondary">Merit #{verificationResult.merit_rank}</Badge>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-background/80 px-3 py-2 text-sm text-muted-foreground">
              <Lock className="h-4 w-4" />
              This record can no longer be changed
            </div>
          </CardContent>
        </Card>
      ) : null}

      {!session ? (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-xl">Step 1: Sign in</CardTitle>
            <CardDescription>
              Use Google or a phone number before submitting a district verification.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {authChecking ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Checking your session...
              </div>
            ) : (
              <Tabs defaultValue="google" className="space-y-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="google">Google</TabsTrigger>
                  <TabsTrigger value="phone">Phone OTP</TabsTrigger>
                </TabsList>

                <TabsContent value="google" className="space-y-4">
                  <div className="rounded-xl border border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground">
                    Google login is the fastest option for students who already have a Google account.
                  </div>
                  <Button onClick={handleGoogleSignIn} disabled={googleLoading} className="w-full">
                    {googleLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Chrome className="mr-2 h-4 w-4" />
                    )}
                    Continue with Google
                  </Button>
                </TabsContent>

                <TabsContent value="phone" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone number</Label>
                    <Input
                      id="phone"
                      placeholder="+8801XXXXXXXXX"
                      value={phoneNumber}
                      onChange={(event) => setPhoneNumber(event.target.value)}
                    />
                  </div>

                  {!otpSent ? (
                    <Button onClick={handleSendOtp} disabled={sendingOtp} className="w-full">
                      {sendingOtp ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Smartphone className="mr-2 h-4 w-4" />
                      )}
                      Send verification code
                    </Button>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Enter the 6-digit code</Label>
                        <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                          <InputOTPGroup>
                            <InputOTPSlot index={0} />
                            <InputOTPSlot index={1} />
                            <InputOTPSlot index={2} />
                            <InputOTPSlot index={3} />
                            <InputOTPSlot index={4} />
                            <InputOTPSlot index={5} />
                          </InputOTPGroup>
                        </InputOTP>
                      </div>
                      <Button
                        onClick={handleVerifyOtp}
                        disabled={verifyingOtp}
                        className="w-full"
                      >
                        {verifyingOtp ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <ShieldCheck className="mr-2 h-4 w-4" />
                        )}
                        Verify phone code
                      </Button>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      ) : null}

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-xl">Step 2: Match your RUET record</CardTitle>
          <CardDescription>
            Start with your name, then confirm department and merit rank from the published list.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="student-name">Student name</Label>
            <div className="relative">
              <Input
                id="student-name"
                placeholder="Type at least 2 letters of your name"
                value={nameQuery}
                onChange={(event) => {
                  setNameQuery(event.target.value);
                  setVerificationResult(null);
                  if (selectedStudent && event.target.value !== selectedStudent.name) {
                    setSelectedStudent(null);
                  }
                }}
                disabled={directoryLoading}
              />

              {!selectedStudent && suggestions.length > 0 ? (
                <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-20 overflow-hidden rounded-xl border border-border bg-popover shadow-xl">
                  {suggestions.map((student) => (
                    <button
                      key={`${student.admission_roll}-${student.application_id}`}
                      type="button"
                      className="flex w-full items-center justify-between gap-4 border-b border-border/60 px-4 py-3 text-left text-sm transition-colors last:border-b-0 hover:bg-accent/40"
                      onClick={() => handleSelectStudent(student)}
                    >
                      <div>
                        <div className="font-medium text-foreground">{student.name}</div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            <p className="text-xs text-muted-foreground">
              {directoryLoading
                ? "Loading the RUET JSON directory..."
                : "Suggestions are matched from the admission JSON and ranked by closest name match."}
            </p>
          </div>

          {selectedStudent ? (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-foreground">{selectedStudent.name}</div>
                </div>
              </div>
            </div>
          ) : null}

          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Department</Label>
              <Select value={department} onValueChange={setDepartment}>
                <SelectTrigger>
                  <SelectValue placeholder="Confirm your department" />
                </SelectTrigger>
                <SelectContent>
                  {availableDepartments.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="merit-rank">Merit rank</Label>
              <Input
                id="merit-rank"
                type="number"
                placeholder="Enter your merit position"
                value={meritRank}
                onChange={(event) => setMeritRank(event.target.value)}
              />
            </div>
          </div>

          {departmentMismatch || meritMismatch ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Entry mismatch</AlertTitle>
              <AlertDescription>
                The department or merit rank does not match the student record you selected.
              </AlertDescription>
            </Alert>
          ) : null}

          <div className="space-y-2">
            <Label>Home district</Label>
            <Select value={selectedDistrict} onValueChange={setSelectedDistrict}>
              <SelectTrigger>
                <SelectValue placeholder="Choose your district" />
              </SelectTrigger>
              <SelectContent>
                {DISTRICTS.map((district) => (
                  <SelectItem key={district.code} value={district.name}>
                    {district.name} ({district.division})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleSubmitVerification}
            disabled={!session || submitting || directoryLoading}
            className="w-full"
          >
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Confirm and lock district
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            Once verified, the district is locked so the analytics map stays trustworthy.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
