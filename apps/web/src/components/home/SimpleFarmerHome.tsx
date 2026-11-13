"use client";

import React, { useState, useTransition } from "react";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/routing";
import { Navigation, Sparkles, ArrowRight } from "lucide-react";
import { CropIcon, CROP_NAMES } from "@/components/crops/CropIcon";
import { BarindMapPicker } from "./BarindMapPicker";
import { AiFarmingOutline } from "./AiFarmingOutline";
import { PILOT_AREAS, type PilotArea, type RecommendOption, type RecommendResponse } from "@/lib/recommend/recommendData";

const TEXTS = {
  bn: {
    h1: "আপনার জমির জন্য সেরা ফসল",
    sub: "আপনার অবস্থান দিন, আমরা ৩টি সেরা চাষের পথ দেখাব।",
    go: "আমার অবস্থান ব্যবহার করুন",
    or: "অথবা এলাকা বেছে নিন",
    pickMap: "মানচিত্রে খুঁজুন",
    closeMap: "মানচিত্র বন্ধ করুন",
    finding: "অবস্থান খুঁজছি…",
    denied: "অবস্থান পাওয়া যায়নি। নিচ থেকে এলাকা বেছে নিন।",
    far: "আপনার জায়গা পাইলট এলাকার বাইরে, তাই কাছের এলাকার ফল দেখানো হচ্ছে।",
    where: "এলাকা: ",
    profit: "লাভ / বিঘা",
    cost: "খরচ / বিঘা",
    water: "পানি",
    selectPlan: "পূর্ণাঙ্গ চাষের রূপরেখা ও আবহাওয়া দেখুন",
    foot: "নাসা উপগ্রহের বৃষ্টি, তাপ ও মাটির আর্দ্রতার তথ্য থেকে XGBoost মডেল হিসাব করেছে। সংখ্যাগুলো উদাহরণ; রোপণের আগে উপজেলা কৃষি অফিসারের সাথে মিলিয়ে নিন।",
    lv: { high: "বেশি", hi: "বেশি", mid: "মাঝারি", medium: "মাঝারি", low: "কম", lo: "কম" } as Record<string, string>,
    error: "ফসল সুপারিশ আনতে সমস্যা হয়েছে। আবার চেষ্টা করুন।",
    loading: "সেরা ফসল হিসাব করা হচ্ছে…",
    titles: {
      profit: "সবচেয়ে বেশি লাভ",
      shift: "বোরো ধান ছেড়ে বদলের সেরা পথ",
      easy: "কম খরচ, কম ঝামেলা",
    },
  },
  en: {
    h1: "The best crops for your field",
    sub: "Share your location and we will show 3 best ways to farm it.",
    go: "Use my location",
    or: "or pick your area",
    pickMap: "Pick on Map",
    closeMap: "Close Map",
    finding: "Finding your location…",
    denied: "Could not get your location. Pick your area below.",
    far: "You are outside the pilot area, so we are showing the nearest area.",
    where: "Area: ",
    profit: "Profit / bigha",
    cost: "Cost / bigha",
    water: "Water",
    selectPlan: "View Outline & Live Weather Plan",
    foot: "An XGBoost model works this out from NASA satellite rain, heat and soil moisture data. Numbers are examples; confirm with your Upazila Agriculture Officer before planting.",
    lv: { high: "High", hi: "High", mid: "Medium", medium: "Medium", low: "Low", lo: "Low" } as Record<string, string>,
    error: "Could not load recommendations. Please try again.",
    loading: "Calculating crop recommendations…",
    titles: {
      profit: "Most profit",
      shift: "Best switch from boro rice",
      easy: "Low cost, low effort",
    },
  },
};

function formatTaka(amount: number, lang: "bn" | "en"): string {
  const formatted = new Intl.NumberFormat(lang === "bn" ? "bn-BD" : "en-US").format(amount);
  return `৳${formatted}`;
}

