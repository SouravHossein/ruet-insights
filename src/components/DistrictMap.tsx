import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DISTRICTS } from "@/data/bangladesh-districts";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface DistrictMapProps {
  districtCounts: Record<string, number>;
  onDistrictClick?: (district: string) => void;
  selectedDistrict?: string | null;
}

// Division-based grid layout for Bangladesh districts
const DIVISION_LAYOUT: Record<string, { row: number; col: number }> = {
  Rangpur: { row: 0, col: 1 },
  Rajshahi: { row: 1, col: 0 },
  Mymensingh: { row: 1, col: 2 },
  Sylhet: { row: 1, col: 3 },
  Dhaka: { row: 2, col: 1 },
  Khulna: { row: 3, col: 0 },
  Chattogram: { row: 2, col: 3 },
  Barishal: { row: 3, col: 1 },
};

export function DistrictMap({
  districtCounts,
  onDistrictClick,
  selectedDistrict,
}: DistrictMapProps) {
  const [hoveredDistrict, setHoveredDistrict] = useState<string | null>(null);

  const maxCount = useMemo(() => {
    const values = Object.values(districtCounts);
    return values.length > 0 ? Math.max(...values) : 1;
  }, [districtCounts]);

  const getColor = (count: number) => {
    if (count === 0) return "bg-cream-dark";
    const intensity = count / maxCount;
    if (intensity < 0.2) return "bg-emerald-mid/20";
    if (intensity < 0.4) return "bg-emerald-mid/40";
    if (intensity < 0.6) return "bg-emerald-mid/60";
    if (intensity < 0.8) return "bg-emerald-mid/80";
    return "bg-primary";
  };

  const getTextColor = (count: number) => {
    if (count === 0) return "text-muted-foreground";
    const intensity = count / maxCount;
    if (intensity >= 0.6) return "text-primary-foreground";
    return "text-foreground";
  };

  // Group districts by division
  const districtsByDivision = useMemo(() => {
    const grouped: Record<string, typeof DISTRICTS> = {};
    DISTRICTS.forEach((d) => {
      if (!grouped[d.division]) grouped[d.division] = [];
      grouped[d.division].push(d);
    });
    return grouped;
  }, []);

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-bold">
          Bangladesh District Heatmap
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Student distribution by district (grouped by division)
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-3">
          {Object.entries(DIVISION_LAYOUT).map(([division, pos]) => (
            <div
              key={division}
              className="space-y-1.5"
              style={{
                gridRow: pos.row + 1,
                gridColumn: pos.col + 1,
              }}
            >
              <h4 className="text-xs font-semibold text-accent uppercase tracking-wider">
                {division}
              </h4>
              <div className="flex flex-wrap gap-1">
                {(districtsByDivision[division] || []).map((district) => {
                  const count = districtCounts[district.name] || 0;
                  const isSelected = selectedDistrict === district.name;
                  const isHovered = hoveredDistrict === district.name;

                  return (
                    <Tooltip key={district.code}>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => onDistrictClick?.(district.name)}
                          onMouseEnter={() =>
                            setHoveredDistrict(district.name)
                          }
                          onMouseLeave={() => setHoveredDistrict(null)}
                          className={`
                            rounded-md px-1.5 py-1 text-[10px] font-medium transition-all cursor-pointer
                            ${getColor(count)} ${getTextColor(count)}
                            ${isSelected ? "ring-2 ring-accent ring-offset-1" : ""}
                            ${isHovered ? "scale-110 shadow-md" : ""}
                          `}
                        >
                          {district.code}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="font-semibold">{district.name}</p>
                        <p className="text-xs">
                          {count} student{count !== 1 ? "s" : ""}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
          <span>Less</span>
          <div className="flex gap-0.5">
            <div className="h-3 w-6 rounded-sm bg-cream-dark" />
            <div className="h-3 w-6 rounded-sm bg-emerald-mid/20" />
            <div className="h-3 w-6 rounded-sm bg-emerald-mid/40" />
            <div className="h-3 w-6 rounded-sm bg-emerald-mid/60" />
            <div className="h-3 w-6 rounded-sm bg-emerald-mid/80" />
            <div className="h-3 w-6 rounded-sm bg-primary" />
          </div>
          <span>More</span>
        </div>
      </CardContent>
    </Card>
  );
}
