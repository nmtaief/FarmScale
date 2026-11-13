import type { PriorityWeights, RotationCandidate, ScoredRotation, SoilOverrides } from "./types";

/**
 * Pure deterministic scoring function for crop rotations.
 *
 * Algorithm per documentation:
 * Score = (W_water * R_water + W_income * R_income + W_soil * R_soil) / (W_water + W_income + W_soil)
 *
 * All inputs are non-negative.
 * If all weights are 0, returns unweighted base average or 0.
 */
export function calculateRotationScore(
  rotation: RotationCandidate,
  weights: PriorityWeights,
  soilOverrides?: SoilOverrides
): { score: number; isCustomSoil: boolean } {
  const totalWeight = weights.water + weights.income + weights.soil;

  if (totalWeight <= 0) {
    return { score: 0, isCustomSoil: false };
  }

  let soilRating = rotation.ratings.soil;
  let isCustomSoil = false;

  // If farmer manually overrode soil organic carbon, adapt soil rating slightly
  if (soilOverrides && typeof soilOverrides.organicCarbonPercent === "number") {
    isCustomSoil = true;
    if (soilOverrides.organicCarbonPercent < 0.8) {
      // Degraded soil increases the value of legume nitrogen-fixing rotations
      const hasLegume =
        rotation.crops.kharif1.id === "mungbean" ||
        rotation.crops.rabi.id === "lentil";
      if (hasLegume) {
        soilRating = Math.min(10, soilRating + 1);
      }
    }
  }

  const rawScore =
    (weights.water * rotation.ratings.water +
      weights.income * rotation.ratings.income +
      weights.soil * soilRating) /
    totalWeight;

  // Round to 1 decimal place cleanly
  const roundedScore = Math.round(rawScore * 10) / 10;

  return {
    score: roundedScore,
    isCustomSoil,
  };
}

/**
 * Ranks a list of candidate crop rotations based on farmer priorities.
 * Deterministic: equal scores are sorted by water conservation first, then income, then id.
 */
export function rankRotations(
  candidates: RotationCandidate[],
  weights: PriorityWeights,
  soilOverrides?: SoilOverrides
): ScoredRotation[] {
  const scored = candidates.map((cand) => {
    const { score, isCustomSoil } = calculateRotationScore(
      cand,
      weights,
      soilOverrides
    );
    return {
      ...cand,
      score,
      rank: 0, // Assigned after sorting
      isCustomSoil,
    };
  });

  // Sort descending by score, tiebreak with water rating, then income rating
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.ratings.water !== a.ratings.water)
      return b.ratings.water - a.ratings.water;
    if (b.ratings.income !== a.ratings.income)
      return b.ratings.income - a.ratings.income;
    return a.id.localeCompare(b.id);
  });

  // Assign 1-based ranks
  return scored.map((item, index) => ({
    ...item,
    rank: index + 1,
  }));
}
