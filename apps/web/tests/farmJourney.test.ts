import { describe, it, expect } from "vitest";
import {
  getCropCalendar,
  generateFreshPlan,
  generateAlreadyStartedPlan,
  delayPendingTasks,
  scaleDosage,
  determineCurrentStage,
} from "../src/lib/agronomics/planGenerator";
import {
  getUnitMultiplier,
  formatBDT,
  ROTATION_AGRONOMICS,
  type LandUnit,
} from "../src/lib/agronomics/rotationData";
import { toBengaliNumerals } from "../src/lib/i18n/numerals";
import cropCalendars from "../src/lib/agronomics/crop_calendars.json";

describe("Whole Farmer Journey & Agronomics Acceptance Tests", () => {
  // 1. Crop Calendars Data Integrity
  describe("Crop Calendar JSON Integrity", () => {
    it("contains valid agronomic calendars for key Barind rotation crops", () => {
      const keys = ["mustard", "mungbean", "aman_rice"];
      for (const key of keys) {
        const cal = (cropCalendars as any).crops[key];
        expect(cal, `Missing calendar for ${key}`).toBeDefined();
        expect(cal.cropId).toBe(key);
        expect(cal.cropNameBn).toBeDefined();
        expect(cal.durationDays).toBeGreaterThan(60);
        expect(cal.stages.length).toBeGreaterThanOrEqual(4);
        expect(cal.tasks.length).toBeGreaterThanOrEqual(5);
        expect(cal.sowingWindow.startApproxDate).toBeDefined();
        expect(cal.sowingWindow.endApproxDate).toBeDefined();
      }
    });

    it("ensures fertilizer and input dosages are specified in tasks with standard units", () => {
      const mustard = (cropCalendars as any).crops.mustard;
      const tasksWithDose = mustard.tasks.filter((t: any) => t.dosagePerBighaBn);
      expect(tasksWithDose.length).toBeGreaterThanOrEqual(2);
      
      const prepTask = mustard.tasks.find((t: any) => t.id === "mustard_prep");
      expect(prepTask?.dosagePerBighaBn).toContain("কেজি");
      expect(prepTask?.dosagePerBighaBn).toContain("টিএসপি");
      expect(prepTask?.dosagePerBighaBn).toContain("এমওপি");
    });
  });

  // 2. Fresh Plan Generation
  describe("generateFreshPlan", () => {
    it("generates sequential tasks starting from sowing date", () => {
      const sowingDate = "2026-11-20";
      const plan = generateFreshPlan("mustard", sowingDate, "farm_test_1", 1, "bigha");

      expect(plan.cycle.crop).toBe("mustard");
      expect(plan.cycle.sowingDate).toBe(sowingDate);
      expect(plan.cycle.status).toBe("active");
      expect(plan.tasks.length).toBeGreaterThan(4);

      // Verify all tasks initially start pending for upcoming crop
      plan.tasks.forEach((task) => {
        expect(task.status).toBe("pending");
        expect(task.dueDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      });

      // Land preparation is scheduled before sowing (e.g. day -3)
      const landPrep = plan.tasks.find((t) => t.type === "land_prep");
      expect(landPrep).toBeDefined();
      expect(landPrep!.dueDate < sowingDate).toBe(true);

      // Harvest is scheduled at the end of the duration
      const harvest = plan.tasks.find((t) => t.type === "harvest");
      expect(harvest).toBeDefined();
      expect(harvest!.dueDate > sowingDate).toBe(true);
      expect(plan.cycle.expectedHarvestDate).toBe(harvest!.dueDate);
    });

    it("scales fertilizer dosages correctly for land size and unit", () => {
      // 1 Bigha
      const plan1Bigha = generateFreshPlan("mustard", "2026-11-20", "f1", 1, "bigha");
      // 2 Bigha (double dose)
      const plan2Bigha = generateFreshPlan("mustard", "2026-11-20", "f2", 2, "bigha");
      // 33 Decimal (= 1 Bigha)
      const plan33Dec = generateFreshPlan("mustard", "2026-11-20", "f3", 33, "decimal");

      const task1 = plan1Bigha.tasks.find((t) => t.dosagePerBighaBn);
      const task2 = plan2Bigha.tasks.find((t) => t.dosagePerBighaBn);
      const taskDec = plan33Dec.tasks.find((t) => t.dosagePerBighaBn);

      expect(task1?.scaledDosageBn).toBeDefined();
      expect(task2?.scaledDosageBn).toBeDefined();
      expect(taskDec?.scaledDosageBn).toBeDefined();

      // 2 bigha should scale the numbers differently from 1 bigha
      expect(task2!.scaledDosageBn).not.toEqual(task1!.scaledDosageBn);
      // 33 decimal is identical to 1 bigha
      expect(taskDec!.scaledDosageBn).toEqual(task1!.scaledDosageBn);
    });
  });

  // 3. Already Started Plan Generation
  describe("generateAlreadyStartedPlan", () => {
    it("marks prior tasks as 'done' when starting from an elapsed sowing date", () => {
      // Sown 30 days ago
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const sowingDateStr = thirtyDaysAgo.toISOString().split("T")[0];

      const plan = generateAlreadyStartedPlan(
        "mustard",
        { sowingDate: sowingDateStr },
        "farm_test_2",
        1,
        "bigha"
      );

      expect(plan.cycle.sowingDate).toBe(sowingDateStr);

      // At day 30, land prep, sowing, and thinning should be done
      const completedTasks = plan.tasks.filter((t) => t.status === "done");
      const pendingTasks = plan.tasks.filter((t) => t.status === "pending");

      expect(completedTasks.length).toBeGreaterThan(0);
      expect(pendingTasks.length).toBeGreaterThan(0);

      // Sowing task should be marked done
      const sowingTask = plan.tasks.find((t) => t.type === "sowing");
      expect(sowingTask?.status).toBe("done");

      // Harvest task should still be pending
      const harvestTask = plan.tasks.find((t) => t.type === "harvest");
      expect(harvestTask?.status).toBe("pending");
    });

    it("marks prior tasks as done when starting from a designated stage", () => {
      // Farmer selects "flowering" stage
      const plan = generateAlreadyStartedPlan(
        "mustard",
        { stageId: "flowering" },
        "farm_test_3",
        1,
        "bigha"
      );

      expect(plan.cycle.currentStage).toBe("flowering");

      // Tasks before flowering (land_prep, sowing, vegetative) must be marked done
      const sowingTask = plan.tasks.find((t) => t.type === "sowing");
      expect(sowingTask?.status).toBe("done");

      // Harvest must be pending
      const harvestTask = plan.tasks.find((t) => t.type === "harvest");
      expect(harvestTask?.status).toBe("pending");
    });
  });

  // 4. Task Delay & Shift Functionality
  describe("delayPendingTasks", () => {
    it("shifts pending task dates forward while leaving completed tasks untouched", () => {
      const sowingDate = "2026-11-20";
      const plan = generateFreshPlan("mustard", sowingDate, "farm_test_4", 1, "bigha");

      // Mark first task as done
      plan.tasks[0].status = "done";
      const origDoneDate = plan.tasks[0].dueDate;
      const origPendingDate = plan.tasks[1].dueDate;

      const { updatedTasks } = delayPendingTasks(plan.tasks, 5, "mustard");

      // Done task unchanged
      expect(updatedTasks[0].dueDate).toBe(origDoneDate);

      // Pending task shifted by 5 days
      const d1 = new Date(origPendingDate);
      const d2 = new Date(updatedTasks[1].dueDate);
      const diffDays = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
      expect(diffDays).toBe(5);
    });

    it("generates an agronomic late harvest warning when shifted into hot dry weather", () => {
      const sowingDate = "2026-11-20";
      const plan = generateFreshPlan("mustard", sowingDate, "farm_test_5", 1, "bigha");

      // Delaying by 35 days pushes mustard harvest to March 15 (extreme heat/shattering risk)
      const { warningBn, warningEn } = delayPendingTasks(plan.tasks, 35, "mustard");

      expect(warningBn).toBeDefined();
      expect(warningBn).toContain("সতর্কতা");
      expect(warningEn).toBeDefined();
      expect(warningEn).toContain("Warning");
    });
  });

  // 5. Land Unit Multipliers & Formatting
  describe("Land Unit Scaling", () => {
    it("correctly converts between Bigha, Decimal, and Acre", () => {
      // 1 Bigha = 1.0x
      expect(getUnitMultiplier("bigha")).toBe(1.0);

      // 1 Decimal = 1/33 Bigha (~0.0303)
      expect(getUnitMultiplier("decimal")).toBeCloseTo(1 / 33, 4);

      // 1 Acre = 100/33 Bigha (~3.0303)
      expect(getUnitMultiplier("acre")).toBeCloseTo(100 / 33, 4);
    });

    it("formats BDT currency with Bengali numerals when requested", () => {
      const formattedBn = formatBDT(25000, "bn");
      expect(formattedBn).toContain("৳");
      expect(formattedBn).toContain("২৫,০০০");

      const formattedEn = formatBDT(25000, "en");
      expect(formattedEn).toContain("৳");
      expect(formattedEn).toContain("25,000");
    });

    it("converts numbers to Bengali numerals accurately", () => {
      expect(toBengaliNumerals(0)).toBe("০");
      expect(toBengaliNumerals(123456789)).toBe("১২৩৪৫৬৭৮৯");
      expect(toBengaliNumerals("2026-11-15")).toBe("২০২৬-১১-১৫");
    });
  });

  // 6. Regex Pattern Matching for Farmer Intent Parser
  describe("Farmer Intent Regex Extraction", () => {
    it("extracts Barind upazila locations accurately from natural Bangla speech", () => {
      const inputs = [
        { text: "আমার জমি গোদাগাড়ী তে ৩ বিঘা", expected: "Godagari Upazila, Barind" },
        { text: "তানোর এ দুই বিঘা জমিতে কি করব", expected: "Tanore Upazila, Barind" },
        { text: "পবা উপজেলার কৃষক", expected: "Paba Upazila, Barind" },
        { text: "রাজশাহী সদর", expected: "Rajshahi Sadar, Barind" },
      ];

      const locationRules = [
        { regex: /গোদাগাড়ী|godagari/i, name: "Godagari Upazila, Barind" },
        { regex: /তানোর|tanore/i, name: "Tanore Upazila, Barind" },
        { regex: /পবা|paba/i, name: "Paba Upazila, Barind" },
        { regex: /রাজশাহী|rajshahi/i, name: "Rajshahi Sadar, Barind" },
      ];

      for (const item of inputs) {
        const match = locationRules.find((rule) => rule.regex.test(item.text));
        expect(match?.name).toBe(item.expected);
      }
    });

    it("extracts land sizes and units accurately from natural Bangla speech", () => {
      const regex = /(\d+|[০-৯]+)\s*(বিঘা|শতক|ডেসিমাল|একর|bigha|decimal|acre)/i;

      const bnDigits: Record<string, string> = {
        "০": "0", "১": "1", "২": "2", "৩": "3", "৪": "4",
        "৫": "5", "৬": "6", "৭": "7", "৮": "8", "৯": "9",
      };

      const parse = (text: string) => {
        const m = text.match(regex);
        if (!m) return null;
        const rawNum = m[1].replace(/[০-৯]/g, (d) => bnDigits[d] || d);
        const rawUnit = m[2].toLowerCase();
        const unit = rawUnit.includes("শতক") || rawUnit.includes("ডেসিমাল") || rawUnit.includes("dec")
          ? "decimal"
          : rawUnit.includes("একর") || rawUnit.includes("acre")
          ? "acre"
          : "bigha";
        return { size: parseFloat(rawNum), unit };
      };

      expect(parse("আমার ৩ বিঘা জমি আছে")).toEqual({ size: 3, unit: "bigha" });
      expect(parse("৫০ শতক জমিতে সরিষা করব")).toEqual({ size: 50, unit: "decimal" });
      expect(parse("২ একর জমিতে লাভ চাই")).toEqual({ size: 2, unit: "acre" });
    });
  });
});
