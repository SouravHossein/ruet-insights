import { describe, expect, it } from "vitest";
import { canonicalizeDistrictName } from "@/lib/district-geo";

describe("district alias normalization", () => {
  it("maps GeoJSON aliases to canonical app district names", () => {
    expect(canonicalizeDistrictName("Barisal")).toBe("Barishal");
    expect(canonicalizeDistrictName("Bogra")).toBe("Bogura");
    expect(canonicalizeDistrictName("Chittagong")).toBe("Chattogram");
    expect(canonicalizeDistrictName("Netrakona")).toBe("Netrokona");
  });

  it("leaves canonical names untouched", () => {
    expect(canonicalizeDistrictName("Dhaka")).toBe("Dhaka");
  });
});
