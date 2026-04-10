import { useDeferredValue, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import {
  AlertCircle,
  CheckCircle2,
  Chrome,
  Loader2,
  Lock,
  MapPin,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { lovable } from "@/integrations/lovable/index";
import {
  type SearchableRuetStudent,
  loadRuetStudents,
  normalizeStudentName,
} from "@/lib/ruet-students";

const MAX_SUGGESTIONS = 8;

const normalizePhoneNumber = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("+")) return trimmed;
  if (trimmed.startsWith("88")) return `+${trimmed}`;
  if (trimmed.startsWith("01")) return `+88${trimmed}`;
  return trimmed;
};

export function VerificationModal() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
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
  const [verified, setVerified] = useState(false);
  const [verifiedDistrict, setVerifiedDistrict] = useState<string | null>(null);

  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Check session on mount
  useEffect(() => {
    let mounted = true;
    const hydrate = async () => {
      const { data: { session: s } } = await supabase.auth.getSession();
      if (!mounted) return;
      setSession(s);
      setAuthChecking(false);
    };
    hydrate();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setAuthChecking(false);
    });
    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);

  // Load student directory
  useEffect(() => {
    let cancelled = false;
    loadRuetStudents()
      .then((records) => { if (!cancelled) setDirectory(records); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setDirectoryLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // Check if user already verified (has a locked student record via IP)
  useEffect(() => {
    if (!session) return;
    // We just check if any student with this user's session is already locked
    // The actual check happens when they try to submit
  }, [session]);

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

  const meritMismatch = selectedStudent && meritRank ? Number(meritRank) !== selectedStudent.merit : false;
  const departmentMismatch = selectedStudent && department ? department !== selectedStudent.department : false;

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
        title: "Google sign-in failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
      setGoogleLoading(false);
    }
  };

  const handleSendOtp = async () => {
    const normalized = normalizePhoneNumber(phoneNumber);
    if (!normalized) {
      toast({ title: "Phone required", description: "Enter your phone number.", variant: "destructive" });
      return;
    }
    setSendingOtp(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({ phone: normalized });
      if (error) throw error;
      setPhoneNumber(normalized);
      setOtpSent(true);
      toast({ title: "Code sent", description: "Enter the 6-digit code sent to your phone." });
    } catch (error) {
      toast({ title: "OTP send failed", description: error instanceof Error ? error.message : "Please try again.", variant: "destructive" });
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      toast({ title: "Incomplete code", description: "Enter the full 6-digit code.", variant: "destructive" });
      return;
    }
    setVerifyingOtp(true);
    try {
      const { error } = await supabase.auth.verifyOtp({ phone: phoneNumber, token: otp, type: "sms" });
      if (error) throw error;
      setOtp("");
      toast({ title: "Signed in", description: "Phone verified." });
    } catch (error) {
      toast({ title: "Verification failed", description: error instanceof Error ? error.message : "Please try again.", variant: "destructive" });
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleSelectStudent = (student: SearchableRuetStudent) => {
    setSelectedStudent(student);
    setNameQuery(student.name);
    setDepartment("");
    setMeritRank("");
  };

  const handleSubmit = async () => {
    if (!session?.user) {
      toast({ title: "Login required", description: "Sign in first.", variant: "destructive" });
      return;
    }
    if (!selectedStudent || !department || !meritRank || !selectedDistrict) {
      toast({ title: "Missing details", description: "Complete all fields.", variant: "destructive" });
      return;
    }
    if (department !== selectedStudent.department || Number(meritRank) !== selectedStudent.merit) {
      toast({ title: "Information mismatch", description: "Department or merit rank does not match.", variant: "destructive" });
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

      setVerified(true);
      setVerifiedDistrict(selectedDistrict);
      toast({ title: "District saved!", description: `Locked to ${selectedDistrict}.` });
      // Close modal after short delay
      setTimeout(() => setOpen(false), 1500);
    } catch (error) {
      toast({
        title: "Could not save",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const buttonLabel = verified
    ? `✓ ${verifiedDistrict}`
    : "Add Your District";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant={verified ? "secondary" : "default"}
          size="sm"
          className="gap-2"
          disabled={verified}
        >
          <MapPin className="h-4 w-4" />
          {buttonLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Your District</DialogTitle>
          <DialogDescription>
            Sign in, find your name, confirm with department & merit rank, then select your home district.
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Auth */}
        {!session ? (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Step 1: Sign in</h3>
            {authChecking ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Checking session...
              </div>
            ) : (
              <Tabs defaultValue="google" className="space-y-3">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="google">Google</TabsTrigger>
                  <TabsTrigger value="phone">Phone OTP</TabsTrigger>
                </TabsList>
                <TabsContent value="google">
                  <Button onClick={handleGoogleSignIn} disabled={googleLoading} className="w-full">
                    {googleLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Chrome className="mr-2 h-4 w-4" />}
                    Continue with Google
                  </Button>
                </TabsContent>
                <TabsContent value="phone" className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="modal-phone">Phone number</Label>
                    <Input id="modal-phone" placeholder="+8801XXXXXXXXX" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
                  </div>
                  {!otpSent ? (
                    <Button onClick={handleSendOtp} disabled={sendingOtp} className="w-full">
                      {sendingOtp ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Smartphone className="mr-2 h-4 w-4" />}
                      Send verification code
                    </Button>
                  ) : (
                    <div className="space-y-3">
                      <Label>Enter 6-digit code</Label>
                      <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                        <InputOTPGroup>
                          {[0,1,2,3,4,5].map(i => <InputOTPSlot key={i} index={i} />)}
                        </InputOTPGroup>
                      </InputOTP>
                      <Button onClick={handleVerifyOtp} disabled={verifyingOtp} className="w-full">
                        {verifyingOtp ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                        Verify code
                      </Button>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </div>
        ) : (
          /* Step 2: Match record + select district */
          <div className="space-y-4">
            {verified ? (
              <div className="flex items-center gap-2 text-primary">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-semibold">District locked to {verifiedDistrict}</span>
                <Lock className="h-4 w-4 ml-auto text-muted-foreground" />
              </div>
            ) : (
              <>
                <h3 className="text-sm font-semibold text-foreground">Step 2: Find your record & select district</h3>

                {/* Name search */}
                <div className="space-y-2">
                  <Label htmlFor="modal-name">Your name</Label>
                  <div className="relative">
                    <Input
                      id="modal-name"
                      placeholder="Type at least 2 letters"
                      value={nameQuery}
                      onChange={(e) => {
                        setNameQuery(e.target.value);
                        if (selectedStudent && e.target.value !== selectedStudent.name) setSelectedStudent(null);
                      }}
                      disabled={directoryLoading}
                    />
                    {!selectedStudent && suggestions.length > 0 && (
                      <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 max-h-48 overflow-y-auto rounded-lg border border-border bg-popover shadow-xl">
                        {suggestions.map((s) => (
                          <button
                            key={`${s.admission_roll}-${s.application_id}`}
                            type="button"
                            className="flex w-full items-center px-3 py-2 text-left text-sm hover:bg-accent/40 border-b border-border/40 last:border-b-0"
                            onClick={() => handleSelectStudent(s)}
                          >
                            <span className="font-medium">{s.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {selectedStudent && (
                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm font-medium">
                    {selectedStudent.name}
                  </div>
                )}

                {/* Department + Merit */}
                <div className="grid gap-3 grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Department</Label>
                    <Select value={department} onValueChange={setDepartment}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {availableDepartments.map((d) => (
                          <SelectItem key={d} value={d}>{d}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="modal-merit">Merit rank</Label>
                    <Input id="modal-merit" type="number" placeholder="#" value={meritRank} onChange={(e) => setMeritRank(e.target.value)} />
                  </div>
                </div>

                {(departmentMismatch || meritMismatch) && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Mismatch</AlertTitle>
                    <AlertDescription>Department or merit rank doesn't match the selected record.</AlertDescription>
                  </Alert>
                )}

                {/* District */}
                <div className="space-y-1.5">
                  <Label>Home district</Label>
                  <Select value={selectedDistrict} onValueChange={setSelectedDistrict}>
                    <SelectTrigger><SelectValue placeholder="Choose your district" /></SelectTrigger>
                    <SelectContent>
                      {DISTRICTS.map((d) => (
                        <SelectItem key={d.code} value={d.name}>{d.name} ({d.division})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={handleSubmit} disabled={submitting || directoryLoading} className="w-full">
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Confirm & Lock District
                </Button>

                <p className="text-center text-xs text-muted-foreground">
                  Once submitted, your district is permanently locked.
                </p>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
