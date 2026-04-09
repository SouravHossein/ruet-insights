import { VerificationForm } from "@/components/VerificationForm";

export default function StudentVerification() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground">Student Verification</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Verify your home district to contribute to RUET geographic data
        </p>
      </div>
      <VerificationForm />
    </div>
  );
}
