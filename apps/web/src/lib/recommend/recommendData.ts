export interface PilotArea {
  id: string;
  name_bn: string;
  name_en: string;
  lat: number;
  lng: number;
  yieldFactor: number;
}

export const PILOT_AREAS: PilotArea[] = [
  { id: "sadar", name_bn: "রাজশাহী সদর", name_en: "Rajshahi Sadar", lat: 24.37, lng: 88.60, yieldFactor: 1.0 },
  { id: "godagari", name_bn: "গোদাগাড়ী", name_en: "Godagari", lat: 24.47, lng: 88.35, yieldFactor: 0.95 },
  { id: "tanore", name_bn: "তানোর", name_en: "Tanore", lat: 24.53, lng: 88.53, yieldFactor: 1.05 },
  { id: "paba", name_bn: "পবা", name_en: "Paba", lat: 24.43, lng: 88.55, yieldFactor: 0.98 },
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
    snapped: boolean;
  };
  options: RecommendOption[];
  meta?: {
    model: string;
    source: string;
  };
}

