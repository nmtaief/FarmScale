import { NextRequest, NextResponse } from "next/server";
import { findNearestUpazila, ALL_RAJSHAHI_UPAZILAS } from "@/lib/recommend/recommendData";
import weatherCacheData from "@/data/weather_cache.json";

export interface DailyWeather {
  date: string;
  maxTemp: number;
  minTemp: number;
  rainMm: number;
  rainProb: number;
  conditionBn: string;
  conditionEn: string;
  icon: "sun" | "cloud" | "rain";
  windMax?: number;
}

export interface WeatherResponse {
  location: {
    lat: number;
    lng: number;
    district_en?: string;
    district_bn?: string;
    upazila_en?: string;
    upazila_bn?: string;
  };
  hasRainWarning: boolean;
  rainAlertBn?: string;
  rainAlertEn?: string;
  heatAlertBn?: string;
  heatAlertEn?: string;
  cropAlertsBn?: string[];
  cropAlertsEn?: string[];
  humidityAvg?: number;
  windMax?: number;
  lastUpdated?: string;
  daily: DailyWeather[];
  source: "cron_cache" | "open_meteo_live" | "nasa_climatology_fallback";
}

const typedCache = weatherCacheData as Record<string, any>;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const latStr = searchParams.get("lat") || "24.37";
  const lngStr = searchParams.get("lng") || "88.60";
  const upazilaParam = searchParams.get("upazila") || searchParams.get("area");

  const lat = parseFloat(latStr) || 24.37;
  const lng = parseFloat(lngStr) || 88.60;

  // Identify matching upazila
  let matchedUpz = ALL_RAJSHAHI_UPAZILAS[0];
  if (upazilaParam) {
    const q = upazilaParam.toLowerCase().replace(/[^a-z0-9]/g, "_");
    const found = ALL_RAJSHAHI_UPAZILAS.find(
      (u) =>
        u.upazila_en.toLowerCase().replace(/[^a-z0-9]/g, "_") === q ||
        u.upazila_bn === upazilaParam.trim()
    );
    if (found) matchedUpz = found;
  } else {
    matchedUpz = findNearestUpazila(lat, lng).upazila;
  }

  const cacheKey = matchedUpz.upazila_en.toLowerCase().replace(/\s+/g, "_");
  const cachedRecord = typedCache[cacheKey];

  // 1. Return from pre-computed cron cache if available
  if (cachedRecord && cachedRecord.daily?.time) {
    const dailyRaw = cachedRecord.daily;
    const days: DailyWeather[] = [];
    let hasRainWarning = false;
    let rainDate = "";
    let rainAmount = 0;

    for (let i = 0; i < (dailyRaw.time?.length || 0); i++) {
      const d = dailyRaw.time[i];
      const maxT = Math.round(dailyRaw.temperature_2m_max[i] || 28);
      const minT = Math.round(dailyRaw.temperature_2m_min[i] || 18);
      const rain = dailyRaw.precipitation_sum[i] || 0;
      const prob = dailyRaw.precipitation_probability_max?.[i] || 0;
      const wind = dailyRaw.windspeed_10m_max?.[i] || 8;
      const code = dailyRaw.weathercode?.[i] || 0;

      let icon: "sun" | "cloud" | "rain" = "sun";
      let condBn = "রৌদ্রোজ্জ্বল";
      let condEn = "Sunny";

      if (rain >= 1.0 || prob >= 50 || code >= 50) {
        icon = "rain";
        condBn = "বৃষ্টির সম্ভাবনা";
        condEn = "Rain expected";
        if (!hasRainWarning) {
          hasRainWarning = true;
          rainDate = d;
          rainAmount = rain;
        }
      } else if (code >= 1 && code <= 3) {
        icon = "cloud";
        condBn = "আংশিক মেঘলা";
        condEn = "Partly cloudy";
      }

      days.push({
        date: d,
        maxTemp: maxT,
        minTemp: minT,
        rainMm: rain,
        rainProb: prob,
        conditionBn: condBn,
        conditionEn: condEn,
        icon,
        windMax: wind,
      });
    }

    const payload: WeatherResponse = {
      location: {
        lat: matchedUpz.lat,
        lng: matchedUpz.lon,
        district_en: matchedUpz.district_en,
        district_bn: matchedUpz.district_bn,
        upazila_en: matchedUpz.upazila_en,
        upazila_bn: matchedUpz.upazila_bn,
      },
      hasRainWarning,
      rainAlertBn: hasRainWarning
        ? `সতর্কতা: ${rainDate}-এ বৃষ্টির সম্ভাবনা (${rainAmount} মিমি)। সার ছিটানো ও সেচ স্থগিত রাখুন।`
        : undefined,
      rainAlertEn: hasRainWarning
        ? `Alert: Rain expected on ${rainDate} (${rainAmount}mm). Hold fertilizer and irrigation.`
        : undefined,
      cropAlertsBn: cachedRecord.alerts_bn || [],
      cropAlertsEn: cachedRecord.alerts_en || [],
      humidityAvg: 65,
      windMax: cachedRecord.wind_max || 10,
      lastUpdated: cachedRecord.last_updated,
      daily: days,
      source: "cron_cache",
    };

    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  }

  // 2. Fallback to live Open-Meteo call if not yet in cache
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,windspeed_10m_max&timezone=Asia%2FDhaka`;

    const res = await fetch(apiUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) throw new Error("Open-Meteo response not ok");

    const data = await res.json();
    const dailyData = data.daily;

    const days: DailyWeather[] = [];
    let hasRainWarning = false;
    let rainDate = "";
    let rainAmount = 0;

    for (let i = 0; i < (dailyData.time?.length || 0); i++) {
      const d = dailyData.time[i];
      const maxT = Math.round(dailyData.temperature_2m_max[i]);
      const minT = Math.round(dailyData.temperature_2m_min[i]);
      const rain = dailyData.precipitation_sum[i] || 0;
      const prob = dailyData.precipitation_probability_max[i] || 0;
      const code = dailyData.weathercode[i] || 0;

      let icon: "sun" | "cloud" | "rain" = "sun";
      let condBn = "রৌদ্রোজ্জ্বল";
      let condEn = "Sunny";

      if (rain >= 1.0 || code >= 50) {
        icon = "rain";
        condBn = "বৃষ্টির সম্ভাবনা";
        condEn = "Rain expected";
        if (!hasRainWarning) {
          hasRainWarning = true;
          rainDate = d;
          rainAmount = rain;
        }
      } else if (code >= 1 && code <= 3) {
        icon = "cloud";
        condBn = "আংশিক মেঘলা";
        condEn = "Partly cloudy";
      }

      days.push({
        date: d,
        maxTemp: maxT,
        minTemp: minT,
        rainMm: rain,
        rainProb: prob,
        conditionBn: condBn,
        conditionEn: condEn,
        icon,
      });
    }

    return NextResponse.json({
      location: {
        lat,
        lng,
        district_en: matchedUpz.district_en,
        district_bn: matchedUpz.district_bn,
        upazila_en: matchedUpz.upazila_en,
        upazila_bn: matchedUpz.upazila_bn,
      },
      hasRainWarning,
      rainAlertBn: hasRainWarning
        ? `সতর্কতা: ${rainDate}-এ বৃষ্টির সম্ভাবনা (${rainAmount} মিমি)। সার প্রয়োগ ও সেচ সাময়িক স্থগিত রাখুন।`
        : undefined,
      rainAlertEn: hasRainWarning
        ? `Alert: Rain expected on ${rainDate} (${rainAmount}mm). Hold fertilizer and irrigation.`
        : undefined,
      cropAlertsBn: [
        "আবহাওয়া অনুকূল: রবি ফসলের পরিচর্যার স্বাভাবিক সময়।",
      ],
      cropAlertsEn: ["Favorable weather for seasonal crop care."],
      lastUpdated: new Date().toISOString(),
      daily: days,
      source: "open_meteo_live",
    });
  } catch {
    // 3. Fallback: NASA POWER 10-year November Climatology
    const fallbackDays: DailyWeather[] = [
      { date: "2026-11-13", maxTemp: 29, minTemp: 19, rainMm: 0, rainProb: 5, conditionBn: "রৌদ্রোজ্জ্বল", conditionEn: "Sunny", icon: "sun" },
      { date: "2026-11-14", maxTemp: 30, minTemp: 19, rainMm: 0, rainProb: 5, conditionBn: "রৌদ্রোজ্জ্বল", conditionEn: "Sunny", icon: "sun" },
      { date: "2026-11-15", maxTemp: 29, minTemp: 18, rainMm: 0, rainProb: 10, conditionBn: "আংশিক মেঘলা", conditionEn: "Partly cloudy", icon: "cloud" },
      { date: "2026-11-16", maxTemp: 28, minTemp: 18, rainMm: 0, rainProb: 10, conditionBn: "রৌদ্রোজ্জ্বল", conditionEn: "Sunny", icon: "sun" },
      { date: "2026-11-17", maxTemp: 29, minTemp: 19, rainMm: 0, rainProb: 5, conditionBn: "রৌদ্রোজ্জ্বল", conditionEn: "Sunny", icon: "sun" },
      { date: "2026-11-18", maxTemp: 28, minTemp: 18, rainMm: 0, rainProb: 5, conditionBn: "রৌদ্রোজ্জ্বল", conditionEn: "Sunny", icon: "sun" },
      { date: "2026-11-19", maxTemp: 28, minTemp: 17, rainMm: 0, rainProb: 5, conditionBn: "রৌদ্রোজ্জ্বল", conditionEn: "Sunny", icon: "sun" },
    ];

    return NextResponse.json({
      location: { lat, lng },
      hasRainWarning: false,
      daily: fallbackDays,
      cropAlertsBn: ["আবহাওয়া শুষ্ক ও অনুকূল: রবি ফসলের বীজ বপনের উপযুক্ত সময়।"],
      cropAlertsEn: ["Favorable dry weather for Rabi sowing."],
      source: "nasa_climatology_fallback",
    });
  }
}
