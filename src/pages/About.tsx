import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, Shield, Info } from "lucide-react";

export default function About() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary">
          <GraduationCap className="h-8 w-8 text-primary-foreground" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">
          RUET Student Intelligence Dashboard
        </h2>
        <p className="text-sm text-muted-foreground mt-2">
          An analytics platform for RUET admission data
        </p>
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Info className="h-5 w-5 text-accent" />
            About This Platform
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-3">
          <p>
            The RUET Student Intelligence Dashboard transforms raw admission data
            into actionable geographic and demographic insights. Students can
            verify their home districts, and the platform visualizes the
            distribution of students across Bangladesh.
          </p>
          <p>
            Features include a district-level heatmap, department analytics,
            merit-based filtering, and a student verification portal with
            one-time locking mechanism.
          </p>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Privacy & Disclaimer
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-3">
          <p>
            <strong>Unofficial academic analytics platform.</strong> No personal
            data is shared publicly. Only aggregated statistics are displayed on
            public views.
          </p>
          <p>
            Student names and admission rolls are never exposed in public
            dashboards. Verified data is locked after submission and cannot be
            modified.
          </p>
          <p className="text-xs text-muted-foreground/70">
            This platform is not affiliated with or endorsed by RUET
            administration. It is a community-driven data analytics tool.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
