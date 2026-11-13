import { NextRequest, NextResponse } from "next/server";

export interface DailyWeather {
  date: string;
  maxTemp: number;
  minTemp: number;
  rainMm: number;
  rainProb: number;
  conditionBn: string;
  conditionEn: string;
  icon: "sun" | "cloud" | "rain";
}

export interface WeatherResponse {
  location: {
    lat: number;
    lng: number;
  };
  hasRainWarning: boolean;
  rainAlertBn?: string;
  rainAlertEn?: string;
  heatAlertBn?: string;
  heatAlertEn?: string;
  daily: DailyWeather[];
  source: "open_meteo" | "nasa_climatology_fallback";
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const latStr = searchParams.get("lat") || "24.37";
  const lngStr = searchParams.get("lng") || "88.60";

  const lat = parseFloat(latStr) || 24.37;
  const lng = parseFloat(lngStr) || 88.60;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max&timezone=Asia%2FDhaka`;

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
        if (!hasRainWarning && i <= 4) {
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

    let rainAlertBn: string | undefined = undefined;
    let rainAlertEn: string | undefined = undefined;

    if (hasRainWarning) {
      const parts = rainDate.split("-");
      const dayNum = parts[2] || "";
      rainAlertBn = `সতর্কতা: আগামী ${dayNum} তারিখে বৃষ্টির সম্ভাবনা (${rainAmount} মিমি)। জমিতে সেচ দেওয়া স্থগিত রাখুন এবং বৃষ্টির পর ইউরিয়া সার দিন।`;
      rainAlertEn = `Warning: Rain forecast around day ${dayNum} (${rainAmount} mm). Hold scheduled irrigation and apply fertilizer after rainfall.`;
    }

    return NextResponse.json(
      {
        location: { lat, lng },
        hasRainWarning,
        rainAlertBn,
        rainAlertEn,
        daily: days,
        source: "open_meteo",
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600",
        },
      }
    );
  } catch {
    // Graceful Barind Climatology Fallback if offline
    const today = new Date();
    const fallbackDays: DailyWeather[] = [];

    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split("T")[0];

      fallbackDays.push({
        date: dateStr,
        maxTemp: 29 - i * 0.2,
        minTemp: 18 - i * 0.3,
        rainMm: 0,
        rainProb: 5,
        conditionBn: "শুষ্ক ও পরিষ্কার",
        conditionEn: "Dry & Clear",
        icon: "sun",
      });
    }

    return NextResponse.json({
      location: { lat, lng },
      hasRainWarning: false,
      daily: fallbackDays,
      source: "nasa_climatology_fallback",
    });
  }
}

