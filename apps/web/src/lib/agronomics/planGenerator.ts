import cropCalendarsData from "./crop_calendars.json";
import { getUnitMultiplier, type LandUnit } from "./rotationData";
import { toBengaliNumerals } from "@/lib/i18n/numerals";

export interface Farm {
  id: string;
  locationId: string;
  locationName: string;
  district: string;
  lat: number;
  lon: number;
  landSize: number;
  unit: LandUnit;
  goal: "save_water" | "more_income" | "improve_soil" | "balanced";
  rotationId: string;
  currentCrop?: string;
  createdAt: string;
}

export interface CropCycle {
  farmId: string;
  season: "rabi" | "kharif_1" | "kharif_2";
  crop: string;
  status: "planned" | "active" | "done";
  sowingDate: string; // YYYY-MM-DD
  currentStage: string;
  expectedHarvestDate: string;
}

export type TaskType =
  | "land_prep"
  | "sowing"
  | "irrigation"
  | "fertilizer"
  | "weeding"
  | "pest_check"
  | "harvest"
  | "storage";

export interface Task {
  id: string;
  cycleId: string;
  dueDate: string; // YYYY-MM-DD
  type: TaskType;
  titleBn: string;
  titleEn: string;
  instructionBn: string;
  instructionEn: string;
  whyBn: string;
  whyEn: string;
  dosagePerBighaBn?: string;
  dosagePerBighaEn?: string;
  scaledDosageBn?: string;
  scaledDosageEn?: string;
  status: "pending" | "done" | "skipped";
  doneAt?: string;
  isWeatherSensitive?: boolean;
  weatherAlertTrigger?: "rain" | "heat" | "none";
}

export interface CropCalendarStage {
  id: string;
  labelBn: string;
  labelEn: string;
  dayOffset: number;
}

export interface CropCalendarTemplate {
  cropId: string;
  cropNameBn: string;
  cropNameEn: string;
  season: "rabi" | "kharif_1" | "kharif_2";
  durationDays: number;
  sowingWindow: {
    startMonthBn: string;
    endMonthBn: string;
    startApproxDate: string;
    endApproxDate: string;
    descriptionBn: string;
    descriptionEn: string;
  };
  stages: CropCalendarStage[];
  tasks: Array<{
    id: string;
    stageId: string;
    dayOffset: number;
    type: TaskType;
    titleBn: string;
    titleEn: string;
    instructionBn: string;
    instructionEn: string;
    whyBn: string;
    whyEn: string;
    dosagePerBighaBn?: string;
    dosagePerBighaEn?: string;
    isWeatherSensitive?: boolean;
    weatherAlertTrigger?: "rain" | "heat" | "none";
  }>;
}

export function getCropCalendar(cropId: string): CropCalendarTemplate {
  const calendars = (cropCalendarsData as any).crops;
  const cal = calendars[cropId] || calendars["mustard"];
  return cal;
}

/**
 * Date calculation helpers
 */
export function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().split("T")[0];
}

