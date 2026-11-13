"use client";

import React, { useState } from "react";
import {
  CloudRain,
  Sun,
  Thermometer,
  Wind,
  ShieldAlert,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Calculator,
  Info,
  Award,
} from "lucide-react";
import picsaDataRaw from "@/data/picsa_climate_history.json";

interface MonthlyStat {
  month: number;
  month_bn: string;
  month_en: string;
  precip_mm: number;
  temp_mean: number;
  temp_max: number;
  temp_min: number;
}

interface CropMatching {
  season: string;
  season_bn: string;
  season_en: string;
  crops: string[];
  climate_fit_bn: string;
  climate_fit_en: string;
  source: string;
}

interface DistrictPicsa {
  district_bn: string;
  district_en: string;
  aez: string;
  annual_rainfall_mm: number;
  rainy_season_onset: { window_bn: string; window_en: string };
  rainy_season_cessation: { window_bn: string; window_en: string };
  rainy_season_length_days: number;
  dry_spell_risk_kharif1_pct: number;
  dry_spell_desc_bn: string;
  dry_spell_desc_en: string;
  heat_stress_risk_pct: number;
  heat_stress_desc_bn: string;
  heat_stress_desc_en: string;
  cold_spell_risk_pct: number;
  cold_spell_desc_bn: string;
  cold_spell_desc_en: string;
  monthly: MonthlyStat[];
  crop_matching_options: CropMatching[];
}

export interface PicsaClimateSectionProps {
  districtEn: string;
  upazilaBn: string;
  upazilaEn: string;
  lang?: "bn" | "en";
  onOpenCostBreakdown?: () => void;
}

const picsaDatabase = picsaDataRaw as {
  metadata: Record<string, string>;
  districts: Record<string, DistrictPicsa>;
};

