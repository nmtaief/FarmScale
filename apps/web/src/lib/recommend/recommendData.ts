import upazilasData from "@/data/rajshahi_division_upazilas.json";

export interface UpazilaRecord {
  district_en: string;
  district_bn: string;
  upazila_en: string;
  upazila_bn: string;
  lat: number;
  lon: number;
}

export interface PilotArea {
  id: string;
  name_bn: string;
  name_en: string;
  district_bn?: string;
  district_en?: string;
  lat: number;
  lng: number;
  yieldFactor: number;
}

export const ALL_RAJSHAHI_UPAZILAS: UpazilaRecord[] = upazilasData as UpazilaRecord[];

// 8 Distinct Districts
export const RAJSHAHI_DISTRICTS = Array.from(
  new Map(ALL_RAJSHAHI_UPAZILAS.map((u) => [u.district_en, { en: u.district_en, bn: u.district_bn }])).values()
);

export function getUpazilasByDistrict(district_en: string): UpazilaRecord[] {
  return ALL_RAJSHAHI_UPAZILAS.filter((u) => u.district_en.toLowerCase() === district_en.toLowerCase());
}

export function findNearestUpazila(lat: number, lng: number): { upazila: UpazilaRecord; distanceKm: number; isFar: boolean } {
  let best = ALL_RAJSHAHI_UPAZILAS[0];
  let minDistance = Infinity;

  for (const u of ALL_RAJSHAHI_UPAZILAS) {
    // Approx distance in km
    const dLat = (u.lat - lat) * 111;
    const dLon = (u.lon - lng) * 111 * Math.cos((lat * Math.PI) / 180);
    const dist = Math.hypot(dLat, dLon);
    if (dist < minDistance) {
      minDistance = dist;
      best = u;
    }
  }

  return {
    upazila: best,
    distanceKm: Math.round(minDistance),
    isFar: minDistance > 45, // Outside Rajshahi division boundary
  };
}

// Backward-compatible PILOT_AREAS
export const PILOT_AREAS: PilotArea[] = [
  { id: "sadar", name_bn: "রাজশাহী সদর", name_en: "Rajshahi Sadar", district_bn: "রাজশাহী", district_en: "Rajshahi", lat: 24.37, lng: 88.60, yieldFactor: 1.0 },
  { id: "godagari", name_bn: "গোদাগাড়ী", name_en: "Godagari", district_bn: "রাজশাহী", district_en: "Rajshahi", lat: 24.47, lng: 88.35, yieldFactor: 0.95 },
  { id: "tanore", name_bn: "তানোর", name_en: "Tanore", district_bn: "রাজশাহী", district_en: "Rajshahi", lat: 24.53, lng: 88.53, yieldFactor: 1.05 },
  { id: "paba", name_bn: "পবা", name_en: "Paba", district_bn: "রাজশাহী", district_en: "Rajshahi", lat: 24.43, lng: 88.55, yieldFactor: 0.98 },
];

export interface RecommendOption {
  key: "profit" | "shift" | "easy";
  title_bn: string;
  title_en: string;
  crops: string[];
  profit_per_bigha: number;
  cost_per_bigha: number;
  water: "low" | "mid" | "high";
  reason_bn: string;
  reason_en: string;
}

export interface RecommendResponse {
  area: {
    id: string;
    name_bn: string;
    name_en: string;
    district_bn?: string;
    district_en?: string;
    snapped: boolean;
  };
  options: RecommendOption[];
  meta?: {
    model: string;
    source: string;
  };
}
