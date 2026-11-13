"use client";

import React, { useState, useEffect, useTransition } from "react";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/routing";
import { Navigation, Sparkles, ArrowRight, MapPin, Check, Calculator } from "lucide-react";
import { CropIcon, CROP_NAMES } from "@/components/crops/CropIcon";
import { BarindMapPicker } from "./BarindMapPicker";
import { AiFarmingOutline } from "./AiFarmingOutline";
import { PicsaClimateSection } from "./PicsaClimateSection";
import { CostBreakdownDrawer } from "@/components/planner/CostBreakdownDrawer";
import { AuthButton } from "@/components/auth/AuthButton";
import { MyFarmModal } from "./MyFarmModal";
import {
  ALL_RAJSHAHI_UPAZILAS,
  RAJSHAHI_DISTRICTS,
  findNearestUpazila,
  type UpazilaRecord,
  type PilotArea,
  type RecommendOption,
  type RecommendResponse,
} from "@/lib/recommend/recommendData";

const TEXTS = {
  bn: {
    h1: "আপনার জমির জন্য সেরা ফসল",
    sub: "আপনার অবস্থান দিন, আমরা ৩টি সেরা চাষের পথ দেখাব।",
    go: "আমার অবস্থান ব্যবহার করুন",
    or: "অথবা জেলা ও উপজেলা বেছে নিন",
    selectDistrict: "জেলা নির্বাচন করুন",
    selectUpazila: "উপজেলা নির্বাচন করুন (৬৭টি)",
    district: "জেলা",
    upazila: "উপজেলা",
    pickMap: "মানচিত্রে খুঁজুন",
    closeMap: "মানচিত্র বন্ধ করুন",
    finding: "অবস্থান খুঁজছি…",
    denied: "অবস্থান পাওয়া যায়নি। নিচ থেকে জেলা ও উপজেলা বেছে নিন।",
    far: "আপনার জায়গা রাজশাহী বিভাগের বাইরে, তাই সবচেয়ে কাছের উপজেলার ফল দেখানো হচ্ছে।",
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
    or: "or select your district and upazila",
    selectDistrict: "Select District",
    selectUpazila: "Select Upazila (67)",
    district: "District",
    upazila: "Upazila",
    pickMap: "Pick on Map",
    closeMap: "Close Map",
    finding: "Finding your location…",
    denied: "Could not get your location. Select your area below.",
    far: "You are outside Rajshahi Division, so we are showing the nearest upazila.",
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

  // Location State: Cascading District & Upazila
  const [selectedDistrictEn, setSelectedDistrictEn] = useState<string>("Rajshahi");
  const [selectedUpazilaEn, setSelectedUpazilaEn] = useState<string>("Godagari");
  const [showMap, setShowMap] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [recommendations, setRecommendations] = useState<RecommendOption[]>([]);
  const [selectedOptionForOutline, setSelectedOptionForOutline] = useState<RecommendOption | null>(null);
  const [costBreakdownOption, setCostBreakdownOption] = useState<RecommendOption | null>(null);
  const [myFarmOpen, setMyFarmOpen] = useState<boolean>(false);
  const [initialLoaded, setInitialLoaded] = useState<boolean>(false);

  // Switch language between Bangla and English
  const handleLanguageChange = (nextLocale: "bn" | "en") => {
    if (nextLocale === lang) return;
    startLangTransition(() => {
      router.replace(pathname, { locale: nextLocale });
    });
  };

  // Upazilas filtered by selected district
  const filteredUpazilas = ALL_RAJSHAHI_UPAZILAS.filter(
    (u) => u.district_en.toLowerCase() === selectedDistrictEn.toLowerCase()
  );

  // Current selected Upazila object
  const currentUpazila =
    ALL_RAJSHAHI_UPAZILAS.find(
      (u) =>
        u.district_en.toLowerCase() === selectedDistrictEn.toLowerCase() &&
        u.upazila_en.toLowerCase() === selectedUpazilaEn.toLowerCase()
    ) || filteredUpazilas[0] || ALL_RAJSHAHI_UPAZILAS[0];

  // Fetch recommendations from /api/recommend
  const fetchRecommendations = async (params: {
    lat?: number;
    lng?: number;
    upazilaName?: string;
    districtName?: string;
    isFar?: boolean;
  }) => {
    setLoading(true);
    setSelectedOptionForOutline(null);
    try {
      const query = new URLSearchParams();
      if (params.upazilaName) query.set("area", params.upazilaName);
      if (params.districtName) query.set("district", params.districtName);
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

  // Restore last selected location on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("farmscale_last_selected_location");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.districtEn && parsed.upazilaEn) {
          setSelectedDistrictEn(parsed.districtEn);
          setSelectedUpazilaEn(parsed.upazilaEn);
          fetchRecommendations({
            upazilaName: parsed.upazilaEn,
            districtName: parsed.districtEn,
          });
          setInitialLoaded(true);
          return;
        }
      }
    } catch {}

    setInitialLoaded(true);
  }, [lang]);

  // Handle District selection
  const handleDistrictChange = (d: string) => {
    setSelectedDistrictEn(d);
    const newUpzs = ALL_RAJSHAHI_UPAZILAS.filter((u) => u.district_en.toLowerCase() === d.toLowerCase());
    const nextUpz = newUpzs[0]?.upazila_en || "";
    setSelectedUpazilaEn(nextUpz);
    setStatusMessage("");

    try {
      localStorage.setItem(
        "farmscale_last_selected_location",
        JSON.stringify({ districtEn: d, upazilaEn: nextUpz })
      );
    } catch {}

    if (nextUpz) {
      fetchRecommendations({
        upazilaName: nextUpz,
        districtName: d,
      });
    }
  };

  // Handle Upazila selection
  const handleUpazilaChange = (uName: string) => {
    setSelectedUpazilaEn(uName);
    setStatusMessage("");

    try {
      localStorage.setItem(
        "farmscale_last_selected_location",
        JSON.stringify({ districtEn: selectedDistrictEn, upazilaEn: uName })
      );
    } catch {}

    fetchRecommendations({
      upazilaName: uName,
      districtName: selectedDistrictEn,
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

        // Find nearest upazila among ALL 67 upazilas
        const nearest = findNearestUpazila(userLat, userLng);
        const upz = nearest.upazila;

        setSelectedDistrictEn(upz.district_en);
        setSelectedUpazilaEn(upz.upazila_en);

        try {
          localStorage.setItem(
            "farmscale_last_selected_location",
            JSON.stringify({ districtEn: upz.district_en, upazilaEn: upz.upazila_en })
          );
        } catch {}

        if (nearest.isFar) {
          setStatusMessage(t.far);
        } else {
          setStatusMessage("");
        }

        fetchRecommendations({
          lat: userLat,
          lng: userLng,
          upazilaName: upz.upazila_en,
          districtName: upz.district_en,
          isFar: nearest.isFar,
        });
      },
      () => {
        setStatusMessage(t.denied);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  return (
    <div className="w-full max-w-7xl mx-auto py-3 sm:py-6 px-3 sm:px-6 lg:px-8 pb-20 font-sans antialiased text-primary">
      {/* Top Header: Brand + Lang Toggle + Auth Button */}
      <header className="flex flex-wrap items-center justify-between gap-3 mb-6 sm:mb-8 pb-4 border-b border-border/70">
        <div className="flex items-center gap-3">
          <svg
            width="40"
            height="40"
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
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-[22px] sm:text-[24px] tracking-tight text-primary">FarmScale</span>
              <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                {lang === "bn" ? "রাজশাহী বিভাগ ও বরেন্দ্র অঞ্চল পাইলট" : "Rajshahi Division & Barind Tract"}
              </span>
            </div>
            <p className="hidden md:block text-xs text-secondary font-medium">
              {lang === "bn" ? "নাসা উপগ্রহ ক্লাইমেটোলজি ও এআই ৩-ফসলি লাভজনক পর্যায় রূপরেখা" : "NASA Satellite Climatology & AI Crop Rotation Engine"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Language switch pill: Bangla (default) & English */}
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
              className={`px-3 sm:px-3.5 py-1.5 rounded-full text-[13px] sm:text-[14px] font-semibold transition-all min-h-[36px] ${
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
              className={`px-3 sm:px-3.5 py-1.5 rounded-full text-[13px] sm:text-[14px] font-semibold transition-all min-h-[36px] ${
                lang === "en"
                  ? "bg-gold text-[#1a1300] shadow-2xs"
                  : "text-secondary hover:text-primary"
              }`}
            >
              EN
            </button>
          </div>

          {/* Google Auth & My Farm Dropdown */}
          <AuthButton lang={lang} onOpenMyFarm={() => setMyFarmOpen(true)} />
        </div>
      </header>

      {/* Hero & Cascading Location Selection: Responsive 2-column on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start mb-8">
        {/* Left Column (Desktop 7 cols): Headline, Subtitle, Big Location Button */}
        <div className="lg:col-span-7 flex flex-col justify-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold/20 text-[#1a1300] text-xs font-bold w-fit mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-700" />
            <span>{lang === "bn" ? "নাসা উপগ্রহের তথ্য ও ৩-ফসলি লাভজনক ঘূর্ণন" : "NASA Earth Data & 3-Season Profitable Rotations"}</span>
          </div>
          <h1 className="text-[28px] sm:text-[34px] lg:text-[40px] font-extrabold leading-[1.2] text-primary tracking-tight">
            {t.h1}
          </h1>
          <p className="text-[16px] sm:text-[18px] text-secondary leading-relaxed mt-2.5 mb-6 max-w-xl">
            {t.sub}
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Big "Use My Location" Button */}
            <button
              type="button"
              onClick={handleUseLocation}
              className="min-h-[56px] px-6 rounded-2xl bg-gold hover:opacity-95 text-[#1a1300] font-bold text-[17px] sm:text-[18px] flex items-center justify-center gap-2.5 cursor-pointer shadow-sm active:scale-[0.99] transition-transform focus-visible:outline focus-visible:outline-3 focus-visible:outline-primary"
            >
              <svg
                width="22"
                height="22"
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

            <button
              type="button"
              onClick={() => setShowMap(!showMap)}
              className="min-h-[56px] px-5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-bold text-[15px] flex items-center justify-center gap-2 cursor-pointer shadow-2xs transition"
            >
              <MapPin className="w-4 h-4 text-emerald-700" />
              <span>{showMap ? t.closeMap : t.pickMap}</span>
            </button>
          </div>

          {/* Dynamic Status / Location Notes */}
          <p
            className="min-h-[24px] mt-3 text-[14px] text-secondary leading-snug"
            role="status"
          >
            {statusMessage}
          </p>
        </div>

        {/* Right Column (Desktop 5 cols): Cascading Select Card */}
        <div className="lg:col-span-5 bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
              <MapPin className="w-4 h-4 text-emerald-700" />
              <span>{t.or}</span>
            </label>
            <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              {lang === "bn" ? "৬৭টি উপজেলা" : "67 Upazilas"}
            </span>
          </div>

          <div className="space-y-3.5">
            {/* District Dropdown (8 Districts) */}
            <div>
              <span className="block text-xs font-bold text-slate-600 mb-1.5">{t.district}</span>
              <select
                value={selectedDistrictEn}
                onChange={(e) => handleDistrictChange(e.target.value)}
                className="w-full px-3.5 py-3 rounded-xl border border-slate-300 bg-slate-50 hover:bg-white font-semibold text-sm text-slate-900 focus:ring-2 focus:ring-primary min-h-[46px] transition cursor-pointer"
              >
                {RAJSHAHI_DISTRICTS.map((d) => (
                  <option key={d.en} value={d.en}>
                    {lang === "bn" ? d.bn : d.en}
                  </option>
                ))}
              </select>
            </div>

            {/* Upazila Dropdown (All Upazilas for selected district) */}
            <div>
              <span className="block text-xs font-bold text-slate-600 mb-1.5">
                {lang === "bn" ? `উপজেলা (${filteredUpazilas.length}টি)` : `Upazila (${filteredUpazilas.length})`}
              </span>
              <select
                value={selectedUpazilaEn}
                onChange={(e) => handleUpazilaChange(e.target.value)}
                className="w-full px-3.5 py-3 rounded-xl border border-slate-300 bg-slate-50 hover:bg-white font-semibold text-sm text-slate-900 focus:ring-2 focus:ring-primary min-h-[46px] transition cursor-pointer"
              >
                {filteredUpazilas.map((u) => (
                  <option key={u.upazila_en} value={u.upazila_en}>
                    {lang === "bn" ? u.upazila_bn : u.upazila_en}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Barind Map Picker (Optional expansion) */}
      {showMap && (
        <div className="mt-2 mb-3">
          <BarindMapPicker
            selectedAreaId={currentUpazila?.upazila_en.toLowerCase()}
            lang={lang}
            onSelectArea={(area, details) => {
              if (details?.lat && details?.lng) {
                const nearest = findNearestUpazila(details.lat, details.lng);
                setSelectedDistrictEn(nearest.upazila.district_en);
                setSelectedUpazilaEn(nearest.upazila.upazila_en);
                fetchRecommendations({
                  lat: details.lat,
                  lng: details.lng,
                  upazilaName: nearest.upazila.upazila_en,
                  districtName: nearest.upazila.district_en,
                  isFar: details.isFar,
                });
              }
            }}
            onClose={() => setShowMap(false)}
          />
        </div>
      )}

      {/* Dynamic Status / Location Notes */}
      <p
        className="min-h-[24px] mt-2 mb-2 text-[14px] text-secondary leading-snug"
        role="status"
      >
        {statusMessage}
      </p>

      {/* Output Results Region (Rendered after selection) */}
      <section id="out" aria-live="polite" className="mt-2">
        {loading && (
          <div className="p-8 text-center text-secondary space-y-2">
            <div className="w-8 h-8 mx-auto rounded-full border-3 border-gold border-t-transparent animate-spin" />
            <p className="text-[16px]">{t.loading}</p>
          </div>
        )}

        {!loading && recommendations.length > 0 && (
          <div>
            {/* Active Area Banner */}
            <div className="flex items-center justify-between bg-gold/15 border border-gold/40 rounded-xl px-4 py-2.5 mb-4 text-[15px] font-semibold text-primary">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-emerald-800" />
                {t.where}
                <strong className="text-forest">
                  {lang === "bn"
                    ? `${currentUpazila.district_bn} > ${currentUpazila.upazila_bn}`
                    : `${currentUpazila.district_en} > ${currentUpazila.upazila_en}`}
                </strong>
              </span>
              <span className="text-xs text-secondary bg-surface px-2 py-0.5 rounded-full border border-border">
                {lang === "bn" ? "৩টি বিকল্প" : "3 Options"}
              </span>
            </div>

            {/* Exactly 3 Recommendation Cards: Responsive 3-Column Comparison on Desktop */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
              {recommendations.map((opt) => {
                const isProfit = opt.key === "profit";
                const isShift = opt.key === "shift";
                const cardTitle = t.titles[opt.key] || opt.title_bn || opt.title_en;
                const waterLabel = t.lv[opt.water] || opt.water;
                const reason = lang === "bn" ? opt.reason_bn : opt.reason_en;
                const isSelectedForOutline = selectedOptionForOutline?.key === opt.key;

                return (
                  <article
                    key={opt.key}
                    tabIndex={0}
                    className={`rounded-[24px] p-5 sm:p-6 border transition-all flex flex-col justify-between h-full ${
                      isProfit
                        ? "bg-surface border-gold/80 shadow-md ring-1 ring-gold/40"
                        : "bg-surface border-border hover:border-gold/50 shadow-xs"
                    } focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary`}
                  >
                    <div>
                      {/* Card Header Badge */}
                      <div className="flex items-center justify-between gap-2 mb-3 min-h-[26px]">
                        <div className="flex items-center gap-2">
                          {isProfit && (
                            <span className="inline-flex items-center gap-1 text-[12px] font-bold px-2.5 py-0.5 rounded-full bg-gold text-[#1a1300] uppercase tracking-wide">
                              <Sparkles className="w-3 h-3 fill-current" />
                              {lang === "bn" ? "সেরা পছন্দ" : "Top Pick"}
                            </span>
                          )}
                          {isShift && (
                            <span className="inline-flex items-center text-[12px] font-bold px-2.5 py-0.5 rounded-full bg-forest text-white uppercase tracking-wide">
                              {lang === "bn" ? "পানি সাশ্রয়ী" : "Saves Water"}
                            </span>
                          )}
                          {!isProfit && !isShift && (
                            <span className="inline-flex items-center text-[12px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 uppercase tracking-wide">
                              {lang === "bn" ? "সহজ ও সাশ্রয়ী" : "Low Cost"}
                            </span>
                          )}
                        </div>
                      </div>

                      <h2 className="text-[19px] sm:text-[21px] font-bold text-primary leading-snug mb-3">
                        {cardTitle}
                      </h2>

                      {/* 3-Season Rotation: Rabi -> Kharif-1 -> Kharif-2 */}
                      <div className="bg-background-50 border border-border/80 rounded-2xl p-3 my-3">
                        <div className="grid grid-cols-3 gap-2 items-center text-center">
                          {opt.crops.map((cropKey, idx) => (
                            <div key={idx} className="flex flex-col items-center">
                              <span className="text-[11px] font-semibold text-secondary uppercase tracking-wider mb-1">
                                {idx === 0
                                  ? lang === "bn"
                                    ? "রবি"
                                    : "Rabi"
                                  : idx === 1
                                  ? lang === "bn"
                                    ? "খরিপ-১"
                                    : "Kharif-1"
                                  : lang === "bn"
                                  ? "খরিপ-২"
                                  : "Kharif-2"}
                              </span>
                              <CropIcon crop={cropKey} size={48} className="my-0.5" />
                              <span className="text-[12px] sm:text-[13px] font-bold text-primary mt-1 line-clamp-2 leading-tight min-h-[32px] flex items-center justify-center text-center px-0.5">
                                {CROP_NAMES[lang][cropKey] || cropKey}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Financial & Water Metrics */}
                      <div className="grid grid-cols-3 gap-1 py-3 border-y border-border/70 my-3 text-center items-start">
                        <div className="px-1 flex flex-col items-center justify-center">
                          <span className="text-[11px] font-bold text-slate-500 whitespace-nowrap">
                            {lang === "bn" ? "সম্ভাব্য লাভ" : "Est. Profit"}
                          </span>
                          <span className="text-[16px] sm:text-[18px] font-black text-forest mt-1 tracking-tight">
                            {formatTaka(opt.profit_per_bigha, lang)}
                          </span>
                          <span className="text-[10px] text-slate-400 mt-0.5">
                            {lang === "bn" ? "প্রতি বিঘা" : "per bigha"}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCostBreakdownOption(opt);
                          }}
                          className="border-x border-border/60 hover:bg-gold/15 transition-all rounded-xl py-1 px-1 flex flex-col items-center justify-center cursor-pointer group w-full"
                          title={lang === "bn" ? "খরচের বিস্তারিত হিসাব দেখুন ও নিজের মতো পরিবর্তন করুন" : "View & edit cost breakdown"}
                        >
                          <span className="text-[11px] font-bold text-slate-500 flex items-center justify-center gap-1 whitespace-nowrap">
                            <span>{lang === "bn" ? "মোট খরচ" : "Total Cost"}</span>
                            <span className="text-[10px] text-emerald-800 font-bold bg-emerald-100 px-1 py-0.2 rounded group-hover:bg-emerald-200">ⓘ</span>
                          </span>
                          <span className="text-[16px] sm:text-[18px] font-bold text-slate-900 mt-1 tracking-tight">
                            {formatTaka(opt.cost_per_bigha, lang)}
                          </span>
                          <span className="text-[10px] text-slate-400 mt-0.5">
                            {lang === "bn" ? "প্রতি বিঘা" : "per bigha"}
                          </span>
                        </button>

                        <div className="px-1 flex flex-col items-center justify-center">
                          <span className="text-[11px] font-bold text-slate-500 whitespace-nowrap">
                            {t.water}
                          </span>
                          <span className="text-[16px] sm:text-[17px] font-bold text-slate-900 mt-1">
                            {waterLabel}
                          </span>
                          <span className="text-[10px] text-slate-400 mt-0.5">
                            {lang === "bn" ? "চাহিদা" : "demand"}
                          </span>
                        </div>
                      </div>

                      {/* Short Reason Sentence */}
                      <p className="text-[14px] sm:text-[15px] text-secondary leading-relaxed m-0 mb-4">
                        {reason}
                      </p>
                    </div>

                    {/* Card Actions (Anchored to bottom) */}
                    <div className="space-y-2 pt-2 mt-auto">
                      {/* Cost Breakdown & Participatory Budget Button */}
                      <button
                        type="button"
                        onClick={() => setCostBreakdownOption(opt)}
                        className="w-full py-2 px-3 rounded-xl text-xs font-bold text-emerald-900 bg-emerald-50 hover:bg-emerald-100/90 border border-emerald-200/90 flex items-center justify-center gap-1.5 transition-colors cursor-pointer min-h-[40px]"
                      >
                        <Calculator className="w-3.5 h-3.5 text-amber-600" />
                        <span>
                          {lang === "bn"
                            ? "খরচ ও লাভের হিসাব (সম্পাদনাযোগ্য) ⓘ"
                            : "Cost Breakdown & Budget ⓘ"}
                        </span>
                      </button>

                      {/* Action button to expand stage-by-stage AI outline */}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedOptionForOutline(opt);
                          setTimeout(() => {
                            const outlineEl = document.getElementById("ai-outline-section");
                            if (outlineEl) outlineEl.scrollIntoView({ behavior: "smooth" });
                          }, 100);
                        }}
                        className={`w-full py-2.5 px-4 rounded-xl font-bold text-[14px] sm:text-[15px] flex items-center justify-center gap-2 transition-all cursor-pointer min-h-[44px] ${
                          isSelectedForOutline
                            ? "bg-forest text-white ring-2 ring-gold"
                            : "bg-gold/20 hover:bg-gold/30 text-primary border border-gold/40"
                        }`}
                      >
                        <span>{t.selectPlan}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* PICSA Historical Climate History & Risk Analysis (NASA POWER Climatology) */}
            <div className="mt-8">
              <PicsaClimateSection
                districtEn={currentUpazila.district_en}
                upazilaBn={currentUpazila.upazila_bn}
                upazilaEn={currentUpazila.upazila_en}
                lang={lang}
                onOpenCostBreakdown={() => {
                  setCostBreakdownOption(recommendations[0]);
                }}
              />
            </div>

            {/* AI Farming Outline and Live Weather (Renders when an option is tapped) */}
            {selectedOptionForOutline && (
              <div id="ai-outline-section" className="mt-8">
                <AiFarmingOutline
                  option={selectedOptionForOutline}
                  areaNameBn={`${currentUpazila.district_bn} > ${currentUpazila.upazila_bn}`}
                  areaNameEn={`${currentUpazila.district_en} > ${currentUpazila.upazila_en}`}
                  lat={currentUpazila.lat}
                  lng={currentUpazila.lon}
                  lang={lang}
                />
              </div>
            )}

            {/* Honest Scientific Footnote */}
            <p className="text-[13px] text-secondary leading-normal mt-6 mb-2 p-3.5 bg-background-50 rounded-xl border border-border/70 text-center">
              {t.foot}
            </p>
          </div>
        )}
      </section>

      {/* Participatory Budgeting & Cost Breakdown Drawer */}
      {costBreakdownOption && (
        <CostBreakdownDrawer
          isOpen={costBreakdownOption !== null}
          onClose={() => setCostBreakdownOption(null)}
          rotationKey={costBreakdownOption.key}
          rotationTitle={t.titles[costBreakdownOption.key] || costBreakdownOption.title_bn}
          crops={costBreakdownOption.crops}
          lang={lang}
          districtName={currentUpazila.district_en}
        />
      )}

      {/* "My Farm" Modal / Drawer */}
      <MyFarmModal
        isOpen={myFarmOpen}
        onClose={() => setMyFarmOpen(false)}
        lang={lang}
        currentDistrictEn={selectedDistrictEn}
        currentUpazilaEn={selectedUpazilaEn}
        onSaveLocation={(d, u) => {
          handleDistrictChange(d);
          handleUpazilaChange(u);
        }}
      />
    </div>
  );
};