export const PicsaClimateSection: React.FC<PicsaClimateSectionProps> = ({
  districtEn,
  upazilaBn,
  upazilaEn,
  lang = "bn",
  onOpenCostBreakdown,
}) => {
  const [activeTab, setActiveTab] = useState<"rainfall" | "temperature">("rainfall");
  const [expandedOption, setExpandedOption] = useState<number | null>(null);

  // Normalize district key
  const normalizedDistrict =
    Object.keys(picsaDatabase.districts).find(
      (k) => k.toLowerCase() === districtEn.toLowerCase()
    ) || "Rajshahi";

  const data: DistrictPicsa = picsaDatabase.districts[normalizedDistrict] || picsaDatabase.districts["Rajshahi"];

  const t = {
    bn: {
      title: "৩০ বছরের জলবায়ু ইতিহাস ও ঝুঁকি বিশ্লেষণ (PICSA)",
      badge: "নাসা উপগ্রহ (NASA POWER) ও পিকসা ফ্রেমওয়ার্ক",
      subtitle: `${data.district_bn} জেলা ও ${upazilaBn} উপজেলার জন্য নাসা উপগ্রহ ও আবহাওয়া অধিদপ্তরের দীর্ঘমেয়াদি জলবায়ু তথ্যের সারসংক্ষেপ।`,
      aezLabel: "কৃষি-পরিবেশ অঞ্চল (AEZ):",
      onset: "বর্ষা শুরু (সাধারণ গড়)",
      cessation: "বর্ষা বিদায় (সম্ভাব্য)",
      length: "বর্ষা মৌসুমের স্থায়ীত্ব",
      lengthUnit: "দিন",
      annualRain: "বার্ষিক গড় বৃষ্টিপাত",
      mmUnit: "মিমি",
      riskTitle: "কৃষি জলবায়ু ঝুঁকি ও সম্ভাব্যতার সূচক (৩০ বছরের নাসা উপাত্ত)",
      drySpellTitle: "খরিপ-১ খরা ঝুঁকি (টানা ১০+ দিন বৃষ্টিহীন)",
      drySpellTip: "প্রাক-বর্ষা মৌসুমে চৈত্র–জ্যৈষ্ঠে টানা শুষ্ক সময়ের ঝুঁকি। প্রতিকার: খরাসহনশীল স্বল্পমেয়াদি জাত (ব্রি ধান৭১/৮৩) বা মুগডাল চাষ।",
      heatStressTitle: "চৈত্র–বৈশাখ তাপপ্রবাহ ঝুঁকি (> ৩৫°সে)",
      heatStressTip: "মার্চ–এপ্রিলে বোরো ধানের থোড় ও পরাগায়নের সময় অতিরিক্ত গরমে চিটা হওয়ার ঝুঁকি। সেচ ও পটাশ স্প্রে নিশ্চিত করুন।",
      coldSpellTitle: "পৌষ–মাঘ শৈত্যপ্রবাহ ঝুঁকি (< ১০°সে)",
      coldSpellTip: "ডিসেম্বর–জানুয়ারিতে আলুর নাবী ধসা (Late Blight) ও বোরো বীজতলার ক্ষতির ঝুঁকি। পলিথিন ছাউনি ব্যবহার করুন।",
      chartTitle: "ঐতিহাসিক মাসিক আবহাওয়া লেখচিত্র",
      chartRainTab: "মাসিক বৃষ্টিপাত (মিমি)",
      chartTempTab: "তাপমাত্রা (°সে)",
      maxTemp: "সর্বোচ্চ",
      minTemp: "সর্বনিম্ন",
      cropsTitle: "জলবায়ু ঝুঁকি অনুযায়ী উপযোগী ফসল ও ব্যবস্থাপনা (DAE/BARI/BRRI)",
      participatoryBtn: "অংশগ্রহণমূলক ব্যয় বাজেট ও লাভ হিসাব করুন (Participatory Budget)",
      sources: "উৎস ও স্বীকৃতি:",
      sourcesList: "১. NASA POWER Agroclimatology (১৯৯১–২০২৪) | ২. বাংলাদেশ কৃষি সম্প্রসারণ অধিদপ্তর (DAE) | ৩. বাংলাদেশ ধান গবেষণা ইনস্টিটিউট (BRRI) | ৪. বাংলাদেশ কৃষি গবেষণা ইনস্টিটিউট (BARI) | ৫. বার্ক সার নির্দেশিকা (BARC FRG ২০২৪)",
    },
    en: {
      title: "30-Year Climate History & Risk Analysis (PICSA)",
      badge: "NASA POWER Satellite Climatology & PICSA Framework",
      subtitle: `Long-term historical climate baseline and risk analysis for ${upazilaEn}, ${data.district_en} District.`,
      aezLabel: "Agro-Ecological Zone (AEZ):",
      onset: "Monsoon Onset Window",
      cessation: "Monsoon Cessation Window",
      length: "Monsoon Duration",
      lengthUnit: "days",
      annualRain: "Mean Annual Rainfall",
      mmUnit: "mm",
      riskTitle: "Agro-Climatic Risk Probabilities (30-Year NASA POWER Climatology)",
      drySpellTitle: "Kharif-1 Dry Spell Risk (> 10 consecutive dry days)",
      drySpellTip: "Pre-monsoon drought spell risk during vegetative stage. Recommendation: Drought-tolerant varieties (BRRI dhan71/83) or pulse relay.",
      heatStressTitle: "Pre-Monsoon Heat Stress Risk (> 35°C for 3+ days)",
      heatStressTip: "Risk of high temperatures during Boro rice flowering in March-April causing sterility. Keep standing water.",
      coldSpellTitle: "Winter Cold Injury Risk (< 10°C)",
      coldSpellTip: "Risk of cold snaps causing potato late blight and seedling yellowing in Dec-Jan. Use polythene nursery cover.",
      chartTitle: "Historical Monthly Climatology Chart",
      chartRainTab: "Monthly Rainfall (mm)",
      chartTempTab: "Temperature (°C)",
      maxTemp: "Max",
      minTemp: "Min",
      cropsTitle: "Climate-Matched Crop Options & Agronomic Practices (DAE/BARI/BRRI)",
      participatoryBtn: "Open Participatory Budget & Edit Farm Costs",
      sources: "Sources & Citations:",
      sourcesList: "1. NASA POWER Agroclimatology (1991–2024 Daily Data) | 2. Department of Agricultural Extension (DAE) | 3. BRRI High Barind Drought Recommendations | 4. BARI Agronomic Guides | 5. BARC Fertilizer Guide 2024",
    },
  }[lang];

  // Helper for Bangladeshi numeral formatting
  const toLocaleNum = (val: number | string) => {
    return lang === "bn"
      ? new Intl.NumberFormat("bn-BD").format(Number(val))
      : String(val);
  };

  // Find max precipitation for chart scaling
  const maxPrecip = Math.max(...data.monthly.map((m) => m.precip_mm), 300);

  return (
    <section
      aria-label={t.title}
      className="bg-white border border-border/80 rounded-3xl p-4 sm:p-6 shadow-sm mb-6 transition-all"
    >
      {/* Header Badge & Title */}
      <div className="flex flex-col gap-2 mb-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
            <Award className="w-3.5 h-3.5 text-emerald-700" />
            {t.badge}
          </span>
          <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-md">
            {t.aezLabel} {data.aez}
          </span>
        </div>

        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          {t.title}
        </h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          {t.subtitle}
        </p>
      </div>

      {/* 4 Core Climate Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 mb-5">
        {/* Onset */}
        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-1">
            <Calendar className="w-3.5 h-3.5 text-emerald-700" />
            <span>{t.onset}</span>
          </div>
          <div className="text-base sm:text-lg font-bold text-slate-900">
            {lang === "bn" ? data.rainy_season_onset.window_bn : data.rainy_season_onset.window_en}
          </div>
        </div>

        {/* Cessation */}
        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-1">
            <Calendar className="w-3.5 h-3.5 text-amber-700" />
            <span>{t.cessation}</span>
          </div>
          <div className="text-base sm:text-lg font-bold text-slate-900">
            {lang === "bn" ? data.rainy_season_cessation.window_bn : data.rainy_season_cessation.window_en}
          </div>
        </div>

        {/* Season Duration */}
        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-1">
            <CloudRain className="w-3.5 h-3.5 text-blue-700" />
            <span>{t.length}</span>
          </div>
          <div className="text-base sm:text-lg font-bold text-slate-900">
            {toLocaleNum(data.rainy_season_length_days)} {t.lengthUnit}
          </div>
        </div>

        {/* Total Annual Rain */}
        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-1">
            <CloudRain className="w-3.5 h-3.5 text-cyan-700" />
            <span>{t.annualRain}</span>
          </div>
          <div className="text-base sm:text-lg font-bold text-slate-900">
            {toLocaleNum(data.annual_rainfall_mm)} {t.mmUnit}
          </div>
        </div>
      </div>

      {/* PICSA Climate Risk Probabilities */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 mb-5 space-y-4">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-600" />
          <span>{t.riskTitle}</span>
        </h3>

        {/* Risk 1: Dry Spell */}
        <div>
          <div className="flex items-center justify-between text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
            <span>{t.drySpellTitle}</span>
            <span className="font-bold text-amber-800">
              {toLocaleNum(data.dry_spell_risk_kharif1_pct)}%
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                data.dry_spell_risk_kharif1_pct > 20
                  ? "bg-amber-600"
                  : "bg-emerald-600"
              }`}
              style={{ width: `${Math.min(data.dry_spell_risk_kharif1_pct * 2.5, 100)}%` }}
            />
          </div>
          <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
            {lang === "bn" ? data.dry_spell_desc_bn : data.dry_spell_desc_en}
            {" "}<span className="text-slate-500 italic">{t.drySpellTip}</span>
          </p>
        </div>

        {/* Risk 2: Heat Stress */}
        <div className="pt-2 border-t border-slate-200/70">
          <div className="flex items-center justify-between text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
            <span>{t.heatStressTitle}</span>
            <span className="font-bold text-orange-800">
              {toLocaleNum(data.heat_stress_risk_pct)}%
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
            <div
              className="h-full bg-orange-600 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(data.heat_stress_risk_pct * 1.5, 100)}%` }}
            />
          </div>
          <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
            {lang === "bn" ? data.heat_stress_desc_bn : data.heat_stress_desc_en}
            {" "}<span className="text-slate-500 italic">{t.heatStressTip}</span>
          </p>
        </div>

        {/* Risk 3: Cold Spell */}
        <div className="pt-2 border-t border-slate-200/70">
          <div className="flex items-center justify-between text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
            <span>{t.coldSpellTitle}</span>
            <span className="font-bold text-sky-800">
              {toLocaleNum(data.cold_spell_risk_pct)}%
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
            <div
              className="h-full bg-sky-600 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(data.cold_spell_risk_pct * 2, 100)}%` }}
            />
          </div>
          <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
            {lang === "bn" ? data.cold_spell_desc_bn : data.cold_spell_desc_en}
            {" "}<span className="text-slate-500 italic">{t.coldSpellTip}</span>
          </p>
        </div>
      </div>

      {/* Interactive Monthly Climatology Chart */}
      <div className="bg-slate-50/70 border border-slate-200 rounded-2xl p-4 mb-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs sm:text-sm font-bold text-slate-800">
            {t.chartTitle}
          </h3>
          <div className="flex rounded-lg bg-slate-200/80 p-0.5 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab("rainfall")}
              className={`px-2.5 py-1 rounded-md transition-all ${
                activeTab === "rainfall"
                  ? "bg-white text-slate-900 shadow-2xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {t.chartRainTab}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("temperature")}
              className={`px-2.5 py-1 rounded-md transition-all ${
                activeTab === "temperature"
                  ? "bg-white text-slate-900 shadow-2xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {t.chartTempTab}
            </button>
          </div>
        </div>

        {/* Visual Bar Graph */}
        <div className="pt-2 pb-1">
          <div className="h-40 flex items-end justify-between gap-1 sm:gap-2 px-1 border-b border-slate-300 pb-1">
            {data.monthly.map((m) => {
              const label = lang === "bn" ? m.month_bn : m.month_en;

              if (activeTab === "rainfall") {
                const heightPct = Math.max((m.precip_mm / maxPrecip) * 100, 4);
                return (
                  <div key={m.month} className="flex-1 flex flex-col items-center group relative">
                    {/* Tooltip */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 bg-slate-900 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow pointer-events-none whitespace-nowrap z-10">
                      {toLocaleNum(m.precip_mm)} mm
                    </div>
                    {/* Bar */}
                    <div
                      className="w-full bg-blue-500 group-hover:bg-blue-600 rounded-t transition-all"
                      style={{ height: `${heightPct}%` }}
                    />
                    <span className="text-[10px] sm:text-[11px] font-semibold text-slate-600 mt-1">
                      {label}
                    </span>
                  </div>
                );
              } else {
                // Temperature Range
                const minH = Math.max((m.temp_min / 45) * 100, 5);
                const maxH = Math.max((m.temp_max / 45) * 100, 10);
                return (
                  <div key={m.month} className="flex-1 flex flex-col items-center group relative">
                    {/* Tooltip */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-10 bg-slate-900 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow pointer-events-none whitespace-nowrap z-10 text-center">
                      <div>{t.maxTemp}: {toLocaleNum(m.temp_max)}°C</div>
                      <div>{t.minTemp}: {toLocaleNum(m.temp_min)}°C</div>
                    </div>
                    {/* Bar Range */}
                    <div className="w-full flex flex-col items-center justify-end h-full">
                      <div
                        className="w-full bg-orange-400 group-hover:bg-orange-500 rounded-t transition-all"
                        style={{ height: `${maxH - minH}%` }}
                      />
                      <div
                        className="w-full bg-sky-200 rounded-b transition-all"
                        style={{ height: `${minH}%` }}
                      />
                    </div>
                    <span className="text-[10px] sm:text-[11px] font-semibold text-slate-600 mt-1">
                      {label}
                    </span>
                  </div>
                );
              }
            })}
          </div>
          <div className="text-[11px] text-slate-500 text-right mt-1.5">
            {activeTab === "rainfall"
              ? lang === "bn"
                ? "বার্ষিক মোট বৃষ্টিপাত নাসা দৈনিক তথ্য (১৯৯১–২০২৪) থেকে পরিমাপকৃত।"
                : "NASA POWER 30-year daily satellite precip climatology."
              : lang === "bn"
              ? "কমলা: সর্বোচ্চ তাপমাত্রা, নীল: সর্বনিম্ন তাপমাত্রা (°সে)"
              : "Orange: Max Temp, Blue: Min Temp (°C)"}
          </div>
        </div>
      </div>

      {/* Climate-Matched Agronomic Choices & Guidelines (DAE/BARI/BRRI) */}
      <div className="mb-5 space-y-3">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-700" />
          <span>{t.cropsTitle}</span>
        </h3>

        <div className="space-y-2.5">
          {data.crop_matching_options.map((opt, idx) => (
            <div
              key={opt.season}
              className="p-3.5 rounded-2xl bg-white border border-slate-200/90 hover:border-slate-300 transition-all shadow-2xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-800">
                  {lang === "bn" ? opt.season_bn : opt.season_en}
                </span>
                <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  {opt.source}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                {lang === "bn" ? opt.climate_fit_bn : opt.climate_fit_en}
              </p>
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {opt.crops.map((c, i) => (
                  <span
                    key={i}
                    className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Participatory Budgeting Button (PICSA Step: Participatory Budgeting) */}
      {onOpenCostBreakdown && (
        <button
          type="button"
          onClick={onOpenCostBreakdown}
          className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-800 to-emerald-950 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 hover:opacity-95 shadow-sm active:scale-[0.99] transition-all min-h-[46px] cursor-pointer"
        >
          <Calculator className="w-4 h-4 text-amber-300" />
          <span>{t.participatoryBtn}</span>
        </button>
      )}

      {/* Verified Citations Footer */}
      <div className="mt-5 pt-3 border-t border-slate-200/80 text-[11px] text-slate-500 leading-normal">
        <strong className="text-slate-700">{t.sources}</strong> {t.sourcesList}
      </div>
    </section>
  );
};
