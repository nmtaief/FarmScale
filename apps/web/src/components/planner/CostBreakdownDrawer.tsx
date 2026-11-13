"use client";

import React, { useState, useMemo } from "react";
import { X, Calculator, RefreshCw, Info, Check, ArrowRight, ShieldCheck, ChevronRight } from "lucide-react";
import { CropIcon, CROP_NAMES } from "@/components/crops/CropIcon";
import costsDataRaw from "@/data/costs.json";

export interface CostBreakdownDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  rotationKey: string;
  rotationTitle: string;
  crops: string[];
  lang: "bn" | "en";
  districtName?: string;
}

const costsData = costsDataRaw as any;

export const CostBreakdownDrawer: React.FC<CostBreakdownDrawerProps> = ({
  isOpen,
  onClose,
  rotationKey,
  rotationTitle,
  crops,
  lang,
  districtName = "Rajshahi",
}) => {
  const [selectedCropIndex, setSelectedCropIndex] = useState<number>(0);
  const [unit, setUnit] = useState<"bigha" | "decimal" | "acre">("bigha");

  // Editable overrides per crop
  const [customEdits, setCustomEdits] = useState<Record<string, Record<string, number>>>({});

  const activeCropKey = crops[selectedCropIndex] || crops[0] || "mustard";
  const cropConfig = costsData.crops[activeCropKey] || costsData.crops["mustard"];

  const t = {
    bn: {
      title: "উৎপাদন খরচ ও লাভ-ক্ষতির পূর্ণাঙ্গ হিসাব",
      subtitle: "সরকারি কৃষি গবেষণা কাউন্সিল (BARC) ও কৃষি বিপণন অধিদপ্তরের (DAM) নির্ভরযোগ্য তথ্য।",
      cropSelect: "ফসল নির্বাচন করুন:",
      unit: "হিসাবের একক:",
      bigha: "বিঘা (৩৩ শতক)",
      decimal: "শতক",
      acre: "একর",
      bestCase: "সর্বোচ্চ লাভ (Best)",
      expectedCase: "প্রত্যাশিত লাভ (Expected)",
      worstCase: "সর্বনিম্ন লাভ (Worst)",
      formula: "লাভ = (প্রত্যাশিত ফলন × বিক্রয়মূল্য) − মোট খরচ",
      lineItems: "খরচের বিস্তারিত খাতসমূহ (প্রতি বিঘায়)",
      source: "উৎস:",
      lastUpdated: "সর্বশেষ হালনাগাদ: নভেম্বর ২০২৬",
      reset: "আগের মানে ফেরত যান",
      close: "বন্ধ করুন",
      editableNote: "আপনার নিজের বীজ বা পারিবারিক শ্রম থাকলে খরচ কমিয়ে প্রকৃত লাভ হিসাব করুন।",
      items: {
        land_preparation: "জমি তৈরি ও চাষ",
        seed: "বীজ বাবদ খরচ",
        irrigation: "সেচ খরচ",
        fertilizer: "সার (ইউরিয়া, টিএসপি, এমওপি, জিপসাম)",
        labour: "শ্রমিক মজুরি (বপন, নিড়ানি ও কাটা)",
        pesticide_fungicide: "বালাইনাশক ও ছত্রাকনাশক",
        transport: "পরিবহন ও হাট খরচ",
        post_harvest: "মাড়াই, শুকানো ও সংরক্ষণ",
        lease_rent: "জমির ইজারা / লিজ (প্রযোজ্য ক্ষেত্রে)",
      } as Record<string, string>,
    },
    en: {
      title: "Cost Breakdown & Participatory Budget",
      subtitle: "Verified data from BARC Fertilizer Guide, DAM Market Rates & BMDA Irrigation Tariffs.",
      cropSelect: "Select Crop:",
      unit: "Calculation Unit:",
      bigha: "Bigha (33 dec)",
      decimal: "Decimal",
      acre: "Acre",
      bestCase: "Best Case Profit",
      expectedCase: "Expected Profit",
      worstCase: "Worst Case Profit",
      formula: "Profit = (Predicted Yield × Farmgate Price) − Total Cost",
      lineItems: "Itemized Cost Breakdown (per bigha)",
      source: "Source:",
      lastUpdated: "Last updated: November 2026",
      reset: "Reset to Official Values",
      close: "Close",
      editableNote: "Adjust costs if using saved seeds or family labour to recalculate live profit.",
      items: {
        land_preparation: "Land Preparation & Tillage",
        seed: "Seed Cost",
        irrigation: "Irrigation Cost",
        fertilizer: "Fertilizer (Urea, TSP, MoP, Gypsum)",
        labour: "Labour Wage (Planting, Weeding, Harvest)",
        pesticide_fungicide: "Plant Protection (Pesticides)",
        transport: "Transport & Market Freight",
        post_harvest: "Threshing & Storage",
        lease_rent: "Land Lease / Rent (if tenant)",
      } as Record<string, string>,
    },
  }[lang];

  // Unit multiplier: bigha = 1, decimal = 1/33, acre = 3.03
  const unitMultiplier = unit === "bigha" ? 1.0 : unit === "decimal" ? 1 / 33 : 3.03;

  // Compute itemized costs with user overrides
  const breakdown = cropConfig?.cost_breakdown_bigha || {};
  const currentCropEdits = customEdits[activeCropKey] || {};

  const landPrepCost = currentCropEdits["land_prep"] ?? breakdown.land_preparation?.cost_bdt ?? 1500;
  const seedCost = currentCropEdits["seed"] ?? breakdown.seed?.cost_bdt ?? 1200;
  const irrigationCost = currentCropEdits["irrigation"] ?? breakdown.irrigation?.cost_bdt ?? 1000;
  const leaseRentCost = currentCropEdits["lease"] ?? breakdown.lease_rent?.cost_bdt ?? 2500;

  // Fertilizer total
  const fertObj = breakdown.fertilizer || {};
  const fertTotal = Object.values(fertObj).reduce((acc: number, f: any) => acc + (f.cost_bdt || 0), 0);

  // Labour total
  const labourObj = breakdown.labour || {};
  const labourTotal = Object.values(labourObj).reduce((acc: number, l: any) => acc + (l.cost_bdt || 0), 0);

  const pesticideCost = breakdown.pesticide_fungicide?.cost_bdt || 800;
  const transportCost = breakdown.transport?.cost_bdt || 500;
  const postHarvestCost = breakdown.post_harvest?.cost_bdt || 500;

  const totalCostBigha =
    landPrepCost + seedCost + irrigationCost + leaseRentCost + fertTotal + labourTotal + pesticideCost + transportCost + postHarvestCost;

  // Yield & Price ranges
  const yields = cropConfig?.yield_range_kg_per_bigha || { worst: 150, expected: 200, best: 250 };
  const prices = cropConfig?.price_range_per_kg || { worst: 25, expected: 30, best: 35 };

  const expectedRevenue = yields.expected * prices.expected;
  const bestRevenue = yields.best * prices.best;
  const worstRevenue = yields.worst * prices.worst;

  const expectedProfit = Math.round((expectedRevenue - totalCostBigha) * unitMultiplier);
  const bestProfit = Math.round((bestRevenue - totalCostBigha) * unitMultiplier);
  const worstProfit = Math.round((worstRevenue - totalCostBigha) * unitMultiplier);

  const formatTaka = (val: number) => `৳${new Intl.NumberFormat(lang === "bn" ? "bn-BD" : "en-US").format(val)}`;

  const handleEdit = (field: string, val: number) => {
    setCustomEdits((prev) => ({
      ...prev,
      [activeCropKey]: {
        ...(prev[activeCropKey] || {}),
        [field]: Math.max(0, val),
      },
    }));
  };

  const handleReset = () => {
    setCustomEdits((prev) => {
      const next = { ...prev };
      delete next[activeCropKey];
      return next;
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-xl lg:max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden max-h-[94vh] flex flex-col font-sans">
        {/* Header */}
        <div className="px-5 py-4 bg-primary text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Calculator className="w-5 h-5 text-gold" />
            <div>
              <h2 className="text-[17px] font-bold leading-tight">{t.title}</h2>
              <p className="text-xs text-slate-300 mt-0.5">{rotationTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-white min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label={t.close}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-slate-800 text-sm">
          {/* Crop Switcher Tabs (3 crops of rotation) */}
          <div className="flex bg-slate-100 p-1 rounded-2xl gap-1">
            {crops.map((cKey, idx) => (
              <button
                key={cKey}
                onClick={() => setSelectedCropIndex(idx)}
                className={`flex-1 py-2 px-2 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition min-h-[44px] ${
                  selectedCropIndex === idx
                    ? "bg-white text-primary shadow-xs border border-slate-200"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <CropIcon crop={cKey} size={22} />
                <span className="truncate">{CROP_NAMES[lang][cKey] || cKey}</span>
              </button>
            ))}
          </div>

          {/* Unit Toggle: Bigha, Decimal, Acre */}
          <div className="flex items-center justify-between bg-slate-50 border border-slate-200/80 px-3 py-2 rounded-xl text-xs">
            <span className="font-semibold text-slate-600">{t.unit}</span>
            <div className="flex gap-1">
              {(["bigha", "decimal", "acre"] as const).map((u) => (
                <button
                  key={u}
                  onClick={() => setUnit(u)}
                  className={`px-3 py-1.5 rounded-lg font-bold transition min-h-[36px] ${
                    unit === u ? "bg-forest text-white" : "bg-white text-slate-600 border border-slate-200"
                  }`}
                >
                  {t[u]}
                </button>
              ))}
            </div>
          </div>

          {/* 3 Profit Scenarios (Best / Expected / Worst) */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-3 rounded-2xl bg-emerald-50/80 border border-emerald-200">
              <span className="text-[11px] font-bold text-emerald-800 uppercase block leading-tight">{t.expectedCase}</span>
              <span className="text-[18px] sm:text-[20px] font-extrabold text-forest block mt-1">
                {formatTaka(expectedProfit)}
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                {yields.expected} কেজি @ {formatTaka(prices.expected)}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200">
              <span className="text-[11px] font-bold text-amber-800 uppercase block leading-tight">{t.bestCase}</span>
              <span className="text-[18px] sm:text-[20px] font-extrabold text-amber-700 block mt-1">
                {formatTaka(bestProfit)}
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                {yields.best} কেজি @ {formatTaka(prices.best)}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-rose-50/70 border border-rose-200">
              <span className="text-[11px] font-bold text-rose-800 uppercase block leading-tight">{t.worstCase}</span>
              <span className="text-[18px] sm:text-[20px] font-extrabold text-rose-700 block mt-1">
                {formatTaka(worstProfit)}
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                {yields.worst} কেজি @ {formatTaka(prices.worst)}
              </span>
            </div>
          </div>

          {/* Formula banner */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-600 flex items-center justify-between">
            <span>{t.formula}</span>
            <span className="font-bold text-primary">
              মোট খরচ: {formatTaka(Math.round(totalCostBigha * unitMultiplier))}
            </span>
          </div>

          {/* Participatory Budgeting: Editable Line Items */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100">
            <div className="bg-slate-100/70 px-4 py-2 font-bold text-xs text-slate-700 flex items-center justify-between">
              <span>{t.lineItems}</span>
              <span className="text-[11px] text-slate-500">{t.lastUpdated}</span>
            </div>

            {/* 1. Land Prep (Editable) */}
            <div className="p-3 flex items-center justify-between hover:bg-slate-50/50">
              <div>
                <p className="font-semibold text-slate-800">{t.items.land_preparation}</p>
                <p className="text-[11px] text-slate-400">{breakdown.land_preparation?.source}</p>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-400">৳</span>
                <input
                  type="number"
                  value={landPrepCost}
                  onChange={(e) => handleEdit("land_prep", parseInt(e.target.value) || 0)}
                  className="w-20 px-2 py-1 text-right font-bold border border-slate-300 rounded-lg text-sm bg-white"
                />
              </div>
            </div>

            {/* 2. Seed (Editable) */}
            <div className="p-3 flex items-center justify-between hover:bg-slate-50/50">
              <div>
                <p className="font-semibold text-slate-800">{t.items.seed}</p>
                <p className="text-[11px] text-slate-400">{breakdown.seed?.source} ({breakdown.seed?.rate})</p>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-400">৳</span>
                <input
                  type="number"
                  value={seedCost}
                  onChange={(e) => handleEdit("seed", parseInt(e.target.value) || 0)}
                  className="w-20 px-2 py-1 text-right font-bold border border-slate-300 rounded-lg text-sm bg-white"
                />
              </div>
            </div>

            {/* 3. Fertilizer (Official BARC) */}
            <div className="p-3 flex items-center justify-between hover:bg-slate-50/50">
              <div>
                <p className="font-semibold text-slate-800">{t.items.fertilizer}</p>
                <p className="text-[11px] text-slate-400">BARC সরকারি সার সুপারিশ গাইড (FRG 2024)</p>
              </div>
              <span className="font-bold text-sm text-slate-800">{formatTaka(fertTotal)}</span>
            </div>

            {/* 4. Irrigation (Editable) */}
            <div className="p-3 flex items-center justify-between hover:bg-slate-50/50">
              <div>
                <p className="font-semibold text-slate-800">{t.items.irrigation}</p>
                <p className="text-[11px] text-slate-400">{breakdown.irrigation?.source}</p>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-400">৳</span>
                <input
                  type="number"
                  value={irrigationCost}
                  onChange={(e) => handleEdit("irrigation", parseInt(e.target.value) || 0)}
                  className="w-20 px-2 py-1 text-right font-bold border border-slate-300 rounded-lg text-sm bg-white"
                />
              </div>
            </div>

            {/* 5. Labour Wage (Official Survey) */}
            <div className="p-3 flex items-center justify-between hover:bg-slate-50/50">
              <div>
                <p className="font-semibold text-slate-800">{t.items.labour}</p>
                <p className="text-[11px] text-slate-400">বরেন্দ্র কৃষি মজুরি জরিপ (৬০০ টাকা/দিন)</p>
              </div>
              <span className="font-bold text-sm text-slate-800">{formatTaka(labourTotal)}</span>
            </div>

            {/* 6. Plant Protection */}
            <div className="p-3 flex items-center justify-between hover:bg-slate-50/50">
              <div>
                <p className="font-semibold text-slate-800">{t.items.pesticide_fungicide}</p>
                <p className="text-[11px] text-slate-400">{breakdown.pesticide_fungicide?.details}</p>
              </div>
              <span className="font-bold text-sm text-slate-800">{formatTaka(pesticideCost)}</span>
            </div>

            {/* 7. Transport & Post-Harvest */}
            <div className="p-3 flex items-center justify-between hover:bg-slate-50/50">
              <div>
                <p className="font-semibold text-slate-800">{t.items.transport}</p>
                <p className="text-[11px] text-slate-400">{breakdown.transport?.details}</p>
              </div>
              <span className="font-bold text-sm text-slate-800">{formatTaka(transportCost + postHarvestCost)}</span>
            </div>

            {/* 8. Lease / Rent (Editable) */}
            <div className="p-3 flex items-center justify-between hover:bg-slate-50/50">
              <div>
                <p className="font-semibold text-slate-800">{t.items.lease_rent}</p>
                <p className="text-[11px] text-slate-400">নিজের জমি হলে ০ টাকা বসান</p>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-400">৳</span>
                <input
                  type="number"
                  value={leaseRentCost}
                  onChange={(e) => handleEdit("lease", parseInt(e.target.value) || 0)}
                  className="w-20 px-2 py-1 text-right font-bold border border-slate-300 rounded-lg text-sm bg-white"
                />
              </div>
            </div>
          </div>

          <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl text-xs text-amber-900 flex items-start gap-2">
            <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <span>{t.editableNote}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={handleReset}
            className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-slate-200/60 transition min-h-[44px]"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{t.reset}</span>
          </button>

          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-forest hover:bg-forest/90 text-white font-bold rounded-xl text-sm shadow-sm transition min-h-[44px]"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};
