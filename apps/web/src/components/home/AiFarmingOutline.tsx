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
  Layers,
  CheckSquare,
} from "lucide-react";
import { CropIcon, CROP_NAMES } from "@/components/crops/CropIcon";
import type { RecommendOption } from "@/lib/recommend/recommendData";
import type { WeatherResponse, DailyWeather } from "@/app/api/weather/route";

interface FarmingTask {
  id: string;
  seasonKey: "rabi" | "kharif1" | "kharif2";
  seasonNameBn: string;
  seasonNameEn: string;
  cropKey: string;
  stageBn?: string;
  stageEn?: string;
  approxDays: string;
  dayBadgeBn?: string;
  dayBadgeEn?: string;
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
  const [selectedSeason, setSelectedSeason] = useState<"all" | "rabi" | "kharif1" | "kharif2">("all");
  const [aiQuery, setAiQuery] = useState("");
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>({});

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

  const toggleTaskCompleted = (taskId: string) => {
    setCompletedTasks((prev) => ({
      ...prev,
      [taskId]: !prev[taskId],
    }));
  };

  // Generate date-wise outline based on rotation key and crops
  const getTasksForOption = (): FarmingTask[] => {
    const hasRain = weatherData?.hasRainWarning || false;

    if (option.key === "profit") {
      // Potato -> Mungbean -> Aman Rice
      return [
        // RABI SEASON: POTATO (7 steps)
        {
          id: "t_pot_1",
          seasonKey: "rabi",
          seasonNameBn: "রবি মৌসুম (কার্তিক–মাঘ)",
          seasonNameEn: "Rabi Season (Nov–Feb)",
          cropKey: "potato",
          dayBadgeBn: "দিন ১–৫",
          dayBadgeEn: "Day 1–5",
          stageBn: "জমি তৈরি ও বেসাল সার প্রয়োগ",
          stageEn: "Land Preparation & Basal Fertilizer",
          approxDays: "১০–২০ নভেম্বর",
          titleBn: "জমি গভীরভাবে ৪–৫ বার চাষ ও সুষম সার প্রয়োগ",
          titleEn: "Deep Tilth & Basal Fertilizer Application",
          instructionBn:
            "মাটি ৪–৫ বার আড়াআড়ি চাষ ও মই দিয়ে ঝুরঝুরে করুন। শেষ চাষের সময় গোবর, টিএসপি, অর্ধেক এমওপি, জিপসাম, বোরন ও অর্ধেক ইউরিয়া মাটিতে মিশিয়ে ভেলি (Ridge) তৈরি করুন।",
          instructionEn:
            "Plough 4–5 times to a fine tilth. Apply compost, TSP, half MoP, Gypsum, Boron, and half Urea before furrowing.",
          doseBn: "গোবর ৮০০ কেজি, ইউরিয়া ১৮ কেজি, টিএসপি ৩৫ কেজি, এমওপি ২০ কেজি, জিপসাম ১৫ কেজি, বোরন ১.৫ কেজি প্রতি বিঘা (৩৩ শতক)।",
          doseEn: "Compost 800 kg, Urea 18 kg, TSP 35 kg, MoP 20 kg, Gypsum 15 kg, Boron 1.5 kg per bigha.",
        },
        {
          id: "t_pot_2",
          seasonKey: "rabi",
          seasonNameBn: "রবি মৌসুম (কার্তিক–মাঘ)",
          seasonNameEn: "Rabi Season (Nov–Feb)",
          cropKey: "potato",
          dayBadgeBn: "রোপণ দিন",
          dayBadgeEn: "Planting Day",
          stageBn: "বীজ আলু রোপণ",
          stageEn: "Seed Potato Planting",
          approxDays: "১৫–২৫ নভেম্বর",
          titleBn: "অঙ্কুরিত রোগমুক্ত বীজ আলু সারিবদ্ধ রোপণ",
          titleEn: "Planting Sprouted Disease-Free Tubers",
          instructionBn:
            "৬০ সেমি দূরত্বে ভেলি করে ২৫ সেমি পর পর বীজ আলু মাটির নিচে ৫–৭ সেমি গভীরে চোখ উপরের দিকে রেখে রোপণ করুন। সুস্থ বিএডিসি প্রত্যয়িত বীজ ব্যবহার করুন।",
          instructionEn:
            "Plant sprouted tubers at 60 cm row spacing and 25 cm plant spacing at 5–7 cm depth.",
          doseBn: "বীজ আলু ২০০–২৫০ কেজি প্রতি বিঘা।",
          doseEn: "Seed tuber 200–250 kg per bigha.",
        },
        {
          id: "t_pot_3",
          seasonKey: "rabi",
          seasonNameBn: "রবি মৌসুম (কার্তিক–মাঘ)",
          seasonNameEn: "Rabi Season (Nov–Feb)",
          cropKey: "potato",
          dayBadgeBn: "রোপণের ২০–২৫ দিন",
          dayBadgeEn: "Day 20–25 Post-Plant",
          stageBn: "১ম সেচ ও গোড়ায় মাটি তোলা",
          stageEn: "1st Irrigation & Earthing-up",
          approxDays: weatherShifted ? "১৫–২০ ডিসেম্বর (বৃষ্টির পর)" : "৫–১০ ডিসেম্বর",
          titleBn: "১ম হালকা সেচ, বাকি ইউরিয়া উপরিপ্রয়োগ ও ভেলি উঁচু করা",
          titleEn: "1st Light Irrigation & Urea Top-dress",
          instructionBn:
            hasRain && !weatherShifted
              ? "সতর্কতা: বৃষ্টির পূর্বাভাস থাকায় সেচ স্থগিত রাখুন। বৃষ্টির পর মাটি জো হলে ইউরিয়া দিয়ে গোড়ায় মাটি তুলুন।"
              : "ভেলার দুই পাশের নালিতে হালকা সেচ দিন। জো আসলে বাকি ইউরিয়া ও বাকি এমওপি সার ছিটিয়ে গাছের গোড়ায় মাটি তুলে ভেলি উঁচু করুন।",
          instructionEn:
            "Apply light furrow irrigation at 20–25 days. Top-dress remaining urea and MoP, then earth-up ridges once soil is workable.",
          doseBn: "ইউরিয়া ১৮ কেজি এবং এমওপি ১৫ কেজি প্রতি বিঘা।",
          doseEn: "Urea 18 kg, MoP 15 kg per bigha.",
          isWeatherSensitive: true,
          weatherWarningBn:
            hasRain
              ? "আবহাওয়া সতর্কতা: বৃষ্টির পূর্বাভাস আছে। সেচ সাময়িক স্থগিত রাখুন এবং বৃষ্টির পর ইউরিয়া দিন।"
              : undefined,
          weatherWarningEn:
            hasRain
              ? "Weather warning: Rain expected. Postpone irrigation and apply urea after rainfall."
              : undefined,
        },
        {
          id: "t_pot_4",
          seasonKey: "rabi",
          seasonNameBn: "রবি মৌসুম (কার্তিক–মাঘ)",
          seasonNameEn: "Rabi Season (Nov–Feb)",
          cropKey: "potato",
          dayBadgeBn: "রোপণের ৪০–৪৫ দিন",
          dayBadgeEn: "Day 40–45 Post-Plant",
          stageBn: "২য় সেচ ও কন্দ গঠন তদারকি",
          stageEn: "2nd Irrigation & Tuber Bulking",
          approxDays: "২৫–৩০ ডিসেম্বর",
          titleBn: "কন্দ দ্রুত বৃদ্ধির সময়ে ২য় হালকা সেচ ও নিড়ানি",
          titleEn: "2nd Irrigation During Tuber Bulking",
          instructionBn:
            "আলু বড় হওয়ার এই সময়ে পানির ঘাটতি হলে ফলন কমে যায়। নালিতে ২য় হালকা সেচ দিন এবং নিশ্চিত করুন কোনো আলু যেন মাটি ভেদ করে বের হয়ে সবুজ না হয়।",
          instructionEn:
            "Provide second controlled furrow irrigation. Ensure tubers remain buried under ridges so they do not turn green.",
        },
        {
          id: "t_pot_5",
          seasonKey: "rabi",
          seasonNameBn: "রবি মৌসুম (কার্তিক–মাঘ)",
          seasonNameEn: "Rabi Season (Nov–Feb)",
          cropKey: "potato",
          dayBadgeBn: "কুয়াশা পর্যায়",
          dayBadgeEn: "Fog Window",
          stageBn: "নাবী ধসা রোগ নজরদারি",
          stageEn: "Late Blight Monitoring",
          approxDays: "১–১৫ জানুয়ারি",
          titleBn: "ঘন কুয়াশা ও নাবী ধসা (Late Blight) থেকে আলু রক্ষা",
          titleEn: "Late Blight Prevention During Winter Fog",
          instructionBn:
            "টানা কুয়াশা ও মেঘলা আবহাওয়ায় আগাম প্রতিরোধক হিসেবে ম্যানকোজেব (ডায়থেন এম-৪৫) প্রতি লিটার পানিতে ২ গ্রাম হারে মিশিয়ে স্প্রে করুন। রোগ আক্রমণ করলে সিকিউর বা এক্রোব্যাট স্প্রে করুন।",
          instructionEn:
            "Spray Mancozeb preventive fungicide at 2 g/L during dense persistent fog.",
          doseBn: "ম্যানকোজেব (ডায়থেন এম-৪৫) ২ গ্রাম/লিটার পানিতে স্প্রে।",
          doseEn: "Mancozeb spray 2 g/L water.",
          isWeatherSensitive: true,
        },
        {
          id: "t_pot_6",
          seasonKey: "rabi",
          seasonNameBn: "রবি মৌসুম (কার্তিক–মাঘ)",
          seasonNameEn: "Rabi Season (Nov–Feb)",
          cropKey: "potato",
          dayBadgeBn: "তোলার ১০ দিন আগে",
          dayBadgeEn: "10 Days Pre-Harvest",
          stageBn: "মাথার গাছ কর্তন (Haulm Cutting)",
          stageEn: "Haulm Cutting for Skin Curing",
          approxDays: "১–১০ ফেব্রুয়ারি",
          titleBn: "মাটির উপরিভাগের গাছ কেটে আলুর চামড়া শক্তকরণ",
          titleEn: "Cut Foliage to Strengthen Potato Skin",
          instructionBn:
            "আলু তোলার ৮–১০ দিন আগে মাটির উপরিভাগের সমস্ত গাছ কেটে সরিয়ে ফেলুন এবং সেচ বন্ধ রাখুন। এতে আলুর চামড়া শক্ত হবে এবং সংরক্ষণকালে ক্ষত বা পচন হবে না।",
          instructionEn:
            "Dehaulm 10 days before harvesting and stop watering. Toughens skin and prevents post-harvest bruising and rotting.",
        },
        {
          id: "t_pot_7",
          seasonKey: "rabi",
          seasonNameBn: "রবি মৌসুম (কার্তিক–মাঘ)",
          seasonNameEn: "Rabi Season (Nov–Feb)",
          cropKey: "potato",
          dayBadgeBn: "ফসল সংগ্রহ",
          dayBadgeEn: "Harvest Day",
          stageBn: "আলু উত্তোলন ও কিউরিং",
          stageEn: "Digging, Sorting & Curing",
          approxDays: "১৫–২৫ ফেব্রুয়ারি",
          titleBn: "শুকনো আবহাওয়ায় সাবধানে আলু উত্তোলন ও ছায়ায় কিউরিং",
          titleEn: "Harvest on Sunny Day & Shade Curing",
          instructionBn:
            "রোদেলা দিনে লাঙ্গল বা কোদাল দিয়ে সাবধানে আলু তুলুন। সরাসরি কড়া রোদে না রেখে ছায়াযুক্ত শীতল স্থানে মেঝেতে পাতলা করে ছড়িয়ে ৭–১০ দিন কিউরিং করুন।",
          instructionEn:
            "Dig tubers carefully on dry sunny days. Spread thinly under shaded ventilated area for 7–10 days curing.",
        },

        // KHARIF-1 SEASON: MUNGBEAN (4 steps)
        {
          id: "t_mung_pot_1",
          seasonKey: "kharif1",
          seasonNameBn: "খরিপ-১ মৌসুম (ফাল্গুন–জ্যৈষ্ঠ)",
          seasonNameEn: "Kharif-1 Season (Mar–May)",
          cropKey: "mungbean",
          dayBadgeBn: "দিন ১–৫",
          dayBadgeEn: "Day 1–5",
          stageBn: "মুগ ডাল বপন ও নাইট্রোজেন বৃদ্ধি",
          stageEn: "Mungbean Sowing & N-Fixation",
          approxDays: "১–১৫ মার্চ",
          titleBn: "বারি মুগ-৬ বপন (আলুর অবশিষ্ট সারের সদ্ব্যবহার)",
          titleEn: "Sow BARI Mung-6 for Soil Regeneration",
          instructionBn:
            "আলু তোলার পর জমি ইতিমধ্যে ঝুরঝুরে থাকে। ১–২টি হালকা চাষ দিয়ে সারিতে (৩০ সেমি পর পর) মুগ বীজ বপন করুন। বীজপ্রতি রাইজোবিয়াম অণুজীবাণু সার মিশিয়ে নিলে শিকড়ে প্রচুর নাইট্রোজেন গুটি হয়।",
          instructionEn:
            "Sow BARI Mung-6 in rows utilizing residual potato fertilizer. Rhizobium inoculum triggers natural nitrogen nodules.",
          doseBn: "বীজ ৪ কেজি প্রতি বিঘা, টিএসপি ৫ কেজি, এমওপি ৪ কেজি (ইউরিয়া ০ কেজি)।",
          doseEn: "Seed 4 kg, TSP 5 kg, MoP 4 kg per bigha (Zero urea).",
        },
        {
          id: "t_mung_pot_2",
          seasonKey: "kharif1",
          seasonNameBn: "খরিপ-১ মৌসুম (ফাল্গুন–জ্যৈষ্ঠ)",
          seasonNameEn: "Kharif-1 Season (Mar–May)",
          cropKey: "mungbean",
          dayBadgeBn: "বপনের ২০–২৫ দিন",
          dayBadgeEn: "Day 20–25",
          stageBn: "আগাছা নিড়ানি ও ফুল পর্যায়",
          stageEn: "Weeding & Flowering Stage",
          approxDays: "২৫ মার্চ – ৫ এপ্রিল",
          titleBn: "১টি নিড়ানি ও চৈত্র মাসের তাপদাহে হালকা সেচ",
          titleEn: "Single Hand Weeding & Flowering Moisture Check",
          instructionBn:
            "গাছ ছোট অবস্থায় ১টি নিড়ানি দিয়ে জমি আগাছামুক্ত করুন। চৈত্রের তীব্র খরায় মাটি ফেটে গেলে ফুল আসার শুরুতে একটিমাত্র হালকা সেচ দিন।",
          instructionEn:
            "Keep plot weed-free early. If extreme heat/drought occurs, apply one light supplemental irrigation at flower bud emergence.",
        },
        {
          id: "t_mung_pot_3",
          seasonKey: "kharif1",
          seasonNameBn: "খরিপ-১ মৌসুম (ফাল্গুন–জ্যৈষ্ঠ)",
          seasonNameEn: "Kharif-1 Season (Mar–May)",
          cropKey: "mungbean",
          dayBadgeBn: "বপনের ৫৫–৬০ দিন",
          dayBadgeEn: "Day 55–60",
          stageBn: "১ম দফায় পাকা শুঁটি সংগ্রহ",
          stageEn: "1st Stage Pod Picking",
          approxDays: "২৫ এপ্রিল – ৫ মে",
          titleBn: "১ম দফায় কালো শুঁটি তোলা (পড পিকিং)",
          titleEn: "First Flush Black Pod Picking",
          instructionBn:
            "গাছের শতকরা ৬০–৭০ ভাগ শুঁটি কালো বা গাঢ় বাদামী হলে সকালে হাত দিয়ে ছিঁড়ে তুলে নিন। রোদে শুকিয়ে মাড়াই করে দানা আলাদা করুন।",
          instructionEn:
            "Hand-pick mature black pods in the morning to prevent shattering. Sun-dry and thresh.",
        },
        {
          id: "t_mung_pot_4",
          seasonKey: "kharif1",
          seasonNameBn: "খরিপ-১ মৌসুম (ফাল্গুন–জ্যৈষ্ঠ)",
          seasonNameEn: "Kharif-1 Season (Mar–May)",
          cropKey: "mungbean",
          dayBadgeBn: "বপনের ৭০ দিন",
          dayBadgeEn: "Day 70",
          stageBn: "২য় দফায় শুঁটি তোলা ও সবুজ সার",
          stageEn: "Final Pod Pick & Green Manuring",
          approxDays: "১০–২০ মে",
          titleBn: "শেষ দফায় মুগ সংগ্রহ ও গাছ মাটিতে চাষ দিয়ে সবুজ সার তৈরি",
          titleEn: "Final Harvest & Legume Green Manure Incorporation",
          instructionBn:
            "বাকি পাকা শুঁটি তোলার পর অবশিষ্ট সবুজ গাছগুলো পাওয়ার টিলার দিয়ে চাষ করে মাটির সাথে মিশিয়ে দিন। এটি পচে পরবর্তী আমন ধানে অর্ধেক ইউরিয়া সারের খরচ বাঁচাবে।",
          instructionEn:
            "Plough remaining green legume biomass into soil. Enriches organic matter and cuts monsoon rice urea requirement by 50%.",
        },

        // KHARIF-2 SEASON: AMAN RICE (4 steps)
        {
          id: "t_aman_pot_1",
          seasonKey: "kharif2",
          seasonNameBn: "খরিপ-২ মৌসুম (আষাঢ়–কার্তিক)",
          seasonNameEn: "Kharif-2 Season (Jul–Nov)",
          cropKey: "rice",
          dayBadgeBn: "বীজতলা",
          dayBadgeEn: "Seedbed",
          stageBn: "বীজ শোধন ও বীজতলা তৈরি",
          stageEn: "Seedbed Preparation & Seed Treatment",
          approxDays: "১৫–৩০ জুন",
          titleBn: "ব্রি ধান-৮৭ / ব্রি ধান-৭১ এর সুস্থ চারা উৎপাদন",
          titleEn: "Healthy Seedling Raising of BRRI Dhan-87",
          instructionBn:
            "উঁচু জমিতে কাদাময় বীজতলায় প্রতি শতকে ৩ কেজি শোধিত বীজ বপন করুন। চারা ২৫–৩০ দিন বয়স পর্যন্ত সুস্থভাবে পরিচর্যা করুন।",
          instructionEn:
            "Sow treated certified seed on wet seedbed. Nurture for 25–30 days for robust disease-free seedlings.",
          doseBn: "বীজ ৩ কেজি প্রতি শতক বীজতলায়।",
          doseEn: "Seed 3 kg per decimal seedbed.",
        },
        {
          id: "t_aman_pot_2",
          seasonKey: "kharif2",
          seasonNameBn: "খরিপ-২ মৌসুম (আষাঢ়–কার্তিক)",
          seasonNameEn: "Kharif-2 Season (Jul–Nov)",
          cropKey: "rice",
          dayBadgeBn: "রোপণ দিন",
          dayBadgeEn: "Transplant Day",
          stageBn: "মূল জমি কাদাকরণ ও চারা রোপণ",
          stageEn: "Puddling & Seedling Transplanting",
          approxDays: "১৫–৩০ জুলাই",
          titleBn: "বর্ষার পানিতে মূল জমি তৈরি ও চারা রোপণ",
          titleEn: "Monsoon Rainfed Puddling & Transplanting",
          instructionBn:
            "সবুজ সারের জমিতে ৩–৪ বার চাষ ও মই দিয়ে কাদা তৈরি করুন। ২৫–৩০ দিন বয়সের চারা সারি থেকে সারি ২০ সেমি এবং গোছা থেকে গোছা ১৫ সেমি দূরত্বে রোপণ করুন।",
          instructionEn:
            "Transplant 25–30 day seedlings at 20x15 cm spacing using monsoon rainfall. Legume residue saves upfront nitrogen.",
          doseBn: "টিএসপি ৭ কেজি, এমওপি ৭ কেজি, জিপসাম ৫ কেজি, দস্তা ১ কেজি প্রতি বিঘা।",
          doseEn: "TSP 7 kg, MoP 7 kg, Gypsum 5 kg, Zinc 1 kg per bigha.",
        },
        {
          id: "t_aman_pot_3",
          seasonKey: "kharif2",
          seasonNameBn: "খরিপ-২ মৌসুম (আষাঢ়–কার্তিক)",
          seasonNameEn: "Kharif-2 Season (Jul–Nov)",
          cropKey: "rice",
          dayBadgeBn: "রোপণের ২০–২৫ দিন",
          dayBadgeEn: "Day 20–25 Post-Transplant",
          stageBn: "১ম নিড়ানি ও ইউরিয়া উপরিপ্রয়োগ",
          stageEn: "Weeding & Reduced Urea Top-dress",
          approxDays: "১৫–২৫ আগস্ট",
          titleBn: "কুশি গজানোর শুরুতে স্বল্প ইউরিয়া ও নিড়ানি",
          titleEn: "Early Tillering Weeding & Single Top-dress",
          instructionBn:
            "জমির আগাছা পরিষ্কার করুন। মুগডালের সবুজ সারের কারণে মাটিতে প্রচুর নাইট্রোজেন জমা থাকায় মাত্র ১ কিস্তিতে স্বল্প ইউরিয়া প্রয়োগ করলেই চলবে।",
          instructionEn:
            "Weed thoroughly. Apply a reduced single dose of urea as mungbean green manure supplies organic nitrogen.",
          doseBn: "ইউরিয়া ৮ কেজি প্রতি বিঘা (সাধারণের চেয়ে অর্ধেক সাশ্রয়)।",
          doseEn: "Urea 8 kg per bigha (50% savings due to legume green manure).",
        },
        {
          id: "t_aman_pot_4",
          seasonKey: "kharif2",
          seasonNameBn: "খরিপ-২ মৌসুম (আষাঢ়–কার্তিক)",
          seasonNameEn: "Kharif-2 Season (Jul–Nov)",
          cropKey: "rice",
          dayBadgeBn: "ফসল সংগ্রহ",
          dayBadgeEn: "Harvest Day",
          stageBn: "ধান কর্তন ও মাড়াই",
          stageEn: "Harvesting & Threshing",
          approxDays: "২৫ অক্টোবর – ১০ নভেম্বর",
          titleBn: "ধান কর্তন, মাড়াই ও পরবর্তী রবি আলুর প্রস্তুতি",
          titleEn: "Harvest Matured Paddy & Field Prep for Potato",
          instructionBn:
            "শীষের শতকরা ৮০ ভাগ ধান সোনালী বর্ণ হলে কেটে নিন। দ্রুত মাড়াই ও শুকিয়ে মাঠ খালি করুন যাতে মধ্য-নভেম্বরের মধ্যে রবি আলুর জমি তৈরি করা যায়।",
          instructionEn:
            "Harvest when 80% panicles turn golden yellow. Thresh, dry, and immediately prepare plot for winter potato.",
        },
      ];
    } else if (option.key === "shift") {
      // Mustard -> Mungbean -> Aman Rice
      return [
        // RABI SEASON: MUSTARD (6 steps)
        {
          id: "t_mus_1",
          seasonKey: "rabi",
          seasonNameBn: "রবি মৌসুম (কার্তিক–মাঘ)",
          seasonNameEn: "Rabi Season (Nov–Jan)",
          cropKey: "mustard",
          dayBadgeBn: "দিন ১–৫",
          dayBadgeEn: "Day 1–5",
          stageBn: "জমি তৈরি ও বেসাল সার প্রয়োগ",
          stageEn: "Land Preparation & Basal Fertilizer",
          approxDays: "১৫–২৫ নভেম্বর",
          titleBn: "গভীরভাবে চাষ ও সুষম সার প্রয়োগ (বোরোর বদলে সেরা বিকল্প)",
          titleEn: "Land Preparation & Basal Fertilizer Application",
          instructionBn:
            "জমি ৩–৪ বার আড়াআড়ি চাষ ও মই দিয়ে সমান ঝুরঝুরে করুন। শেষ চাষের সময় টিএসপি, অর্ধেক এমওপি, জিপসাম ও গোবর মাটিতে ভালোভাবে মিশিয়ে দিন। কার্তিক–অগ্রহায়ণে বপন করলে জাবপোকার আক্রমণ এড়ানো যায়।",
          instructionEn:
            "Plough 3–4 times. Mid-November planting avoids severe winter aphid infestation peaks. Incorporate basal fertilizers during final land preparation.",
          doseBn: "টিএসপি ১০ কেজি, এমওপি ৮ কেজি, জিপসাম ৬ কেজি, দস্তা ১ কেজি ও গোবর ৫০০ কেজি প্রতি বিঘা।",
          doseEn: "TSP 10 kg, MoP 8 kg, Gypsum 6 kg, Zinc 1 kg, Compost 500 kg per bigha.",
        },
        {
          id: "t_mus_2",
          seasonKey: "rabi",
          seasonNameBn: "রবি মৌসুম (কার্তিক–মাঘ)",
          seasonNameEn: "Rabi Season (Nov–Jan)",
          cropKey: "mustard",
          dayBadgeBn: "বপন দিন",
          dayBadgeEn: "Sowing Day",
          stageBn: "বীজ শোধন ও বপন",
          stageEn: "Seed Treatment & Sowing",
          approxDays: "১৮–২৫ নভেম্বর",
          titleBn: "বারি সরিষা-১৪/১৮ বীজ বপন (স্বল্পমেয়াদী জাত)",
          titleEn: "Sow BARI Sarisha-14/18 (80-Day Short Duration)",
          instructionBn:
            "জমিতে পর্যাপ্ত জো অবস্থায় বীজ ছিটিয়ে বা সারিতে (২৫ সেমি পর পর) বপন করুন। বপনের আগে প্রতি কেজি বীজে ২.৫ গ্রাম প্রোভ্যাক্স বা অটোস্টিন মিশিয়ে শোধন করে নিন।",
          instructionEn:
            "Broadcast or drill in 25 cm rows in moist soil. Treat seeds with Provax or Autostin (2.5 g/kg seed) to prevent seedling damping-off.",
          doseBn: "বীজ ১ কেজি প্রতি বিঘা।",
          doseEn: "Certified seed 1 kg per bigha.",
        },
        {
          id: "t_mus_3",
          seasonKey: "rabi",
          seasonNameBn: "রবি মৌসুম (কার্তিক–মাঘ)",
          seasonNameEn: "Rabi Season (Nov–Jan)",
          cropKey: "mustard",
          dayBadgeBn: "বপনের ১৫–২০ দিন",
          dayBadgeEn: "Day 15–20",
          stageBn: "চারা পাতলাকরণ ও ১ম নিড়ানি",
          stageEn: "Thinning & Hand Weeding",
          approxDays: "১–৭ ডিসেম্বর",
          titleBn: "গাছ পাতলাকরণ ও আগাছা পরিষ্কার",
          titleEn: "Seedling Thinning & Weed Removal",
          instructionBn:
            "চারা গজানোর ১০–১৫ দিন পর অতিরিক্ত চারা তুলে পাতলা করুন, যাতে গাছ থেকে গাছের দূরত্ব ৬–৮ সেমি বজায় থাকে। জমিতে কোনো আগাছা থাকলে সাবধানে নিড়িয়ে পরিষ্কার করুন।",
          instructionEn:
            "Thin out crowded seedlings to maintain 6–8 cm spacing between plants. Hand weed carefully.",
        },
        {
          id: "t_mus_4",
          seasonKey: "rabi",
          seasonNameBn: "রবি মৌসুম (কার্তিক–মাঘ)",
          seasonNameEn: "Rabi Season (Nov–Jan)",
          cropKey: "mustard",
          dayBadgeBn: "বপনের ২৫–৩০ দিন",
          dayBadgeEn: "Day 25–30",
          stageBn: "১ম হালকা সেচ ও ইউরিয়া উপরিপ্রয়োগ",
          stageEn: "1st Irrigation & Nitrogen Top-dress",
          approxDays: weatherShifted ? "১৫–২০ ডিসেম্বর (বৃষ্টির পর)" : "৮–১৫ ডিসেম্বর",
          titleBn: "ফুল ফোটার প্রাক্কালে একমাত্র হালকা সেচ ও ১ম ইউরিয়া",
          titleEn: "Single Controlled Irrigation at Flower Bud Stage",
          instructionBn:
            hasRain && !weatherShifted
              ? "সতর্কতা: বৃষ্টির পূর্বাভাস থাকায় সেচ সাময়িক স্থগিত রাখুন। বৃষ্টির পর মাটি জো হলে ইউরিয়া দিন।"
              : "ফুল আসার শুরুতে মাত্র একটি হালকা সেচ দিন। জমিতে কোনোভাবেই পানি জমতে দেবেন না, দ্রুত নিকাশ করুন। জমি জো আসার পর ইউরিয়া সার উপরিপ্রয়োগ করুন।",
          instructionEn:
            "Provide one light irrigation before flowering. Ensure zero waterlogging. Top-dress 12 kg Urea once workable.",
          doseBn: "ইউরিয়া ১২ কেজি প্রতি বিঘা।",
          doseEn: "Urea 12 kg per bigha.",
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
          id: "t_mus_5",
          seasonKey: "rabi",
          seasonNameBn: "রবি মৌসুম (কার্তিক–মাঘ)",
          seasonNameEn: "Rabi Season (Nov–Jan)",
          cropKey: "mustard",
          dayBadgeBn: "বপনের ৪৫–৫০ দিন",
          dayBadgeEn: "Day 45–50",
          stageBn: "জাবপোকা নজরদারি ও দমন",
          stageEn: "Aphid Monitoring & Management",
          approxDays: "১–১০ জানুয়ারি",
          titleBn: "শীতের কুয়াশাচ্ছন্ন আবহাওয়ায় জাবপোকা পর্যবেক্ষণ",
          titleEn: "Winter Fog Aphid Scouting & Spray",
          instructionBn:
            "টানা কুয়াশায় সরিষার ডগায় জাবপোকার আক্রমণ হতে পারে। আক্রান্ত হলে ইমিডাক্লোপ্রিড (টিডো/অ্যাডমায়ার) প্রতি ১০ লিটার পানিতে ২ মিলি অথবা ম্যালাথিয়ন ২ মিলি মিশিয়ে বিকালে স্প্রে করুন।",
          instructionEn:
            "Scout for aphids during heavy fog. If noticed, spray Imidacloprid (0.2 ml/L water) in late afternoon.",
          doseBn: "ইমিডাক্লোপ্রিড ০.২ মিলি প্রতি লিটার পানিতে স্প্রে।",
          doseEn: "Imidacloprid spray 0.2 ml/L water.",
          isWeatherSensitive: true,
        },
        {
          id: "t_mus_6",
          seasonKey: "rabi",
          seasonNameBn: "রবি মৌসুম (কার্তিক–মাঘ)",
          seasonNameEn: "Rabi Season (Nov–Jan)",
          cropKey: "mustard",
          dayBadgeBn: "বপনের ৭৫–৮৫ দিন",
          dayBadgeEn: "Day 75–85",
          stageBn: "ফসল পাকা ও মাড়াই",
          stageEn: "Harvesting & Threshing",
          approxDays: "৫–১৫ ফেব্রুয়ারি",
          titleBn: "সরিষা পাকা, কর্তন ও শুষ্ক মাড়াই (৮০ দিনের স্বল্পমেয়াদী)",
          titleEn: "Harvest Matured Crop (80-Day Short Duration)",
          instructionBn:
            "গাছ ও শুঁটি শতকরা ৭৫–৮০ ভাগ হলদে হলে সকালের দিকে কেটে নিন যাতে রোদে শুঁটি ফেটে বীজ ঝরে না পড়ে। মাড়াই করে বীজ ৩–৪ দিন কড়া রোদে শুকিয়ে সংরক্ষণ করুন।",
          instructionEn:
            "Harvest in early morning when 75–80% of siliques turn yellowish to prevent pod shattering. Sun-dry 3–4 days before bagging.",
        },

        // KHARIF-1 SEASON: MUNGBEAN (4 steps)
        {
          id: "t_mung_mus_1",
          seasonKey: "kharif1",
          seasonNameBn: "খরিপ-১ মৌসুম (ফাল্গুন–জ্যৈষ্ঠ)",
          seasonNameEn: "Kharif-1 Season (Mar–May)",
          cropKey: "mungbean",
          dayBadgeBn: "দিন ১–৫",
          dayBadgeEn: "Day 1–5",
          stageBn: "জমি তৈরি ও মুগ বপন",
          stageEn: "Land Preparation & Mungbean Sowing",
          approxDays: "২৫ ফেব্রুয়ারি – ১০ মার্চ",
          titleBn: "বারি মুগ-৬ বপন (মাটিতে প্রাকৃতিকভাবে নাইট্রোজেন সঞ্চয়)",
          titleEn: "Sow BARI Mung-6 for Biological Nitrogen Fixation",
          instructionBn:
            "সরিষা কাটার পর জমিতে ১–২ বার চাষ দিন। শিকড়ে নাইট্রোজেন গুটি গঠনের জন্য বীজপ্রতি ২০ গ্রাম রাইজোবিয়াম অণুজীবাণু সার মিশিয়ে সারিতে (৩০ সেমি পর পর) বপন করুন।",
          instructionEn:
            "Sow mungbean immediately after mustard. Enriches Barind soil and cuts chemical urea cost for monsoon rice.",
          doseBn: "বীজ ৪ কেজি প্রতি বিঘা, টিএসপি ৫ কেজি, এমওপি ৪ কেজি (ইউরিয়া প্রয়োজন নেই)।",
          doseEn: "Seed 4 kg, TSP 5 kg, MoP 4 kg per bigha (Zero urea).",
        },
        {
          id: "t_mung_mus_2",
          seasonKey: "kharif1",
          seasonNameBn: "খরিপ-১ মৌসুম (ফাল্গুন–জ্যৈষ্ঠ)",
          seasonNameEn: "Kharif-1 Season (Mar–May)",
          cropKey: "mungbean",
          dayBadgeBn: "বপনের ১৫–২০ দিন",
          dayBadgeEn: "Day 15–20",
          stageBn: "আগাছা দমন ও নিড়ানি",
          stageEn: "Weeding & Moisture Conservation",
          approxDays: "২০–২৫ মার্চ",
          titleBn: "নিড়ানি ও চৈত্রের খরায় মাটির আর্দ্রতা রক্ষা",
          titleEn: "Weed Control & Moisture Management",
          instructionBn:
            "চারা গজানোর পর জমিতে নিড়ানি দিয়ে আগাছা মুক্ত রাখুন। গাছে ফুল আসার শুরুতে খরা বা উচ্চ তাপমাত্রা দেখা দিলে মাত্র একটি হালকা সেচ দিন।",
          instructionEn:
            "Keep plot weed-free. If soil dries severely in Chaitra heat, apply one light supplemental irrigation at flower bud emergence.",
        },
        {
          id: "t_mung_mus_3",
          seasonKey: "kharif1",
          seasonNameBn: "খরিপ-১ মৌসুম (ফাল্গুন–জ্যৈষ্ঠ)",
          seasonNameEn: "Kharif-1 Season (Mar–May)",
          cropKey: "mungbean",
          dayBadgeBn: "বপনের ৫৫–৬০ দিন",
          dayBadgeEn: "Day 55–60",
          stageBn: "১ম দফায় পাকা শুঁটি সংগ্রহ",
          stageEn: "1st Stage Pod Picking",
          approxDays: "২০–৩০ এপ্রিল",
          titleBn: "১ম দফায় কালো শুঁটি তোলা (পড পিকিং)",
          titleEn: "Hand-picking Mature Black Pods",
          instructionBn:
            "গাছের অধিকাংশ শুঁটি কালো বা গাঢ় বাদামী হলে সকালে হাত দিয়ে ছিঁড়ে তুলে নিন। রোদে শুকিয়ে মাড়াই করুন।",
          instructionEn:
            "Hand-pick mature pods in morning hours. Sun-dry and thresh.",
        },
        {
          id: "t_mung_mus_4",
          seasonKey: "kharif1",
          seasonNameBn: "খরিপ-১ মৌসুম (ফাল্গুন–জ্যৈষ্ঠ)",
          seasonNameEn: "Kharif-1 Season (Mar–May)",
          cropKey: "mungbean",
          dayBadgeBn: "বপনের ৭০–৭৫ দিন",
          dayBadgeEn: "Day 70–75",
          stageBn: "২য় দফায় শুঁটি তোলা ও সবুজ সার",
          stageEn: "Final Pod Pick & Green Manuring",
          approxDays: "১০–২০ মে",
          titleBn: "২য় দফায় ফসল সংগ্রহ ও মুগ গাছ মাটিতে মিশিয়ে সবুজ সার তৈরি",
          titleEn: "Final Flush Harvest & Green Manure Incorporation",
          instructionBn:
            "বাকি পাকা শুঁটি তোলার পর অবশিষ্ট সবুজ গাছগুলো লাঙ্গল দিয়ে চাষ করে মাটির সাথে মিশিয়ে দিন। এটি মাটিতে পচে উৎকৃষ্ট জৈব সার হবে এবং আমন ধানে অর্ধেক ইউরিয়া সাশ্রয় করবে।",
          instructionEn:
            "Incorporate remaining crop residue into soil as green manure. Provides organic matter and saves chemical fertilizer.",
        },

        // KHARIF-2 SEASON: AMAN RICE (5 steps)
        {
          id: "t_aman_mus_1",
          seasonKey: "kharif2",
          seasonNameBn: "খরিপ-২ মৌসুম (আষাঢ়–কার্তিক)",
          seasonNameEn: "Kharif-2 Season (Jul–Nov)",
          cropKey: "rice",
          dayBadgeBn: "বীজতলা",
          dayBadgeEn: "Seedbed",
          stageBn: "বীজতলা তৈরি ও বীজ বপন",
          stageEn: "Seedbed Preparation & Sowing",
          approxDays: "১৫–৩০ জুন",
          titleBn: "ব্রি ধান-৮৭ / ব্রি ধান-৭১ এর সুস্থ সবল চারা উৎপাদন",
          titleEn: "Seedbed Management of BRRI Dhan-87",
          instructionBn:
            "আমন মৌসুমের জন্য উঁচু জমিতে কাদাময় বীজতলা তৈরি করুন। প্রতি শতক বীজতলায় ৩ কেজি শোধিত বীজ বপন করুন। চারা ২৫–৩০ দিন বয়স পর্যন্ত সুস্থভাবে পরিচর্যা করুন।",
          instructionEn:
            "Raise healthy seedlings on elevated wet seedbed. 25–30 day old seedlings are ideal for transplanting.",
          doseBn: "বীজ ৩ কেজি প্রতি শতক বীজতলায়।",
          doseEn: "Seed 3 kg per decimal seedbed.",
        },
        {
          id: "t_aman_mus_2",
          seasonKey: "kharif2",
          seasonNameBn: "খরিপ-২ মৌসুম (আষাঢ়–কার্তিক)",
          seasonNameEn: "Kharif-2 Season (Jul–Nov)",
          cropKey: "rice",
          dayBadgeBn: "রোপণ দিন",
          dayBadgeEn: "Transplant Day",
          stageBn: "জমি কাদাকরণ ও চারা রোপণ",
          stageEn: "Puddling & Seedling Transplanting",
          approxDays: "১৫–৩০ জুলাই",
          titleBn: "বর্ষার পানিতে মূল জমি তৈরি ও চারা রোপণ",
          titleEn: "Transplant BRRI Dhan-87 (Monsoon Rainfed)",
          instructionBn:
            "সবুজ সারের জমিতে ৩–৪ বার চাষ ও মই দিয়ে জমি ভালোভাবে থকথকে কাদা করুন। ২৫–৩০ দিন বয়সের চারা সারি থেকে সারি ২০ সেমি এবং গোছা থেকে গোছা ১৫ সেমি দূরত্বে রোপণ করুন।",
          instructionEn:
            "Puddle plot using seasonal monsoon rain. Transplant 25–30 day seedlings at 20x15 cm spacing. Zero deep tube-well pumping required.",
          doseBn: "টিএসপি ৭ কেজি, এমওপি ৭ কেজি, জিপসাম ৫ কেজি, দস্তা ১ কেজি প্রতি বিঘা।",
          doseEn: "TSP 7 kg, MoP 7 kg, Gypsum 5 kg, Zinc 1 kg per bigha.",
        },
        {
          id: "t_aman_mus_3",
          seasonKey: "kharif2",
          seasonNameBn: "খরিপ-২ মৌসুম (আষাঢ়–কার্তিক)",
          seasonNameEn: "Kharif-2 Season (Jul–Nov)",
          cropKey: "rice",
          dayBadgeBn: "রোপণের ২০–২৫ দিন",
          dayBadgeEn: "Day 20–25 Post-Transplant",
          stageBn: "১ম নিড়ানি ও ইউরিয়া উপরিপ্রয়োগ",
          stageEn: "Weeding & 1st Urea Top-dress",
          approxDays: "১৫–২৫ আগস্ট",
          titleBn: "কুশি গজানোর শুরুতে ১ম ইউরিয়া প্রয়োগ ও আগাছা দমন",
          titleEn: "Tillering Stage Weeding & Nitrogen Top-dress",
          instructionBn:
            "জমির আগাছা পরিষ্কার করে গাছের গোড়ায় মাটি চেপে দিন। মাটিতে হালকা পানি বা জো অবস্থায় ইউরিয়া উপরিপ্রয়োগ করুন।",
          instructionEn:
            "Clean weeds and firm soil around hills. Top-dress reduced urea under moist field conditions.",
          doseBn: "ইউরিয়া ৮ কেজি প্রতি বিঘা (মুগডাল সবুজ সারের কারণে অর্ধেক কম)।",
          doseEn: "Urea 8 kg per bigha (Legume residue saves 50% synthetic nitrogen).",
        },
        {
          id: "t_aman_mus_4",
          seasonKey: "kharif2",
          seasonNameBn: "খরিপ-২ মৌসুম (আষাঢ়–কার্তিক)",
          seasonNameEn: "Kharif-2 Season (Jul–Nov)",
          cropKey: "rice",
          dayBadgeBn: "রোপণের ৫৫–৬০ দিন",
          dayBadgeEn: "Day 55–60",
          stageBn: "কাইচথোড় পর্যায় ও ২য় ইউরিয়া",
          stageEn: "Panicle Initiation & Insect Scouting",
          approxDays: "২০ সেপ্টেম্বর – ৫ অক্টোবর",
          titleBn: "কাইচথোড় পর্যায় ও মাজরা/ব্লাস্ট রোগ নজরদারি",
          titleEn: "Panicle Initiation & Stem Borer / Blast Management",
          instructionBn:
            "গাছের কাইচথোড় আসার সময় শেষ কিস্তির ইউরিয়া প্রয়োগ করুন। মাজরা পোকা ও পাতা মোড়ানো পোকা দমনে পার্চিং (ডালে পাখি বসার ব্যবস্থা) করুন এবং প্রয়োজনে অনুমোদিত দানাদার কীটনাশক ব্যবহার করুন।",
          instructionEn:
            "Apply final urea top-dress at panicle initiation. Practice perching for natural insect control.",
          doseBn: "ইউরিয়া ৪ কেজি প্রতি বিঘা।",
          doseEn: "Urea 4 kg per bigha.",
        },
        {
          id: "t_aman_mus_5",
          seasonKey: "kharif2",
          seasonNameBn: "খরিপ-২ মৌসুম (আষাঢ়–কার্তিক)",
          seasonNameEn: "Kharif-2 Season (Jul–Nov)",
          cropKey: "rice",
          dayBadgeBn: "রোপণের ১০০–১১০ দিন",
          dayBadgeEn: "Day 100–110",
          stageBn: "ধান পাকা, কর্তন ও মাড়াই",
          stageEn: "Harvesting, Threshing & Drying",
          approxDays: "২৫ অক্টোবর – ১৫ নভেম্বর",
          titleBn: "ধান কর্তন, মাড়াই ও পরবর্তী সরিষার জন্য জমি খালিকরণ",
          titleEn: "Harvest Matured Paddy & Clear Field for Mustard",
          instructionBn:
            "শীষের শতকরা ৮০ ভাগ ধান সোনালী হলে কেটে নিন। দ্রুত মাড়াই ও শুকিয়ে সংরক্ষণ করুন, যাতে মধ্য-নভেম্বরের মধ্যে রবি সরিষা বপনের জন্য জমি প্রস্তুত থাকে।",
          instructionEn:
            "Harvest when 80% grains are golden yellow. Thresh promptly to clear land for Rabi mustard sowing.",
        },
      ];
    } else if (option.key === "wheat_cereal" || option.crops[0] === "wheat") {
      // Wheat -> Mungbean -> Aman Rice
      return [
        {
          id: "t_wht_1",
          seasonKey: "rabi",
          seasonNameBn: "রবি মৌসুম (কার্তিক–মাঘ)",
          seasonNameEn: "Rabi Season (Nov–Feb)",
          cropKey: "wheat",
          dayBadgeBn: "দিন ১–৫",
          dayBadgeEn: "Day 1–5",
          stageBn: "জমি তৈরি ও বেসাল সার প্রয়োগ",
          stageEn: "Land Preparation & Basal Fertilizer",
          approxDays: "১০–২০ নভেম্বর",
          titleBn: "জমি ৩–৪ বার চাষ ও সুষম সার প্রয়োগ (ব্লাস্ট প্রতিরোধী বারি গম-৩৩)",
          titleEn: "Land Preparation & Basal Fertilizer (BARI Gom-33)",
          instructionBn:
            "জমি ৩–৪ বার আড়াআড়ি চাষ ও মই দিয়ে সমান ঝুরঝুরে করুন। শেষ চাষের সময় গোবর, টিএসপি, অর্ধেক এমওপি, জিপসাম, বোরন ও অর্ধেক ইউরিয়া সার প্রয়োগ করুন।",
          instructionEn:
            "Plough 3–4 times. Incorporate compost, TSP, half MoP, Gypsum, Boron, and half Urea during final land preparation.",
          doseBn: "গোবর ৫০০ কেজি, ইউরিয়া ১৪ কেজি, টিএসপি ১৮ কেজি, এমওপি ১২ কেজি, জিপসাম ১০ কেজি, বোরন ১ কেজি প্রতি বিঘা।",
          doseEn: "Compost 500 kg, Urea 14 kg, TSP 18 kg, MoP 12 kg, Gypsum 10 kg, Boron 1 kg per bigha.",
        },
        {
          id: "t_wht_2",
          seasonKey: "rabi",
          seasonNameBn: "রবি মৌসুম (কার্তিক–মাঘ)",
          seasonNameEn: "Rabi Season (Nov–Feb)",
          cropKey: "wheat",
          dayBadgeBn: "বপন দিন",
          dayBadgeEn: "Sowing Day",
          stageBn: "বীজ শোধন ও বপন",
          stageEn: "Seed Treatment & Line Sowing",
          approxDays: "১৫–৩০ নভেম্বর",
          titleBn: "বারি গম-৩৩ বীজ শোধন ও সারিতে বপন",
          titleEn: "BARI Gom-33 Seed Treatment & Drilling",
          instructionBn:
            "প্রতি কেজি বীজে ২.৫ গ্রাম প্রোভ্যাক্স মিশিয়ে বীজ শোধন করুন। ২০ সেমি দূরত্বে টানা অগভীর লাইনে বীজ বপন করে মাটি দিয়ে ঢেকে দিন।",
          instructionEn:
            "Treat seed with Provax (2.5 g/kg). Drill in 20 cm rows in moist soil.",
          doseBn: "বীজ ১৬ কেজি প্রতি বিঘা।",
          doseEn: "Certified seed 16 kg per bigha.",
        },
        {
          id: "t_wht_3",
          seasonKey: "rabi",
          seasonNameBn: "রবি মৌসুম (কার্তিক–মাঘ)",
          seasonNameEn: "Rabi Season (Nov–Feb)",
          cropKey: "wheat",
          dayBadgeBn: "বপনের ১৭–২১ দিন",
          dayBadgeEn: "Day 17–21 (CRI Stage)",
          stageBn: "১ম সেচ (ক্রাউন রুট পর্যায়) ও বাকি ইউরিয়া",
          stageEn: "1st Irrigation (Crown Root Stage) & Urea Top-dress",
          approxDays: "৫–১২ ডিসেম্বর",
          titleBn: "১ম অতীব গুরুত্বপূর্ণ হালকা সেচ ও বাকি ইউরিয়া প্রয়োগ",
          titleEn: "Critical First Irrigation & Nitrogen Top-dress",
          instructionBn:
            "গমের জন্য এই সেচটি সবচেয়ে গুরুত্বপূর্ণ। খুব হালকা সেচ দিন যাতে জমিতে পানি না জমে। জো আসার পর বাকি অর্ধেক ইউরিয়া উপরিপ্রয়োগ করুন।",
          instructionEn:
            "Apply critical light irrigation at Crown Root Initiation. Top-dress remaining 14 kg Urea once workable.",
          doseBn: "ইউরিয়া ১৪ কেজি প্রতি বিঘা।",
          doseEn: "Urea 14 kg per bigha.",
          isWeatherSensitive: true,
          weatherWarningBn: hasRain ? "বৃষ্টির সম্ভাবনা থাকলে সেচ স্থগিত রাখুন।" : undefined,
        },
        {
          id: "t_wht_4",
          seasonKey: "rabi",
          seasonNameBn: "রবি মৌসুম (কার্তিক–মাঘ)",
          seasonNameEn: "Rabi Season (Nov–Feb)",
          cropKey: "wheat",
          dayBadgeBn: "বপনের ৫০–৫৫ দিন",
          dayBadgeEn: "Day 50–55",
          stageBn: "২য় সেচ ও ব্লাস্ট প্রতিরোধ",
          stageEn: "2nd Irrigation & Blast Preventive",
          approxDays: "৫–১৫ জানুয়ারি",
          titleBn: "শীষ বের হওয়ার মুখে ২য় সেচ ও ফলিকুর/নাটিভো স্প্রে",
          titleEn: "2nd Irrigation at Heading & Blast Prevention",
          instructionBn:
            "শীষ বের হওয়ার সময় ২য় হালকা সেচ দিন। গম ব্লাস্ট রোগ প্রতিরোধের জন্য অনুমোদিত নাটিভো বা ফলিকুর প্রতি লিটার পানিতে ০.৬ গ্রাম হারে স্প্রে করুন।",
          instructionEn:
            "Provide second light irrigation. Spray Nativo or Folicur (0.6 g/L) preventively against wheat blast.",
        },
        {
          id: "t_wht_5",
          seasonKey: "rabi",
          seasonNameBn: "রবি মৌসুম (কার্তিক–মাঘ)",
          seasonNameEn: "Rabi Season (Nov–Feb)",
          cropKey: "wheat",
          dayBadgeBn: "বপনের ৭৫–৮০ দিন",
          dayBadgeEn: "Day 75–80",
          stageBn: "৩য় শেষ সেচ (দানা পুষ্টকরণ)",
          stageEn: "Final Irrigation (Grain Filling)",
          approxDays: "১–১০ ফেব্রুয়ারি",
          titleBn: "দানা দুধ পর্যায় ও ৩য় হালকা সেচ",
          titleEn: "Grain Milking Stage Light Irrigation",
          instructionBn:
            "বাতাস না থাকলে শান্ত আবহাওয়ায় হালকা সেচ দিন যাতে গাছ হেলে না পড়ে। এটি দানা পুষ্ট ও মোটাতাজা করে।",
          instructionEn:
            "Irrigate lightly in calm wind to prevent crop lodging during grain bulking.",
        },
        {
          id: "t_wht_6",
          seasonKey: "rabi",
          seasonNameBn: "রবি মৌসুম (কার্তিক–মাঘ)",
          seasonNameEn: "Rabi Season (Nov–Feb)",
          cropKey: "wheat",
          dayBadgeBn: "ফসল কর্তন",
          dayBadgeEn: "Harvest Day",
          stageBn: "গম কর্তন ও মাড়াই",
          stageEn: "Harvesting & Threshing",
          approxDays: "১–১৫ মার্চ",
          titleBn: "গম সোনালী হলে সকালের দিকে কর্তন ও শুকানো",
          titleEn: "Harvest Golden Wheat & Sun Dry",
          instructionBn:
            "গাছ ও শিষ শুকিয়ে সোনালী রঙ ধারণ করলে সকালে কেটে মাড়াই করুন। বীজ ১২% আর্দ্রতায় শুকিয়ে গুদামজাত করুন।",
          instructionEn:
            "Harvest when grain is hard and golden. Thresh and dry to 12% moisture.",
        },
        // Kharif-1: Mungbean
        {
          id: "t_mung_wht_1",
          seasonKey: "kharif1",
          seasonNameBn: "খরিপ-১ মৌসুম (ফাল্গুন–জ্যৈষ্ঠ)",
          seasonNameEn: "Kharif-1 Season (Mar–Jun)",
          cropKey: "mungbean",
          dayBadgeBn: "বপন দিন",
          dayBadgeEn: "Sowing Day",
          stageBn: "বারি মুগ-৬ বপন",
          stageEn: "Sow BARI Mung-6",
          approxDays: "১৫–২৫ মার্চ",
          titleBn: "গম কাটার পরপরই জো মাটিতে মুগডাল বপন",
          titleEn: "Sow BARI Mung-6 in Residual Wheat Moisture",
          instructionBn:
            "গম কাটার পর জমি ১-২ চাষ দিয়ে বারি মুগ-৬ বপন করুন। এটি পরবর্তী আমন ধানের ইউরিয়া সারের খরচ অর্ধেক কমায়।",
          instructionEn:
            "Broadcast certified mungbean seed. Naturally fixes nitrogen for upcoming Aman rice.",
          doseBn: "বীজ ৪–৫ কেজি প্রতি বিঘা।",
          doseEn: "Seed 4–5 kg per bigha.",
        },
        {
          id: "t_mung_wht_2",
          seasonKey: "kharif1",
          seasonNameBn: "খরিপ-১ মৌসুম (ফাল্গুন–জ্যৈষ্ঠ)",
          seasonNameEn: "Kharif-1 Season (Mar–Jun)",
          cropKey: "mungbean",
          dayBadgeBn: "শুঁটি তোলা",
          dayBadgeEn: "Pod Picking",
          stageBn: "মুগের পাকা শুঁটি তোলা ও গাছ মাটিতে মেশানো",
          stageEn: "Harvest Pods & Green Manure",
          approxDays: "১৫–২৫ মে",
          titleBn: "পাকা শুঁটি সংগ্রহ করে গাছ জমিতে চাষ দিয়ে মিশিয়ে দিন",
          titleEn: "Pick Mature Pods & Incorporate Residue into Soil",
          instructionBn:
            "কালো বর্ণের পাকা শুঁটি তুলে নিন এবং অবশিষ্ট সবুজ গাছটি জমিতে চাষ দিয়ে মাটির সাথে মিশিয়ে সবুজ সার তৈরি করুন।",
          instructionEn:
            "Pick pods for profit, then plough vegetative biomass into soil as organic green manure.",
        },
        // Kharif-2: Aman Rice
        {
          id: "t_aman_wht_1",
          seasonKey: "kharif2",
          seasonNameBn: "খরিপ-২ মৌসুম (আষাঢ়–কার্তিক)",
          seasonNameEn: "Kharif-2 Season (Jul–Nov)",
          cropKey: "rice",
          dayBadgeBn: "রোপণ দিন",
          dayBadgeEn: "Transplant Day",
          stageBn: "স্বল্পমেয়াদী ব্রি ধান-৮৭ রোপণ",
          stageEn: "Transplant BRRI Dhan-87",
          approxDays: "২৫ জুলাই – ১০ আগস্ট",
          titleBn: "বর্ষার পানিতে আমন ধান রোপণ (জিরো সেচ খরচ)",
          titleEn: "Transplant Rainfed Aman Paddy",
          instructionBn:
            "মুগডাল পচানো জমিতে ২৫ দিন বয়সের চারা ২০×১৫ সেমি দূরত্বে রোপণ করুন। সবুজ সারের কারণে ফলন বাড়ে।",
          instructionEn:
            "Transplant into green-manured plot using natural monsoon rains.",
          doseBn: "টিএসপি ৬ কেজি, এমওপি ৮ কেজি প্রতি বিঘা।",
          doseEn: "TSP 6 kg, MoP 8 kg per bigha.",
        },
        {
          id: "t_aman_wht_2",
          seasonKey: "kharif2",
          seasonNameBn: "খরিপ-২ মৌসুম (আষাঢ়–কার্তিক)",
          seasonNameEn: "Kharif-2 Season (Jul–Nov)",
          cropKey: "rice",
          dayBadgeBn: "ফসল সংগ্রহ",
          dayBadgeEn: "Harvest Day",
          stageBn: "ধান কর্তন ও গমের প্রস্তুতি",
          stageEn: "Harvest Paddy & Prepare for Wheat",
          approxDays: "২৫ অক্টোবর – ১০ নভেম্বর",
          titleBn: "ধান কর্তন, মাড়াই ও পরবর্তী গমের জমি প্রস্তুতি",
          titleEn: "Harvest Aman Paddy & Field Prep for Wheat",
          instructionBn:
            "ধান সোনালী হলে কেটে দ্রুত মাড়াই করুন যাতে নভেম্বরের মাঝামাঝি রবি গম বপন সম্পন্ন করা যায়।",
          instructionEn:
            "Harvest and clear land promptly for timely mid-November wheat sowing.",
        },
      ];
    } else if (option.key === "maize_commercial" || option.crops[0] === "maize") {
      // Maize -> Mungbean -> Aman Rice
      return [
        {
          id: "t_mze_1",
          seasonKey: "rabi",
          seasonNameBn: "রবি মৌসুম (কার্তিক–মাঘ)",
          seasonNameEn: "Rabi Season (Nov–Apr)",
          cropKey: "maize",
          dayBadgeBn: "দিন ১–৫",
          dayBadgeEn: "Day 1–5",
          stageBn: "গভীর চাষ ও বেসাল সার প্রয়োগ",
          stageEn: "Deep Ploughing & Basal Fertilizer",
          approxDays: "১০–২৫ নভেম্বর",
          titleBn: "গভীরভাবে ৪ বার চাষ ও সুষম সার প্রয়োগ (বারি হাইব্রিড ভুট্টা-৯)",
          titleEn: "Deep Tilth & Heavy Basal Nutrition",
          instructionBn:
            "ভুট্টার শিকড় গভীরে প্রবেশ করে, তাই জমি ৪ বার গভীরভাবে চাষ করুন। শেষ চাষে গোবর, টিএসপি, অর্ধেক এমওপি, জিপসাম, দস্তা ও এক-তৃতীয়াংশ ইউরিয়া প্রয়োগ করুন।",
          instructionEn:
            "Deep plough 4 times. Incorporate compost, TSP, half MoP, Gypsum, Zinc, and 1/3rd Urea.",
          doseBn: "গোবর ৮০০ কেজি, ইউরিয়া ১৫ কেজি, টিএসপি ২৫ কেজি, এমওপি ২০ কেজি, জিপসাম ১৫ কেজি, দস্তা ২ কেজি প্রতি বিঘা।",
          doseEn: "Compost 800 kg, Urea 15 kg, TSP 25 kg, MoP 20 kg, Gypsum 15 kg, Zinc 2 kg per bigha.",
        },
        {
          id: "t_mze_2",
          seasonKey: "rabi",
          seasonNameBn: "রবি মৌসুম (কার্তিক–মাঘ)",
          seasonNameEn: "Rabi Season (Nov–Apr)",
          cropKey: "maize",
          dayBadgeBn: "বপন দিন",
          dayBadgeEn: "Sowing Day",
          stageBn: "সারিবদ্ধ বীজ বপন",
          stageEn: "Line Sowing in Furrows",
          approxDays: "১৫–৩০ নভেম্বর",
          titleBn: "সারিতে ৩ সেমি গভীরে বীজ বপন (লাইন ৬০ সেমি, গাছ ২৫ সেমি)",
          titleEn: "Precision Dibbling in 60x25 cm Grid",
          instructionBn:
            "সারি থেকে সারির দূরত্ব ৬০ সেমি এবং গাছ থেকে গাছ ২৫ সেমি রেখে ৩-৪ সেমি গভীরে ১টি করে পুষ্ট বীজ বপন করে মাটি চাপা দিন।",
          instructionEn:
            "Dibble 1 seed per hill at 60 cm row and 25 cm plant spacing at 3-4 cm depth.",
          doseBn: "হাইব্রিড বীজ ৩ কেজি প্রতি বিঘা।",
          doseEn: "Hybrid seed 3 kg per bigha.",
        },
        {
          id: "t_mze_3",
          seasonKey: "rabi",
          seasonNameBn: "রবি মৌসুম (কার্তিক–মাঘ)",
          seasonNameEn: "Rabi Season (Nov–Apr)",
          cropKey: "maize",
          dayBadgeBn: "বপনের ২০–২৫ দিন",
          dayBadgeEn: "Day 20–25",
          stageBn: "৪–৬ পাতা পর্যায়, ১ম সেচ ও নিড়ানি",
          stageEn: "4-6 Leaf Stage: 1st Irrigation & Weeding",
          approxDays: "১৫–২২ ডিসেম্বর",
          titleBn: "১ম সেচ, নিড়ানি ও ২য় কিস্তির ইউরিয়া উপরিপ্রয়োগ",
          titleEn: "1st Furrow Irrigation & 2nd Urea Split",
          instructionBn:
            "নালিতে হালকা সেচ দিন। জো আসার পর নিড়ানি দিয়ে জমি আগাছামুক্ত করুন এবং ২য় কিস্তির ইউরিয়া প্রয়োগ করুন।",
          instructionEn:
            "Light furrow irrigation. Hand weed and top-dress 15 kg Urea once soil is workable.",
          doseBn: "ইউরিয়া ১৫ কেজি প্রতি বিঘা।",
          doseEn: "Urea 15 kg per bigha.",
        },
        {
          id: "t_mze_4",
          seasonKey: "rabi",
          seasonNameBn: "রবি মৌসুম (কার্তিক–মাঘ)",
          seasonNameEn: "Rabi Season (Nov–Apr)",
          cropKey: "maize",
          dayBadgeBn: "বপনের ৪৫–৫০ দিন",
          dayBadgeEn: "Day 45–50",
          stageBn: "হাঁটু সমান পর্যায় (Knee-high) ও গোড়ায় মাটি তোলা",
          stageEn: "Knee-High Stage: Earthing Up & 3rd Urea",
          approxDays: "১০–২০ জানুয়ারি",
          titleBn: "২য় সেচ, ৩য় কিস্তির ইউরিয়া ও গাছের গোড়ায় মাটি তুলে ভেলি উঁচু করা",
          titleEn: "2nd Irrigation, Final Urea & Ridge Earthing-Up",
          instructionBn:
            "গাছ হাঁটু সমান উঁচু হলে বাকি ইউরিয়া ও বাকি এমওপি সার দিয়ে গাছের গোড়ায় মাটি তুলে দিন যাতে গাছ বাতাসে হেলে না পড়ে। এরপর নালিতে সেচ দিন।",
          instructionEn:
            "Top-dress final 15 kg Urea and remaining MoP. Earth up ridges to prevent lodging, then irrigate.",
          doseBn: "ইউরিয়া ১৫ কেজি ও এমওপি ১০ কেজি প্রতি বিঘা।",
          doseEn: "Urea 15 kg, MoP 10 kg per bigha.",
        },
        {
          id: "t_mze_5",
          seasonKey: "rabi",
          seasonNameBn: "রবি মৌসুম (কার্তিক–মাঘ)",
          seasonNameEn: "Rabi Season (Nov–Apr)",
          cropKey: "maize",
          dayBadgeBn: "বপনের ৭৫–৮০ দিন",
          dayBadgeEn: "Day 75–80",
          stageBn: "মোচা ও সিল্কিং পর্যায়, ৩য় সেচ",
          stageEn: "Silking & Tasseling: 3rd Irrigation",
          approxDays: "১০–২০ ফেব্রুয়ারি",
          titleBn: "মোচায় দানা ভরার সময় ৩য় সেচ ও ফল আর্মিওয়ার্ম নজরদারি",
          titleEn: "Critical Tasseling Irrigation & Pest Defense",
          instructionBn:
            "এই সময়ে পানির অভাব হলে মোচায় দানা শূন্য থাকবে। নালিতে পর্যাপ্ত সেচ দিন। পাতা ও মোচায় ফল আর্মিওয়ার্ম পোকা নজরদারি করুন।",
          instructionEn:
            "Critical water stage for grain set. Irrigate furrows and monitor for Fall Armyworm.",
        },
        {
          id: "t_mze_6",
          seasonKey: "rabi",
          seasonNameBn: "রবি মৌসুম (কার্তিক–মাঘ)",
          seasonNameEn: "Rabi Season (Nov–Apr)",
          cropKey: "maize",
          dayBadgeBn: "ফসল কর্তন",
          dayBadgeEn: "Harvest Day",
          stageBn: "ভুট্টা সংগ্রহ ও শুকানো",
          stageEn: "Cob Harvest, Shelling & Sun Drying",
          approxDays: "১০–২৫ এপ্রিল",
          titleBn: "মোচার খোসা শুকিয়ে খড়ের রঙ হলে কর্তন ও মাড়াই",
          titleEn: "Harvest Matured Cobs & Shell into Grain",
          instructionBn:
            "মোচার খোসা সাদাটে শুকনা হলে গাছ থেকে মোচা তুলে খোসা ছাড়িয়ে রোদে শুকিয়ে মেশিনে মাড়াই করুন। পোল্ট্রি মিলে সরাসরি বিক্রি করুন।",
          instructionEn:
            "Harvest dry cobs, shell grain via machine, and sun dry to 12% moisture for feed mills.",
        },
        // Kharif-1: Mungbean
        {
          id: "t_mung_mze_1",
          seasonKey: "kharif1",
          seasonNameBn: "খরিপ-১ মৌসুম (ফাল্গুন–জ্যৈষ্ঠ)",
          seasonNameEn: "Kharif-1 Season (May–Jun)",
          cropKey: "mungbean",
          dayBadgeBn: "স্বল্পমেয়াদী বপন",
          dayBadgeEn: "Short Crop",
          stageBn: "স্বল্পমেয়াদী মুগডাল",
          stageEn: "Catch Mungbean",
          approxDays: "২৫ এপ্রিল – ৫ মে",
          titleBn: "ভুট্টার পর স্বল্পমেয়াদী মুগডাল বপন",
          titleEn: "Sow Short Duration Pulse",
          instructionBn:
            "ভুট্টা কাটার পর জমি চাষ দিয়ে দ্রুত মুগডাল বপন করুন যা পরবর্তী ধানের জন্য মাটি সমৃদ্ধ করবে।",
          instructionEn:
            "Quick broadcast of pulse to enrich soil before monsoon.",
        },
        // Kharif-2: Aman Rice
        {
          id: "t_aman_mze_1",
          seasonKey: "kharif2",
          seasonNameBn: "খরিপ-২ মৌসুম (আষাঢ়–কার্তিক)",
          seasonNameEn: "Kharif-2 Season (Jul–Nov)",
          cropKey: "rice",
          dayBadgeBn: "রোপণ দিন",
          dayBadgeEn: "Transplant Day",
          stageBn: "রোপা আমন ধান রোপণ",
          stageEn: "Transplant Rainfed Aman",
          approxDays: "৫–২০ আগস্ট",
          titleBn: "বর্ষার পানিতে ব্রি ধান-৮৭ রোপণ",
          titleEn: "Transplant High-Yielding Aman Rice",
          instructionBn:
            "প্রাকৃতিক বর্ষায় জমি কাদা করে চারা রোপণ করুন। কোনো বাড়তি সেচ খরচ ছাড়াই ভালো ফলন মিলবে।",
          instructionEn:
            "Transplant into flooded paddy using natural precipitation.",
        },
      ];
    } else if (option.key === "onion_spices" || option.crops[0] === "onion") {
      // Onion -> Mungbean -> Aman Rice
      return [
        {
          id: "t_on_1",
          seasonKey: "rabi",
          seasonNameBn: "রবি মৌসুম (কার্তিক–মাঘ)",
          seasonNameEn: "Rabi Season (Nov–Mar)",
          cropKey: "onion",
          dayBadgeBn: "দিন ১–৫",
          dayBadgeEn: "Day 1–5",
          stageBn: "জমি মিহি ঝুরঝুরে তৈরি ও বেসাল সার",
          stageEn: "Fine Tilth & Basal Nutrition",
          approxDays: "১–১৫ ডিসেম্বর",
          titleBn: "জমি গভীরভাবে ৫ বার চাষ ও সুষম সার প্রয়োগ (তাহেরপুরী পেঁয়াজ)",
          titleEn: "Fine Tilth & Basal Nutrition (Taherpuri Onion)",
          instructionBn:
            "জমি ৪-৫ বার চাষ ও মই দিয়ে মাটি খুব মিহি ঝুরঝুরে করুন। শেষ চাষে গোবর, টিএসপি, অর্ধেক এমওপি, জিপসাম, দস্তা ও অর্ধেক ইউরিয়া মিশিয়ে ভেলি বেড তৈরি করুন।",
          instructionEn:
            "Plough 5 times to a powdery tilth. Incorporate compost, TSP, half MoP, Gypsum, Zinc, and half Urea before raising beds.",
          doseBn: "গোবর ৮০০ কেজি, ইউরিয়া ১৭ কেজি, টিএসপি ৩০ কেজি, এমওপি ২৫ কেজি, জিপসাম ১৫ কেজি, দস্তা ২ কেজি প্রতি বিঘা।",
          doseEn: "Compost 800 kg, Urea 17 kg, TSP 30 kg, MoP 25 kg, Gypsum 15 kg, Zinc 2 kg per bigha.",
        },
        {
          id: "t_on_2",
          seasonKey: "rabi",
          seasonNameBn: "রবি মৌসুম (কার্তিক–মাঘ)",
          seasonNameEn: "Rabi Season (Nov–Mar)",
          cropKey: "onion",
          dayBadgeBn: "রোপণ দিন",
          dayBadgeEn: "Planting Day",
          stageBn: "তাহেরপুরী পেঁয়াজ কন্দ/চারা রোপণ",
          stageEn: "Planting Taherpuri Bulblets/Seedlings",
          approxDays: "১০–২৫ ডিসেম্বর",
          titleBn: "সারিতে ১৫×১০ সেমি দূরত্বে চারা বা কন্দ রোপণ",
          titleEn: "Plant Seedlings in 15x10 cm Spacing",
          instructionBn:
            "১৫ সেমি দূরত্বের সারিতে ১০ সেমি পর পর চারা বা কন্দ ২-৩ সেমি গভীরে সোজা করে রোপণ করুন। রোপণের পর হালকা সেচ দিয়ে মাটি ভিজিয়ে দিন।",
          instructionEn:
            "Plant seedlings upright at 15x10 cm spacing. Apply immediate light sprinkle irrigation.",
          doseBn: "কন্দ/চারা ২৫–৩০ কেজি প্রতি বিঘা।",
          doseEn: "Bulblets/seedlings 25–30 kg per bigha.",
        },
        {
          id: "t_on_3",
          seasonKey: "rabi",
          seasonNameBn: "রবি মৌসুম (কার্তিক–মাঘ)",
          seasonNameEn: "Rabi Season (Nov–Mar)",
          cropKey: "onion",
          dayBadgeBn: "রোপণের ২০–২৫ দিন",
          dayBadgeEn: "Day 20–25",
          stageBn: "১ম সেচ, আগাছা নিড়ানি ও বাকি ইউরিয়া",
          stageEn: "1st Irrigation, Weeding & Remaining Urea",
          approxDays: "৫–১৫ জানুয়ারি",
          titleBn: "১ম হালকা সেচ, সাবধানে নিড়ানি ও বাকি ইউরিয়া প্রয়োগ",
          titleEn: "1st Irrigation & Urea Top-dress",
          instructionBn:
            "পেঁয়াজের শিকড় অগভীর হওয়ায় সাবধানে হাত দিয়ে আগাছা নিড়িয়ে ফেলুন। বাকি ইউরিয়া উপরিপ্রয়োগ করে নালিতে হালকা সেচ দিন।",
          instructionEn:
            "Hand weed carefully around shallow roots. Top-dress remaining 17 kg Urea and provide light furrow irrigation.",
          doseBn: "ইউরিয়া ১৭ কেজি প্রতি বিঘা।",
          doseEn: "Urea 17 kg per bigha.",
        },
        {
          id: "t_on_4",
          seasonKey: "rabi",
          seasonNameBn: "রবি মৌসুম (কার্তিক–মাঘ)",
          seasonNameEn: "Rabi Season (Nov–Mar)",
          cropKey: "onion",
          dayBadgeBn: "রোপণের ৪৫–৫০ দিন",
          dayBadgeEn: "Day 45–50",
          stageBn: "কন্দ স্ফীতি পর্যায় ও বেগুনি দাগ রোগ প্রতিরোধ",
          stageEn: "Bulbing Stage & Purple Blotch Prevention",
          approxDays: "২৫ জানুয়ারি – ৫ ফেব্রুয়ারি",
          titleBn: "২য় হালকা সেচ ও পার্পল ব্লচ (Purple Blotch) দমনে রোভরাল স্প্রে",
          titleEn: "Bulbing Irrigation & Purple Blotch Control",
          instructionBn:
            "পেঁয়াজ বড় হওয়ার প্রধান সময়ে হালকা সেচ দিন। পাতায় বেগুনি দাগ রোগ দেখা দিলে প্রতি লিটার পানিতে ২ গ্রাম রোভরাল বা ডায়থেন এম-৪৫ মিশিয়ে স্প্রে করুন।",
          instructionEn:
            "Apply light irrigation. Spray Rovral or Mancozeb (2 g/L) against Purple Blotch fungal disease.",
        },
        {
          id: "t_on_5",
          seasonKey: "rabi",
          seasonNameBn: "রবি মৌসুম (কার্তিক–মাঘ)",
          seasonNameEn: "Rabi Season (Nov–Mar)",
          cropKey: "onion",
          dayBadgeBn: "রোপণের ৭০–৭৫ দিন",
          dayBadgeEn: "Day 70–75",
          stageBn: "৩য় শেষ সেচ ও থ্রিপস দমন",
          stageEn: "Final Irrigation & Thrips Management",
          approxDays: "২০–২৮ ফেব্রুয়ারি",
          titleBn: "শেষ হালকা সেচ ও চোষক পোকা (থ্রিপস) দমন",
          titleEn: "Final Irrigation & Thrips Control",
          instructionBn:
            "কন্দ পরিপক্ক হওয়ার পূর্বে শেষ হালকা সেচ দিন। ফসল উত্তোলনের ১৫ দিন আগে সেচ সম্পূর্ণ বন্ধ রাখুন। থ্রিপস পোকার আক্রমণ হলে এ্যাডমায়ার স্প্রে করুন।",
          instructionEn:
            "Provide final irrigation, then cease water 15 days before harvest. Spray Admire if thrips appear.",
        },
        {
          id: "t_on_6",
          seasonKey: "rabi",
          seasonNameBn: "রবি মৌসুম (কার্তিক–মাঘ)",
          seasonNameEn: "Rabi Season (Nov–Mar)",
          cropKey: "onion",
          dayBadgeBn: "ফসল উত্তোলন",
          dayBadgeEn: "Harvest Day",
          stageBn: "পেঁয়াজ উত্তোলন ও ছায়ায় শুকানো (Curing)",
          stageEn: "Uprooting & Shade Curing",
          approxDays: "১৫–৩০ মার্চ",
          titleBn: "গাছের শীর্ষ নুয়ে পড়লে পেঁয়াজ উত্তোলন ও ছায়ায় শুকানো",
          titleEn: "Harvest at 70% Neck Fall & Curing",
          instructionBn:
            "শতকরা ৭০ ভাগ গাছের পাতা নুয়ে পড়লে পেঁয়াজ সাবধানে তুলে ২-৩ দিন শুকনা ছায়াযুক্ত স্থানে মেলে রেখে শুকিয়ে নিন (Curing)। এতে সংরক্ষণ ক্ষমতা বহুগুণ বাড়ে।",
          instructionEn:
            "Harvest when 70% foliage collapses. Cure under shade for 3 days before market or storage.",
        },
        // Kharif-1: Mungbean
        {
          id: "t_mung_on_1",
          seasonKey: "kharif1",
          seasonNameBn: "খরিপ-১ মৌসুম (ফাল্গুন–জ্যৈষ্ঠ)",
          seasonNameEn: "Kharif-1 Season (Apr–Jun)",
          cropKey: "mungbean",
          dayBadgeBn: "বপন দিন",
          dayBadgeEn: "Sowing Day",
          stageBn: "বারি মুগ-৬ ডাল বপন",
          stageEn: "Sow BARI Mung-6",
          approxDays: "১–১০ এপ্রিল",
          titleBn: "পেঁয়াজ তোলার পর জমিতে মুগডাল বপন",
          titleEn: "Broadcast Mungbean Post Onion",
          instructionBn:
            "পেঁয়াজ সংগ্রহের পর জমি হালকা চাষ দিয়ে মুগডাল বপন করুন। এটি পেঁয়াজের অবশিষ্ট সারের অপচয় রোধ করে মাটি উর্বর রাখে।",
          instructionEn:
            "Broadcast mungbean to utilize residual soil nutrients and build soil organic matter.",
        },
        // Kharif-2: Aman Rice
        {
          id: "t_aman_on_1",
          seasonKey: "kharif2",
          seasonNameBn: "খরিপ-২ মৌসুম (আষাঢ়–কার্তিক)",
          seasonNameEn: "Kharif-2 Season (Jul–Nov)",
          cropKey: "rice",
          dayBadgeBn: "রোপণ দিন",
          dayBadgeEn: "Transplant Day",
          stageBn: "আমন ধান রোপণ",
          stageEn: "Rainfed Aman Rice",
          approxDays: "২৫ জুলাই – ১০ আগস্ট",
          titleBn: "বর্ষার পানিতে আমন ধান রোপণ ও খাদ্য নিরাপত্তা",
          titleEn: "Transplant Rainfed Aman Rice",
          instructionBn:
            "প্রাকৃতিক বর্ষায় চারা রোপণ করে খাদ্য নিরাপত্তা নিশ্চিত করুন এবং নভেম্বর নাগাদ রবি পেঁয়াজের জন্য মাঠ উন্মুক্ত করুন।",
          instructionEn:
            "Transplant paddy in monsoon to secure household rice before winter onion cycle.",
        },
      ];
    } else {
      // Lentil -> Mungbean -> Aman Rice (Low cost, low effort)
      return [
        // RABI SEASON: LENTIL (5 steps)
        {
          id: "t_len_1",
          seasonKey: "rabi",
          seasonNameBn: "রবি মৌসুম (কার্তিক–মাঘ)",
          seasonNameEn: "Rabi Season (Nov–Feb)",
          cropKey: "lentil",
          dayBadgeBn: "দিন ১–৩",
          dayBadgeEn: "Day 1–3",
          stageBn: "স্বল্প চাষে জমি তৈরি",
          stageEn: "Minimal Tilth Land Preparation",
          approxDays: "১৫–২৫ নভেম্বর",
          titleBn: "২–৩ চাষে জো অবস্থায় জমি তৈরি (কম খরচ, কম ঝামেলা)",
          titleEn: "Minimal Tilth & Basal Fertilizer Application",
          instructionBn:
            "মাটি খুব বেশি ঝুরঝুরে না করে ২–৩ বার চাষ ও মই দিন। শেষ চাষের সময় সুষম সার প্রয়োগ করুন। মসুর শিকড়ে নিজে নাইট্রোজেন তৈরি করে, তাই কোনো ইউরিয়া সারের প্রয়োজন নেই।",
          instructionEn:
            "Plough 2–3 times. Lentil fixes its own nitrogen, needing zero urea fertilizer.",
          doseBn: "টিএসপি ৮ কেজি, এমওপি ৫ কেজি, জিপসাম ৪ কেজি প্রতি বিঘা (ইউরিয়া ০ কেজি)।",
          doseEn: "TSP 8 kg, MoP 5 kg, Gypsum 4 kg per bigha (Zero urea).",
        },
        {
          id: "t_len_2",
          seasonKey: "rabi",
          seasonNameBn: "রবি মৌসুম (কার্তিক–মাঘ)",
          seasonNameEn: "Rabi Season (Nov–Feb)",
          cropKey: "lentil",
          dayBadgeBn: "বপন দিন",
          dayBadgeEn: "Sowing Day",
          stageBn: "বীজ শোধন ও বপন",
          stageEn: "Seed Treatment & Sowing",
          approxDays: "১৮–৩০ নভেম্বর",
          titleBn: "বারি মসুর-৮ বপন (উচ্চ বাজারদর ও কম সেচ)",
          titleEn: "Sow BARI Masur-8 (High Value, Zero Tube-well Water)",
          instructionBn:
            "বীজ বপনের পূর্বে প্রতি কেজি বীজে ২ গ্রাম প্রোভ্যাক্স মিশিয়ে শোধন করে নিন। জো জমিতে ছিটিয়ে বা সারিতে বীজ বপন করে হালকা মই দিয়ে ঢেকে দিন।",
          instructionEn:
            "Treat seed with Provax (2 g/kg). Broadcast or drill in moist soil and cover lightly.",
          doseBn: "বীজ ৪–৫ কেজি প্রতি বিঘা।",
          doseEn: "Certified seed 4–5 kg per bigha.",
        },
        {
          id: "t_len_3",
          seasonKey: "rabi",
          seasonNameBn: "রবি মৌসুম (কার্তিক–মাঘ)",
          seasonNameEn: "Rabi Season (Nov–Feb)",
          cropKey: "lentil",
          dayBadgeBn: "বপনের ২০–২৫ দিন",
          dayBadgeEn: "Day 20–25",
          stageBn: "আগাছা দমন ও নিকাশ নালা",
          stageEn: "Weeding & Drainage Maintenance",
          approxDays: "১৫–২৫ ডিসেম্বর",
          titleBn: "১টি হাত নিড়ানি ও জমির পানি নিষ্কাশন নিশ্চিতকরণ",
          titleEn: "Single Hand Weeding & Drainage Maintenance",
          instructionBn:
            "গাছ ছোট অবস্থায় আগাছা তুলে পরিষ্কার করুন। জমিতে যেন কোনোভাবেই বৃষ্টির বা কুয়াশার পানি না জমে সেজন্য চারদিকে নিকাশ নালা কেটে রাখুন।",
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
          id: "t_len_4",
          seasonKey: "rabi",
          seasonNameBn: "রবি মৌসুম (কার্তিক–মাঘ)",
          seasonNameEn: "Rabi Season (Nov–Feb)",
          cropKey: "lentil",
          dayBadgeBn: "ফুল পর্যায়",
          dayBadgeEn: "Flowering Stage",
          stageBn: "পাতা ঝলসানো ও মরিচা রোগ নজরদারি",
          stageEn: "Stemphylium Blight Scouting",
          approxDays: "১০–২০ জানুয়ারি",
          titleBn: "ঘন কুয়াশায় পাতা ঝলসানো রোগ পর্যবেক্ষণ ও দমন",
          titleEn: "Stemphylium Blight Monitoring During Fog",
          instructionBn:
            "ঘন কুয়াশায় মসুরে স্টেমফিলিয়াম ব্লাইট বা পাতা ঝলসানো রোগ হতে পারে। লক্ষণ দেখলে রোভরাল বা অটোস্টিন প্রতি লিটার পানিতে ২ গ্রাম হারে স্প্রে করুন।",
          instructionEn:
            "Scout for Stemphylium blight during prolonged fog. Spray Rovral (2 g/L) if blight appears.",
          doseBn: "রোভরাল ২ গ্রাম/লিটার পানিতে স্প্রে।",
          doseEn: "Rovral spray 2 g/L water.",
          isWeatherSensitive: true,
        },
        {
          id: "t_len_5",
          seasonKey: "rabi",
          seasonNameBn: "রবি মৌসুম (কার্তিক–মাঘ)",
          seasonNameEn: "Rabi Season (Nov–Feb)",
          cropKey: "lentil",
          dayBadgeBn: "বপনের ৮৫–৯৫ দিন",
          dayBadgeEn: "Day 85–95",
          stageBn: "মসুর কর্তন ও মাড়াই",
          stageEn: "Harvesting & Threshing",
          approxDays: "২০ ফেব্রুয়ারি – ৫ মার্চ",
          titleBn: "সকালে মসুর কর্তন ও রোদে শুকিয়ে মাড়াই",
          titleEn: "Morning Harvesting & Threshing",
          instructionBn:
            "গাছের নিচের পাতা ঝরে গেলে এবং শুঁটি বাদামী হলে সকালের দিকে কেটে নিন। রোদে শুকিয়ে মাড়াই করে দানা আলাদা করুন।",
          instructionEn:
            "Harvest in morning hours when pods turn brownish to prevent pod shatter.",
        },

        // KHARIF-1 SEASON: MUNGBEAN (3 steps)
        {
          id: "t_mung_len_1",
          seasonKey: "kharif1",
          seasonNameBn: "খরিপ-১ মৌসুম (ফাল্গুন–জ্যৈষ্ঠ)",
          seasonNameEn: "Kharif-1 Season (Mar–May)",
          cropKey: "mungbean",
          dayBadgeBn: "দিন ১–৫",
          dayBadgeEn: "Day 1–5",
          stageBn: "মুগ ডাল বপন",
          stageEn: "Mungbean Sowing",
          approxDays: "১০–২৫ মার্চ",
          titleBn: "বারি মুগ-৬ বপন (ডাবল ডাল ফসল চক্র)",
          titleEn: "Sow BARI Mung-6 for Double Legume Soil Rebuilding",
          instructionBn:
            "মসুরের পরপরই মুগ চাষ বরেন্দ্র ভূমির জন্য সবচেয়ে নিরাপদ ও লাভজনক। এক ফোঁটাও ভূগর্ভস্থ পানি পাম্প করতে হয় না। সারিতে বীজ বপন করুন।",
          instructionEn:
            "Successive pulse rotation doubles natural nitrogen capture and restores organic carbon with zero tube-well pumping.",
          doseBn: "বীজ ৪ কেজি প্রতি বিঘা, টিএসপি ৫ কেজি।",
          doseEn: "Seed 4 kg, TSP 5 kg per bigha.",
        },
        {
          id: "t_mung_len_2",
          seasonKey: "kharif1",
          seasonNameBn: "খরিপ-১ মৌসুম (ফাল্গুন–জ্যৈষ্ঠ)",
          seasonNameEn: "Kharif-1 Season (Mar–May)",
          cropKey: "mungbean",
          dayBadgeBn: "বপনের ২০–২৫ দিন",
          dayBadgeEn: "Day 20–25",
          stageBn: "পরিচর্যা ও নিড়ানি",
          stageEn: "Weeding & Summer Heat Care",
          approxDays: "১–১৫ এপ্রিল",
          titleBn: "গাছের গোড়া আগাছামুক্তকরণ ও পোকা তদারকি",
          titleEn: "Weed Control & Insect Scouting",
          instructionBn:
            "আগাছা পরিষ্কার করুন। চৈত্র মাসের তাপদাহে মাটি শুকিয়ে গেলে নদী বা খালের পানি দিয়ে একটিমাত্র হালকা সেচ দিন।",
          instructionEn:
            "Clean weeds. If severe drought develops, provide one light irrigation.",
        },
        {
          id: "t_mung_len_3",
          seasonKey: "kharif1",
          seasonNameBn: "খরিপ-১ মৌসুম (ফাল্গুন–জ্যৈষ্ঠ)",
          seasonNameEn: "Kharif-1 Season (Mar–May)",
          cropKey: "mungbean",
          dayBadgeBn: "ফসল সংগ্রহ ও সবুজ সার",
          dayBadgeEn: "Harvest & Green Manure",
          approxDays: "১৫ মে – ৫ জুন",
          titleBn: "মুগডাল ঘরে তোলা ও গাছ জমিতে মিশিয়ে মাটির উর্বরতা বৃদ্ধি",
          titleEn: "Harvest Pods & Soil Incorporation",
          instructionBn:
            "টানা দুটি ডাল ফসলের কারণে মাটিতে বিপুল পরিমাণ প্রাকৃতিক নাইট্রোজেন জমা হয়, যা মাটির উর্বরতা দীর্ঘমেয়াদে বজায় রাখে।",
          instructionEn:
            "Monsoon rice after two pulse crops yields exceptionally well with up to 60% less synthetic fertilizer.",
        },

        // KHARIF-2 SEASON: AMAN RICE (4 steps)
        {
          id: "t_aman_len_1",
          seasonKey: "kharif2",
          seasonNameBn: "খরিপ-২ মৌসুম (আষাঢ়–কার্তিক)",
          seasonNameEn: "Kharif-2 Season (Jul–Nov)",
          cropKey: "rice",
          dayBadgeBn: "বীজতলা",
          dayBadgeEn: "Seedbed",
          stageBn: "বীজতলা তৈরি",
          stageEn: "Seedbed Sowing",
          approxDays: "২৫ জুন – ১০ জুলাই",
          titleBn: "আমন ধানের সুস্থ চারা উৎপাদন",
          titleEn: "Raise Healthy Aman Rice Seedlings",
          instructionBn:
            "উঁচু জমিতে সুস্থ সবল চারা তৈরি করুন। চারা গজানোর ২৫ দিন পর মূল জমিতে রোপণের জন্য প্রস্তুত হবে।",
          instructionEn:
            "Prepare raised seedbed and nurture seedlings for 25 days.",
        },
        {
          id: "t_aman_len_2",
          seasonKey: "kharif2",
          seasonNameBn: "খরিপ-২ মৌসুম (আষাঢ়–কার্তিক)",
          seasonNameEn: "Kharif-2 Season (Jul–Nov)",
          cropKey: "rice",
          dayBadgeBn: "রোপণ দিন",
          dayBadgeEn: "Transplant Day",
          stageBn: "চারা রোপণ",
          stageEn: "Seedling Transplanting",
          approxDays: "২৫ জুলাই – ১০ আগস্ট",
          titleBn: "বর্ষার পানিতে চারা রোপণ (জিরো ডিজেল/বিদ্যুৎ খরচ)",
          titleEn: "Rainfed BRRI Dhan-87 Planting (Zero Fuel Cost)",
          instructionBn:
            "কাদা জমিতে ২০×১৫ সেমি দূরত্বে চারা রোপণ করুন। বরেন্দ্র অঞ্চলে বর্ষার প্রাকৃতিক বৃষ্টিতে এই ধান সম্পূর্ণ বিনা সেচ খরচে চাষ হয়।",
          instructionEn:
            "Transplant at 20x15 cm spacing using natural monsoon rains.",
          doseBn: "টিএসপি ৬ কেজি, এমওপি ৬ কেজি প্রতি বিঘা।",
          doseEn: "TSP 6 kg, MoP 6 kg per bigha.",
        },
        {
          id: "t_aman_len_3",
          seasonKey: "kharif2",
          seasonNameBn: "খরিপ-২ মৌসুম (আষাঢ়–কার্তিক)",
          seasonNameEn: "Kharif-2 Season (Jul–Nov)",
          cropKey: "rice",
          dayBadgeBn: "রোপণের ২৫ দিন",
          dayBadgeEn: "Day 25 Post-Transplant",
          stageBn: "স্বল্প ইউরিয়া প্রয়োগ ও নিড়ানি",
          stageEn: "Minimal Urea Top-dress",
          approxDays: "২৫ আগস্ট – ১০ সেপ্টেম্বর",
          titleBn: "নামমাত্র ইউরিয়া প্রয়োগ ও আগাছা পরিষ্কার",
          titleEn: "Minimal Synthetic Nitrogen & Weeding",
          instructionBn:
            "ডাবল ডাল ফসলের অবশিষ্টাংশের কারণে সাধারণ ধানের চেয়ে মাত্র এক-তৃতীয়াংশ সার দিলেই সর্বোচ্চ ফলন মেলে।",
          instructionEn:
            "Two pulse crops accumulate abundant natural soil nitrogen, drastically cutting synthetic fertilizer costs.",
          doseBn: "ইউরিয়া মাত্র ৬ কেজি প্রতি বিঘা।",
          doseEn: "Urea only 6 kg per bigha.",
        },
        {
          id: "t_aman_len_4",
          seasonKey: "kharif2",
          seasonNameBn: "খরিপ-২ মৌসুম (আষাঢ়–কার্তিক)",
          seasonNameEn: "Kharif-2 Season (Jul–Nov)",
          cropKey: "rice",
          dayBadgeBn: "ফসল কর্তন",
          dayBadgeEn: "Harvest Day",
          stageBn: "ধান কর্তন ও মাড়াই",
          stageEn: "Harvesting & Threshing",
          approxDays: "১০–২৫ নভেম্বর",
          titleBn: "আমন ধান সংগ্রহ ও রবি মসুরের প্রস্তুতি",
          titleEn: "Harvest Paddy & Prepare for Winter Lentil",
          instructionBn:
            "ধান কেটে মাড়াই করে ঘরে তুলুন এবং পরবর্তী রবি মৌসুমের মসুর চাষের জন্য মাঠ উন্মুক্ত রাখুন।",
          instructionEn:
            "Harvest matured rice, thresh, and prepare the field for winter lentil.",
        },
      ];
    }
  };

