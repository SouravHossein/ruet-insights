import type { Feature, FeatureCollection, MultiPolygon, Polygon } from "geojson";

type DistrictGeometry = MultiPolygon | Polygon;

interface RawDistrictProperties {
  ADM1_EN: string;
  ADM2_EN: string;
}

export interface DistrictFeatureProperties extends RawDistrictProperties {
  name: string;
  division: string;
}

export type DistrictFeature = Feature<DistrictGeometry, DistrictFeatureProperties>;
export type DistrictFeatureCollection = FeatureCollection<DistrictGeometry, DistrictFeatureProperties>;

const DISTRICT_NAME_ALIASES: Record<string, string> = {
  Barisal: "Barishal",
  Bogra: "Bogura",
  Brahamanbaria: "Brahmanbaria",
  "Chapai Nawabganj": "Chapainawabganj",
  Chittagong: "Chattogram",
  Cumilla: "Comilla",
  Jessore: "Jashore",
  Khagrachari: "Khagrachhari",
  Maulvibazar: "Moulvibazar",
  Nawabganj: "Chapainawabganj",
  Netrakona: "Netrokona",
  Sirajgonj: "Sirajganj",
};

export function canonicalizeDistrictName(name: string) {
  const normalizedName = name.trim();
  return DISTRICT_NAME_ALIASES[normalizedName] ?? normalizedName;
}

export function normalizeDistrictFeatureCollection(
  collection: FeatureCollection<DistrictGeometry, RawDistrictProperties>,
) {
  return {
    ...collection,
    features: collection.features.map((feature) => ({
      ...feature,
      properties: {
        ...feature.properties,
        name: canonicalizeDistrictName(feature.properties.ADM2_EN),
        division: feature.properties.ADM1_EN,
      },
    })),
  } satisfies DistrictFeatureCollection;
}

export async function loadDistrictFeatureCollection() {
  const response = await fetch("/bangladesh-districts.geojson");

  if (!response.ok) {
    throw new Error("Unable to load Bangladesh district boundaries.");
  }

  const collection = (await response.json()) as FeatureCollection<
    DistrictGeometry,
    RawDistrictProperties
  >;

  return normalizeDistrictFeatureCollection(collection);
}
