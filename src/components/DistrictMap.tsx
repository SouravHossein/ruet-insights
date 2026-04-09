import { useMemo, useState } from "react";
import { MapPinned } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DISTRICTS } from "@/data/bangladesh-districts";
import {
  DISTRICT_COORDINATE_BOUNDS,
  getDistrictCoordinate,
} from "@/data/bangladesh-district-coordinates";
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

const MAP_IMAGE_URL =
  "https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/BD_Map_admin.svg/1024px-BD_Map_admin.svg.png";

const MAP_PADDING = {
  bottom: 7,
  left: 14,
  right: 10,
  top: 8,
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

  const plottedDistricts = useMemo(
    () =>
      DISTRICTS.map((district) => {
        const coordinate = getDistrictCoordinate(district.name);
        if (!coordinate) return null;

        const xRatio =
          (coordinate.lng - DISTRICT_COORDINATE_BOUNDS.minLng) /
          (DISTRICT_COORDINATE_BOUNDS.maxLng - DISTRICT_COORDINATE_BOUNDS.minLng);
        const yRatio =
          (DISTRICT_COORDINATE_BOUNDS.maxLat - coordinate.lat) /
          (DISTRICT_COORDINATE_BOUNDS.maxLat - DISTRICT_COORDINATE_BOUNDS.minLat);

        return {
          ...district,
          count: districtCounts[district.name] || 0,
          x:
            MAP_PADDING.left +
            xRatio * (100 - MAP_PADDING.left - MAP_PADDING.right),
          y:
            MAP_PADDING.top +
            yRatio * (100 - MAP_PADDING.top - MAP_PADDING.bottom),
        };
      }).filter(Boolean),
    [districtCounts],
  );

  const topDistricts = useMemo(
    () =>
      [...plottedDistricts]
        .sort((left, right) => right.count - left.count)
        .slice(0, 6),
    [plottedDistricts],
  );

  const getMarkerSize = (count: number) => {
    if (count === 0) return 10;
    return 12 + Math.round((count / maxCount) * 18);
  };

  const getMarkerClass = (count: number, isSelected: boolean) => {
    if (isSelected) {
      return "border-accent bg-accent text-accent-foreground shadow-lg shadow-accent/20";
    }
    if (count === 0) {
      return "border-border/80 bg-background/90 text-muted-foreground";
    }
    const intensity = count / maxCount;
    if (intensity < 0.2) return "border-primary/30 bg-primary/20 text-primary";
    if (intensity < 0.45) return "border-primary/40 bg-primary/40 text-primary-foreground";
    if (intensity < 0.7) return "border-primary/60 bg-primary/70 text-primary-foreground";
    return "border-primary bg-primary text-primary-foreground";
  };

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg font-bold">
          <MapPinned className="h-5 w-5 text-accent" />
          Bangladesh District Map
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Real district placement using public Bangladesh district coordinates
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_220px]">
          <div className="relative overflow-hidden rounded-[1.75rem] border border-border/60 bg-[radial-gradient(circle_at_top,_hsl(var(--cream))_0%,_hsl(var(--cream-dark))_100%)] aspect-[4/5]">
            <img
              src={MAP_IMAGE_URL}
              alt="Bangladesh administrative map"
              className="absolute inset-0 h-full w-full object-contain opacity-85"
            />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_transparent_35%,_hsl(var(--background)/0.35)_100%)]" />

            {plottedDistricts.map((district) => {
              const isHovered = hoveredDistrict === district.name;
              const isSelected = selectedDistrict === district.name;
              const markerSize = getMarkerSize(district.count);

              return (
                <Tooltip key={district.code}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => onDistrictClick?.(district.name)}
                      onMouseEnter={() => setHoveredDistrict(district.name)}
                      onMouseLeave={() => setHoveredDistrict(null)}
                      className={`absolute flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border text-[10px] font-bold transition-all ${getMarkerClass(district.count, isSelected)} ${isHovered ? "scale-110" : ""}`}
                      style={{
                        height: `${markerSize}px`,
                        left: `${district.x}%`,
                        top: `${district.y}%`,
                        width: `${markerSize}px`,
                      }}
                    >
                      {district.count > 0 ? district.code.slice(0, 1) : ""}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="font-semibold">{district.name}</p>
                    <p className="text-xs">
                      {district.count} student{district.count !== 1 ? "s" : ""}
                    </p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>

          <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
            <div className="mb-3 text-sm font-semibold text-foreground">Most represented</div>
            <div className="space-y-2">
              {topDistricts.map((district) => (
                <button
                  key={district.code}
                  type="button"
                  onClick={() => onDistrictClick?.(district.name)}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                    selectedDistrict === district.name
                      ? "bg-accent text-accent-foreground"
                      : "bg-background/80 hover:bg-background"
                  }`}
                >
                  <span>{district.name}</span>
                  <span className="text-xs font-semibold">{district.count}</span>
                </button>
              ))}
            </div>

            <div className="mt-5 text-xs text-muted-foreground">
              Marker size and color both scale with the number of verified students from each
              district.
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>Lower</span>
          <div className="flex gap-1">
            <div className="h-3 w-5 rounded-full border border-border bg-background" />
            <div className="h-3 w-5 rounded-full border border-primary/30 bg-primary/20" />
            <div className="h-3 w-5 rounded-full border border-primary/40 bg-primary/40" />
            <div className="h-3 w-5 rounded-full border border-primary/60 bg-primary/70" />
            <div className="h-3 w-5 rounded-full border border-primary bg-primary" />
          </div>
          <span>Higher</span>
        </div>
      </CardContent>
    </Card>
  );
}