  const allTasks = getTasksForOption();
  const filteredTasks = selectedSeason === "all"
    ? allTasks
    : allTasks.filter((t) => t.seasonKey === selectedSeason);

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
      <div className="p-4 sm:p-5 rounded-2xl bg-forest text-white border border-forest shadow-card">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-gold text-[#1a1300] font-bold">
              {lang === "bn" ? "নির্বাচিত চাষ পরিকল্পনা" : "Selected Rotation Outline"}
            </span>
            <span className="text-xs text-white/80 bg-white/10 px-2.5 py-0.5 rounded-full font-mono">
              {allTasks.length} {lang === "bn" ? "টি পর্যায়ক্রমিক ধাপ" : "Stage Milestones"}
            </span>
          </div>
          {onBackToOptions && (
            <button
              type="button"
              onClick={onBackToOptions}
              className="text-xs text-gold underline hover:text-white transition-colors cursor-pointer"
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
              {lang === "bn" ? "লাইভ আবহাওয়া পূর্বাভাস (বরেন্দ্র ও প্লাবনভূমি)" : "Live Weather Telemetry"}
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

      {/* Date-wise Farming Plan Outline Section */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-leaf" />
            <div>
              <h3 className="text-lg font-bold text-primary m-0">
                {lang === "bn" ? "পূর্ণাঙ্গ চাষের রূপরেখা ও ক্যালেন্ডার (দিন ও তারিখসহ)" : "Complete Day-by-Day Farming Calendar"}
              </h3>
              <span className="text-xs text-secondary">
                {lang === "bn" ? "BARC সুষম সার গাইড ও DAE/BRRI/BARI প্রমাণিত জাত" : "Official BARC Fertilizer Doses & BARI/BRRI Varieties"}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            className="text-xs font-medium text-forest hover:text-gold flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface border border-border shadow-2xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{lang === "bn" ? "ছাপুন / ক্যালেন্ডার প্রিন্ট" : "Print Calendar"}</span>
          </button>
        </div>

        {/* Season Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-surface rounded-xl border border-border shadow-2xs">
          <button
            type="button"
            onClick={() => setSelectedSeason("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              selectedSeason === "all"
                ? "bg-forest text-gold shadow-2xs"
                : "bg-transparent text-secondary hover:text-primary hover:bg-bg"
            }`}
          >
            {lang === "bn" ? `সব মৌসুম (${allTasks.length}টি ধাপ)` : `All Year (${allTasks.length} stages)`}
          </button>
          <button
            type="button"
            onClick={() => setSelectedSeason("rabi")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              selectedSeason === "rabi"
                ? "bg-forest text-gold shadow-2xs"
                : "bg-transparent text-secondary hover:text-primary hover:bg-bg"
            }`}
          >
            {lang === "bn" ? "১. রবি মৌসুম (শীতকাল)" : "1. Rabi (Winter)"}
          </button>
          <button
            type="button"
            onClick={() => setSelectedSeason("kharif1")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              selectedSeason === "kharif1"
                ? "bg-forest text-gold shadow-2xs"
                : "bg-transparent text-secondary hover:text-primary hover:bg-bg"
            }`}
          >
            {lang === "bn" ? "২. খরিপ-১ (গ্রীষ্মকাল - মুগডাল)" : "2. Kharif-1 (Mungbean)"}
          </button>
          <button
            type="button"
            onClick={() => setSelectedSeason("kharif2")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              selectedSeason === "kharif2"
                ? "bg-forest text-gold shadow-2xs"
                : "bg-transparent text-secondary hover:text-primary hover:bg-bg"
            }`}
          >
            {lang === "bn" ? "৩. খরিপ-২ (বর্ষাকাল - রোপা আমন)" : "3. Kharif-2 (Aman Rice)"}
          </button>
        </div>

        {/* Task Cards Sequence */}
        <div className="space-y-3">
          {filteredTasks.map((task, idx) => {
            const isDone = !!completedTasks[task.id];

            return (
              <div
                key={task.id}
                className={`p-4 rounded-xl border transition-all shadow-2xs bg-surface ${
                  isDone
                    ? "opacity-60 bg-slate-50 border-slate-300"
                    : task.weatherWarningBn
                    ? "border-gold/60 ring-1 ring-gold/40"
                    : "border-border hover:border-slate-300"
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-start gap-2.5">
                    {/* Step Number with Checklist Toggle */}
                    <button
                      type="button"
                      onClick={() => toggleTaskCompleted(task.id)}
                      className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 cursor-pointer transition-all ${
                        isDone
                          ? "bg-emerald-600 text-white"
                          : "bg-forest text-gold hover:opacity-90"
                      }`}
                      title={lang === "bn" ? "সম্পন্ন হিসেবে চিহ্নিত করতে চাপুন" : "Click to mark done"}
                    >
                      {isDone ? "✓" : idx + 1}
                    </button>

                    <div>
                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        <span className="text-[11px] font-mono font-bold text-slate-500 uppercase">
                          {lang === "bn" ? task.seasonNameBn : task.seasonNameEn}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                          {task.approxDays}
                        </span>
                        {task.dayBadgeBn && (
                          <span className="text-[10px] font-mono font-bold text-slate-600 bg-slate-200 px-1.5 py-0.5 rounded">
                            {lang === "bn" ? task.dayBadgeBn : task.dayBadgeEn}
                          </span>
                        )}
                      </div>

                      <h4 className={`text-[16px] font-bold m-0 leading-tight ${isDone ? "line-through text-slate-500" : "text-primary"}`}>
                        {lang === "bn" ? task.titleBn : task.titleEn}
                      </h4>
                    </div>
                  </div>

                  <CropIcon crop={task.cropKey} size={32} />
                </div>

                <p className="text-[14px] text-secondary leading-relaxed mt-1 mb-2 pl-9">
                  {lang === "bn" ? task.instructionBn : task.instructionEn}
                </p>

                {task.doseBn && (
                  <div className="ml-9 mt-2 p-2.5 rounded-lg bg-bg border border-border text-xs text-primary font-medium flex items-start gap-1.5">
                    <span className="font-bold text-forest shrink-0">
                      {lang === "bn" ? "সারের সঠিক মাত্রা (বিঘা প্রতি):" : "Recommended Dose / Bigha:"}
                    </span>
                    <span className="text-slate-800 font-semibold">{lang === "bn" ? task.doseBn : task.doseEn}</span>
                  </div>
                )}

                {task.weatherWarningBn && (
                  <div className="ml-9 mt-2 p-2.5 rounded-lg bg-gold/15 border border-gold/40 text-xs text-[#705200] font-semibold flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-[#b08000]" />
                    <span>{lang === "bn" ? task.weatherWarningBn : task.weatherWarningEn}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Interactive AI Farm Advisor Q&A */}
      <div className="p-4 sm:p-5 rounded-2xl bg-surface border border-border shadow-card space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-gold" />
          <span className="font-bold text-[16px] text-primary">
            {lang === "bn" ? "AI কৃষি উপদেষ্টাকে প্রশ্ন করুন" : "Ask AI Advisor for Tailored Guidance"}
          </span>
        </div>

        <p className="text-xs text-secondary leading-relaxed m-0">
          {lang === "bn"
            ? "আপনার নির্বাচিত ফসল, সার প্রয়োগ বা আবহাওয়ার সমস্যা সম্পর্কে প্রশ্ন লিখুন।"
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
                ? "যেমন: সরিষার জমিতে ইউরিয়া কখন দেব বা নাবী ধসা থেকে রক্ষার উপায় কি?"
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
