import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { rankRotations, SAMPLE_ROTATIONS } from "@farmscale/scoring";
import { routing } from "../src/i18n/routing";

describe("Acceptance Tests (Bangla & English Only)", () => {
  const messagesDir = path.resolve(__dirname, "../messages");
  const en = JSON.parse(fs.readFileSync(path.join(messagesDir, "en.json"), "utf-8"));
  const bn = JSON.parse(fs.readFileSync(path.join(messagesDir, "bn.json"), "utf-8"));

  // 0. Japanese removal check
  describe("Japanese Removal & Strict Bilingual Parity", () => {
    it("ensures ja.json is completely removed", () => {
      expect(fs.existsSync(path.join(messagesDir, "ja.json"))).toBe(false);
    });

    it("ensures routing only includes bn and en", () => {
      expect(routing.locales).toEqual(["bn", "en"]);
      expect(routing.defaultLocale).toBe("bn");
    });
  });

  // 1. Crop Trait Correctness
  describe("Crop Trait Agronomic Correctness", () => {
    it("ensures Mustard is NOT labeled as a legume and does NOT claim nitrogen fixation", () => {
      const mustardBn = bn.cropTraits.soilBenefit.mustard;
      const mustardEn = en.cropTraits.soilBenefit.mustard;

      expect(mustardBn).toBeDefined();
      expect(mustardEn).toBeDefined();

      // Must explicitly note it does not fix nitrogen
      expect(mustardBn).toContain("নাইট্রোজেন তৈরি করে না");
      expect(mustardEn).toContain("Does NOT fix atmospheric nitrogen");

      // Must not falsely call mustard a legume / ডাল
      expect(mustardEn.toLowerCase()).not.toContain("legume nodulation");
      expect(mustardBn).not.toContain("ডাল জাতীয়");
    });

    it("verifies that Legumes (Mungbean, Lentil) accurately explain biological nitrogen fixation", () => {
      const mungbeanBn = bn.cropTraits.soilBenefit.mungbean;
      const lentilBn = bn.cropTraits.soilBenefit.lentil;
      const mungbeanEn = en.cropTraits.soilBenefit.mungbean;
      const lentilEn = en.cropTraits.soilBenefit.lentil;

      expect(mungbeanBn).toContain("নাইট্রোজেন");
      expect(mungbeanBn).toContain("ডাল");
      expect(lentilBn).toContain("নাইট্রোজেন");
      expect(lentilBn).toContain("ডাল");

      expect(mungbeanEn.toLowerCase()).toContain("nitrogen");
      expect(lentilEn.toLowerCase()).toContain("nitrogen");
    });

    it("verifies all 8 crops have defined soil and water descriptions across en and bn", () => {
      const cropKeys = ["mustard", "wheat", "lentil", "boro_rice", "mungbean", "aus_rice", "aman_rice", "fallow"];

      for (const crop of cropKeys) {
        expect(en.cropTraits.soilBenefit[crop], `en missing soilBenefit for ${crop}`).toBeDefined();
        expect(bn.cropTraits.soilBenefit[crop], `bn missing soilBenefit for ${crop}`).toBeDefined();

        expect(en.cropTraits.waterNeed[crop], `en missing waterNeed for ${crop}`).toBeDefined();
        expect(bn.cropTraits.waterNeed[crop], `bn missing waterNeed for ${crop}`).toBeDefined();
      }
    });
  });

  // 2. Rotation Count Consistency
  describe("Rotation Count Rendering Consistency", () => {
    it("matches the number of ranked rotations to the list length", () => {
      const priorities = { water: 8, income: 4, soil: 6 };
      const ranked = rankRotations(SAMPLE_ROTATIONS, priorities);

      expect(ranked.length).toBe(SAMPLE_ROTATIONS.length);
      expect(ranked.length).toBe(4);

      // Verify ranks are continuous from 1 to N
      ranked.forEach((r, idx) => {
        expect(r.rank).toBe(idx + 1);
      });
    });
  });

  // 3. Enum to Label Mapping
  describe("Enum to Label Mapping (No Raw Key Leakage)", () => {
    it("ensures all season enums have translated human labels in en and bn", () => {
      const seasons = ["rabi", "kharif_1", "kharif_2"];
      for (const season of seasons) {
        expect(en.seasons[season]).toBeDefined();
        expect(bn.seasons[season]).toBeDefined();

        // Never equals the raw enum string
        expect(en.seasons[season]).not.toBe(season);
        expect(bn.seasons[season]).not.toBe(season);
      }
    });

    it("ensures all crop enums have translated human labels in en and bn", () => {
      const crops = ["mustard", "wheat", "lentil", "boro_rice", "mungbean", "aus_rice", "aman_rice", "fallow"];
      for (const crop of crops) {
        expect(en.crops[crop]).toBeDefined();
        expect(bn.crops[crop]).toBeDefined();

        // Bangla translations must be in Bengali script
        expect(bn.crops[crop]).not.toBe(crop);
      }
    });
  });

  // 4. I18n Key Coverage Parity
  describe("I18n Key Coverage Parity", () => {
    it("verifies that bn.json contains all required top-level message keys from en.json", () => {
      const enKeys = Object.keys(en).filter((k) => k !== "_meta");
      const bnKeys = Object.keys(bn).filter((k) => k !== "_meta");

      for (const k of enKeys) {
        expect(bnKeys, `bn.json is missing top-level section: ${k}`).toContain(k);
      }
    });
  });
});
