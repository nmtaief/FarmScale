"use client";

import React, { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Slider } from "@/components/ui/Slider";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { RotationCard } from "@/components/planner/RotationCard";
import { BottomSheet } from "@/components/ui/BottomSheet";
import {
  Droplets,
  DollarSign,
  Sprout,
  Sliders,
  Settings2,
  RotateCcw,
  AlertCircle,
  Scale,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { useAppStore } from "@/lib/store/useAppStore";
import { rankRotations, SAMPLE_ROTATIONS } from "@farmscale/scoring";
import { toBengaliNumerals } from "@/lib/i18n/numerals";

export default function PlannerPage() {
  const t = useTranslations("planner");
  const tCommon = useTranslations("common");
  const locale = useLocale();

  const priorities = useAppStore((s) => s.priorities);
  const setPriorities = useAppStore((s) => s.setPriorities);
  const setPriority = useAppStore((s) => s.setPriority);
  const soilOverrides = useAppStore((s) => s.soilOverrides);
  const setSoilOverrides = useAppStore((s) => s.setSoilOverrides);
  const resetPriorities = useAppStore((s) => s.resetPriorities);
  const viewMode = useAppStore((s) => s.viewMode);

  const [soilModalOpen, setSoilModalOpen] = useState(false);
  const [customSoc, setCustomSoc] = useState(
    soilOverrides?.organicCarbonPercent !== undefined
      ? String(soilOverrides.organicCarbonPercent)
      : "0.68"
  );
  const [customPh, setCustomPh] = useState(
    soilOverrides?.ph !== undefined ? String(soilOverrides.ph) : "5.8"
  );

  // Deterministic scoring calculation
  const rankedRotations = rankRotations(SAMPLE_ROTATIONS, priorities, soilOverrides);
  const allZero = priorities.water === 0 && priorities.income === 0 && priorities.soil === 0;

  // Active simple choice preset detection
  const isWaterPreset = priorities.water >= 9 && priorities.income <= 4;
  const isIncomePreset = priorities.income >= 9 && priorities.water <= 4;
  const isSoilPreset = priorities.soil >= 9 && priorities.income <= 4;
  const isBalancedPreset = !isWaterPreset && !isIncomePreset && !isSoilPreset;

  const handleSelectPreset = (preset: "water" | "income" | "soil" | "balanced") => {
    switch (preset) {
      case "water":
        setPriorities({ water: 10, income: 2, soil: 4 });
        break;
      case "income":
        setPriorities({ water: 2, income: 10, soil: 3 });
        break;
      case "soil":
        setPriorities({ water: 4, income: 2, soil: 10 });
        break;
      case "balanced":
      default:
        setPriorities({ water: 6, income: 6, soil: 6 });
        break;
    }
  };

  const handleSaveSoil = () => {
    const soc = parseFloat(customSoc);
    const ph = parseFloat(customPh);
    setSoilOverrides({
      organicCarbonPercent: isNaN(soc) ? undefined : soc,
      ph: isNaN(ph) ? undefined : ph,
    });
    setSoilModalOpen(false);
  };

  const handleClearSoilOverrides = () => {
    setSoilOverrides(undefined);
    setCustomSoc("0.68");
    setCustomPh("5.8");
    setSoilModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Honest sample notice banner */}
      <div className="p-3.5 rounded-md bg-leaf/10 border border-leaf/30 text-xs text-primary leading-relaxed">
        <span className="font-bold text-leaf mr-1.5">পাইলট প্রাক্কলন:</span>
        {tCommon("honestSampleBanner")}
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <span className="text-xs uppercase font-mono font-bold tracking-wider text-secondary">
            {viewMode === "expert" ? "Multi-Objective Deterministic Planner" : "সহজ কৃষক পরিকল্পনা"}
          </span>
          <h1 className="text-2xl sm:text-4xl font-serif font-bold text-primary m-0">
            {t("title")}
          </h1>
          <p className="text-sm text-secondary m-0 mt-1">
            {t("subtitle")}
          </p>
        </div>

        {/* Soil Override Control (Expert View Only) */}
        {viewMode === "expert" && (
          <div className="flex items-center gap-2">
            {soilOverrides && <Chip state="sample">Using your soil values</Chip>}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSoilModalOpen(true)}
              className="flex items-center gap-1.5"
            >
              <Settings2 className="w-4 h-4 text-leaf" />
              <span>Override Soil Values</span>
            </Button>
          </div>
        )}
      </div>

      {/* SIMPLE VIEW: 4 Large Choice Cards */}
      {viewMode === "simple" && (
        <section aria-label="Farmer Priority Choice" className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-serif font-bold text-primary m-0">
              {t("priorityQuestion")}
            </h2>
            <button
              type="button"
              onClick={() => handleSelectPreset("balanced")}
              className="text-xs text-secondary hover:text-primary flex items-center gap-1 touch-target min-h-[36px]"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{locale === "bn" ? "রিসেট" : "Reset"}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Choice 1: Save Water */}
            <button
              type="button"
              onClick={() => handleSelectPreset("water")}
              className={`p-4 rounded-xl border text-left transition-all touch-target min-h-[88px] flex flex-col justify-between ${
                isWaterPreset
                  ? "bg-water/15 border-water ring-2 ring-water/40 shadow-card"
                  : "bg-surface border-border hover:border-water/50"
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1.5">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-full bg-water/20 text-water">
                    <Droplets className="w-5 h-5" />
                  </div>
                  <span className="font-bold text-lg text-primary">
                    {t("saveWaterChoice")}
                  </span>
                </div>
                {isWaterPreset && <CheckCircle2 className="w-5 h-5 text-water" />}
              </div>
              <p className="text-xs text-secondary leading-snug m-0">
                {t("saveWaterDesc")}
              </p>
            </button>

            {/* Choice 2: More Income */}
            <button
              type="button"
              onClick={() => handleSelectPreset("income")}
              className={`p-4 rounded-xl border text-left transition-all touch-target min-h-[88px] flex flex-col justify-between ${
                isIncomePreset
                  ? "bg-gold/20 border-gold ring-2 ring-gold/40 shadow-card"
                  : "bg-surface border-border hover:border-gold/50"
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1.5">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-full bg-gold/25 text-amber-800 dark:text-gold">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <span className="font-bold text-lg text-primary">
                    {t("moreIncomeChoice")}
                  </span>
                </div>
                {isIncomePreset && <CheckCircle2 className="w-5 h-5 text-gold-text" />}
              </div>
              <p className="text-xs text-secondary leading-snug m-0">
                {t("moreIncomeDesc")}
              </p>
            </button>

            {/* Choice 3: Improve Soil */}
            <button
              type="button"
              onClick={() => handleSelectPreset("soil")}
              className={`p-4 rounded-xl border text-left transition-all touch-target min-h-[88px] flex flex-col justify-between ${
                isSoilPreset
                  ? "bg-leaf/15 border-leaf ring-2 ring-leaf/40 shadow-card"
                  : "bg-surface border-border hover:border-leaf/50"
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1.5">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-full bg-leaf/20 text-leaf">
                    <Sprout className="w-5 h-5" />
                  </div>
                  <span className="font-bold text-lg text-primary">
                    {t("improveSoilChoice")}
                  </span>
                </div>
                {isSoilPreset && <CheckCircle2 className="w-5 h-5 text-leaf" />}
              </div>
              <p className="text-xs text-secondary leading-snug m-0">
                {t("improveSoilDesc")}
              </p>
            </button>

            {/* Choice 4: Balanced */}
            <button
              type="button"
              onClick={() => handleSelectPreset("balanced")}
              className={`p-4 rounded-xl border text-left transition-all touch-target min-h-[88px] flex flex-col justify-between ${
                isBalancedPreset
                  ? "bg-forest/15 border-forest ring-2 ring-forest/40 shadow-card"
                  : "bg-surface border-border hover:border-forest/50"
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1.5">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-full bg-forest/20 text-forest dark:text-leaf">
                    <Scale className="w-5 h-5" />
                  </div>
                  <span className="font-bold text-lg text-primary">
                    {t("balancedChoice")}
                  </span>
                </div>
                {isBalancedPreset && <CheckCircle2 className="w-5 h-5 text-forest dark:text-leaf" />}
              </div>
              <p className="text-xs text-secondary leading-snug m-0">
                {t("balancedDesc")}
              </p>
            </button>
          </div>
        </section>
      )}

      {/* Main Grid: Sliders Left (Expert View Only) + Ranked Cards Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Sliders Panel (Expert View Only) */}
        {viewMode === "expert" && (
          <aside className="lg:col-span-4 sticky top-28 space-y-6">
            <div className="p-6 rounded-lg bg-surface border border-border shadow-card space-y-6">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-gold" />
                  <h2 className="text-base font-serif font-bold text-primary m-0">
                    Farmer Priorities (0–10)
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={resetPriorities}
                  className="text-xs text-secondary hover:text-primary flex items-center gap-1 touch-target min-h-[30px]"
                  title="Reset sliders"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              </div>

              {/* Slider 1: Save Water */}
              <Slider
                label={t("saveWater")}
                value={priorities.water}
                onChange={(val) => setPriority("water", val)}
                icon={<Droplets className="w-4 h-4 text-water" />}
                accentColor="water"
                description="Favors mustard & rainfed rice over high-pumping boro"
              />

              {/* Slider 2: Earn Income */}
              <Slider
                label={t("earnIncome")}
                value={priorities.income}
                onChange={(val) => setPriority("income", val)}
                icon={<DollarSign className="w-4 h-4 text-gold-text" />}
                accentColor="gold"
                description="Maximizes gross margin and local market return"
              />

              {/* Slider 3: Rebuild Soil */}
              <Slider
                label={t("rebuildSoil")}
                value={priorities.soil}
                onChange={(val) => setPriority("soil", val)}
                icon={<Sprout className="w-4 h-4 text-leaf" />}
                accentColor="leaf"
                description="Prioritizes legumes that fix nitrogen and add green manure"
              />
            </div>
          </aside>
        )}

        {/* Right Column: Ranked Cards (Spans full width in Simple View, 8 cols in Expert View) */}
        <section
          className={`${viewMode === "expert" ? "lg:col-span-8" : "lg:col-span-12"} space-y-6`}
          aria-label="Ranked Recommendations"
        >
          {allZero ? (
            <div className="p-12 text-center rounded-lg border border-dashed border-border bg-surface/50 space-y-3">
              <AlertCircle className="w-8 h-8 text-secondary mx-auto" />
              <h2 className="text-base font-serif font-bold text-primary m-0">
                {t("zeroPrompt")}
              </h2>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg sm:text-xl font-serif font-bold text-primary m-0">
                  {t("recommendationsCount", {
                    count: toBengaliNumerals(rankedRotations.length, locale),
                  })}
                </h2>
                {viewMode === "expert" && (
                  <span className="text-xs text-muted font-mono">
                    Algorithm: (W&times;R)/&Sigma;W
                  </span>
                )}
              </div>

              {/* Render ALL ranked rotations (Count matches rendered list) */}
              <div className="space-y-5">
                {rankedRotations.map((rotation, idx) => (
                  <RotationCard
                    key={rotation.id}
                    rotation={rotation}
                    isTopRank={idx === 0}
                  />
                ))}
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Soil Overrides Modal (Expert View) */}
      <BottomSheet
        isOpen={soilModalOpen}
        onClose={() => setSoilModalOpen(false)}
        title="Custom Soil & Field Measurements"
      >
        <p className="text-xs text-secondary leading-relaxed">
          If you have local soil test results from DAE, BMDA, or your field sensor, enter them below. The scoring algorithm will adjust crop suitability scores immediately.
        </p>

        <div className="space-y-4 pt-2">
          <div>
            <label className="text-xs font-semibold text-primary block mb-1">
              Topsoil Organic Carbon (SOC %)
            </label>
            <input
              type="number"
              step="0.05"
              min="0.1"
              max="5.0"
              value={customSoc}
              onChange={(e) => setCustomSoc(e.target.value)}
              className="w-full p-2.5 rounded bg-bg border border-border text-primary text-sm focus:outline-none focus:ring-2 focus:ring-gold"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-primary block mb-1">
              Soil pH (H₂O)
            </label>
            <input
              type="number"
              step="0.1"
              min="4.0"
              max="9.0"
              value={customPh}
              onChange={(e) => setCustomPh(e.target.value)}
              className="w-full p-2.5 rounded bg-bg border border-border text-primary text-sm focus:outline-none focus:ring-2 focus:ring-gold"
            />
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-border">
            <button
              type="button"
              onClick={handleClearSoilOverrides}
              className="text-xs text-secondary hover:text-red-600 underline"
            >
              Reset to NASA Baseline
            </button>
            <Button variant="primary" size="sm" onClick={handleSaveSoil}>
              <span>Apply Soil Overrides</span>
            </Button>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}
