import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, BarChart3 } from "lucide-react";

interface InsightsPanelProps {
  districtCounts: Record<string, number>;
  departmentCounts: Record<string, number>;
}

export function InsightsPanel({
  districtCounts,
  departmentCounts,
}: InsightsPanelProps) {
  const sortedDistricts = Object.entries(districtCounts)
    .sort(([, a], [, b]) => b - a)
    .filter(([, count]) => count > 0);

  const topDistricts = sortedDistricts.slice(0, 8);
  const underrepresented = Object.entries(districtCounts)
    .filter(([, count]) => count <= 2)
    .sort(([, a], [, b]) => a - b)
    .slice(0, 5);

  const sortedDepts = Object.entries(departmentCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8);

  const totalStudents = Object.values(districtCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-4">
      {/* Top Districts */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-accent" />
            Top Districts
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {topDistricts.length === 0 ? (
            <p className="text-xs text-muted-foreground">No data yet</p>
          ) : (
            topDistricts.map(([name, count], i) => {
              const percent = totalStudents > 0 ? (count / totalStudents) * 100 : 0;
              return (
                <div key={name} className="flex items-center gap-2">
                  <span className="text-xs font-bold text-accent w-5">
                    #{i + 1}
                  </span>
                  <span className="text-xs font-medium flex-1 text-foreground">
                    {name}
                  </span>
                  <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <Badge variant="secondary" className="text-[10px] px-1.5">
                    {count}
                  </Badge>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Department Distribution */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            By Department
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {sortedDepts.length === 0 ? (
            <p className="text-xs text-muted-foreground">No data yet</p>
          ) : (
            sortedDepts.map(([name, count]) => {
              const percent = totalStudents > 0 ? (count / totalStudents) * 100 : 0;
              // Abbreviate dept name
              const abbr = name
                .replace("Engineering", "Engg.")
                .replace("Computer Science & ", "CS")
                .replace("Electrical & Electronic ", "EE")
                .replace("Electronics & Telecommunication ", "ETE ")
                .replace("Information & Communication Technology", "ICT")
                .replace("Industrial & Production ", "IP")
                .replace("Materials Science & ", "MSE ")
                .replace("Mechanical ", "ME ")
                .replace("Mechatronics ", "MCT ")
                .replace("Mining ", "Min. ")
                .replace("Glass & Ceramic ", "GCE ")
                .replace("Chemical ", "ChE ")
                .replace("Civil ", "CE ")
                .replace("Urban & Regional Planning", "URP")
                .replace("Bechelors of Urban and Regional Planning", "BURP")
                .replace("Architecture", "Arch.");

              return (
                <div key={name} className="flex items-center gap-2">
                  <span className="text-xs font-medium flex-1 text-foreground truncate" title={name}>
                    {abbr}
                  </span>
                  <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-secondary rounded-full"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground w-6 text-right">
                    {count}
                  </span>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Underrepresented */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-destructive" />
            Underrepresented
          </CardTitle>
        </CardHeader>
        <CardContent>
          {underrepresented.length === 0 ? (
            <p className="text-xs text-muted-foreground">No data yet</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {underrepresented.map(([name, count]) => (
                <Badge key={name} variant="outline" className="text-[10px]">
                  {name}: {count}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
