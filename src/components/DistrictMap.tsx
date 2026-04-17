'use client';

import { useEffect, useMemo, useState } from "react";
import { BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  canonicalizeDistrictName,
  loadDistrictFeatureCollection,
  type DistrictFeature,
  type DistrictFeatureCollection,
} from "@/lib/district-geo";

interface DistrictMapProps {
  districtCounts: Record<string, number>;
  mode?: "analytics" | "picker";
  onDistrictClick?: (district: string) => void;
  selectedDistrict?: string | null;
  successDistrict?: string | null;
}

interface HeatmapDistrict {
  count: number;
  division: string;
  isHovered: boolean;
  isSelected: boolean;
  isSuccess: boolean;
  label: string | null;
  name: string;
  path: string;
  x: number;
  y: number;
}

const SVG_WIDTH = 520;
const SVG_HEIGHT = 620;
const SVG_PADDING = 20;
const MAP_BOUNDS = {
  minLat: 20.6,
  maxLat: 26.7,
  minLng: 88.0,
  maxLng: 92.7,
};

const HEAT_COLORS = [
  "#f6efe3",
  "#ecd8ae",
  "#e4b36f",
  "#da863d",
  "#ca5d23",
  "#a53d1b",
];

export function DistrictMap({
  districtCounts,
  mode = "analytics",
  onDistrictClick,
  selectedDistrict,
  successDistrict,
}: DistrictMapProps) {
  const [districtGeoJson, setDistrictGeoJson] = useState<DistrictFeatureCollection | null>(null);
  const [hoveredDistrict, setHoveredDistrict] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      try {
        const collection = await loadDistrictFeatureCollection();
        if (!cancelled) {
          setDistrictGeoJson(collection);
          setLoadError(null);
        }
      } catch (error) {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : "Unable to load district map.");
        }
      }
    };

    void loadData();

    return () => {
      cancelled = true;
    };
  }, []);

  const maxCount = useMemo(() => {
    const values = Object.values(districtCounts);
    return values.length > 0 ? Math.max(...values) : 0;
  }, [districtCounts]);

  const totalVerified = useMemo(
    () => Object.values(districtCounts).reduce((sum, count) => sum + count, 0),
    [districtCounts],
  );

  const getDistrictFill = (count: number, isSelected: boolean, isSuccess: boolean) => {
    if (isSuccess) return "#f04a17";
    if (isSelected) return "#fff0c7";
    if (count <= 0 || maxCount <= 0) return "#f3eee4";

    const ratio = Math.log(count + 1) / Math.log(maxCount + 1);
    const colorIndex = Math.min(
      HEAT_COLORS.length - 1,
      Math.max(0, Math.floor(ratio * HEAT_COLORS.length)),
    );

    return HEAT_COLORS[colorIndex];
  };

  const projectPoint = ([lng, lat]: [number, number]) => {
    const x =
      SVG_PADDING +
      ((lng - MAP_BOUNDS.minLng) / (MAP_BOUNDS.maxLng - MAP_BOUNDS.minLng)) *
        (SVG_WIDTH - SVG_PADDING * 2);
    const y =
      SVG_HEIGHT -
      SVG_PADDING -
      ((lat - MAP_BOUNDS.minLat) / (MAP_BOUNDS.maxLat - MAP_BOUNDS.minLat)) *
        (SVG_HEIGHT - SVG_PADDING * 2);

    return [x, y] as const;
  };

  const ringToPath = (ring: [number, number][]) =>
    `${ring
      .map((point, index) => {
        const [x, y] = projectPoint(point);
        return `${index === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
      })
      .join(" ")} Z`;

  const centroid = (feature: DistrictFeature) => {
    const ring =
      feature.geometry.type === "Polygon"
        ? feature.geometry.coordinates[0]
        : feature.geometry.coordinates[0][0];

    let totalX = 0;
    let totalY = 0;

    ring.forEach((point) => {
      const [x, y] = projectPoint(point);
      totalX += x;
      totalY += y;
    });

    return {
      x: totalX / ring.length,
      y: totalY / ring.length,
    };
  };

  const districts = useMemo<HeatmapDistrict[]>(() => {
    if (!districtGeoJson) return [];

    return districtGeoJson.features.map((feature) => {
      const name = canonicalizeDistrictName(feature.properties.name);
      const count = districtCounts[name] ?? 0;
      const isSelected = selectedDistrict === name;
      const isHovered = hoveredDistrict === name;
      const isSuccess = successDistrict === name;
      const center = centroid(feature);
      const path =
        feature.geometry.type === "Polygon"
          ? ringToPath(feature.geometry.coordinates[0])
          : feature.geometry.coordinates.map((polygon) => ringToPath(polygon[0])).join(" ");

      return {
        count,
        division: feature.properties.division,
        isHovered,
        isSelected,
        isSuccess,
        label: count >= Math.max(8, Math.ceil(maxCount * 0.2)) ? name : null,
        name,
        path,
        x: center.x,
        y: center.y,
      };
    });
  }, [districtGeoJson, districtCounts, hoveredDistrict, maxCount, selectedDistrict, successDistrict]);

  const topDistricts = useMemo(
    () =>
      Object.entries(districtCounts)
        .filter(([, count]) => count > 0)
        .sort((left, right) => right[1] - left[1])
        .slice(0, 12),
    [districtCounts],
  );

  const activeDistrict = useMemo(() => {
    if (hoveredDistrict) {
      return districts.find((district) => district.name === hoveredDistrict) ?? null;
    }

    if (selectedDistrict) {
      return districts.find((district) => district.name === selectedDistrict) ?? null;
    }

    return topDistricts.length > 0
      ? districts.find((district) => district.name === topDistricts[0][0]) ?? null
      : null;
  }, [districts, hoveredDistrict, selectedDistrict, topDistricts]);

  const mapDescription =
    mode === "picker"
      ? "Select your district from a compact SVG heatmap instead of a full interactive map."
      : "District heatmap of verified RUET students across Bangladesh.";

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg font-bold">
          <BarChart3 className="h-5 w-5 text-accent" />
          Bangladesh District Heatmap
        </CardTitle>
        <p className="text-xs text-muted-foreground">{mapDescription}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_260px]">
          <div className="relative overflow-hidden rounded-[1.75rem] border border-border/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.55),rgba(241,233,220,0.75))] p-4">
            {loadError ? (
              <div className="flex aspect-[5/6] items-center justify-center px-6 text-center text-sm text-destructive">
                {loadError}
              </div>
            ) : !districtGeoJson ? (
              <div className="flex aspect-[5/6] items-center justify-center text-sm text-muted-foreground">
                Projecting district outlines...
              </div>
            ) : (
              <svg
                viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
                className="mx-auto block aspect-[5/6] w-full max-w-[540px]"
                role="img"
                aria-label="Bangladesh district heatmap"
              >
                {districts.map((district) => (
                  <path
                    key={district.name}
                    d={district.path}
                    fill={getDistrictFill(district.count, district.isSelected, district.isSuccess)}
                    stroke={district.isHovered ? "#7c2d12" : district.isSelected ? "#9a3412" : "#d9c6ac"}
                    strokeWidth={district.isSelected || district.isHovered ? 2 : 0.9}
                    style={{
                      cursor: mode === "picker" || onDistrictClick ? "pointer" : "default",
                      filter: district.isSuccess
                        ? "drop-shadow(0 0 12px rgba(240, 74, 23, 0.45))"
                        : district.isSelected
                          ? "drop-shadow(0 0 10px rgba(217, 119, 6, 0.22))"
                          : district.isHovered
                            ? "brightness(1.03)"
                            : "none",
                      transition: "fill 160ms ease, stroke 160ms ease, stroke-width 160ms ease, filter 160ms ease",
                    }}
                    onClick={() => onDistrictClick?.(district.name)}
                    onMouseEnter={() => setHoveredDistrict(district.name)}
                    onMouseLeave={() => setHoveredDistrict((current) => (current === district.name ? null : current))}
                  />
                ))}

                {districts
                  .filter((district) => district.label)
                  .map((district) => (
                    <text
                      key={`${district.name}-label`}
                      x={district.x}
                      y={district.y}
                      textAnchor="middle"
                      fontSize={district.count > 50 ? 10 : 8}
                      fill={district.count > 25 ? "#fffdf7" : "#7c2d12"}
                      fontWeight={700}
                      pointerEvents="none"
                      style={{ letterSpacing: "0.04em" }}
                    >
                      {district.label!.length > 10 ? `${district.label!.slice(0, 9)}.` : district.label}
                    </text>
                  ))}
              </svg>
            )}
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
              <div className="mb-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Active district
              </div>
              {activeDistrict ? (
                <>
                  <div className="text-lg font-semibold text-foreground">{activeDistrict.name}</div>
                  <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                    {activeDistrict.division} division
                  </div>
                  <div className="mt-4 text-3xl font-bold text-accent">{activeDistrict.count}</div>
                  <div className="text-xs text-muted-foreground">
                    verified student{activeDistrict.count === 1 ? "" : "s"}
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-background/70">
                    <div
                      className="h-full rounded-full bg-accent transition-all"
                      style={{
                        width:
                          maxCount > 0 ? `${Math.max(6, (activeDistrict.count / maxCount) * 100)}%` : "0%",
                      }}
                    />
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    {totalVerified > 0
                      ? `${((activeDistrict.count / totalVerified) * 100).toFixed(1)}% of verified total`
                      : "No verified data yet"}
                  </div>
                </>
              ) : (
                <div className="text-sm text-muted-foreground">
                  Hover a district to inspect it.
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
              <div className="mb-3 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Density scale
              </div>
              <div className="space-y-2">
                {HEAT_COLORS.map((color, index) => (
                  <div key={color} className="flex items-center gap-3 text-xs text-muted-foreground">
                    <div className="h-3 w-8 rounded-full border border-border/60" style={{ backgroundColor: color }} />
                    <span>
                      {index === 0
                        ? "Low / none"
                        : index === HEAT_COLORS.length - 1
                          ? "Highest density"
                          : `Band ${index + 1}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
              <div className="mb-3 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Most represented
              </div>
              <div className="space-y-2">
                {topDistricts.length > 0 ? (
                  topDistricts.map(([name, count], index) => (
                    <button
                      key={name}
                      type="button"
                      onMouseEnter={() => setHoveredDistrict(name)}
                      onMouseLeave={() => setHoveredDistrict((current) => (current === name ? null : current))}
                      onClick={() => onDistrictClick?.(name)}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors ${
                        selectedDistrict === name
                          ? "bg-accent text-accent-foreground"
                          : "bg-background/80 hover:bg-background"
                      }`}
                    >
                      <span className="w-5 text-[11px] font-semibold opacity-70">{index + 1}</span>
                      <span className="min-w-0 flex-1 truncate text-sm">{name}</span>
                      <span className="text-xs font-semibold">{count}</span>
                    </button>
                  ))
                ) : (
                  <div className="rounded-xl bg-background/80 px-3 py-2 text-sm text-muted-foreground">
                    No verified district data yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
