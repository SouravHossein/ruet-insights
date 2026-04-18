export interface DistrictCoordinate {
  lat: number;
  lng: number;
}

const RAW_COORDINATES: Record<string, DistrictCoordinate> = {
  Bagerhat: { lat: 22.171956502507786, lng: 89.71390035261985 },
  Bandarban: { lat: 21.717264454615925, lng: 92.27470773213214 },
  Barguna: { lat: 22.14890893396141, lng: 90.12671825903048 },
  Barishal: { lat: 22.800704706571107, lng: 90.42056338889094 },
  Bhola: { lat: 22.33375884025988, lng: 90.74367017537215 },
  Bogura: { lat: 24.80068058237865, lng: 89.30528621158173 },
  Brahmanbaria: { lat: 23.935415104317322, lng: 91.10252963252408 },
  Chandpur: { lat: 23.23366019368476, lng: 90.7158412702654 },
  Chattogram: { lat: 22.426162597083184, lng: 91.82266537648158 },
  Chuadanga: { lat: 23.569476713921972, lng: 88.83397044583884 },
  Comilla: { lat: 23.444877723519223, lng: 91.00327534026844 },
  "Cox's Bazar": { lat: 21.511340636573834, lng: 92.0686541425345 },
  Dhaka: { lat: 23.814502577592847, lng: 90.21788589146138 },
  Dinajpur: { lat: 25.579978204934246, lng: 88.84085416562766 },
  Faridpur: { lat: 23.45428031047813, lng: 89.80535632619429 },
  Feni: { lat: 22.96341805082408, lng: 91.39999141356236 },
  Gaibandha: { lat: 25.32538161469346, lng: 89.46534601818186 },
  Gazipur: { lat: 24.087985612384834, lng: 90.41910957869608 },
  Gopalganj: { lat: 23.13679531216899, lng: 89.91492544158116 },
  Habiganj: { lat: 24.37380637763971, lng: 91.41363640336631 },
  Jamalpur: { lat: 24.946526649613723, lng: 89.88763731310941 },
  Jashore: { lat: 23.091528738691323, lng: 89.16559484532752 },
  Jhalokati: { lat: 22.56680492207391, lng: 90.18101437213073 },
  Jhenaidah: { lat: 23.455026871136774, lng: 89.03088037884645 },
  Joypurhat: { lat: 25.07159919634757, lng: 89.07757600204263 },
  Khagrachhari: { lat: 23.193742231362858, lng: 91.90377016981412 },
  Khulna: { lat: 22.27747025124784, lng: 89.42900674962395 },
  Kishoreganj: { lat: 24.40980327845586, lng: 90.95635613927558 },
  Kurigram: { lat: 25.910141563603233, lng: 89.65657249528257 },
  Kushtia: { lat: 23.901343085669534, lng: 89.02016088634535 },
  Lakshmipur: { lat: 22.921585031196503, lng: 90.85051175494114 },
  Lalmonirhat: { lat: 26.16883023191647, lng: 89.16358667889533 },
  Madaripur: { lat: 23.20685801326211, lng: 90.16421016260006 },
  Magura: { lat: 23.432638408448536, lng: 89.42267037969998 },
  Manikganj: { lat: 23.87647688602164, lng: 89.97938077003361 },
  Moulvibazar: { lat: 24.48378987458801, lng: 91.92192017213242 },
  Meherpur: { lat: 23.79204284123628, lng: 88.69067507085441 },
  Munshiganj: { lat: 23.53544196167809, lng: 90.44139581412881 },
  Mymensingh: { lat: 24.7351619744336, lng: 90.46277357277137 },
  Naogaon: { lat: 24.863091690146362, lng: 88.75378491976096 },
  Narail: { lat: 23.122900297900042, lng: 89.59083492262863 },
  Narayanganj: { lat: 23.748833640952252, lng: 90.58003650855639 },
  Narsingdi: { lat: 23.9846975856957, lng: 90.74129809307836 },
  Natore: { lat: 24.41556222659424, lng: 89.08509518201778 },
  Nawabganj: { lat: 24.769689468996432, lng: 88.34351968440471 },
  Netrokona: { lat: 24.877025444990547, lng: 90.85608156921705 },
  Nilphamari: { lat: 26.019429013827317, lng: 88.9249393671388 },
  Noakhali: { lat: 22.631019329122186, lng: 91.12909394505587 },
  Pabna: { lat: 24.092258068932594, lng: 89.3769435537878 },
  Panchagarh: { lat: 26.31907925382584, lng: 88.556896771636 },
  Patuakhali: { lat: 22.10275258683615, lng: 90.39946315536749 },
  Pirojpur: { lat: 22.548454346423373, lng: 90.0039907283805 },
  Rajbari: { lat: 23.705337711978235, lng: 89.56083517414024 },
  Rajshahi: { lat: 24.496096810421438, lng: 88.68384971269954 },
  Rangamati: { lat: 22.81502583194141, lng: 92.3083391455001 },
  Rangpur: { lat: 25.61603854701732, lng: 89.23096787188058 },
  Satkhira: { lat: 22.190587731762815, lng: 89.16377472079672 },
  Shariatpur: { lat: 23.229059281599028, lng: 90.42590396128793 },
  Sherpur: { lat: 25.07112109900649, lng: 90.09014297970977 },
  Sirajgonj: { lat: 24.42466476097068, lng: 89.5723596946346 },
  Sunamganj: { lat: 24.893986401015034, lng: 91.35376084394822 },
  Sylhet: { lat: 24.902315344762055, lng: 91.98164690674007 },
  Tangail: { lat: 24.33976047881404, lng: 89.9902954686679 },
  Thakurgaon: { lat: 25.96452044413376, lng: 88.35270441260954 },
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