export const SimpleFarmerHome: React.FC = () => {
  const currentLocale = useLocale();
  const lang: "bn" | "en" = currentLocale === "en" ? "en" : "bn";
  const t = TEXTS[lang];

  const router = useRouter();
  const pathname = usePathname();
  const [isPendingLang, startLangTransition] = useTransition();

  const [selectedArea, setSelectedArea] = useState<PilotArea | null>(null);
  const [showMap, setShowMap] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [recommendations, setRecommendations] = useState<RecommendOption[]>([]);
  const [selectedOptionForOutline, setSelectedOptionForOutline] = useState<RecommendOption | null>(null);

  // Switch language between Bangla and English
  const handleLanguageChange = (nextLocale: "bn" | "en") => {
    if (nextLocale === lang) return;
    startLangTransition(() => {
      router.replace(pathname, { locale: nextLocale });
    });
  };

  // Fetch recommendations from /api/recommend
  const fetchRecommendations = async (params: { lat?: number; lng?: number; areaId?: string; isFar?: boolean }) => {
    setLoading(true);
    setSelectedOptionForOutline(null);
    try {
      const query = new URLSearchParams();
      if (params.areaId) query.set("area", params.areaId);
      if (params.lat !== undefined && params.lng !== undefined) {
        query.set("lat", String(params.lat));
        query.set("lng", String(params.lng));
      }
      query.set("lang", lang);

      const res = await fetch(`/api/recommend?${query.toString()}`);
      if (!res.ok) throw new Error("Fetch failed");

      const data: RecommendResponse = await res.json();
      setRecommendations(data.options || []);

      // If snapped or far note
      if (data.area?.snapped || params.isFar) {
        setStatusMessage(t.far);
      }
    } catch {
      setStatusMessage(t.error);
    } finally {
      setLoading(false);
    }
  };

  // User taps an area chip or map pin
  const handleSelectArea = (area: PilotArea, details?: { lat: number; lng: number; isFar: boolean }) => {
    setSelectedArea(area);
    setStatusMessage("");
    fetchRecommendations({
      areaId: area.id,
      lat: details?.lat,
      lng: details?.lng,
      isFar: details?.isFar,
    });
  };

  // User taps "Use my location" button
  const handleUseLocation = () => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      setStatusMessage(t.denied);
      return;
    }

    setStatusMessage(t.finding);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const userLat = pos.coords.latitude;
        const userLng = pos.coords.longitude;

        // Find nearest pilot area
        let bestArea = PILOT_AREAS[0];
        let bestDist = Infinity;
        for (const a of PILOT_AREAS) {
          const dist = Math.hypot(a.lat - userLat, a.lng - userLng);
          if (dist < bestDist) {
            bestDist = dist;
            bestArea = a;
          }
        }

        const isFar = bestDist > 0.35;
        setSelectedArea(bestArea);
        if (isFar) {
          setStatusMessage(t.far);
        } else {
          setStatusMessage("");
        }

        fetchRecommendations({ lat: userLat, lng: userLng, areaId: bestArea.id, isFar });
      },
      () => {
        setStatusMessage(t.denied);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  return (
    <div className="max-w-[560px] mx-auto py-2 px-1 sm:px-2 pb-16 font-sans antialiased text-primary">
      {/* Top Header: Brand + Lang Toggle */}
      <header className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2.5 font-bold text-[22px] tracking-tight text-primary">
          <svg
            width="38"
            height="38"
            viewBox="0 0 48 48"
            aria-hidden="true"
            className="flex-shrink-0"
          >
            <rect width="48" height="48" rx="13" fill="#1B3B2B" />
            <path
              d="M24 38V22"
              stroke="#E0A800"
              strokeWidth="3.2"
              strokeLinecap="round"
            />
            <path
              d="M24 25C24 17 18 13 11 14C11 21 16 26 24 25Z"
              fill="#7DBB6E"
            />
            <path
              d="M24 21C24 13 29 9 37 10C37 17 32 22 24 21Z"
              fill="#E0A800"
            />
            <path
              d="M14 38H34"
              stroke="#7DBB6E"
              strokeWidth="3.2"
              strokeLinecap="round"
            />
          </svg>
          <span>FarmScale</span>
        </div>

        {/* Language switch pill: Bangla (default) & English only */}
        <div
          className="flex bg-surface border border-border rounded-full p-0.5 shadow-2xs"
          role="group"
          aria-label="Language"
        >
          <button
            type="button"
            disabled={isPendingLang}
            onClick={() => handleLanguageChange("bn")}
            aria-pressed={lang === "bn"}
            className={`px-3.5 py-1.5 rounded-full text-[15px] font-semibold transition-all min-h-[36px] ${
              lang === "bn"
                ? "bg-gold text-[#1a1300] shadow-2xs"
                : "text-secondary hover:text-primary"
            }`}
          >
            বাংলা
          </button>
          <button
            type="button"
            disabled={isPendingLang}
            onClick={() => handleLanguageChange("en")}
            aria-pressed={lang === "en"}
            className={`px-3.5 py-1.5 rounded-full text-[15px] font-semibold transition-all min-h-[36px] ${
              lang === "en"
                ? "bg-gold text-[#1a1300] shadow-2xs"
                : "text-secondary hover:text-primary"
            }`}
          >
            English
          </button>
        </div>
      </header>

      {/* Main Title & Subtitle */}
      <h1 className="text-[28px] sm:text-[30px] font-bold leading-[1.25] text-primary mt-6 mb-2">
        {t.h1}
      </h1>
      <p className="text-[17px] text-secondary leading-snug mb-6">
        {t.sub}
      </p>

      {/* Big "Use My Location" Button */}
      <button
        type="button"
        onClick={handleUseLocation}
        className="w-full min-h-[60px] rounded-2xl bg-gold hover:opacity-95 text-[#1a1300] font-bold text-[19px] flex items-center justify-center gap-2.5 cursor-pointer shadow-sm active:scale-[0.99] transition-transform focus-visible:outline focus-visible:outline-3 focus-visible:outline-primary"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21Z" />
          <circle cx="12" cy="9.5" r="2.5" />
        </svg>
        <span>{t.go}</span>
      </button>

      {/* Fallback Area Chips & Map Picker Toggle */}
      <div className="flex items-center justify-between mt-5 mb-2">
        <p className="text-[15px] text-secondary font-medium m-0">
          {t.or}
        </p>

        {/* Map Picker Trigger Button */}
        <button
          type="button"
          onClick={() => setShowMap((prev) => !prev)}
          className={`px-3 py-1.5 rounded-full font-medium text-[13px] sm:text-[14px] transition-all cursor-pointer border flex items-center gap-1.5 ${
            showMap
              ? "border-forest bg-forest text-white"
              : "border-gold/60 bg-gold/15 text-primary hover:border-gold"
          }`}
        >
          <Navigation className="w-3.5 h-3.5 text-gold shrink-0" />
          <span>{showMap ? t.closeMap : t.pickMap}</span>
        </button>
      </div>

      {/* Pilot Upazila Chips */}
      <div className="flex flex-wrap gap-2">
        {PILOT_AREAS.map((a) => {
          const isSelected = selectedArea?.id === a.id;
          return (
            <button
              key={a.id}
              type="button"
              onClick={() => handleSelectArea(a)}
              aria-pressed={isSelected}
              className={`min-h-[44px] px-4 py-2 rounded-full font-medium text-[16px] transition-all cursor-pointer border ${
                isSelected
                  ? "border-forest bg-forest text-white shadow-sm"
                  : "border-border bg-surface text-primary hover:border-gold"
              } focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary`}
            >
              {lang === "bn" ? a.name_bn : a.name_en}
            </button>
          );
        })}
      </div>

      {/* Interactive Barind Map Picker (Opens when user wants) */}
      {showMap && (
        <div className="mt-3">
          <BarindMapPicker
            selectedAreaId={selectedArea?.id}
            lang={lang}
            onSelectArea={(area, details) => {
              handleSelectArea(area, details);
            }}
            onClose={() => setShowMap(false)}
          />
        </div>
      )}

      {/* Dynamic Status / Location Notes */}
      <p
        className="min-h-[26px] mt-3 mb-1 text-[15px] text-secondary leading-snug"
        role="status"
      >
        {statusMessage}
      </p>

      {/* Output Results Region (Only rendered after location/chip is selected) */}
      <section id="out" aria-live="polite" className="mt-3">
        {loading && (
          <div className="p-8 text-center text-secondary space-y-2">
            <div className="w-8 h-8 mx-auto rounded-full border-3 border-gold border-t-transparent animate-spin" />
            <p className="text-[16px] font-medium">{t.loading}</p>
          </div>
        )}

        {!loading && selectedArea && recommendations.length > 0 && (
          <div>
            {/* Selected Area Header */}
            <p className="font-semibold text-[17px] text-primary mb-3">
              {t.where}
              <span className="text-forest dark:text-gold font-bold">
                {lang === "bn" ? selectedArea.name_bn : selectedArea.name_en}
              </span>
            </p>

            {/* Exactly 3 Options in strict order: profit, shift, easy */}
            {recommendations.map((opt) => {
              const isBest = opt.key === "profit";
              const isSelectedForOutline = selectedOptionForOutline?.key === opt.key;
              const title = t.titles[opt.key] || (lang === "bn" ? opt.title_bn : opt.title_en);
              const reason = lang === "bn" ? opt.reason_bn : opt.reason_en;
              const waterLabel = t.lv[opt.water] || opt.water;

              return (
                <article
                  key={opt.key}
                  className={`rounded-[18px] mb-3.5 transition-all shadow-card ${
                    isBest
                      ? "bg-forest border-2 border-forest text-white p-5 sm:p-6"
                      : "bg-surface border border-border text-primary p-4 sm:p-5"
                  } ${isSelectedForOutline ? "ring-2 ring-gold" : ""}`}
                >
                  <h2
                    className={`text-[19px] font-bold mb-3 ${
                      isBest ? "text-white" : "text-primary"
                    }`}
                  >
                    {title}
                  </h2>

                  {/* 3-Season Rotation Sequence */}
                  <div className="flex items-start gap-1 sm:gap-2">
                    {opt.crops.map((cropKey, idx) => (
                      <React.Fragment key={cropKey + idx}>
                        {idx > 0 && (
                          <span
                            className={`self-center -mt-4 opacity-50 text-xl font-bold ${
                              isBest ? "text-white" : "text-secondary"
                            }`}
                            aria-hidden="true"
                          >
                            ›
                          </span>
                        )}
                        <div className="flex-1 text-center text-[14px] leading-tight">
                          <CropIcon
                            crop={cropKey}
                            size={52}
                            showName={false}
                            lang={lang}
                          />
                          <span
                            className={`block mt-1 font-medium text-[13px] sm:text-[14px] ${
                              isBest ? "text-white/95" : "text-primary"
                            }`}
                          >
                            {CROP_NAMES[lang][cropKey] || cropKey}
                          </span>
                        </div>
                      </React.Fragment>
                    ))}
                  </div>

                  {/* 3 Key Stats */}
                  <div
                    className={`grid grid-cols-3 gap-2 mt-4 mb-2.5 pt-3 border-t text-center ${
                      isBest
                        ? "border-white/20"
                        : "border-border"
                    }`}
                  >
                    <div>
                      <b
                        className={`text-[18px] sm:text-[20px] font-bold leading-tight block ${
                          isBest ? "text-white" : "text-primary"
                        }`}
                      >
                        {formatTaka(opt.profit_per_bigha, lang)}
                      </b>
                      <span
                        className={`text-[13px] block mt-0.5 ${
                          isBest ? "text-[#cfe0d3]" : "text-secondary"
                        }`}
                      >
                        {t.profit}
                      </span>
                    </div>

                    <div>
                      <b
                        className={`text-[18px] sm:text-[20px] font-bold leading-tight block ${
                          isBest ? "text-white" : "text-primary"
                        }`}
                      >
                        {formatTaka(opt.cost_per_bigha, lang)}
                      </b>
                      <span
                        className={`text-[13px] block mt-0.5 ${
                          isBest ? "text-[#cfe0d3]" : "text-secondary"
                        }`}
                      >
                        {t.cost}
                      </span>
                    </div>

                    <div>
                      <b
                        className={`text-[18px] sm:text-[20px] font-bold leading-tight block ${
                          isBest ? "text-white" : "text-primary"
                        }`}
                      >
                        {waterLabel}
                      </b>
                      <span
                        className={`text-[13px] block mt-0.5 ${
                          isBest ? "text-[#cfe0d3]" : "text-secondary"
                        }`}
                      >
                        {t.water}
                      </span>
                    </div>
                  </div>

                  {/* 1 Short Reason Sentence */}
                  <p
                    className={`text-[15px] m-0 leading-snug ${
                      isBest ? "text-[#cfe0d3]" : "text-secondary"
                    }`}
                  >
                    {reason}
                  </p>

                  {/* Select this Option Button -> Triggers AI Outline & Weather Warning */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedOptionForOutline(opt);
                      setTimeout(() => {
                        document.getElementById("outline-section")?.scrollIntoView({ behavior: "smooth" });
                      }, 100);
                    }}
                    className={`mt-4 w-full py-3 px-4 rounded-xl font-bold text-[15px] flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm active:scale-[0.99] ${
                      isBest
                        ? "bg-gold hover:bg-gold/90 text-[#1a1300]"
                        : "bg-forest hover:bg-forest/90 text-white"
                    }`}
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>{t.selectPlan}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </article>
              );
            })}

            {/* AI Farming Outline & Live Weather Advisory (Activated upon option selection) */}
            {selectedOptionForOutline && (
              <div id="outline-section" className="mt-6 pt-4 border-t border-border">
                <AiFarmingOutline
                  option={selectedOptionForOutline}
                  areaNameBn={selectedArea.name_bn}
                  areaNameEn={selectedArea.name_en}
                  lat={selectedArea.lat}
                  lng={selectedArea.lng}
                  lang={lang}
                  onBackToOptions={() => setSelectedOptionForOutline(null)}
                />
              </div>
            )}
          </div>
        )}
      </section>

      {/* Honest Pilot Footnote */}
      <p className="text-[13.5px] text-secondary mt-6 leading-relaxed">
        {t.foot}
      </p>
    </div>
  );
};
