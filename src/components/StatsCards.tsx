import { Card, CardContent } from "@/components/ui/card";
import { Users, CheckCircle, MapPin, Award } from "lucide-react";

interface StatsCardsProps {
  totalStudents: number;
  verifiedCount: number;
  topDistrict: string;
  topDepartment: string;
}

export function StatsCards({
  totalStudents,
  verifiedCount,
  topDistrict,
  topDepartment,
}: StatsCardsProps) {
  const verifiedPercent =
    totalStudents > 0 ? Math.round((verifiedCount / totalStudents) * 100) : 0;

  const stats = [
    {
      label: "Total Students",
      value: totalStudents.toLocaleString(),
      icon: Users,
      accent: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Verified",
      value: `${verifiedPercent}%`,
      subtitle: `${verifiedCount} students`,
      icon: CheckCircle,
      accent: "text-secondary",
      bg: "bg-secondary/10",
    },
    {
      label: "Top District",
      value: topDistrict || "—",
      icon: MapPin,
      accent: "text-accent",
      bg: "bg-accent/10",
    },
    {
      label: "Top Department",
      value: topDepartment || "—",
      icon: Award,
      accent: "text-primary",
      bg: "bg-primary/10",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label} className="border-border/50">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {stat.label}
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {stat.value}
                </p>
                {stat.subtitle && (
                  <p className="text-xs text-muted-foreground">
                    {stat.subtitle}
                  </p>
                )}
              </div>
              <div className={`rounded-lg p-2.5 ${stat.bg}`}>
                <stat.icon className={`h-5 w-5 ${stat.accent}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
