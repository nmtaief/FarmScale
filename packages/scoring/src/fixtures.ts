/**
 * ============================================================================
 * NOTICE: SAMPLE DATA FIXTURES - NOT REAL MEASUREMENTS
 * ============================================================================
 * The crop traits and rotation ratings in this file are illustrative placeholders
 * for testing and demonstration of the scoring algorithm.
 *
 * THEY ARE NOT SOURCED FROM AGRONOMIC FIELD TRIALS OR OFFICIAL SENSORS.
 * Every item is explicitly marked with `source: "sample"` and `status: "sample"`.
 * All user-facing components consuming this data must render the visible
 * "Sample data" indicator per AGENTS.md rule 1 and prompt.md Section 5.
 * ============================================================================
 */

import type { CropTrait, RotationCandidate } from "./types";

export const SAMPLE_CROPS: Record<string, CropTrait> = {
  mustard: {
    id: "mustard",
    nameKey: "crops.mustard",
    season: "rabi",
    waterNeedRating: 8,
    incomeRating: 5,
    soilBenefitRating: 7,
    source: "sample",
    status: "sample",
  },
  wheat: {
    id: "wheat",
    nameKey: "crops.wheat",
    season: "rabi",
    waterNeedRating: 6,
    incomeRating: 7,
    soilBenefitRating: 6,
    source: "sample",
    status: "sample",
  },
  lentil: {
    id: "lentil",
    nameKey: "crops.lentil",
    season: "rabi",
    waterNeedRating: 7,
    incomeRating: 5,
    soilBenefitRating: 8,
    source: "sample",
    status: "sample",
  },
  boro_rice: {
    id: "boro_rice",
    nameKey: "crops.boro_rice",
    season: "rabi",
    waterNeedRating: 2,
    incomeRating: 9,
    soilBenefitRating: 3,
    source: "sample",
    status: "sample",
  },
  mungbean: {
    id: "mungbean",
    nameKey: "crops.mungbean",
    season: "kharif_1",
    waterNeedRating: 8,
    incomeRating: 6,
    soilBenefitRating: 9,
    source: "sample",
    status: "sample",
  },
  aus_rice: {
    id: "aus_rice",
    nameKey: "crops.aus_rice",
    season: "kharif_1",
    waterNeedRating: 6,
    incomeRating: 5,
    soilBenefitRating: 5,
    source: "sample",
    status: "sample",
  },
  aman_rice: {
    id: "aman_rice",
    nameKey: "crops.aman_rice",
    season: "kharif_2",
    waterNeedRating: 5,
    incomeRating: 7,
    soilBenefitRating: 5,
    source: "sample",
    status: "sample",
  },
  fallow: {
    id: "fallow",
    nameKey: "crops.fallow",
    season: "kharif_1",
    waterNeedRating: 10,
    incomeRating: 0,
    soilBenefitRating: 4,
    source: "sample",
    status: "sample",
  },
};

export const SAMPLE_ROTATIONS: RotationCandidate[] = [
  {
    id: "mustard-mungbean-aman",
    nameKey: "rotations.mustard_mungbean_aman",
    crops: {
      rabi: SAMPLE_CROPS.mustard,
      kharif1: SAMPLE_CROPS.mungbean,
      kharif2: SAMPLE_CROPS.aman_rice,
    },
    ratings: {
      water: 8,
      income: 5,
      soil: 8,
    },
    signalCodes: [
      "signal.low_water_demand_winter",
      "signal.legume_nitrogen_boost",
      "signal.monsoon_rainfed_monsoon",
    ],
  },
  {
    id: "wheat-mungbean-aman",
    nameKey: "rotations.wheat_mungbean_aman",
    crops: {
      rabi: SAMPLE_CROPS.wheat,
      kharif1: SAMPLE_CROPS.mungbean,
      kharif2: SAMPLE_CROPS.aman_rice,
    },
    ratings: {
      water: 6,
      income: 7,
      soil: 7,
    },
    signalCodes: [
      "signal.moderate_water_winter",
      "signal.high_market_value",
      "signal.legume_soil_recovery",
    ],
  },
  {
    id: "lentil-aus-aman",
    nameKey: "rotations.lentil_aus_aman",
    crops: {
      rabi: SAMPLE_CROPS.lentil,
      kharif1: SAMPLE_CROPS.aus_rice,
      kharif2: SAMPLE_CROPS.aman_rice,
    },
    ratings: {
      water: 7,
      income: 5,
      soil: 8,
    },
    signalCodes: [
      "signal.pulse_nitrogen_fixation",
      "signal.low_irrigation_cost",
      "signal.soil_microbiome_benefit",
    ],
  },
  {
    id: "boro-aman",
    nameKey: "rotations.boro_aman",
    crops: {
      rabi: SAMPLE_CROPS.boro_rice,
      kharif1: SAMPLE_CROPS.fallow,
      kharif2: SAMPLE_CROPS.aman_rice,
    },
    ratings: {
      water: 2,
      income: 9,
      soil: 3,
    },
    signalCodes: [
      "signal.heavy_groundwater_extraction",
      "signal.high_yield_cash_crop",
      "signal.soil_depletion_risk",
    ],
  },
];
