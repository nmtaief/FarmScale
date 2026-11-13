export type Season = "kharif_1" | "kharif_2" | "rabi";

export interface PriorityWeights {
  /** Save water priority weight (0-10) */
  water: number;
  /** Earn income priority weight (0-10) */
  income: number;
  /** Rebuild soil priority weight (0-10) */
  soil: number;
}

export type DataStatus = "live" | "sample" | "unavailable";

export interface CropTrait {
  id: string;
  nameKey: string;
  season: Season;
  waterNeedRating: number; // 0-10 (higher = saves more water)
  incomeRating: number;    // 0-10 (higher = more profitable)
  soilBenefitRating: number; // 0-10 (higher = fixes nitrogen / rebuilds soil)
  source: string;
  status: DataStatus;
}

export interface RotationCandidate {
  id: string;
  nameKey: string;
  crops: {
    rabi: CropTrait;
    kharif1: CropTrait;
    kharif2: CropTrait;
  };
  /** Aggregate rotation ratings across the 3 seasons (0-10) */
  ratings: {
    water: number;
    income: number;
    soil: number;
  };
  /** Explanation signal codes mapping to translated sentences */
  signalCodes: string[];
}

export interface SoilOverrides {
  organicCarbonPercent?: number;
  ph?: number;
  texture?: string;
}

export interface ScoredRotation extends RotationCandidate {
  rank: number;
  score: number;
  isCustomSoil?: boolean;
}
