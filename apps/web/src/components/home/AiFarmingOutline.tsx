"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar,
  CloudRain,
  Sun,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  Send,
  Loader2,
  RotateCcw,
  Printer,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { CropIcon, CROP_NAMES } from "@/components/crops/CropIcon";
import type { RecommendOption } from "@/lib/recommend/recommendData";
import type { WeatherResponse, DailyWeather } from "@/app/api/weather/route";

interface FarmingTask {
  id: string;
  seasonNameBn: string;
  seasonNameEn: string;
  cropKey: string;
  stageBn: string;
  stageEn: string;
  approxDays: string;
  titleBn: string;
  titleEn: string;
  instructionBn: string;
  instructionEn: string;
  doseBn?: string;
  doseEn?: string;
  weatherWarningBn?: string;
  weatherWarningEn?: string;
  isWeatherSensitive?: boolean;
}

interface AiFarmingOutlineProps {
  option: RecommendOption;
  areaNameBn: string;
  areaNameEn: string;
  lat: number;
  lng: number;
  lang?: "bn" | "en";
  onBackToOptions?: () => void;
}

export const AiFarmingOutline: React.FC<AiFarmingOutlineProps> = ({
  option,
  areaNameBn,
  areaNameEn,
  lat,
  lng,
  lang = "bn",
  onBackToOptions,
}) => {
  const [weatherData, setWeatherData] = useState<WeatherResponse | null>(null);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [weatherShifted, setWeatherShifted] = useState(false);
  const [aiQuery, setAiQuery] = useState("");
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [expandedSeason, setExpandedSeason] = useState<number>(0);

  // Fetch live weather from /api/weather
  useEffect(() => {
    let isCancelled = false;
    const fetchWeather = async () => {
      setLoadingWeather(true);
      try {
        const res = await fetch(`/api/weather?lat=${lat}&lng=${lng}`);
        if (!res.ok) throw new Error("Weather fetch failed");
        const data: WeatherResponse = await res.json();
        if (!isCancelled) {
          setWeatherData(data);
        }
      } catch {
        // Handled gracefully in route fallback
      } finally {
        if (!isCancelled) setLoadingWeather(false);
      }
    };

    fetchWeather();
    return () => {
      isCancelled = true;
    };
  }, [lat, lng]);

  // Generate date-wise outline based on rotation key and crops
  const getTasksForOption = (): FarmingTask[] => {
    const hasRain = weatherData?.hasRainWarning || false;

    if (option.key === "profit") {
      // Potato -> Mungbean -> Aman Rice
      return [
        {
          id: "t_pot_1",
          seasonNameBn: "রবি মৌসুম (কার্তিক–মাঘ)",
          seasonNameEn: "Rabi Season (Nov–Feb)",
          cropKey: "potato",
          stageBn: "জমি তৈরি ও বেসাল সার প্রয়োগ",
          stageEn: "Land Preparation & Basal Fertilizer",
          approxDays: "১৫–২০ নভেম্বর",
          titleBn: "জমি গভীরভাবে চাষ ও সুষম সার প্রয়োগ",
          titleEn: "Deep Tilth & Basal Fertilizer Application",
          instructionBn:
            "মাটি ৪-৫ বার চাষ করে ঝুরঝুরে করুন। শেষ চাষের সময় জৈব সার, টিএসপি, এমওপি ও জিপসাম মাটিতে মিশিয়ে ভেলি তৈরি করুন।",
          instructionEn:
            "Plough 4–5 times to a fine tilth. Apply compost, TSP, MoP, and Gypsum during final land preparation before furrowing.",
          doseBn: "গোবর ৮০০ কেজি, টিএসপি ৩৫ কেজি, এমওপি ৩৫ কেজি, জিপসাম ১৫ কেজি প্রতি বিঘা",
          doseEn: "Compost 800 kg, TSP 35 kg, MoP 35 kg, Gypsum 15 kg per bigha",
        },
        {
          id: "t_pot_2",
          seasonNameBn: "রবি মৌসুম (কার্তিক–মাঘ)",
          seasonNameEn: "Rabi Season (Nov–Feb)",
          cropKey: "potato",
          stageBn: "বীজ আলু রোপণ",
          stageEn: "Seed Potato Planting",
          approxDays: "২০–২৫ নভেম্বর",
          titleBn: "অঙ্কুরিত রোগমুক্ত বীজ আলু রোপণ",
          titleEn: "Planting Sprouted Disease-Free Tubers",
          instructionBn:
            "৬০ সেমি দূরত্বে সারি করে ২৫ সেমি পর পর বীজ আলু মাটির নিচে ৫–৭ সেমি গভীরে রোপণ করুন।",
          instructionEn:
            "Plant sprouted tubers at 60 cm row spacing and 25 cm plant spacing at 5–7 cm depth.",
          doseBn: "বীজ আলু ২০০–২৫০ কেজি প্রতি বিঘা",
          doseEn: "Seed tuber 200–250 kg per bigha",
        },
        {
          id: "t_pot_3",
          seasonNameBn: "রবি মৌসুম (কার্তিক–মাঘ)",
          seasonNameEn: "Rabi Season (Nov–Feb)",
          cropKey: "potato",
          stageBn: "১ম সেচ ও গোড়ায় মাটি তোলা",
          stageEn: "1st Irrigation & Earthing-up",
          approxDays: weatherShifted ? "৩০ নভেম্বর – ৫ ডিসেম্বর (বৃষ্টির পর)" : "২৫–২৮ নভেম্বর",
          titleBn: "১ম হালকা সেচ ও ১ম ইউরিয়া উপরিপ্রয়োগ",
          titleEn: "1st Light Irrigation & Urea Top-dress",
          instructionBn:
            hasRain && !weatherShifted
              ? "সতর্কতা: বৃষ্টির পূর্বাভাস থাকায় সেচ সাময়িক বন্ধ রাখুন। বৃষ্টির পর মাটি জো হলে ইউরিয়া দিয়ে গোড়ায় মাটি তুলুন।"
              : "রোপণের ২০–২৫ দিন পর হালকা সেচ দিন। জো আসলে অর্ধেক ইউরিয়া সার ছিটিয়ে গাছের গোড়ায় মাটি তুলে দিন।",
          instructionEn:
            "Apply light furrow irrigation at 20–25 days. Top-dress half urea and earth-up ridges once soil is workable.",
          doseBn: "ইউরিয়া ১৮ কেজি প্রতি বিঘা",
          doseEn: "Urea 18 kg per bigha",
          isWeatherSensitive: true,
          weatherWarningBn:
            hasRain
              ? "আবহাওয়া সতর্কতা: বৃষ্টির পূর্বাভাস আছে। সেচ স্থগিত রাখুন এবং বৃষ্টির পর ইউরিয়া দিন।"
              : undefined,
          weatherWarningEn:
            hasRain
              ? "Weather warning: Rain expected. Postpone irrigation and apply urea after rainfall."
              : undefined,
        },
        {
          id: "t_pot_4",
          seasonNameBn: "রবি মৌসুম (কার্তিক–মাঘ)",
          seasonNameEn: "Rabi Season (Nov–Feb)",
          cropKey: "potato",
          stageBn: "নাবী ধসা রোগ নজরদারি",
          stageEn: "Late Blight Monitoring",
          approxDays: "ডিসেম্বর–জানুয়ারি",
          titleBn: "ঘন কুয়াশা ও নাবী ধসা থেকে আলু রক্ষা",
          titleEn: "Late Blight Prevention During Winter Fog",
          instructionBn:
            "টানা কুয়াশা ও মেঘলা আবহাওয়ায় ম্যানকোজেব জাতীয় ছত্রাকনাশক প্রতি লিটার পানিতে ২ গ্রাম হারে মিশিয়ে স্প্রে করুন।",
          instructionEn:
            "Spray Mancozeb preventive fungicide at 2 g/L during dense persistent fog.",
          doseBn: "ম্যানকোজেব (ডায়থেন এম-৪৫) স্প্রে",
          doseEn: "Mancozeb spray 2 g/L",
          isWeatherSensitive: true,
        },
        {
          id: "t_pot_5",
          seasonNameBn: "রবি মৌসুম (কার্তিক–মাঘ)",
          seasonNameEn: "Rabi Season (Nov–Feb)",
          cropKey: "potato",
          stageBn: "আলু কর্তন ও উত্তোলন",
          stageEn: "Harvest & Curing",
          approxDays: "১০–২০ ফেব্রুয়ারি",
          titleBn: "গাছ কেটে ১০ দিন পর আলু তোলা",
          titleEn: "Haulm Cutting & Harvest Curing",
          instructionBn:
            "তোলার ১০ দিন আগে মাটির উপরের গাছ কেটে দিন যাতে আলুর চামড়া শক্ত হয়। শুকনো দিনে সাবধানে আলু তুলুন।",
          instructionEn:
            "Dehaulm 10 days before digging to cure potato skin. Harvest on dry sunny days.",
        },
        {
          id: "t_mung_1",
          seasonNameBn: "খরিপ-১ মৌসুম (ফাল্গুন–জ্যৈষ্ঠ)",
          seasonNameEn: "Kharif-1 Season (Mar–May)",
          cropKey: "mungbean",
          stageBn: "মুগ ডাল বপন ও নাইট্রোজেন বৃদ্ধি",
          stageEn: "Mungbean Sowing & Biological N-Fixation",
          approxDays: "১–১৫ মার্চ",
          titleBn: "বারি মুগ-৬ বপন (মাটির উর্বরতা পুনরুদ্ধার)",
          titleEn: "Sow BARI Mung-6 for Soil Regeneration",
          instructionBn:
            "আলু কাটার পর মাটিতে অবশিষ্ট সারে মুগ বীজ বপন করুন। শিকড়ে নাইট্রোজেন গুটি তৈরি হয়ে মাটির উর্বরতা বাড়াবে।",
          instructionEn:
            "Sow mungbean utilizing residual moisture and nutrients. Rhizobium nodules naturally fix atmospheric nitrogen.",
          doseBn: "বীজ ৪ কেজি প্রতি বিঘা (রাইজোবিয়াম ইনোকুলাম সহ)",
          doseEn: "Seed 4 kg per bigha with Rhizobium inoculum",
        },
        {
          id: "t_aman_1",
          seasonNameBn: "খরিপ-২ মৌসুম (আষাঢ়–কার্তিক)",
          seasonNameEn: "Kharif-2 Season (Jul–Nov)",
          cropKey: "rice",
          stageBn: "রোপা আমন চারা রোপণ",
          stageEn: "T. Aman Rice Transplanting",
          approxDays: "১৫–৩০ জুলাই",
          titleBn: "ব্রি ধান-৮৭ চারা রোপণ (বৃষ্টির পানিতে চাষ)",
          titleEn: "Transplant BRRI Dhan-87 (Monsoon Rainfed)",
          instructionBn:
            "মুগের গাছ চাষ দিয়ে মাটিতে মিশিয়ে দিন (সবুজ সার)। ২৫–৩০ দিনের সুস্থ চারা ২০×১৫ সেমি দূরত্বে রোপণ করুন।",
          instructionEn:
            "Incorporate mungbean residue as green manure. Transplant 25–30 day seedlings at 20x15 cm spacing using monsoon rains.",
          doseBn: "ইউরিয়া ১০ কেজি কম লাগবে (সবুজ সারের কারণে)",
          doseEn: "Save 10 kg Urea per bigha due to legume residue",
        },
      ];
    } else if (option.key === "shift") {
      // Mustard -> Mungbean -> Aman Rice
      return [
        {
          id: "t_mus_1",
          seasonNameBn: "রবি মৌসুম (কার্তিক–মাঘ)",
          seasonNameEn: "Rabi Season (Nov–Jan)",
          cropKey: "mustard",
          stageBn: "জমি তৈরি ও সরিষা বীজ বপন",
          stageEn: "Land Preparation & Sowing",
          approxDays: "১৫–২৫ নভেম্বর",
          titleBn: "বারি সরিষা-১৪/১৮ বপন (বোরোর বদলে সেরা)",
          titleEn: "Sow BARI Sarisha-14/18 (Low Water Alternative)",
          instructionBn:
            "জমি ৩–৪ বার চাষ দিয়ে সমান করুন। কার্তিক–অগ্রহায়ণে বপন করলে জাবপোকার আক্রমণ এড়ানো যায়।",
          instructionEn:
            "Plough 3–4 times. Mid-November planting avoids severe winter aphid infestation peaks.",
          doseBn: "বীজ ১ কেজি, টিএসপি ১০ কেজি, এমওপি ৮ কেজি, জিপসাম ৬ কেজি",
          doseEn: "Seed 1 kg, TSP 10 kg, MoP 8 kg, Gypsum 6 kg per bigha",
        },
        {
          id: "t_mus_2",
          seasonNameBn: "রবি মৌসুম (কার্তিক–মাঘ)",
          seasonNameEn: "Rabi Season (Nov–Jan)",
          cropKey: "mustard",
          stageBn: "১ম হালকা সেচ ও ইউরিয়া",
          stageEn: "1st Irrigation & Nitrogen Top-dress",
          approxDays: weatherShifted ? "১০–১৫ ডিসেম্বর (বৃষ্টির পর)" : "৫–১০ ডিসেম্বর",
          titleBn: "ফুল ফোটার শুরুতে একমাত্র হালকা সেচ",
          titleEn: "Single Controlled Irrigation at Flower Bud Stage",
          instructionBn:
            hasRain && !weatherShifted
              ? "সতর্কতা: বৃষ্টির পূর্বাভাস থাকায় সেচ স্থগিত রাখুন। বৃষ্টির পর জমি জো হলে ইউরিয়া ছিটিয়ে দিন।"
              : "ফুল আসার শুরুতে ১টি হালকা সেচ দিন। জমিতে যেন পানি না জমে। সেচের পর বিঘায় ১২ কেজি ইউরিয়া দিন।",
          instructionEn:
            "Provide one light irrigation before flowering. Ensure zero waterlogging. Top-dress 12 kg Urea once workable.",
          doseBn: "ইউরিয়া ১২ কেজি প্রতি বিঘা",
          doseEn: "Urea 12 kg per bigha",
          isWeatherSensitive: true,
          weatherWarningBn:
            hasRain
              ? "আবহাওয়া সতর্কতা: বৃষ্টির পূর্বাভাস আছে। সেচ বন্ধ রাখুন এবং বৃষ্টির পর ইউরিয়া দিন।"
              : undefined,
          weatherWarningEn:
            hasRain
              ? "Weather warning: Rain expected. Hold irrigation and top-dress after rainfall."
              : undefined,
        },
        {
          id: "t_mus_3",
          seasonNameBn: "রবি মৌসুম (কার্তিক–মাঘ)",
          seasonNameEn: "Rabi Season (Nov–Jan)",
          cropKey: "mustard",
          stageBn: "ফসল কর্তন ও মাড়াই",
          stageEn: "Harvesting & Threshing",
          approxDays: "৫–১৫ ফেব্রুয়ারি",
          titleBn: "সরিষা পাকা ও কর্তন (৮০ দিনের স্বল্পমেয়াদী)",
          titleEn: "Harvest Matured Crop (80-Day Short Duration)",
          instructionBn:
            "গাছ ও শুঁটি শতকরা ৭০–৮০ ভাগ হলদে হলে সকালের দিকে কেটে নিন যাতে বীজ ঝরে না পড়ে।",
          instructionEn:
            "Harvest in early morning when 70–80% of siliques turn yellowish to prevent pod shattering.",
        },
        {
          id: "t_mung_2",
          seasonNameBn: "খরিপ-১ মৌসুম (ফাল্গুন–জ্যৈষ্ঠ)",
          seasonNameEn: "Kharif-1 Season (Mar–May)",
          cropKey: "mungbean",
          stageBn: "মুগ ডাল বপন",
          stageEn: "Mungbean Planting",
          approxDays: "১–১৫ মার্চ",
          titleBn: "বারি মুগ-৬ বপন (মাটিতে নাইট্রোজেন সঞ্চয়)",
          titleEn: "Sow BARI Mung-6 for Soil Nitrogen Regeneration",
          instructionBn:
            "সরিষা কাটার পর জমি তৈরি করে মুগ ডাল বপন করুন। এটি পরবর্তী আমন ধানের ইউরিয়া সারের খরচ অর্ধেক কমায়।",
          instructionEn:
            "Sow mungbean immediately after mustard. Enriches Barind soil and cuts chemical urea cost for monsoon rice.",
          doseBn: "বীজ ৪ কেজি প্রতি বিঘা",
          doseEn: "Seed 4 kg per bigha",
        },
        {
          id: "t_aman_2",
          seasonNameBn: "খরিপ-২ মৌসুম (আষাঢ়–কার্তিক)",
          seasonNameEn: "Kharif-2 Season (Jul–Nov)",
          cropKey: "rice",
          stageBn: "রোপা আমন ধান",
          stageEn: "T. Aman Rice Transplanting",
          approxDays: "১৫–৩০ জুলাই",
          titleBn: "ব্রি ধান-৮৭ চারা রোপণ",
          titleEn: "Transplant BRRI Dhan-87",
          instructionBn:
            "বর্ষার পানিতে রোপা আমন সম্পন্ন করুন। বোরোর মতো কোনো গভীর নলকূপের ভারী সেচ খরচের প্রয়োজন নেই।",
          instructionEn:
            "Rely entirely on seasonal monsoon rain, avoiding deep tube-well pumping costs of winter boro.",
        },
      ];
    } else {
      // Lentil -> Mungbean -> Aman Rice (Low cost, low effort)
      return [
        {
          id: "t_len_1",
          seasonNameBn: "রবি মৌসুম (কার্তিক–মাঘ)",
          seasonNameEn: "Rabi Season (Nov–Feb)",
          cropKey: "lentil",
          stageBn: "মসুর বীজ বপন ও জমি তৈরি",
          stageEn: "Lentil Sowing & Minimal Tilth",
          approxDays: "১৫–৩০ নভেম্বর",
          titleBn: "বারি মসুর-৮ বপন (কম খরচে বেশি লাভ)",
          titleEn: "Sow BARI Masur-8 (Low Cost, High Market Value)",
          instructionBn:
            "জমি ২–৩ বার হালকা চাষ দিয়ে জো অবস্থায় বীজ ছিটিয়ে দিন। মসুরে কোনো রাসায়নিক নাইট্রোজেন সারের প্রয়োজন নেই।",
          instructionEn:
            "Sow in moist soil after 2 light ploughs. Lentil fixes its own nitrogen, needing zero urea fertilizer.",
          doseBn: "বীজ ৪–৫ কেজি, টিএসপি ৮ কেজি, এমওপি ৫ কেজি প্রতি বিঘা",
          doseEn: "Seed 4–5 kg, TSP 8 kg, MoP 5 kg per bigha",
        },
        {
          id: "t_len_2",
          seasonNameBn: "রবি মৌসুম (কার্তিক–মাঘ)",
          seasonNameEn: "Rabi Season (Nov–Feb)",
          cropKey: "lentil",
          stageBn: "আগাছা দমন ও মাটির আর্দ্রতা রক্ষা",
          stageEn: "Weeding & Moisture Conservation",
          approxDays: "২০–২৫ ডিসেম্বর",
          titleBn: "১টি নিড়ানি ও নিকাশ নিশ্চিতকরণ",
          titleEn: "Single Hand Weeding & Drainage Maintenance",
          instructionBn:
            "গাছ ছোট অবস্থায় আগাছা পরিষ্কার করুন। জমিতে যেন কোনোভাবেই বৃষ্টির পানি জমে না থাকে।",
          instructionEn:
            "Keep plot weed-free at seedling stage. Ensure free surface drainage as lentil is sensitive to standing water.",
          isWeatherSensitive: true,
          weatherWarningBn:
            hasRain
              ? "আবহাওয়া সতর্কতা: বৃষ্টি হলে মসুরের জমিতে পানি জমতে দেওয়া যাবে না, নালা কেটে পানি বের করে দিন।"
              : undefined,
          weatherWarningEn:
            hasRain
              ? "Weather warning: Drain any standing rainwater immediately to prevent root rot."
              : undefined,
        },
        {
          id: "t_len_3",
          seasonNameBn: "রবি মৌসুম (কার্তিক–মাঘ)",
          seasonNameEn: "Rabi Season (Nov–Feb)",
          cropKey: "lentil",
          stageBn: "মসুর কর্তন",
          stageEn: "Harvesting",
          approxDays: "২০ ফেব্রুয়ারি – ৫ মার্চ",
          titleBn: "সকালে ফসল কর্তন ও মাড়াই",
          titleEn: "Morning Harvesting & Threshing",
          instructionBn:
            "গাছের নিচের পাতা শুকিয়ে শুঁটি বাদামী হলে সকালে কেটে রোদ্রে শুকিয়ে মাড়াই করুন।",
          instructionEn:
            "Harvest in morning hours when pods turn brownish to prevent pod shatter.",
        },
        {
          id: "t_mung_3",
          seasonNameBn: "খরিপ-১ মৌসুম (ফাল্গুন–জ্যৈষ্ঠ)",
          seasonNameEn: "Kharif-1 Season (Mar–May)",
          cropKey: "mungbean",
          stageBn: "মুগ ডাল বপন",
          stageEn: "Mungbean Sowing",
          approxDays: "১০–২৫ মার্চ",
          titleBn: "বারি মুগ-৬ বপন (অতিরিক্ত আয় ও সবুজ সার)",
          titleEn: "Sow BARI Mung-6 for Double Legume Soil Rebuilding",
          instructionBn:
            "মসুরের পরপরই মুগ চাষ করলে জমিতে দ্বিগুণ নাইট্রোজেন জমে এবং মাটির স্বাস্থ্য চমৎকার থাকে।",
          instructionEn:
            "Successive pulse rotation doubles natural nitrogen capture and restores organic carbon.",
          doseBn: "বীজ ৪ কেজি প্রতি বিঘা",
          doseEn: "Seed 4 kg per bigha",
        },
        {
          id: "t_aman_3",
          seasonNameBn: "খরিপ-২ মৌসুম (আষাঢ়–কার্তিক)",
          seasonNameEn: "Kharif-2 Season (Jul–Nov)",
          cropKey: "rice",
          stageBn: "রোপা আমন ধান",
          stageEn: "T. Aman Rice",
          approxDays: "জুলাই–নভেম্বর",
          titleBn: "বৃষ্টি নির্ভর ব্রি ধান-৮৭ চাষ",
          titleEn: "Rainfed BRRI Dhan-87 Planting",
          instructionBn:
            "টানা দুটি ডাল ফসলের পর আমন ধান চাষে আশাতীত ফলন পাওয়া যায় এবং ইউরিয়া সার ৬০% সাশ্রয় হয়।",
          instructionEn:
            "Monsoon rice after two pulse crops yields exceptionally well with up to 60% less synthetic fertilizer.",
        },
      ];
    }
  };

  const tasks = getTasksForOption();

  // Handle weather date shift
  const handleToggleWeatherShift = () => {
    setWeatherShifted((prev) => !prev);
  };

  // AI interactive prompt query
  const handleAskAi = async () => {
    if (!aiQuery.trim()) return;
    setLoadingAi(true);
    setAiAnswer(null);

    try {
      const res = await fetch("/api/advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `${option.key} ফসলের পর্যায়: ${option.crops.join(", ")}। এলাকা: ${areaNameBn} (${lat}, ${lng})। প্রশ্ন: ${aiQuery}`,
          location: { name: areaNameBn, district: "Rajshahi", lat, lon: lng },
          language: lang,
        }),
      });

      if (!res.ok) throw new Error("AI advisor request failed");
      const data = await res.json();
      setAiAnswer(
        data.reply ||
          data.plain_language_answer ||
          (lang === "bn"
            ? "আপনার নির্বাচিত ফসল পর্যায়ের জন্য সময়মতো বীজ বপন এবং বৃষ্টির পূর্বাভাস মেনে সেচ স্থগিত রাখা সর্বোচ্চ ফলন নিশ্চিত করবে।"
            : "Following the recommended sowing window and holding irrigation around rain events ensures maximum yield.")
      );
    } catch {
      setAiAnswer(
        lang === "bn"
          ? "পরামর্শ: বৃষ্টির পূর্বাভাস থাকলে সেচ সাময়িক স্থগিত রাখুন এবং জমি জো আসলে ইউরিয়া উপরিপ্রয়োগ করুন। প্রয়োজনে আপনার উপ-সহকারী কৃষি কর্মকর্তার পরামর্শ নিন।"
          : "Advice: Hold scheduled irrigation during rain events and apply urea top-dress once the soil is workable."
      );
    } finally {
      setLoadingAi(false);
    }
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Top Navigation & Selected Plan Summary */}
      <div className="p-4 rounded-2xl bg-forest text-white border border-forest shadow-card">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-gold text-[#1a1300] font-bold">
            {lang === "bn" ? "নির্বাচিত চাষ পরিকল্পনা" : "Selected Rotation Outline"}
          </span>
          {onBackToOptions && (
            <button
              type="button"
              onClick={onBackToOptions}
              className="text-xs text-gold underline hover:text-white transition-colors"
            >
              {lang === "bn" ? "বিকল্প বদলান" : "Change Rotation"}
            </button>
          )}
        </div>

        <h2 className="text-xl sm:text-2xl font-bold leading-tight mb-2">
          {lang === "bn" ? option.title_bn : option.title_en}
        </h2>
        <p className="text-sm text-[#cfe0d3] leading-snug m-0">
          {lang === "bn" ? option.reason_bn : option.reason_en} (এলাকা: {areaNameBn})
        </p>

        {/* 3 Crop Badges */}
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/20">
          {option.crops.map((c, i) => (
            <React.Fragment key={c + i}>
              {i > 0 && <span className="text-white/60 font-bold">›</span>}
              <div className="inline-flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-lg text-xs font-semibold">
                <CropIcon crop={c} size={24} />
                <span>{CROP_NAMES[lang][c] || c}</span>
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Live Weather Forecast & Automated Warning Strip */}
      <div className="p-4 rounded-2xl bg-surface border border-border shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CloudRain className="w-5 h-5 text-water" />
            <span className="font-bold text-[16px] text-primary">
              {lang === "bn" ? "লাইভ আবহাওয়া পূর্বাভাস (রাজশাহী বরেন্দ্র)" : "Live Weather Telemetry (Barind)"}
            </span>
          </div>
          {loadingWeather && (
            <div className="w-4 h-4 rounded-full border-2 border-gold border-t-transparent animate-spin" />
          )}
        </div>

        {/* 7-Day Live Forecast Tiles */}
        {weatherData && weatherData.daily.length > 0 && (
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5 pt-1 overflow-x-auto">
            {weatherData.daily.map((day, idx) => {
              const dayLabel = day.date.split("-")[2];
              const isRain = day.rainMm >= 1.0;

              return (
                <div
                  key={day.date}
                  className={`p-2 rounded-xl text-center border transition-all ${
                    isRain
                      ? "bg-water/10 border-water text-primary ring-1 ring-water/40 font-bold"
                      : "bg-bg border-border text-secondary"
                  }`}
                >
                  <span className="text-[11px] block font-mono">
                    {idx === 0 ? (lang === "bn" ? "আজ" : "Today") : `${dayLabel} তারিখ`}
                  </span>
                  <div className="my-1 flex justify-center">
                    {day.icon === "rain" ? (
                      <CloudRain className="w-4 h-4 text-water animate-bounce" />
                    ) : (
                      <Sun className="w-4 h-4 text-gold" />
                    )}
                  </div>
                  <span className="text-xs font-bold block text-primary">{day.maxTemp}°C</span>
                  {day.rainMm > 0 ? (
                    <span className="text-[10px] text-water font-bold block">{day.rainMm}mm</span>
                  ) : (
                    <span className="text-[10px] text-muted block">শুষ্ক</span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Actionable Weather Warning Alert */}
        {weatherData?.hasRainWarning && (
          <div className="p-3 rounded-xl bg-gold/15 border border-gold/40 text-primary space-y-2">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-[#b08000] shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm font-medium leading-relaxed">
                {lang === "bn" ? weatherData.rainAlertBn : weatherData.rainAlertEn}
              </div>
            </div>

            <button
              type="button"
              onClick={handleToggleWeatherShift}
              className="w-full py-2 px-3 rounded-lg bg-gold hover:opacity-90 text-[#1a1300] font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>
                {weatherShifted
                  ? lang === "bn"
                    ? "✓ বৃষ্টির কারণে সেচ পেছানো হয়েছে (পুনরায় দেখতে চাপুন)"
                    : "✓ Schedule shifted past rain window (tap to toggle)"
                  : lang === "bn"
                  ? "আবহাওয়ার সতর্কতা অনুযায়ী সেচের তারিখ পিছিয়ে নিন"
                  : "Adapt schedule and shift irrigation past rain"}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Date-wise Farming Plan Outline */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-leaf" />
            <h3 className="text-lg font-bold text-primary m-0">
              {lang === "bn" ? "কখন কী করবেন: পূর্ণাঙ্গ চাষের রূপরেখা" : "When & What to Do: Farming Schedule"}
            </h3>
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            className="text-xs font-medium text-forest hover:text-gold flex items-center gap-1 px-2.5 py-1 rounded bg-surface border border-border"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{lang === "bn" ? "ছাপুন" : "Print"}</span>
          </button>
        </div>

        {/* Task Cards Sequence */}
        <div className="space-y-2.5">
          {tasks.map((task, idx) => (
            <div
              key={task.id}
              className={`p-4 rounded-xl border transition-all shadow-2xs bg-surface ${
                task.weatherWarningBn
                  ? "border-gold/60 ring-1 ring-gold/40"
                  : "border-border"
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-forest text-white text-xs font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <div>
                    <span className="text-[11px] font-mono font-bold text-secondary uppercase block">
                      {lang === "bn" ? task.seasonNameBn : task.seasonNameEn} • {task.approxDays}
                    </span>
                    <h4 className="text-[16px] font-bold text-primary m-0 leading-tight">
                      {lang === "bn" ? task.titleBn : task.titleEn}
                    </h4>
                  </div>
                </div>

                <CropIcon crop={task.cropKey} size={32} />
              </div>

              <p className="text-[14px] text-secondary leading-relaxed mt-2 mb-1.5 pl-8">
                {lang === "bn" ? task.instructionBn : task.instructionEn}
              </p>

              {task.doseBn && (
                <div className="ml-8 mt-2 p-2 rounded-lg bg-bg border border-border text-xs text-primary font-medium">
                  <span className="font-bold text-forest">সারের মাত্রা: </span>
                  {lang === "bn" ? task.doseBn : task.doseEn}
                </div>
              )}

              {task.weatherWarningBn && (
                <div className="ml-8 mt-2 p-2 rounded-lg bg-gold/15 border border-gold/40 text-xs text-[#705200] font-semibold flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>{lang === "bn" ? task.weatherWarningBn : task.weatherWarningEn}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Interactive AI Farm Advisor Q&A */}
      <div className="p-4 rounded-2xl bg-surface border border-border shadow-card space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-gold" />
          <span className="font-bold text-[16px] text-primary">
            {lang === "bn" ? "AI কৃষি উপদেষ্টাকে জিজ্ঞাসা করুন" : "Ask AI Advisor for Tailored Guidance"}
          </span>
        </div>

        <p className="text-xs text-secondary leading-relaxed m-0">
          {lang === "bn"
            ? "আপনার নির্বাচিত ফসল, সার প্রয়োগ বা আবহাওয়ার সমস্যা সম্পর্কে প্রশ্ন লিখুন বা বলুন।"
            : "Ask questions specifically tailored to this crop sequence, soil and local Barind climate."}
        </p>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={aiQuery}
            onChange={(e) => setAiQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAskAi()}
            placeholder={
              lang === "bn"
                ? "যেমন: মাটিতে ইউরিয়া কখন দেব বা নাবী ধসা থেকে রক্ষার উপায় কি?"
                : "e.g. When is the best time to apply urea or prevent blight?"
            }
            className="flex-1 min-h-[44px] px-3.5 text-sm bg-bg rounded-xl border border-border text-primary focus:outline-none focus:ring-2 focus:ring-gold"
          />

          <button
            type="button"
            disabled={loadingAi || !aiQuery.trim()}
            onClick={handleAskAi}
            className="min-h-[44px] px-4 rounded-xl bg-forest text-gold font-bold text-sm flex items-center gap-1.5 disabled:opacity-50 hover:bg-forest/90 transition-all cursor-pointer"
          >
            {loadingAi ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span>{lang === "bn" ? "জিজ্ঞাসা" : "Ask"}</span>
          </button>
        </div>

        {aiAnswer && (
          <div className="p-3.5 rounded-xl bg-leaf/10 border border-leaf/30 text-xs sm:text-sm text-primary leading-relaxed animate-fadeIn">
            <span className="font-bold text-leaf block mb-1">
              {lang === "bn" ? "উপদেষ্টার উত্তর:" : "Advisor Response:"}
            </span>
            <p className="m-0 text-secondary">{aiAnswer}</p>
          </div>
        )}
      </div>
    </div>
  );
};

