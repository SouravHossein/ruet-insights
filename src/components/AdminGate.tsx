import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Lock } from "lucide-react";

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || "admin123"; // Replace with your secure password or use environment variable
const SESSION_KEY = "ruet-admin-auth";

interface AdminGateProps {
  children: React.ReactNode;
}

export function AdminGate({ children }: AdminGateProps) {
  const [authenticated, setAuthenticated] = useState(
    () => sessionStorage.getItem(SESSION_KEY) === "true"
  );
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, "true");
      setAuthenticated(true);
      setError(false);
    } else {
      setError(true);
    }
  };

  if (authenticated) return <>{children}</>;

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Admin Access</CardTitle>
          <CardDescription>Enter the admin password to continue.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-pw">Password</Label>
              <Input
                id="admin-pw"
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(false); }}
                placeholder="Enter admin password"
                autoFocus
              />
              {error && <p className="text-sm text-destructive">Incorrect password.</p>}
            </div>
            <Button type="submit" className="w-full">Unlock</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
