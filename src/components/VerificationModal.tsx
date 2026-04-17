import { useDeferredValue, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { CheckCircle2, Chrome, Flame, Loader2, MapPin, Search, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
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
import { lovable } from "@/integrations/lovable/index";
import {
  type SearchableRuetStudent,
  loadRuetStudents,
  normalizeStudentName,
} from "@/lib/ruet-students";
import { cn } from "@/lib/utils";

const MAX_SUGGESTIONS = 8;

const normalizePhoneNumber = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("+")) return trimmed;
  if (trimmed.startsWith("88")) return `+${trimmed}`;
  if (trimmed.startsWith("01")) return `+88${trimmed}`;
  return trimmed;
};

type Step = "auth" | "search" | "confirm" | "district" | "done";

export function VerificationModal() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [authChecking, setAuthChecking] = useState(true);

  const [directory, setDirectory] = useState<SearchableRuetStudent[]>([]);
  const [directoryLoading, setDirectoryLoading] = useState(true);

  const [step, setStep] = useState<Step>("auth");
  const [nameQuery, setNameQuery] = useState("");
  const deferredNameQuery = useDeferredValue(nameQuery);
  const [selectedStudent, setSelectedStudent] = useState<SearchableRuetStudent | null>(null);
  const [department, setDepartment] = useState("");
  const [meritRank, setMeritRank] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [igniting, setIgniting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [verifiedDistrict, setVerifiedDistrict] = useState<string | null>(null);

  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Session
  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (!mounted) return;
      setSession(s);
      setAuthChecking(false);
      if (s) setStep((cur) => (cur === "auth" ? "search" : cur));
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setAuthChecking(false);
      if (s) setStep((cur) => (cur === "auth" ? "search" : cur));
    });
    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);

  // Directory
  useEffect(() => {
    let cancelled = false;
    loadRuetStudents()
      .then((records) => { if (!cancelled) setDirectory(records); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setDirectoryLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const availableDepartments = useMemo(
    () => Array.from(new Set(directory.map((s) => s.department))).sort(),
    [directory],
  );

  const searchTerm = normalizeStudentName(deferredNameQuery);
  const suggestions = useMemo(() => {
    if (!searchTerm || searchTerm.length < 2) return [];
    return directory
      .filter((s) => s.normalizedName.includes(searchTerm))
      .sort((a, b) => {
        const aStarts = a.normalizedName.startsWith(searchTerm) ? 0 : 1;
        const bStarts = b.normalizedName.startsWith(searchTerm) ? 0 : 1;
        if (aStarts !== bStarts) return aStarts - bStarts;
        return a.merit - b.merit;
      })
      .slice(0, MAX_SUGGESTIONS);
  }, [directory, searchTerm]);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) throw result.error;
      if (result.redirected) return;
    } catch (error) {
      toast({
        title: "Sign-in failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
      setGoogleLoading(false);
    }
  };

  const handleSendOtp = async () => {
    const normalized = normalizePhoneNumber(phoneNumber);
    if (!normalized) {
      toast({ title: "Enter a phone number", variant: "destructive" });
      return;
    }
    setSendingOtp(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({ phone: normalized });
      if (error) throw error;
      setPhoneNumber(normalized);
      setOtpSent(true);
    } catch (error) {
      toast({
        title: "Could not send code",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) return;
    setVerifyingOtp(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        phone: phoneNumber,
        token: otp,
        type: "sms",
      });
      if (error) throw error;
      setOtp("");
    } catch (error) {
      toast({
        title: "Invalid code",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleSelectStudent = (student: SearchableRuetStudent) => {
    setSelectedStudent(student);
    setNameQuery(student.name);
    setStep("confirm");
  };

  const handleConfirmIdentity = () => {
    if (!department || !meritRank) {
      toast({ title: "Fill in both fields", variant: "destructive" });
      return;
    }
    setStep("district");
  };

  const handleDistrictPick = (district: string) => {
    setSelectedDistrict(district);
    setIgniting(true);
    // Auto-submit after the burning animation gets going
    setTimeout(() => handleSubmit(district), 900);
  };

  const handleSubmit = async (district: string) => {
    if (!session?.user || !selectedStudent) return;
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("submit-verification", {
        body: {
          admissionRoll: selectedStudent.admission_roll,
          applicationId: selectedStudent.application_id,
          department,
          district,
          meritRank: Number(meritRank),
          name: selectedStudent.name,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setVerifiedDistrict(district);
      setStep("done");
      toast({
        title: "🔥 District locked!",
        description: `${selectedStudent.name} → ${district}`,
      });
      setTimeout(() => setOpen(false), 2200);
    } catch (error) {
      setIgniting(false);
      toast({
        title: "Could not save",
        description: error instanceof Error ? error.message : "Check your details and try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const buttonLabel = verifiedDistrict ? `🔥 ${verifiedDistrict}` : "Add Your District";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant={verifiedDistrict ? "secondary" : "default"}
          size="sm"
          className="gap-2"
          disabled={!!verifiedDistrict}
        >
          <MapPin className="h-4 w-4" />
          <span className="hidden sm:inline">{buttonLabel}</span>
          <span className="sm:hidden">{verifiedDistrict ? "✓" : "Add District"}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md p-0 gap-0 max-h-[100dvh] sm:max-h-[90vh] h-[100dvh] sm:h-auto rounded-none sm:rounded-lg overflow-hidden flex flex-col">
        <DialogTitle className="sr-only">Add Your District</DialogTitle>

        {/* Progress bar */}
        <div className="h-1 bg-muted">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{
              width:
                step === "auth" ? "20%"
                : step === "search" ? "40%"
                : step === "confirm" ? "60%"
                : step === "district" ? "85%"
                : "100%",
            }}
          />
        </div>

        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          {/* Step: Auth */}
          {step === "auth" && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold">Sign in</h2>
                <p className="text-sm text-muted-foreground mt-1">Choose one to continue</p>
              </div>

              {authChecking ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <Tabs defaultValue="google" className="space-y-4">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="google">Google</TabsTrigger>
                    <TabsTrigger value="phone">Phone</TabsTrigger>
                  </TabsList>
                  <TabsContent value="google">
                    <Button
                      onClick={handleGoogleSignIn}
                      disabled={googleLoading}
                      size="lg"
                      className="w-full"
                    >
                      {googleLoading
                        ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        : <Chrome className="mr-2 h-4 w-4" />}
                      Continue with Google
                    </Button>
                  </TabsContent>
                  <TabsContent value="phone" className="space-y-3">
                    {!otpSent ? (
                      <>
                        <Input
                          placeholder="+8801XXXXXXXXX"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          inputMode="tel"
                          autoComplete="tel"
                          className="h-12 text-base"
                        />
                        <Button
                          onClick={handleSendOtp}
                          disabled={sendingOtp}
                          size="lg"
                          className="w-full"
                        >
                          {sendingOtp
                            ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            : <Smartphone className="mr-2 h-4 w-4" />}
                          Send code
                        </Button>
                      </>
                    ) : (
                      <>
                        <p className="text-sm text-muted-foreground text-center">
                          Code sent to {phoneNumber}
                        </p>
                        <div className="flex justify-center">
                          <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                            <InputOTPGroup>
                              {[0,1,2,3,4,5].map((i) => <InputOTPSlot key={i} index={i} />)}
                            </InputOTPGroup>
                          </InputOTP>
                        </div>
                        <Button
                          onClick={handleVerifyOtp}
                          disabled={verifyingOtp || otp.length !== 6}
                          size="lg"
                          className="w-full"
                        >
                          {verifyingOtp && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Verify
                        </Button>
                        <button
                          type="button"
                          onClick={() => { setOtpSent(false); setOtp(""); }}
                          className="text-xs text-muted-foreground underline w-full text-center"
                        >
                          Use a different number
                        </button>
                      </>
                    )}
                  </TabsContent>
                </Tabs>
              )}
            </div>
          )}

          {/* Step: Search name */}
          {step === "search" && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold">Find your name</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Search the RUET admission list
                </p>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  autoFocus
                  placeholder="Type your name..."
                  value={nameQuery}
                  onChange={(e) => setNameQuery(e.target.value)}
                  disabled={directoryLoading}
                  className="h-12 pl-10 text-base"
                />
              </div>

              <div className="space-y-1.5 max-h-[50vh] overflow-y-auto -mx-1">
                {directoryLoading && (
                  <div className="flex justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                )}
                {!directoryLoading && suggestions.length === 0 && nameQuery.length >= 2 && (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    No results. Keep typing.
                  </p>
                )}
                {suggestions.map((s) => (
                  <button
                    key={`${s.admission_roll}-${s.application_id}`}
                    type="button"
                    onClick={() => handleSelectStudent(s)}
                    className="w-full text-left rounded-lg border border-border bg-card hover:bg-accent/30 active:bg-accent/50 transition-colors p-3 mx-1"
                  >
                    <div className="font-medium">{s.name}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step: Confirm identity */}
          {step === "confirm" && selectedStudent && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold">Confirm it's you</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Enter your department and merit rank
                </p>
              </div>

              <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 text-sm font-medium">
                {selectedStudent.name}
              </div>

              <div className="space-y-3">
                <Select value={department} onValueChange={setDepartment}>
                  <SelectTrigger className="h-12 text-base">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableDepartments.map((d) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Input
                  type="number"
                  inputMode="numeric"
                  placeholder="Merit rank"
                  value={meritRank}
                  onChange={(e) => setMeritRank(e.target.value)}
                  className="h-12 text-base"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => { setStep("search"); setSelectedStudent(null); setNameQuery(""); }}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button onClick={handleConfirmIdentity} className="flex-1">
                  Next
                </Button>
              </div>
            </div>
          )}

          {/* Step: District (gamified) */}
          {step === "district" && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Flame className="h-5 w-5 text-accent" />
                  Light up your district
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Tap to ignite — this locks permanently
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {DISTRICTS.map((d) => {
                  const burning = selectedDistrict === d.name && igniting;
                  return (
                    <button
                      key={d.code}
                      type="button"
                      disabled={igniting || submitting}
                      onClick={() => handleDistrictPick(d.name)}
                      className={cn(
                        "rounded-lg border-2 border-border bg-card p-3 text-sm font-medium transition-all",
                        "hover:border-accent hover:bg-accent/10 active:scale-95",
                        "disabled:opacity-40 disabled:cursor-not-allowed",
                        burning && "district-burning bg-accent/20 border-accent disabled:opacity-100",
                      )}
                    >
                      {d.name}
                    </button>
                  );
                })}
              </div>

              {(igniting || submitting) && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground pt-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Locking your district...
                </div>
              )}
            </div>
          )}

          {/* Step: Done */}
          {step === "done" && verifiedDistrict && (
            <div className="flex flex-col items-center justify-center py-10 space-y-4 text-center">
              <div className="relative">
                <Flame className="h-20 w-20 text-accent animate-pulse" />
                <CheckCircle2 className="h-8 w-8 text-primary absolute -bottom-1 -right-1 bg-background rounded-full" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{verifiedDistrict}</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Locked to your record forever 🔥
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