export function daysBetween(dateStrA: string, dateStrB: string): number {
  const a = new Date(dateStrA + "T00:00:00Z");
  const b = new Date(dateStrB + "T00:00:00Z");
  const diffMs = b.getTime() - a.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export const BANGLA_MONTHS = [
  "বৈশাখ", "জ্যৈষ্ঠ", "আষাঢ়", "শ্রাবণ", "ভাদ্র", "আশ্বিন",
  "কার্তিক", "অগ্রহায়ণ", "পৌষ", "মাঘ", "ফাল্গুন", "চৈত্র"
];

const ENGLISH_MONTHS_BN = [
  "জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন",
  "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"
];

export function formatReadableDate(dateStr: string, locale = "bn"): string {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  const year = parts[0];
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);

  if (locale === "bn") {
    const monthName = ENGLISH_MONTHS_BN[monthIdx] || parts[1];
    return `${toBengaliNumerals(day, "bn")} ${monthName} ${toBengaliNumerals(year, "bn")}`;
  }

  const enMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${enMonths[monthIdx]} ${day}, ${year}`;
}

/**
 * Determine current stage from sowing date and duration
 */
export function determineCurrentStage(
  template: CropCalendarTemplate,
  sowingDate: string,
  asOfDate = getTodayDateString()
): CropCalendarStage {
  const elapsed = daysBetween(sowingDate, asOfDate);

  // If sowing date is in future or today is land prep
  if (elapsed < 0) {
    return template.stages[0]; // land prep
  }

  // Find the highest stage where stage.dayOffset <= elapsed
  let current = template.stages[0];
  for (const stage of template.stages) {
    if (elapsed >= stage.dayOffset) {
      current = stage;
    }
  }

  return current;
}

/**
 * Scale dosage text by land size and unit
 */
export function scaleDosage(
  dosageBigha: string | undefined,
  landSize: number,
  unit: LandUnit,
  locale = "bn"
): string {
  if (!dosageBigha) return "";
  const multiplier = getUnitMultiplier(unit) * landSize;

  const bnToAscii: Record<string, string> = {
    "০": "0", "১": "1", "২": "2", "৩": "3", "৪": "4",
    "৫": "5", "৬": "6", "৭": "7", "৮": "8", "৯": "9",
  };

  // Match numbers in both ASCII and Bengali digits
  const scaled = dosageBigha.replace(/([0-9০-৯]+(\.[0-9০-৯]+)?)\s*(কেজি|kg|গ্রাম|g)/gi, (match, rawNum, _, unitWord) => {
    const asciiNum = rawNum.replace(/[০-৯]/g, (d: string) => bnToAscii[d] || d);
    const parsed = parseFloat(asciiNum);
    if (isNaN(parsed)) return match;
    const total = Math.round(parsed * multiplier * 10) / 10;
    const formatted = locale === "bn" ? toBengaliNumerals(total, "bn") : String(total);
    return `${formatted} ${unitWord}`;
  });

  return scaled;
}

/**
 * Fresh plan: farmer starts from a selected sowing date
 */
export function generateFreshPlan(
  cropId: string,
  sowingDate: string,
  farmId: string,
  landSize = 1,
  unit: LandUnit = "bigha",
  locale = "bn"
): { cycle: CropCycle; tasks: Task[] } {
  const template = getCropCalendar(cropId);
  const cycleId = `cycle_${farmId}_${cropId}_${Date.now()}`;
  const today = getTodayDateString();

  const expectedHarvestDate = addDays(sowingDate, template.durationDays);
  const currentStage = determineCurrentStage(template, sowingDate, today);

  // If sowing date is in the future or today, it's a fresh prospective plan: all tasks are pending
  const isFutureOrToday = daysBetween(today, sowingDate) >= 0;

  const tasks: Task[] = template.tasks.map((t, idx) => {
    const dueDate = addDays(sowingDate, t.dayOffset);
    const isPast = !isFutureOrToday && daysBetween(today, dueDate) < 0;

    return {
      id: `task_${cycleId}_${idx}`,
      cycleId,
      dueDate,
      type: t.type,
      titleBn: t.titleBn,
      titleEn: t.titleEn,
      instructionBn: t.instructionBn,
      instructionEn: t.instructionEn,
      whyBn: t.whyBn,
      whyEn: t.whyEn,
      dosagePerBighaBn: t.dosagePerBighaBn,
      dosagePerBighaEn: t.dosagePerBighaEn,
      scaledDosageBn: scaleDosage(t.dosagePerBighaBn, landSize, unit, "bn"),
      scaledDosageEn: scaleDosage(t.dosagePerBighaEn, landSize, unit, "en"),
      status: isPast ? "done" : "pending",
      doneAt: isPast ? dueDate : undefined,
      isWeatherSensitive: t.isWeatherSensitive,
      weatherAlertTrigger: t.weatherAlertTrigger,
    };
  });

  const cycle: CropCycle = {
    farmId,
    season: template.season,
    crop: cropId,
    status: "active",
    sowingDate,
    currentStage: currentStage.id,
    expectedHarvestDate,
  };

  return { cycle, tasks };
}

/**
 * Already started plan: farmer started already.
 * Can provide either a past sowing date OR their current stage!
 */
export function generateAlreadyStartedPlan(
  cropId: string,
  input: { sowingDate?: string; stageId?: string },
  farmId: string,
  landSize = 1,
  unit: LandUnit = "bigha",
  locale = "bn"
): { cycle: CropCycle; tasks: Task[] } {
  const template = getCropCalendar(cropId);
  const cycleId = `cycle_${farmId}_${cropId}_${Date.now()}`;
  const today = getTodayDateString();

  let sowingDate = input.sowingDate;

  // If stageId is provided without sowingDate, calculate estimated sowing date
  if (!sowingDate && input.stageId) {
    const stage = template.stages.find((s) => s.id === input.stageId) || template.stages[1];
    sowingDate = addDays(today, -Math.max(0, stage.dayOffset));
  } else if (!sowingDate) {
    sowingDate = today;
  }

  const expectedHarvestDate = addDays(sowingDate, template.durationDays);
  const currentStage = input.stageId
    ? template.stages.find((s) => s.id === input.stageId) || template.stages[0]
    : determineCurrentStage(template, sowingDate, today);

  const tasks: Task[] = template.tasks.map((t, idx) => {
    const dueDate = addDays(sowingDate!, t.dayOffset);
    // If task was prior to the chosen stage or in the past, mark as done
    const isPastOrPrior =
      t.dayOffset < currentStage.dayOffset || daysBetween(today, dueDate) < 0;

    return {
      id: `task_${cycleId}_${idx}`,
      cycleId,
      dueDate,
      type: t.type,
      titleBn: t.titleBn,
      titleEn: t.titleEn,
      instructionBn: t.instructionBn,
      instructionEn: t.instructionEn,
      whyBn: t.whyBn,
      whyEn: t.whyEn,
      dosagePerBighaBn: t.dosagePerBighaBn,
      dosagePerBighaEn: t.dosagePerBighaEn,
      scaledDosageBn: scaleDosage(t.dosagePerBighaBn, landSize, unit, "bn"),
      scaledDosageEn: scaleDosage(t.dosagePerBighaEn, landSize, unit, "en"),
      status: isPastOrPrior ? "done" : "pending",
      doneAt: isPastOrPrior ? dueDate : undefined,
      isWeatherSensitive: t.isWeatherSensitive,
      weatherAlertTrigger: t.weatherAlertTrigger,
    };
  });

  const cycle: CropCycle = {
    farmId,
    season: template.season,
    crop: cropId,
    status: "active",
    sowingDate,
    currentStage: currentStage.id,
    expectedHarvestDate,
  };

  return { cycle, tasks };
}

/**
 * Shift remaining/pending tasks by N days ("দেরি হয়েছে / তারিখ বদলান")
 */
export function delayPendingTasks(
  tasks: Task[],
  delayDays: number,
  cropId?: string
): { updatedTasks: Task[]; warningBn?: string; warningEn?: string } {
  let warningBn: string | undefined = undefined;
  let warningEn: string | undefined = undefined;

  const updatedTasks = tasks.map((task) => {
    if (task.status === "pending") {
      const newDueDate = addDays(task.dueDate, delayDays);
      return {
        ...task,
        dueDate: newDueDate,
      };
    }
    return task;
  });

  // Check harvest date risk
  const harvestTask = updatedTasks.find((t) => t.type === "harvest");
  if (harvestTask) {
    const harvestMonth = parseInt(harvestTask.dueDate.split("-")[1], 10);
    // If mustard harvested after March (month 3), warn about kharif-1 delay
    if (cropId === "mustard" && (harvestMonth > 3 || (harvestMonth === 3 && parseInt(harvestTask.dueDate.split("-")[2], 10) >= 15))) {
      warningBn = "সতর্কতা: সরিষা কর্তন মার্চ মাসের মাঝামাঝি পার হয়ে গেলে পরবর্তী খরিপ-১ মুগ ডাল বপনের সময় সংকুচিত হয়ে যাবে।";
      warningEn = "Warning: Harvesting mustard past mid-March delays subsequent kharif-1 mungbean planting.";
    }
  }

  return { updatedTasks, warningBn, warningEn };
}
