export interface DistrictCoordinate {
  lat: number;
  lng: number;
}

const RAW_COORDINATES: Record<string, DistrictCoordinate> = {
  Dhaka: { lat: 23.7115253, lng: 90.4111451 },
  Faridpur: { lat: 23.6070822, lng: 89.8429406 },
  Gazipur: { lat: 24.0022858, lng: 90.4264283 },
  Gopalganj: { lat: 23.0050857, lng: 89.8266059 },
  Jamalpur: { lat: 24.937533, lng: 89.937775 },
  Kishoreganj: { lat: 24.444937, lng: 90.776575 },
  Madaripur: { lat: 23.164102, lng: 90.1896805 },
  Manikganj: { lat: 23.8644, lng: 90.0047 },
  Munshiganj: { lat: 23.5422, lng: 90.5305 },
  Mymensingh: { lat: 24.7471, lng: 90.4203 },
  Narayanganj: { lat: 23.63366, lng: 90.496482 },
  Narsingdi: { lat: 23.932233, lng: 90.71541 },
  Netrokona: { lat: 24.870955, lng: 90.727887 },
  Rajbari: { lat: 23.7574305, lng: 89.6444665 },
  Shariatpur: { lat: 23.2423, lng: 90.4348 },
  Sherpur: { lat: 25.0204933, lng: 90.0152966 },
  Tangail: { lat: 24.2513, lng: 89.9167 },
  Bogura: { lat: 24.8465228, lng: 89.377755 },
  Joypurhat: { lat: 25.0968, lng: 89.0227 },
  Naogaon: { lat: 24.7936, lng: 88.9318 },
  Natore: { lat: 24.420556, lng: 89.000282 },
  Nawabganj: { lat: 24.5965034, lng: 88.2775122 },
  Pabna: { lat: 23.998524, lng: 89.233645 },
  Rajshahi: { lat: 24.3745, lng: 88.6042 },
  Sirajgonj: { lat: 24.4533978, lng: 89.7006815 },
  Dinajpur: { lat: 25.6217061, lng: 88.6354504 },
  Gaibandha: { lat: 25.328751, lng: 89.528088 },
  Kurigram: { lat: 25.805445, lng: 89.636174 },
  Lalmonirhat: { lat: 25.9923, lng: 89.2847 },
  Nilphamari: { lat: 25.931794, lng: 88.856006 },
  Panchagarh: { lat: 26.3411, lng: 88.5541606 },
  Rangpur: { lat: 25.7558096, lng: 89.244462 },
  Thakurgaon: { lat: 26.0336945, lng: 88.4616834 },
  Barguna: { lat: 22.0953, lng: 90.1121 },
  Barishal: { lat: 22.701, lng: 90.3535 },
  Bhola: { lat: 22.685923, lng: 90.648179 },
  Jhalokati: { lat: 22.6406, lng: 90.1987 },
  Patuakhali: { lat: 22.3596316, lng: 90.3298712 },
  Pirojpur: { lat: 22.5841, lng: 89.972 },
  Bandarban: { lat: 22.1953275, lng: 92.2183773 },
  Brahmanbaria: { lat: 23.9570904, lng: 91.1119286 },
  Chandpur: { lat: 23.2332585, lng: 90.6712912 },
  Chattogram: { lat: 22.335109, lng: 91.834073 },
  Cumilla: { lat: 23.4682747, lng: 91.1788135 },
  "Cox's Bazar": { lat: 21.4272, lng: 92.0058 },
  Feni: { lat: 23.0159, lng: 91.3976 },
  Khagrachari: { lat: 23.119285, lng: 91.984663 },
  Lakshmipur: { lat: 22.942477, lng: 90.841184 },
  Noakhali: { lat: 22.869563, lng: 91.099398 },
  Rangamati: { lat: 22.7324, lng: 92.2985 },
  Habiganj: { lat: 24.374945, lng: 91.41553 },
  Maulvibazar: { lat: 24.482934, lng: 91.777417 },
  Sunamganj: { lat: 25.0658042, lng: 91.3950115 },
  Sylhet: { lat: 24.8897956, lng: 91.8697894 },
  Bagerhat: { lat: 22.651568, lng: 89.785938 },
  Chuadanga: { lat: 23.6401961, lng: 88.841841 },
  Jashore: { lat: 23.16643, lng: 89.2081126 },
  Jhenaidah: { lat: 23.5448176, lng: 89.1539213 },
  Khulna: { lat: 22.815774, lng: 89.568679 },
  Kushtia: { lat: 23.901258, lng: 89.120482 },
  Magura: { lat: 23.487337, lng: 89.419956 },
  Meherpur: { lat: 23.762213, lng: 88.631821 },
  Narail: { lat: 23.172534, lng: 89.512672 },
  Satkhira: { lat: 22.7185, lng: 89.0705 },
};

const DISTRICT_ALIASES: Record<string, string> = {
  Chapainawabganj: "Nawabganj",
  Comilla: "Cumilla",
  Khagrachhari: "Khagrachari",
  Moulvibazar: "Maulvibazar",
  Sirajganj: "Sirajgonj",
};

export function getDistrictCoordinate(name: string) {
  const canonicalName = DISTRICT_ALIASES[name] ?? name;
  return RAW_COORDINATES[canonicalName] ?? null;
}

export const DISTRICT_COORDINATE_BOUNDS = Object.values(RAW_COORDINATES).reduce(
  (bounds, current) => ({
    minLat: Math.min(bounds.minLat, current.lat),
    maxLat: Math.max(bounds.maxLat, current.lat),
    minLng: Math.min(bounds.minLng, current.lng),
    maxLng: Math.max(bounds.maxLng, current.lng),
  }),
  {
    minLat: Infinity,
    maxLat: -Infinity,
    minLng: Infinity,
    maxLng: -Infinity,
  },
);
