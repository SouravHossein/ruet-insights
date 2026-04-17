'use client';

import { useEffect, useMemo, useRef, useState } from "react";
import { MapPinned } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { canonicalizeDistrictName, loadDistrictFeatureCollection, type DistrictFeatureCollection } from "@/lib/district-geo";

interface DistrictMapProps {
  districtCounts: Record<string, number>;
  mode?: "analytics" | "picker";
  onDistrictClick?: (district: string) => void;
  selectedDistrict?: string | null;
  successDistrict?: string | null;
}

const WARM_SCALE = ["#efe5d0", "#efc780", "#f39a48", "#e25b2b", "#b72f15"];
const FALLBACK_BOUNDS = L.latLngBounds([20.5, 88], [26.8, 93]);

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

  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const geoJsonLayerRef = useRef<L.GeoJSON | null>(null);
  const hasFitBoundsRef = useRef(false);

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

  useEffect(() => {
    if (!mapElementRef.current || mapRef.current) {
      return;
    }

    const map = L.map(mapElementRef.current, {
      attributionControl: true,
      scrollWheelZoom: true,
      zoomControl: true,
    });

    map.fitBounds(FALLBACK_BOUNDS, { padding: [12, 12] });

    const tileLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    });

    tileLayer.addTo(map);

    mapRef.current = map;
    tileLayerRef.current = tileLayer;

    window.requestAnimationFrame(() => {
      map.invalidateSize();
    });

    return () => {
      geoJsonLayerRef.current?.remove();
      tileLayerRef.current?.remove();
      map.remove();
      geoJsonLayerRef.current = null;
      tileLayerRef.current = null;
      mapRef.current = null;
      hasFitBoundsRef.current = false;
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

  const topDistricts = useMemo(
    () =>
      Object.entries(districtCounts)
        .filter(([, count]) => count > 0)
        .sort((left, right) => right[1] - left[1])
        .slice(0, 6),
    [districtCounts],
  );

  useEffect(() => {
    const map = mapRef.current;

    if (!map || !districtGeoJson) {
      return;
    }

    geoJsonLayerRef.current?.remove();

    const getDistrictColor = (count: number) => {
      if (count <= 0 || maxCount <= 0) return "#d5d1c8";

      const intensity = count / maxCount;

      if (intensity <= 0.2) return WARM_SCALE[0];
      if (intensity <= 0.4) return WARM_SCALE[1];
      if (intensity <= 0.6) return WARM_SCALE[2];
      if (intensity <= 0.8) return WARM_SCALE[3];
      return WARM_SCALE[4];
    };

    const geoJsonLayer = L.geoJSON(districtGeoJson, {
      style: (feature) => {
        const districtName = canonicalizeDistrictName(feature?.properties?.name ?? "");
        const count = districtCounts[districtName] ?? 0;
        const isSelected = selectedDistrict === districtName;
        const isHovered = hoveredDistrict === districtName;
        const isSuccess = successDistrict === districtName;

        return {
          className: [
            "district-shape",
            mode === "picker" ? "district-shape--interactive" : "",
            isSelected ? "district-shape--selected" : "",
            isSuccess ? "district-shape--success" : "",
          ]
            .filter(Boolean)
            .join(" "),
          color: isSuccess ? "#ffcf6e" : isSelected ? "#fff3df" : "#fff9f0",
          fillColor: isSuccess ? "#f04a17" : getDistrictColor(count),
          fillOpacity: isSelected || isHovered ? 0.88 : 0.72,
          opacity: 1,
          weight: isSelected ? 2.8 : isHovered ? 2.4 : 1.4,
        };
      },
      onEachFeature: (feature, layer) => {
        const districtName = canonicalizeDistrictName(feature.properties.name);
        const count = districtCounts[districtName] ?? 0;
        const share = totalVerified > 0 ? ((count / totalVerified) * 100).toFixed(1) : "0.0";

        layer.bindTooltip(
          `<div class="district-tooltip">
            <div class="district-tooltip__title">${districtName}</div>
            <div>${count} verified student${count === 1 ? "" : "s"}</div>
            <div>${share}% of verified total</div>
          </div>`,
        );

        layer.on({
          click: () => onDistrictClick?.(districtName),
          mouseover: () => setHoveredDistrict(districtName),
          mouseout: () => setHoveredDistrict(null),
        });
      },
    });

    geoJsonLayer.addTo(map);
    geoJsonLayerRef.current = geoJsonLayer;

    if (!hasFitBoundsRef.current) {
      const bounds = geoJsonLayer.getBounds();
      map.fitBounds(bounds.isValid() ? bounds : FALLBACK_BOUNDS, { padding: [12, 12] });
      hasFitBoundsRef.current = true;
    }

    return () => {
      geoJsonLayer.off();
      geoJsonLayer.remove();
      if (geoJsonLayerRef.current === geoJsonLayer) {
        geoJsonLayerRef.current = null;
      }
    };
  }, [
    districtCounts,
    districtGeoJson,
    hoveredDistrict,
    maxCount,
    mode,
    onDistrictClick,
    selectedDistrict,
    successDistrict,
    totalVerified,
  ]);

  useEffect(() => {
    mapRef.current?.invalidateSize();
  }, [districtGeoJson]);

  const mapDescription =
    mode === "picker"
      ? "Click a district to select it for verification. Colors reflect verified-student counts."
      : "District-boundary choropleth of verified RUET students across Bangladesh.";

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg font-bold">
          <MapPinned className="h-5 w-5 text-accent" />
          Bangladesh District Heat Map
        </CardTitle>
        <p className="text-xs text-muted-foreground">{mapDescription}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_220px]">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[1.75rem] border border-border/60">
            <div ref={mapElementRef} className="h-full w-full" />
            {loadError ? (
              <div className="absolute inset-0 flex items-center justify-center bg-background/90 px-6 text-center text-sm text-destructive">
                {loadError}
              </div>
            ) : null}
            {!loadError && !districtGeoJson ? (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80 text-sm text-muted-foreground">
                Loading district boundaries...
              </div>
            ) : null}
          </div>

          <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
            <div className="mb-3 text-sm font-semibold text-foreground">Most represented</div>
            <div className="space-y-2">
              {topDistricts.length > 0 ? (
                topDistricts.map(([name, count]) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => onDistrictClick?.(name)}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                      selectedDistrict === name
                        ? "bg-accent text-accent-foreground"
                        : "bg-background/80 hover:bg-background"
                    }`}
                  >
                    <span>{name}</span>
                    <span className="text-xs font-semibold">{count}</span>
                  </button>
                ))
              ) : (
                <div className="rounded-xl bg-background/80 px-3 py-2 text-sm text-muted-foreground">
                  No verified district data yet.
                </div>
              )}
            </div>

            <div className="mt-5 text-xs text-muted-foreground">
              District colors are based on verified-student counts, using a warm five-step density scale.
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>Lower</span>
          <div className="flex gap-1">
            {WARM_SCALE.map((color) => (
              <div
                key={color}
                className="h-3 w-5 rounded-full border border-border"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          <span>Higher</span>
        </div>
      </CardContent>
    </Card>
  );
}
