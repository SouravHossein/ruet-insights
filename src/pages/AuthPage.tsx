import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Chrome, Loader2, LogOut, ShieldCheck, Smartphone } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuthStatus } from "@/hooks/use-auth-status";
import { supabase } from "@/integrations/supabase/client";
import {
  buildOAuthRedirectUrl,
  getMaskedContact,
  normalizePhoneNumber,
} from "@/lib/auth";

export default function AuthPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { session, aal, nextLevel, loading, redirectToNext } = useAuthStatus();

  const [googleLoading, setGoogleLoading] = useState(false);
  const [factorLoading, setFactorLoading] = useState(false);
  const [sendLoading, setSendLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [signOutLoading, setSignOutLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [verifiedPhoneFactorId, setVerifiedPhoneFactorId] = useState<string | null>(null);

  const nextPath = useMemo(
    () => redirectToNext(searchParams.get("next")),
    [redirectToNext, searchParams],
  );

  useEffect(() => {
    if (!loading && session && aal === "aal2") {
      navigate(nextPath, { replace: true });
    }
  }, [aal, loading, navigate, nextPath, session]);

  useEffect(() => {
    let cancelled = false;

    const loadFactors = async () => {
      if (!session || aal === "aal2") {
        setVerifiedPhoneFactorId(null);
        return;
      }

      setFactorLoading(true);

      try {
        const { data, error } = await supabase.auth.mfa.listFactors();
        if (error) throw error;

        if (!cancelled) {
          setVerifiedPhoneFactorId(data?.phone[0]?.id ?? null);
        }
      } catch (error) {
        if (!cancelled) {
          toast({
            title: "Unable to load MFA setup",
            description: error instanceof Error ? error.message : "Please try again.",
            variant: "destructive",
          });
        }
      } finally {
        if (!cancelled) {
          setFactorLoading(false);
        }
      }
    };

    void loadFactors();

    return () => {
      cancelled = true;
    };
  }, [aal, session, toast]);

  const signedInAs = getMaskedContact(session?.user?.email ?? session?.user?.phone);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: buildOAuthRedirectUrl(nextPath),
        },
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

  const handleSendCode = async () => {
    const normalizedPhone = normalizePhoneNumber(phoneNumber);

    if (!verifiedPhoneFactorId && !normalizedPhone) {
      toast({
        title: "Phone number required",
        description: "Enter your phone number in international format before requesting the code.",
        variant: "destructive",
      });
      return;
    }

    setSendLoading(true);

    try {
      let activeFactorId = verifiedPhoneFactorId;

      if (!activeFactorId) {
        const { data, error } = await supabase.auth.mfa.enroll({
          factorType: "phone",
          phone: normalizedPhone,
          friendlyName: "RUET district verification",
        });

        if (error) throw error;
        activeFactorId = data.id;
        setPhoneNumber(data.phone);
      }

      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: activeFactorId,
        channel: "sms",
      });

      if (challengeError) throw challengeError;

      setFactorId(activeFactorId);
      setChallengeId(challenge.id);
      toast({
        title: "Verification code sent",
        description: "Enter the 6-digit SMS code to finish the second factor.",
      });
    } catch (error) {
      toast({
        title: "Could not start phone verification",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSendLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!factorId || !challengeId) {
      toast({
        title: "Code not started",
        description: "Request a verification code first.",
        variant: "destructive",
      });
      return;
    }

    if (otp.length !== 6) {
      toast({
        title: "Incomplete code",
        description: "Enter the full 6-digit verification code.",
        variant: "destructive",
      });
      return;
    }

    setVerifyLoading(true);

    try {
      const { error } = await supabase.auth.mfa.verify({
        factorId,
        challengeId,
        code: otp,
      });

      if (error) throw error;

      setOtp("");
      toast({
        title: "Second factor verified",
        description: "Redirecting you to district verification.",
      });
    } catch (error) {
      toast({
        title: "Code verification failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleSignOut = async () => {
    setSignOutLoading(true);
    await supabase.auth.signOut();
    setPhoneNumber("");
    setOtp("");
    setChallengeId(null);
    setFactorId(null);
    setVerifiedPhoneFactorId(null);
    setSignOutLoading(false);
  };

  return (
    <div className="min-h-screen bg-background px-4 py-8 md:px-6">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">District Verification Login</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Sign in with Google, complete phone MFA, then continue to the Bangladesh district map.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link to="/">Back to analytics</Link>
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle>Authentication</CardTitle>
              <CardDescription>
                Google is the first factor. Phone verification is the required second factor.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {loading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Checking your session...
                </div>
              ) : null}

              {!loading && !session ? (
                <div className="space-y-4">
                  <Alert>
                    <ShieldCheck className="h-4 w-4" />
                    <AlertTitle>Before you continue</AlertTitle>
                    <AlertDescription>
                      You will return here after Google sign-in, then finish phone-based MFA before
                      you can verify a district.
                    </AlertDescription>
                  </Alert>

                  <Button onClick={handleGoogleSignIn} disabled={googleLoading} className="w-full">
                    {googleLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Chrome className="mr-2 h-4 w-4" />
                    )}
                    Continue with Google
                  </Button>
                </div>
              ) : null}

              {!loading && session ? (
                <div className="space-y-5">
                  <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-medium text-foreground">Signed in</div>
                        <div className="text-sm text-muted-foreground">
                          {signedInAs ?? "Authenticated student"}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={aal === "aal2" ? "default" : "secondary"}>
                          {aal === "aal2" ? "AAL2 ready" : "AAL1 session"}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleSignOut}
                          disabled={signOutLoading}
                        >
                          {signOutLoading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <LogOut className="mr-2 h-4 w-4" />
                          )}
                          Sign out
                        </Button>
                      </div>
                    </div>
                  </div>

                  {aal !== "aal2" ? (
                    <div className="space-y-4">
                      <Alert>
                        <Smartphone className="h-4 w-4" />
                        <AlertTitle>Phone MFA required</AlertTitle>
                        <AlertDescription>
                          {nextLevel === "aal2"
                            ? "A verified phone factor already exists for this account. Request a fresh SMS code to continue."
                            : "Add a phone factor and verify it to promote this session to AAL2."}
                        </AlertDescription>
                      </Alert>

                      {!verifiedPhoneFactorId ? (
                        <div className="space-y-2">
                          <Label htmlFor="auth-phone">Phone number</Label>
                          <Input
                            id="auth-phone"
                            placeholder="+8801XXXXXXXXX"
                            value={phoneNumber}
                            onChange={(event) => setPhoneNumber(event.target.value)}
                            disabled={factorLoading || sendLoading}
                          />
                        </div>
                      ) : null}

                      <Button
                        onClick={handleSendCode}
                        disabled={factorLoading || sendLoading}
                        className="w-full"
                      >
                        {factorLoading || sendLoading ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Smartphone className="mr-2 h-4 w-4" />
                        )}
                        {verifiedPhoneFactorId ? "Send login code" : "Enroll phone and send code"}
                      </Button>

                      {challengeId ? (
                        <div className="space-y-3 rounded-2xl border border-border/60 p-4">
                          <div className="space-y-1">
                            <Label>Enter the 6-digit SMS code</Label>
                            <p className="text-xs text-muted-foreground">
                              The code upgrades this session to AAL2 and unlocks the district map.
                            </p>
                          </div>

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

                          <Button onClick={handleVerifyCode} disabled={verifyLoading} className="w-full">
                            {verifyLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Verify code
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 text-sm text-foreground">
                      MFA is already complete for this session. Redirecting you to district verification.
                    </div>
                  )}
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader>
              <CardTitle>What happens next</CardTitle>
              <CardDescription>After authentication you will land on the new verification flow.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
                1. Search the student directory from the `students` table.
              </div>
              <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
                2. Confirm your department and merit rank.
              </div>
              <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
                3. Select your district directly on the Bangladesh map and lock it.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
