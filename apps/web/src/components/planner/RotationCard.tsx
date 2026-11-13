"use client";

import React, { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Chip } from "@/components/ui/Chip";
import { Button } from "@/components/ui/Button";
import {
  ChevronDown,
  ChevronUp,
  Droplets,
  Sprout,
  DollarSign,
  Calendar,
  Volume2,
  VolumeX,
  Share2,
  Printer,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import type { ScoredRotation } from "@farmscale/scoring";
import { useAppStore } from "@/lib/store/useAppStore";
import {
  ROTATION_AGRONOMICS,
  getUnitMultiplier,
  formatBDT,
  type LandUnit,
} from "@/lib/agronomics/rotationData";
import { toBengaliNumerals } from "@/lib/i18n/numerals";

export interface RotationCardProps {
  rotation: ScoredRotation;
  isTopRank?: boolean;
}

export const RotationCard: React.FC<RotationCardProps> = ({
  rotation,
  isTopRank = false,
}) => {
  const t = useTranslations("planner");
  const tCrops = useTranslations("crops");
  const tSeasons = useTranslations("seasons");
  const tCommon = useTranslations("common");
  const locale = useLocale();

  const viewMode = useAppStore((s) => s.viewMode);
  const unit = useAppStore((s) => s.unit);
  const setUnit = useAppStore((s) => s.setUnit);

  const [whyOpen, setWhyOpen] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  // Agronomic metadata lookup
  const agronomics = ROTATION_AGRONOMICS[rotation.id] || ROTATION_AGRONOMICS["mustard-mungbean-aman"];
  const multiplier = getUnitMultiplier(unit);
  const netProfit = Math.round(agronomics.profitPerBigha * multiplier);
  const inputCost = Math.round(agronomics.costPerBigha * multiplier);

  // Crops in season order
  const seasonCrops = [
    {
      seasonKey: "rabi",
      seasonLabel: tSeasons("rabi"),
      cropId: rotation.crops.rabi.id,
      cropName: tCrops(rotation.crops.rabi.id),
      iconColor: "text-amber-600 bg-amber-50 dark:bg-amber-950/40",
    },
    {
      seasonKey: "kharif_1",
      seasonLabel: tSeasons("kharif_1"),
      cropId: rotation.crops.kharif1.id,
      cropName: tCrops(rotation.crops.kharif1.id),
      iconColor: "text-leaf bg-leaf/10",
    },
    {
      seasonKey: "kharif_2",
      seasonLabel: tSeasons("kharif_2"),
      cropId: rotation.crops.kharif2.id,
      cropName: tCrops(rotation.crops.kharif2.id),
      iconColor: "text-water bg-water/10",
    },
  ];

  // Unit display labels
  const unitLabel =
    unit === "decimal"
      ? t("perDecimal")
      : unit === "acre"
      ? t("perAcre")
      : unit === "hectare"
      ? t("perHectare")
      : t("perBigha");

  // Read aloud feature (Web Speech API)
  const handleReadAloud = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      alert("Speech synthesis is not supported on your browser.");
      return;
    }

    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      return;
    }

    window.speechSynthesis.cancel();

    const titleText = seasonCrops.map((c) => c.cropName).join(", ");
    const textToSpeak =
      locale === "bn"
        ? `সুপারিশ নম্বর ${toBengaliNumerals(rotation.rank, "bn")}। ফসল চক্র: ${titleText}। ${agronomics.waterSavingHeadlineBn}। বাৎসরিক মোট লাভ আনুমানিক ${formatBDT(netProfit, "bn")} প্রতি ${unitLabel}। ${agronomics.tradeoffBn}`
        : `Rank ${rotation.rank}. Rotation: ${titleText}. ${agronomics.waterSavingHeadlineEn}. Net profit approx ${formatBDT(netProfit, "en")} ${unitLabel}. ${agronomics.tradeoffEn}`;

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = locale === "bn" ? "bn-BD" : "en-US";
    utterance.rate = 0.95;

    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);

    setIsPlayingAudio(true);
    window.speechSynthesis.speak(utterance);
  };

  // WhatsApp / Share handler
  const handleShare = () => {
    const titleText = seasonCrops.map((c) => c.cropName).join(" → ");
    const shareMessage =
      locale === "bn"
        ? `ফার্মস্কেল ফসল পর্যায় পরামর্শ:\n🌾 ফসল: ${titleText}\n💧 পানির সাশ্রয়: ${agronomics.waterSavingHeadlineBn}\n💰 বাৎসরিক লাভ: ${formatBDT(netProfit, "bn")} (${unitLabel})\n🔗 বিস্তারিত দেখুন: ${typeof window !== "undefined" ? window.location.href : "https://farmscale-web.vercel.app"}`
        : `FarmScale Crop Rotation Plan:\n🌾 Sequence: ${titleText}\n💧 Water saving: ${agronomics.waterSavingHeadlineEn}\n💰 Est. profit: ${formatBDT(netProfit, "en")} (${unitLabel})\n🔗 View: ${typeof window !== "undefined" ? window.location.href : "https://farmscale-web.vercel.app"}`;

    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareMessage)}`;
    window.open(whatsappUrl, "_blank");

    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(shareMessage).catch(() => {});
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    }
  };

  // Print handler
  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <article
      className={`rounded-lg border transition-all duration-200 overflow-hidden shadow-card print:shadow-none print:border-neutral-400 ${
        isTopRank
          ? "border-gold ring-2 ring-gold/40 bg-surface"
          : "border-border bg-surface hover:border-gold/50"
      }`}
    >
      {/* Top Banner for Rank #1 */}
      {isTopRank && (
        <div className="bg-gold px-4 py-1.5 text-forest text-xs font-bold tracking-wide flex items-center justify-between">
          <span className="flex items-center gap-1.5 font-bold">
            <span className="w-2 h-2 rounded-full bg-forest animate-pulse" />
            {t("topRankBadge")}
          </span>
          <Chip state="sample" className="bg-forest/15 text-forest border-transparent">
            {tCommon("sampleData")}
          </Chip>
        </div>
      )}

      <div className="p-4 sm:p-6 space-y-5">
        {/* Header: Rank + Plain Language Headline + Unit Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-border/80 pb-4">
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-2">
              <span
                className={`w-8 h-8 rounded-full flex items-center justify-center font-mono font-bold text-sm ${
                  isTopRank ? "bg-gold text-forest shadow-xs" : "bg-bg border border-border text-primary"
                }`}
              >
                #{toBengaliNumerals(rotation.rank, locale)}
              </span>
              <h3 className="text-xl sm:text-2xl font-serif font-bold text-primary m-0">
                {seasonCrops.map((c) => c.cropName).join(" → ")}
              </h3>
            </div>

            {/* Plain language water headline */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-water/10 text-water text-xs font-bold">
              <Droplets className="w-3.5 h-3.5" />
              <span>{locale === "bn" ? agronomics.waterSavingHeadlineBn : agronomics.waterSavingHeadlineEn}</span>
            </div>

            {rotation.isCustomSoil && (
              <span className="text-xs text-leaf font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {t("customSoilTag")}
              </span>
            )}
          </div>

          {/* Unit Switcher & Quick Mode Metric */}
          <div className="flex items-center gap-2 self-start sm:self-auto bg-bg p-1 rounded-lg border border-border">
            <span className="text-[11px] font-semibold text-secondary px-1.5">
              {t("unitSwitch")}:
            </span>
            {(["bigha", "decimal", "acre", "hectare"] as LandUnit[]).map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => setUnit(u)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  unit === u
                    ? "bg-forest text-white font-bold shadow-xs"
                    : "text-secondary hover:text-primary"
                }`}
              >
                {u === "bigha"
                  ? locale === "bn" ? "বিঘা" : "Bigha"
                  : u === "decimal"
                  ? locale === "bn" ? "শতক" : "Dec"
                  : u === "acre"
                  ? locale === "bn" ? "একর" : "Acre"
                  : locale === "bn" ? "হেক্টর" : "Ha"}
              </button>
            ))}
          </div>
        </div>

        {/* 3 Season Visual Timeline */}
        <div className="space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {seasonCrops.map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-lg bg-bg border border-border flex items-center sm:flex-col sm:text-center justify-between gap-3"
              >
                <div className={`p-2.5 rounded-full ${item.iconColor} flex-shrink-0`}>
                  <Sprout className="w-5 h-5" />
                </div>
                <div className="flex-1 sm:space-y-0.5">
                  <span className="text-[11px] text-secondary font-medium block">
                    {item.seasonLabel}
                  </span>
                  <span className="text-base font-bold text-primary block">
                    {item.cropName}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Economics Panel (BARI/DAM Grounded Benchmarks) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-lg bg-bg border border-border">
          <div className="space-y-1">
            <span className="text-xs text-secondary font-medium flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-leaf" />
              {t("netProfit")} ({unitLabel})
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-leaf">
              {formatBDT(netProfit, locale)}
            </div>
            <p className="text-[11px] text-muted m-0 leading-tight">
              {locale === "bn" ? agronomics.boroProfitComparisonBn : agronomics.boroProfitComparisonEn}
            </p>
          </div>

          <div className="space-y-1 sm:border-l sm:border-border sm:pl-4">
            <span className="text-xs text-secondary font-medium block">
              {t("productionCost")} ({unitLabel})
            </span>
            <div className="text-xl sm:text-2xl font-bold text-primary">
              {formatBDT(inputCost, locale)}
            </div>
            <p className="text-[11px] text-muted m-0 leading-tight">
              {locale === "bn" ? agronomics.yieldSummaryBn : agronomics.yieldSummaryEn}
            </p>
          </div>
        </div>

        {/* 3 Practical Next Steps for Farmers */}
        <div className="p-4 rounded-lg bg-surface border border-leaf/30 space-y-2.5">
          <h4 className="text-xs uppercase tracking-wider font-bold text-leaf m-0 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            <span>{t("actionNextSteps")}</span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <div className="p-2.5 rounded bg-bg border border-border">
              <span className="text-[11px] text-secondary font-semibold block mb-0.5">
                ১. {t("sowingWindow")}:
              </span>
              <span className="text-primary font-medium">
                {locale === "bn" ? agronomics.nextSteps.sowingBn : agronomics.nextSteps.sowingEn}
              </span>
            </div>
            <div className="p-2.5 rounded bg-bg border border-border">
              <span className="text-[11px] text-secondary font-semibold block mb-0.5">
                ২. {t("suggestedVariety")}:
              </span>
              <span className="text-primary font-medium">
                {locale === "bn" ? agronomics.nextSteps.varietyBn : agronomics.nextSteps.varietyEn}
              </span>
            </div>
            <div className="p-2.5 rounded bg-bg border border-border">
              <span className="text-[11px] text-secondary font-semibold block mb-0.5">
                ৩. {t("irrigationNeed")}:
              </span>
              <span className="text-primary font-medium">
                {locale === "bn" ? agronomics.nextSteps.irrigationBn : agronomics.nextSteps.irrigationEn}
              </span>
            </div>
          </div>
        </div>

        {/* Honest Trade-off Line */}
        <div className="p-3 rounded-md bg-amber-500/10 border border-amber-500/30 text-xs text-primary flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-bold text-amber-700 dark:text-amber-400 mr-1">
              {t("tradeoff")}:
            </span>
            <span>{locale === "bn" ? agronomics.tradeoffBn : agronomics.tradeoffEn}</span>
          </div>
        </div>

        {/* Action Buttons: Read Aloud (Voice), Share (WhatsApp), Print */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-border">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReadAloud}
              className={`gap-1.5 touch-target min-h-[40px] text-xs font-semibold ${
                isPlayingAudio ? "bg-leaf/15 text-leaf border-leaf" : ""
              }`}
            >
              {isPlayingAudio ? (
                <>
                  <VolumeX className="w-4 h-4 text-leaf animate-pulse" />
                  <span>{tCommon("stopListening")}</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4 text-secondary" />
                  <span>{t("readAloud")}</span>
                </>
              )}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="gap-1.5 touch-target min-h-[40px] text-xs font-semibold"
            >
              <Share2 className="w-4 h-4 text-water" />
              <span>{copiedShare ? tCommon("copied") : t("sharePlan")}</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="gap-1.5 touch-target min-h-[40px] text-xs font-semibold hidden sm:inline-flex"
            >
              <Printer className="w-4 h-4 text-secondary" />
              <span>{t("printSave")}</span>
            </Button>
          </div>

          <div className="text-[11px] text-muted">
            BARI / DAM ২০২৪ পাইলট প্রাক্কলন (নমুনা)
          </div>
        </div>

        {/* Expert View Expandable Section */}
        {viewMode === "expert" && (
          <div className="pt-3 border-t border-dashed border-border space-y-3">
            <button
              type="button"
              onClick={() => setWhyOpen((prev) => !prev)}
              className="w-full flex items-center justify-between py-1 text-xs font-bold text-primary hover:text-gold transition-colors touch-target min-h-[38px]"
              aria-expanded={whyOpen}
            >
              <span className="flex items-center gap-1.5">
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-bg border border-border">
                  Score: {rotation.score}/10
                </span>
                <span>{t("whyThisRotation")} (Expert Telemetry)</span>
              </span>
              {whyOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {whyOpen && (
              <div className="p-3.5 rounded bg-bg text-xs space-y-2 border border-border">
                <div className="font-semibold text-primary">Grounded Data Signals & Weights:</div>
                <ul className="space-y-1.5 m-0 pl-4 list-disc text-secondary">
                  {rotation.signalCodes.map((code) => (
                    <li key={code} className="leading-relaxed">
                      <span className="font-mono text-[11px] text-primary block sm:inline mr-1">
                        [{code}]
                      </span>
                      <span>
                        {code.includes("water")
                          ? "Preserves groundwater table by shifting irrigation to rainfed monsoon."
                          : code.includes("legume") || code.includes("pulse")
                          ? "Restores organic nitrogen into topsoil, cutting synthetic fertilizer needs."
                          : "Stabilizes crop revenues while keeping soil structure protected."}
                      </span>
                      <span className="text-[10px] text-muted block mt-0.5">
                        Source: FAO-56 / ISRIC SoilGrids baseline (Sample)
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </article>
  );
};
