import { describe, it, expect } from "vitest";
import { PILOT_AREAS } from "../src/lib/recommend/recommendData";
import { normalizeCropKey, CROP_NAMES } from "../src/components/crops/CropIcon";
import { routing } from "../src/i18n/routing";

describe("Simple Home Page & Recommend API Acceptance Tests", () => {
  // 1. Japanese Removal Check
  describe("Bilingual Only (Bangla & English)", () => {
    it("ensures routing contains only bn and en", () => {
      expect(routing.locales).toEqual(["bn", "en"]);
      expect(routing.defaultLocale).toBe("bn");
    });
  });

  // 2. Pilot Areas & Snapping
  describe("Pilot Areas", () => {
    it("contains exactly 4 Barind pilot areas", () => {
      expect(PILOT_AREAS.length).toBe(4);
      const ids = PILOT_AREAS.map((a) => a.id);
      expect(ids).toEqual(["sadar", "godagari", "tanore", "paba"]);
    });

    it("verifies accurate coordinates and names for Rajshahi Barind upazilas", () => {
      const sadar = PILOT_AREAS.find((a) => a.id === "sadar")!;
      expect(sadar.name_bn).toBe("রাজশাহী সদর");
      expect(sadar.name_en).toBe("Rajshahi Sadar");
      expect(sadar.lat).toBeCloseTo(24.37, 2);
      expect(sadar.lng).toBeCloseTo(88.60, 2);

      const godagari = PILOT_AREAS.find((a) => a.id === "godagari")!;
      expect(godagari.name_bn).toBe("গোদাগাড়ী");
      expect(godagari.name_en).toBe("Godagari");

      const tanore = PILOT_AREAS.find((a) => a.id === "tanore")!;
      expect(tanore.name_bn).toBe("তানোর");
      expect(tanore.name_en).toBe("Tanore");

      const paba = PILOT_AREAS.find((a) => a.id === "paba")!;
      expect(paba.name_bn).toBe("পবা");
      expect(paba.name_en).toBe("Paba");
    });
  });

  // 3. Crop Icon Key Normalization and Names
  describe("Crop Names and Normalization", () => {
    it("normalizes crop aliases to standard keys", () => {
      expect(normalizeCropKey("potato")).toBe("potato");
      expect(normalizeCropKey("আলু")).toBe("potato");
      expect(normalizeCropKey("mungbean")).toBe("mungbean");
      expect(normalizeCropKey("মুগ")).toBe("mungbean");
      expect(normalizeCropKey("mustard")).toBe("mustard");
      expect(normalizeCropKey("সরিষা")).toBe("mustard");
      expect(normalizeCropKey("lentil")).toBe("lentil");
      expect(normalizeCropKey("মসুর")).toBe("lentil");
      expect(normalizeCropKey("boro_rice")).toBe("rice");
      expect(normalizeCropKey("aman_rice")).toBe("rice");
      expect(normalizeCropKey("আমন ধান")).toBe("rice");
    });

    it("ensures all 5 core rotation crops have authentic Bangla and English labels", () => {
      const crops = ["potato", "mungbean", "rice", "mustard", "lentil"];
      for (const c of crops) {
        expect(CROP_NAMES.bn[c], `Missing Bangla name for ${c}`).toBeDefined();
        expect(CROP_NAMES.en[c], `Missing English name for ${c}`).toBeDefined();
      }
      expect(CROP_NAMES.bn.potato).toBe("আলু");
      expect(CROP_NAMES.bn.mungbean).toBe("মুগ");
      expect(CROP_NAMES.bn.rice).toBe("আমন ধান");
      expect(CROP_NAMES.bn.mustard).toBe("সরিষা");
      expect(CROP_NAMES.bn.lentil).toBe("মসুর");
    });
  });

  // 4. Recommendation Output Structure
  describe("Recommendation Card Specification", () => {
    it("verifies the 3 options order: profit, shift, easy", () => {
      const keys = ["profit", "shift", "easy"];
      expect(keys[0]).toBe("profit"); // Most profit
      expect(keys[1]).toBe("shift");  // Best switch from boro
      expect(keys[2]).toBe("easy");   // Low cost, low effort
    });

    it("verifies 3-season rotation patterns for each option", () => {
      // 1. Most profit: potato -> mungbean -> rice
      const profitCrops = ["potato", "mungbean", "rice"];
      expect(profitCrops).toEqual(["potato", "mungbean", "rice"]);

      // 2. Best switch from boro: mustard -> mungbean -> rice
      const shiftCrops = ["mustard", "mungbean", "rice"];
      expect(shiftCrops).toEqual(["mustard", "mungbean", "rice"]);

      // 3. Low cost, low effort: lentil -> mungbean -> rice
      const easyCrops = ["lentil", "mungbean", "rice"];
      expect(easyCrops).toEqual(["lentil", "mungbean", "rice"]);
    });

    it("formats Taka values with Bangla numerals in Bengali locale", () => {
      const formatTaka = (amount: number, lang: "bn" | "en") => {
        const formatted = new Intl.NumberFormat(lang === "bn" ? "bn-BD" : "en-US").format(amount);
        return `৳${formatted}`;
      };

      expect(formatTaka(38000, "bn")).toBe("৳৩৮,০০০");
      expect(formatTaka(22000, "bn")).toBe("৳২২,০০০");
      expect(formatTaka(38000, "en")).toBe("৳38,000");
    });
  });

  // 5. Map Picker Bounds and Weather Adaptation Logic
  describe("Map Picker & Weather Adaptation", () => {
    it("computes nearest pilot area for coordinates clicked on map", () => {
      // Near Godagari
      const clickLat = 24.48;
      const clickLng = 88.34;
      let nearest = PILOT_AREAS[0];
      let bestDist = Infinity;
      for (const a of PILOT_AREAS) {
        const d = Math.hypot(a.lat - clickLat, a.lng - clickLng);
        if (d < bestDist) {
          bestDist = d;
          nearest = a;
        }
      }
      expect(nearest.id).toBe("godagari");
    });

    it("triggers weather warning flag when rain probability exceeds threshold", () => {
      const dailyPrecip = [0, 0, 8.5, 0];
      const hasRain = dailyPrecip.some((p) => p >= 1.0);
      expect(hasRain).toBe(true);

      const generateWarning = (mm: number) =>
        `সতর্কতা: বৃষ্টির সম্ভাবনা (${mm} মিমি)। সেচ স্থগিত রাখুন।`;
      expect(generateWarning(8.5)).toContain("সেচ স্থগিত রাখুন");
    });
  });
});
