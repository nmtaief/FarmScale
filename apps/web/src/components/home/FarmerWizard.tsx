"use client";

import React, { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  Mic,
  MicOff,
  Send,
  Loader2,
  Sparkles,
  MapPin,
  Check,
  Calendar,
  Droplets,
  DollarSign,
  Sprout,
  Scale,
  Volume2,
  VolumeX,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  Info,
} from "lucide-react";
import { useAppStore, type LocationInfo } from "@/lib/store/useAppStore";
import { LocateMeButton } from "@/components/ui/LocateMeButton";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { rankRotations, SAMPLE_ROTATIONS } from "@farmscale/scoring";
import {
  ROTATION_AGRONOMICS,
  getUnitMultiplier,
  formatBDT,
  type LandUnit,
} from "@/lib/agronomics/rotationData";
import {
  getCropCalendar,
  generateFreshPlan,
  generateAlreadyStartedPlan,
  getTodayDateString,
  type Farm,
} from "@/lib/agronomics/planGenerator";
import { toBengaliNumerals } from "@/lib/i18n/numerals";

export const FarmerWizard: React.FC = () => {
  const tCommon = useTranslations("common");
  const tCrops = useTranslations("crops");
  const tSeasons = useTranslations("seasons");
  const tPlanner = useTranslations("planner");
  const locale = useLocale();

  const storeLocation = useAppStore((s) => s.location);
  const setStoreLocation = useAppStore((s) => s.setLocation);
  const setSavedFarm = useAppStore((s) => s.setSavedFarm);

  // Wizard state: 1 | 2 | 3
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1 Form State
  const [voiceText, setVoiceText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [parsingVoice, setParsingVoice] = useState(false);
  const [parsedChips, setParsedChips] = useState<{
    locationName: string;
    landSize: number;
    unit: LandUnit;
    goal: "save_water" | "more_income" | "improve_soil" | "balanced";
    currentCrop: string;
  } | null>(null);

  // Farmer Choices
  const [selectedLocation, setSelectedLocation] = useState<LocationInfo>(storeLocation);
  const [landSize, setLandSize] = useState<number>(1);
  const [landUnit, setLandUnit] = useState<LandUnit>("bigha");
  const [goal, setGoal] = useState<"save_water" | "more_income" | "improve_soil" | "balanced">("save_water");
  const [currentCrop, setCurrentCrop] = useState<string>("boro_rice");

  // Step 2 Selection
  const [selectedRotationId, setSelectedRotationId] = useState<string>("mustard-mungbean-aman");
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);

  // Step 3 Timing & Start Mode
  const [startMode, setStartMode] = useState<"new" | "already_started">("new");
  const [sowingDate, setSowingDate] = useState<string>(getTodayDateString());
  const [selectedStartStage, setSelectedStartStage] = useState<string>("vegetative");

  // Pilot Upazilas list
  const pilotUpazilas: LocationInfo[] = [
    { name: "Godagari Upazila, Barind", lat: 24.4667, lon: 88.3333, district: "Rajshahi", isPilot: true },
    { name: "Tanore Upazila", lat: 24.5833, lon: 88.575, district: "Rajshahi", isPilot: true },
    { name: "Paba Upazila", lat: 24.4333, lon: 88.625, district: "Rajshahi", isPilot: true },
    { name: "Rajshahi Sadar, Barind", lat: 24.3745, lon: 88.6042, district: "Rajshahi", isPilot: true },
    { name: "Naogaon Sadar", lat: 24.8167, lon: 88.9333, district: "Naogaon", isPilot: true },
    { name: "Natore Sadar", lat: 24.4167, lon: 88.9833, district: "Natore", isPilot: true },
  ];

  // Voice recognition via Web Speech API
  const handleToggleVoice = () => {
    if (typeof window === "undefined") return;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert(
        locale === "bn"
          ? "আপনার ব্রাউজারে ভয়েস সাপোর্ট নেই। অনুগ্রহ করে নিচে টাইপ করুন।"
          : "Voice recognition is not supported. Please type in the text box."
      );
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "bn-BD";
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);

      recognition.onresult = (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript;
        if (transcript) {
          setVoiceText(transcript);
          setIsListening(false);
          parseNaturalLanguageInput(transcript);
        }
      };

      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  // Parse natural language input via API
  const parseNaturalLanguageInput = async (text: string) => {
    if (!text.trim()) return;
    setParsingVoice(true);

    try {
      const res = await fetch("/api/parse-farmer-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.status === "success" && data.parsed) {
          const p = data.parsed;
          setParsedChips({
            locationName: p.locationName,
            landSize: p.landSize,
            unit: p.unit,
            goal: p.goal,
            currentCrop: p.currentCrop,
          });

          // Sync into form states
          const matchedLoc = pilotUpazilas.find((u) => u.name.includes(p.locationName)) || selectedLocation;
          setSelectedLocation(matchedLoc);
          setStoreLocation(matchedLoc);
          setLandSize(p.landSize);
          setLandUnit(p.unit);
          setGoal(p.goal);
          setCurrentCrop(p.currentCrop);
        }
      }
    } catch (e) {
      console.warn("Failed to parse intent:", e);
    } finally {
      setParsingVoice(false);
    }
  };

  // Map farmer goal to scoring weights
  const getGoalWeights = (g: string) => {
    switch (g) {
      case "save_water":
        return { water: 10, income: 2, soil: 4 };
      case "more_income":
        return { water: 2, income: 10, soil: 3 };
      case "improve_soil":
        return { water: 4, income: 2, soil: 10 };
      case "balanced":
      default:
        return { water: 6, income: 6, soil: 6 };
    }
  };

  // Rank rotations using deterministic engine
  const rankedRotations = rankRotations(SAMPLE_ROTATIONS, getGoalWeights(goal)).slice(0, 3);

  // Audio Read Aloud
  const handleReadAloud = (text: string, id: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    if (playingAudioId === id) {
      window.speechSynthesis.cancel();
      setPlayingAudioId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = locale === "bn" ? "bn-BD" : "en-US";
    utterance.rate = 0.95;

    utterance.onend = () => setPlayingAudioId(null);
    utterance.onerror = () => setPlayingAudioId(null);

    setPlayingAudioId(id);
    window.speechSynthesis.speak(utterance);
  };

  // Final confirmation in Step 3 -> Saves Farm & Launches State B
  const handleCompleteFarmSetup = () => {
    const farmId = `farm_${Date.now()}`;
    const farm: Farm = {
      id: farmId,
      locationId: selectedLocation.name,
      locationName: selectedLocation.name,
      district: selectedLocation.district,
      lat: selectedLocation.lat,
      lon: selectedLocation.lon,
      landSize,
      unit: landUnit,
      goal,
      rotationId: selectedRotationId,
      currentCrop,
      createdAt: new Date().toISOString(),
    };

    // Determine initial crop in the rotation (e.g. mustard for rabi)
    const initialCrop = "mustard";

    let plan;
    if (startMode === "new") {
      plan = generateFreshPlan(initialCrop, sowingDate, farmId, landSize, landUnit, locale);
    } else {
      plan = generateAlreadyStartedPlan(
        initialCrop,
        { sowingDate, stageId: selectedStartStage },
        farmId,
        landSize,
        landUnit,
        locale
      );
    }

    setSavedFarm(farm, plan.cycle, plan.tasks);
  };

  const selectedCropCalendar = getCropCalendar("mustard");

  return (
    <div className="space-y-6 pb-12 max-w-2xl mx-auto">
      {/* Honest sample notice banner */}
      <div className="p-3.5 rounded-md bg-leaf/10 border border-leaf/30 text-xs text-primary leading-relaxed">
        <span className="font-bold text-leaf mr-1.5">পাইলট প্রাক্কলন:</span>
        {tCommon("honestSampleBanner")}
      </div>

      {/* Stepped Progress Indicator */}
      <div className="flex items-center justify-between px-2 pt-1">
        {[
          { num: 1, labelBn: "আপনার পছন্দ", labelEn: "Preferences" },
          { num: 2, labelBn: "সেরা পরিকল্পনা", labelEn: "Best Plan" },
          { num: 3, labelBn: "চাষের সময়সূচি", labelEn: "Schedule" },
        ].map((s) => (
          <div key={s.num} className="flex items-center gap-2">
            <span
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                step === s.num
                  ? "bg-forest text-gold ring-2 ring-gold"
                  : step > s.num
                  ? "bg-leaf text-white"
                  : "bg-surface border border-border text-secondary"
              }`}
            >
              {step > s.num ? "✓" : toBengaliNumerals(s.num, locale)}
            </span>
            <span
              className={`text-xs font-semibold hidden sm:inline ${
                step === s.num ? "text-primary font-bold" : "text-secondary"
              }`}
            >
              {locale === "bn" ? s.labelBn : s.labelEn}
            </span>
          </div>
        ))}
      </div>

      {/* ================= STEP 1: আপনি কী চান? ================= */}
      {step === 1 && (
        <section className="space-y-6 animate-in fade-in">
          <div className="space-y-1">
            <span className="text-xs uppercase font-mono font-bold tracking-wider text-gold">
              ধাপ ১ / ৩
            </span>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-primary m-0">
              {locale === "bn" ? "আপনি কী চান?" : "What do you want for your farm?"}
            </h1>
            <p className="text-sm text-secondary m-0">
              {locale === "bn"
                ? "মুখে বলুন অথবা নিচের কার্ডগুলো চেপে সহজে নির্বাচন করুন।"
                : "Speak into the mic or tap the cards below to set your farm preferences."}
            </p>
          </div>

          {/* Mode 1: Big Voice Mic + Text Fallback */}
          <div className="p-5 rounded-2xl bg-surface border-2 border-gold/40 shadow-card space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-primary flex items-center gap-2">
                <Mic className="w-5 h-5 text-gold animate-pulse" />
                {locale === "bn" ? "মুখে বলে সরাসরি পরিকল্পনা নিন (বাংলা ভয়েস)" : "Speak Your Requirement (Bangla Voice)"}
              </span>
              <Chip state="sample">{locale === "bn" ? "ভয়েস এআই" : "Voice AI"}</Chip>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleToggleVoice}
                className={`p-4 rounded-full border-2 transition-all touch-target shadow-raised flex-shrink-0 ${
                  isListening
                    ? "bg-red-500 text-white border-red-500 animate-pulse scale-105"
                    : "bg-forest text-gold border-gold hover:bg-forest/90"
                }`}
                title="Speak in Bangla"
              >
                {isListening ? <MicOff className="w-7 h-7" /> : <Mic className="w-7 h-7" />}
              </button>

              <div className="flex-1 relative">
                <input
                  type="text"
                  value={voiceText}
                  onChange={(e) => setVoiceText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      parseNaturalLanguageInput(voiceText);
                    }
                  }}
                  placeholder={
                    locale === "bn"
                      ? "যেমন: গোদাগাড়ীতে ২ বিঘা জমিতে পানি বাঁচাতে চাই..."
                      : "e.g. 2 bigha in Godagari, want to save water..."
                  }
                  className="w-full p-3.5 pr-12 rounded-xl bg-bg border border-border text-primary text-sm focus:outline-none focus:ring-2 focus:ring-gold"
                />
                <button
                  type="button"
                  onClick={() => parseNaturalLanguageInput(voiceText)}
                  disabled={parsingVoice || !voiceText.trim()}
                  className="absolute right-2 top-2 p-2 rounded-lg bg-forest text-white disabled:opacity-40"
                >
                  {parsingVoice ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {isListening && (
              <p className="text-xs text-red-600 font-bold flex items-center gap-1.5 animate-pulse m-0">
                <span className="w-2 h-2 rounded-full bg-red-600" />
                {locale === "bn" ? "আপনার কথা শুনছি... কথা শেষ হলে স্বয়ংক্রিয়ভাবে প্রসেস হবে" : "Listening... speak now"}
              </p>
            )}

            {/* Confirmation Chips if Parsed */}
            {parsedChips && (
              <div className="p-3 rounded-lg bg-leaf/10 border border-leaf/30 space-y-1.5 animate-in fade-in">
                <span className="text-[11px] font-bold text-leaf uppercase block">
                  {locale === "bn" ? "শনাক্তকৃত তথ্য (সঠিক আছে কি না নিশ্চিত করুন):" : "Parsed details (tap to adjust):"}
                </span>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="px-2.5 py-1 rounded-full bg-surface border border-border font-medium text-primary">
                    📍 {parsedChips.locationName}
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-surface border border-border font-medium text-primary">
                    📐 {toBengaliNumerals(parsedChips.landSize, locale)} {parsedChips.unit === "decimal" ? "শতক" : parsedChips.unit === "acre" ? "একর" : "বিঘা"}
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-surface border border-border font-medium text-primary">
                    🎯 {parsedChips.goal === "save_water" ? "পানি বাঁচান" : parsedChips.goal === "more_income" ? "বেশি আয়" : parsedChips.goal === "improve_soil" ? "মাটি ভালো করুন" : "সব মিলিয়ে"}
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-surface border border-border font-medium text-primary">
                    🌾 {parsedChips.currentCrop === "wheat" ? "গম" : "বোরো ধান"}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="text-center font-bold text-xs text-secondary">
            — {locale === "bn" ? "অথবা সরাসরি বেছে নিন" : "OR SELECT DIRECTLY"} —
          </div>

          {/* Mode 2: Tap Cards (Location, Land Size, Goal, Current Crop) */}
          <div className="space-y-4">
            {/* 1. Location Selection */}
            <div className="p-4 rounded-xl bg-surface border border-border space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-primary flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-water" />
                  <span>{locale === "bn" ? "১. আপনার এলাকা বা উপজেলা:" : "1. Location:"}</span>
                </label>
                <LocateMeButton variant="chip" onLocated={(loc) => setSelectedLocation(loc)} />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {pilotUpazilas.map((u) => {
                  const isSel = selectedLocation.name.includes(u.name.split(",")[0]);
                  return (
                    <button
                      key={u.name}
                      type="button"
                      onClick={() => {
                        setSelectedLocation(u);
                        setStoreLocation(u);
                      }}
                      className={`p-2.5 rounded-lg border text-left text-xs font-semibold transition-all touch-target ${
                        isSel
                          ? "bg-leaf/15 border-leaf text-primary font-bold ring-1 ring-leaf"
                          : "bg-bg border-border text-secondary hover:border-gold"
                      }`}
                    >
                      {u.name.split(",")[0]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Land Size & Unit */}
            <div className="p-4 rounded-xl bg-surface border border-border space-y-2.5">
              <label className="text-sm font-bold text-primary block">
                {locale === "bn" ? "২. জমির পরিমাণ ও একক:" : "2. Land Size & Unit:"}
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="0.1"
                  step="0.5"
                  value={landSize}
                  onChange={(e) => setLandSize(Math.max(0.1, parseFloat(e.target.value) || 1))}
                  className="w-28 p-3 rounded-xl bg-bg border border-border text-primary font-bold text-lg text-center focus:outline-none focus:ring-2 focus:ring-gold"
                />
                <div className="flex items-center gap-1.5 bg-bg p-1 rounded-xl border border-border">
                  {(["bigha", "decimal", "acre"] as LandUnit[]).map((u) => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => setLandUnit(u)}
                      className={`px-3 py-2 rounded-lg text-xs font-bold transition-colors touch-target ${
                        landUnit === u
                          ? "bg-forest text-white shadow-xs"
                          : "text-secondary hover:text-primary"
                      }`}
                    >
                      {u === "bigha"
                        ? locale === "bn" ? "বিঘা" : "Bigha"
                        : u === "decimal"
                        ? locale === "bn" ? "শতক" : "Decimal"
                        : locale === "bn" ? "একর" : "Acre"}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 3. Goal Selection */}
            <div className="p-4 rounded-xl bg-surface border border-border space-y-2.5">
              <label className="text-sm font-bold text-primary block">
                {locale === "bn" ? "৩. আপনার প্রধান লক্ষ্য কী?" : "3. What is your primary goal?"}
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { id: "save_water", labelBn: "পানি বাঁচান", labelEn: "Save Water", icon: Droplets, color: "text-water", descBn: "৬০% কম সেচ লাগবে" },
                  { id: "more_income", labelBn: "বেশি আয়", labelEn: "More Income", icon: DollarSign, color: "text-gold-text", descBn: "উচ্চ বাজারমূল্য ও মুনাফা" },
                  { id: "improve_soil", labelBn: "মাটি ভালো করুন", labelEn: "Improve Soil", icon: Sprout, color: "text-leaf", descBn: "ডাল ফসলে নাইট্রোজেন বাড়বে" },
                  { id: "balanced", labelBn: "সব মিলিয়ে", labelEn: "Balanced", icon: Scale, color: "text-forest dark:text-leaf", descBn: "লাভ ও পানির সমন্বয়" },
                ].map((g) => {
                  const Icon = g.icon;
                  const isSel = goal === g.id;
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setGoal(g.id as any)}
                      className={`p-3.5 rounded-xl border text-left transition-all touch-target flex flex-col justify-between min-h-[76px] ${
                        isSel
                          ? "bg-leaf/15 border-leaf ring-2 ring-leaf/40 shadow-xs"
                          : "bg-bg border-border hover:border-gold"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className={`w-5 h-5 ${g.color}`} />
                        <span className="font-bold text-sm text-primary">
                          {locale === "bn" ? g.labelBn : g.labelEn}
                        </span>
                      </div>
                      <span className="text-[11px] text-secondary mt-1">
                        {locale === "bn" ? g.descBn : g.labelEn}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. Current Crop */}
            <div className="p-4 rounded-xl bg-surface border border-border space-y-2.5">
              <label className="text-sm font-bold text-primary block">
                {locale === "bn" ? "৪. এখন আপনার জমিতে কী চাষ করেন?" : "4. What do you currently grow?"}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: "boro_rice", labelBn: "বোরো ধান", labelEn: "Boro Rice" },
                  { id: "wheat", labelBn: "গম", labelEn: "Wheat" },
                  { id: "fallow", labelBn: "পতিত জমি", labelEn: "Fallow" },
                  { id: "other", labelBn: "অন্য কিছু", labelEn: "Other" },
                ].map((c) => {
                  const isSel = currentCrop === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCurrentCrop(c.id)}
                      className={`p-2.5 rounded-lg border text-center text-xs font-bold transition-all touch-target ${
                        isSel
                          ? "bg-forest text-white border-forest shadow-xs"
                          : "bg-bg border-border text-secondary hover:border-gold"
                      }`}
                    >
                      {locale === "bn" ? c.labelBn : c.labelEn}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Next Button */}
          <div className="pt-2">
            <Button
              variant="primary"
              size="lg"
              onClick={() => setStep(2)}
              className="w-full justify-center shadow-raised touch-target min-h-[50px] text-base"
            >
              <span>{locale === "bn" ? "পরবর্তী ধাপ: সেরা পরিকল্পনা দেখুন" : "Next: See Recommended Plan"}</span>
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </section>
      )}

      {/* ================= STEP 2: আপনার জন্য সেরা পরিকল্পনা ================= */}
      {step === 2 && (
        <section className="space-y-6 animate-in fade-in">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-xs text-secondary hover:text-primary flex items-center gap-1 font-semibold touch-target min-h-[36px]"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{locale === "bn" ? "পূর্ববর্তী ধাপ" : "Back"}</span>
            </button>
            <span className="text-xs uppercase font-mono font-bold tracking-wider text-gold">
              ধাপ ২ / ৩
            </span>
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-primary m-0">
              {locale === "bn" ? "আপনার জন্য সেরা পরিকল্পনা" : "Your Recommended Crop Rotation"}
            </h1>
            <p className="text-sm text-secondary m-0">
              {locale === "bn"
                ? `${selectedLocation.name} এবং ${toBengaliNumerals(landSize, locale)} ${landUnit === "decimal" ? "শতক" : landUnit === "acre" ? "একর" : "বিঘা"} জমির জন্য সেরা ফসল পর্যায়:`
                : `Optimized for ${selectedLocation.name} and ${landSize} ${landUnit}:`}
            </p>
          </div>

          {/* Ranked Rotation Cards */}
          <div className="space-y-4">
            {rankedRotations.map((rot, idx) => {
              const agro = ROTATION_AGRONOMICS[rot.id] || ROTATION_AGRONOMICS["mustard-mungbean-aman"];
              const mult = getUnitMultiplier(landUnit) * landSize;
              const profitScaled = Math.round(agro.profitPerBigha * mult);
              const costScaled = Math.round(agro.costPerBigha * mult);
              const isSelected = selectedRotationId === rot.id;

              const cropsArr = [
                { name: tCrops(rot.crops.rabi.id), season: "রবি (কার্তিক–ফাল্গুন)" },
                { name: tCrops(rot.crops.kharif1.id), season: "খরিপ-১ (চৈত্র–জ্যৈষ্ঠ)" },
                { name: tCrops(rot.crops.kharif2.id), season: "খরিপ-২ (আষাঢ়–আশ্বিন)" },
              ];

              const speechText =
                locale === "bn"
                  ? `ফসল চক্র: ${cropsArr.map((c) => c.name).join(", ")}। ${agro.waterSavingHeadlineBn}। বাৎসরিক মোট লাভ আনুমানিক ${formatBDT(profitScaled, "bn")}। ${agro.tradeoffBn}`
                  : `Rotation: ${cropsArr.map((c) => c.name).join(" to ")}. ${agro.waterSavingHeadlineEn}. Net profit approx ${formatBDT(profitScaled, "en")}.`;

              return (
                <div
                  key={rot.id}
                  className={`p-5 rounded-2xl border-2 transition-all shadow-card ${
                    isSelected
                      ? "bg-surface border-gold ring-2 ring-gold/40 shadow-raised"
                      : "bg-surface border-border hover:border-gold/50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 border-b border-border/80 pb-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                            idx === 0 ? "bg-gold text-forest" : "bg-bg border border-border text-primary"
                          }`}
                        >
                          #{toBengaliNumerals(idx + 1, locale)}
                        </span>
                        <h2 className="text-xl font-serif font-bold text-primary m-0">
                          {cropsArr.map((c) => c.name).join(" → ")}
                        </h2>
                      </div>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-water/10 text-water text-xs font-bold">
                        <Droplets className="w-3.5 h-3.5" />
                        <span>{locale === "bn" ? agro.waterSavingHeadlineBn : agro.waterSavingHeadlineEn}</span>
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleReadAloud(speechText, rot.id)}
                      className="p-2 rounded-full border border-border hover:bg-surface-hover text-secondary touch-target"
                      title="Listen in Bangla"
                    >
                      {playingAudioId === rot.id ? (
                        <VolumeX className="w-5 h-5 text-leaf animate-pulse" />
                      ) : (
                        <Volume2 className="w-5 h-5" />
                      )}
                    </button>
                  </div>

                  {/* 3 Season Visual Progression */}
                  <div className="grid grid-cols-3 gap-2 py-3 text-center">
                    {cropsArr.map((c, i) => (
                      <div key={i} className="p-2 rounded-lg bg-bg border border-border">
                        <span className="text-[10px] text-secondary font-medium block">
                          {c.season.split(" ")[0]}
                        </span>
                        <span className="text-xs font-bold text-primary block mt-0.5">
                          {c.name}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Economics scaled for farmer's land size */}
                  <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-bg border border-border text-xs">
                    <div>
                      <span className="text-secondary block">
                        {locale === "bn" ? "বাৎসরিক মোট লাভ:" : "Net Annual Profit:"}
                      </span>
                      <span className="text-lg font-extrabold text-leaf block">
                        {formatBDT(profitScaled, locale)}
                      </span>
                      <span className="text-[10px] text-muted block">
                        {locale === "bn" ? agro.boroProfitComparisonBn : agro.boroProfitComparisonEn}
                      </span>
                    </div>
                    <div className="border-l border-border pl-3">
                      <span className="text-secondary block">
                        {locale === "bn" ? "উৎপাদন খরচ:" : "Input Cost:"}
                      </span>
                      <span className="text-base font-bold text-primary block">
                        {formatBDT(costScaled, locale)}
                      </span>
                      <span className="text-[10px] text-muted block">
                        {locale === "bn" ? agro.yieldSummaryBn : agro.yieldSummaryEn}
                      </span>
                    </div>
                  </div>

                  {/* Trade-off alert */}
                  <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[11px] text-primary flex items-start gap-1.5 mt-3">
                    <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <span>{locale === "bn" ? agro.tradeoffBn : agro.tradeoffEn}</span>
                  </div>

                  {/* Select button */}
                  <div className="pt-4">
                    <Button
                      variant={isSelected ? "primary" : "outline"}
                      size="md"
                      onClick={() => {
                        setSelectedRotationId(rot.id);
                        setStep(3);
                      }}
                      className="w-full justify-center shadow-xs touch-target min-h-[46px] font-bold"
                    >
                      {isSelected ? (
                        <>
                          <Check className="w-4 h-4 mr-1.5 text-forest" />
                          <span>{locale === "bn" ? "এটি বেছে নেওয়া হয়েছে (পরবর্তী ধাপ)" : "Selected – Continue"}</span>
                        </>
                      ) : (
                        <span>{locale === "bn" ? "এটি বেছে নিন" : "Select this Plan"}</span>
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ================= STEP 3: কখন শুরু করেছেন? ================= */}
      {step === 3 && (
        <section className="space-y-6 animate-in fade-in">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="text-xs text-secondary hover:text-primary flex items-center gap-1 font-semibold touch-target min-h-[36px]"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{locale === "bn" ? "পূর্ববর্তী ধাপ" : "Back"}</span>
            </button>
            <span className="text-xs uppercase font-mono font-bold tracking-wider text-gold">
              ধাপ ৩ / ৩
            </span>
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-primary m-0">
              {locale === "bn" ? "কখন শুরু করেছেন?" : "When are you starting?"}
            </h1>
            <p className="text-sm text-secondary m-0">
              {locale === "bn"
                ? "নতুন শুরু করবেন নাকি ইতিমধ্যে জমি তৈরি বা চারা বোনা হয়ে গেছে?"
                : "Starting fresh, or have you already begun field work?"}
            </p>
          </div>

          {/* Two Big Choice Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setStartMode("new")}
              className={`p-5 rounded-2xl border-2 text-left transition-all touch-target min-h-[110px] flex flex-col justify-between ${
                startMode === "new"
                  ? "bg-leaf/15 border-leaf ring-2 ring-leaf/40 shadow-raised"
                  : "bg-surface border-border hover:border-gold"
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="font-bold text-lg text-primary">
                  🌱 {locale === "bn" ? "নতুন শুরু করব" : "Starting Fresh"}
                </span>
                {startMode === "new" && <Check className="w-5 h-5 text-leaf" />}
              </div>
              <p className="text-xs text-secondary leading-tight m-0">
                {locale === "bn"
                  ? "শুরু করার তারিখ বেছে নিন; পুরো চাষের দিনপঞ্জি তৈরি হবে।"
                  : "Pick your sowing date to generate full calendar."}
              </p>
            </button>

            <button
              type="button"
              onClick={() => setStartMode("already_started")}
              className={`p-5 rounded-2xl border-2 text-left transition-all touch-target min-h-[110px] flex flex-col justify-between ${
                startMode === "already_started"
                  ? "bg-gold/20 border-gold ring-2 ring-gold/40 shadow-raised"
                  : "bg-surface border-border hover:border-gold"
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="font-bold text-lg text-primary">
                  🚜 {locale === "bn" ? "আমি শুরু করে ফেলেছি" : "Already Started"}
                </span>
                {startMode === "already_started" && <Check className="w-5 h-5 text-gold-text" />}
              </div>
              <p className="text-xs text-secondary leading-tight m-0">
                {locale === "bn"
                  ? "বর্তমান পর্যায় জানান; বাকি কাজগুলোর পরিকল্পনা দেখানো হবে।"
                  : "Pick your current crop stage to continue from now onward."}
              </p>
            </button>
          </div>

          {/* Mode A: New Start Options */}
          {startMode === "new" && (
            <div className="p-5 rounded-xl bg-surface border border-border space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-bold text-primary block">
                  {locale === "bn" ? "বপনের তারিখ নির্বাচন করুন:" : "Select Sowing Date:"}
                </label>
                <div className="p-3 rounded-lg bg-leaf/10 border border-leaf/30 text-xs text-primary">
                  <span className="font-bold text-leaf mr-1">
                    {locale === "bn" ? "অনুমোদিত বপনকাল:" : "Recommended Window:"}
                  </span>
                  <span>{locale === "bn" ? selectedCropCalendar.sowingWindow.descriptionBn : selectedCropCalendar.sowingWindow.descriptionEn}</span>
                </div>
              </div>

              <input
                type="date"
                value={sowingDate}
                onChange={(e) => setSowingDate(e.target.value)}
                className="w-full p-3.5 rounded-xl bg-bg border border-border text-primary font-bold text-base focus:ring-2 focus:ring-gold outline-none"
              />
            </div>
          )}

          {/* Mode B: Already Started Options */}
          {startMode === "already_started" && (
            <div className="p-5 rounded-xl bg-surface border border-border space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-primary block">
                  {locale === "bn" ? "আপনার বর্তমান ফসল কোন পর্যায়ে রয়েছে?" : "What is your current crop stage?"}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {selectedCropCalendar.stages.map((st) => {
                    const isSel = selectedStartStage === st.id;
                    return (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => setSelectedStartStage(st.id)}
                        className={`p-3 rounded-lg border text-left text-xs font-semibold transition-all touch-target ${
                          isSel
                            ? "bg-forest text-white border-forest font-bold shadow-xs"
                            : "bg-bg border-border text-primary hover:border-gold"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{locale === "bn" ? st.labelBn : st.labelEn}</span>
                          {isSel && <Check className="w-4 h-4 text-gold" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 border-t border-border">
                <label className="text-xs font-semibold text-secondary block mb-1">
                  {locale === "bn" ? "বীজ বপন বা রোপণের আনুমানিক তারিখ (জানা থাকলে):" : "Approximate sowing date (optional):"}
                </label>
                <input
                  type="date"
                  value={sowingDate}
                  onChange={(e) => setSowingDate(e.target.value)}
                  className="w-full p-3 rounded-xl bg-bg border border-border text-primary text-sm focus:ring-2 focus:ring-gold outline-none"
                />
              </div>
            </div>
          )}

          {/* Final Submit Button */}
          <div className="pt-2">
            <Button
              variant="primary"
              size="lg"
              onClick={handleCompleteFarmSetup}
              className="w-full justify-center shadow-raised touch-target min-h-[52px] text-base font-bold"
            >
              <Check className="w-5 h-5 mr-2 text-forest" />
              <span>{locale === "bn" ? "আমার ফার্ম তৈরি করুন এবং দিনপঞ্জি চালু করুন" : "Save My Farm & Launch Daily Tasks"}</span>
            </Button>
          </div>
        </section>
      )}
    </div>
  );
};

