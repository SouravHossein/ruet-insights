import { Link } from "react-router-dom";
import { Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStatus } from "@/hooks/use-auth-status";

export function VerifyDistrictButton() {
  const { loading, session, aal } = useAuthStatus();

  const href = session && aal === "aal2" ? "/verify" : "/auth";

  return (
    <Button asChild size="sm" className="gap-2">
      <Link to={href}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
        Verify District
      </Link>
    </Button>
  );
}
