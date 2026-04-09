import { VerificationForm } from "@/components/VerificationForm";

export default function StudentVerification() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground">Student Verification</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Sign in, match your admission record from the RUET JSON list, and lock your home district
        </p>
      </div>
      <VerificationForm />
    </div>
  );
}
