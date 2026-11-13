import { describe, it, expect } from "vitest";
import { rankRotations, calculateRotationScore } from "../src/engine";
import { SAMPLE_ROTATIONS } from "../src/fixtures";
import type { ScoredRotation } from "../src/types";

describe("FarmScale Scoring Engine", () => {
  it("ranks Mustard rotation #1 under water-first weights (8/3/4) with score 7.4", () => {
    const weights = { water: 8, income: 3, soil: 4 };
    const ranked = rankRotations(SAMPLE_ROTATIONS, weights);

    expect(ranked[0].id).toBe("mustard-mungbean-aman");
    expect(ranked[0].rank).toBe(1);
    expect(ranked[0].score).toBe(7.4);
  });

  it("ranks Wheat rotation #1 under income-first weights (3/8/4) with score 6.8", () => {
    const weights = { water: 3, income: 8, soil: 4 };
    const ranked = rankRotations(SAMPLE_ROTATIONS, weights);

    expect(ranked[0].id).toBe("wheat-mungbean-aman");
    expect(ranked[0].rank).toBe(1);
    expect(ranked[0].score).toBe(6.8);
  });

  it("handles all-zero weights gracefully returning score 0", () => {
    const weights = { water: 0, income: 0, soil: 0 };
    const ranked = rankRotations(SAMPLE_ROTATIONS, weights);

    expect(ranked).toHaveLength(SAMPLE_ROTATIONS.length);
    ranked.forEach((r: ScoredRotation) => {
      expect(r.score).toBe(0);
    });
  });

  it("marks result as custom soil when soil overrides are provided", () => {
    const weights = { water: 8, income: 3, soil: 4 };
    const ranked = rankRotations(SAMPLE_ROTATIONS, weights, {
      organicCarbonPercent: 0.5,
    });

    expect(ranked[0].isCustomSoil).toBe(true);
  });
});
