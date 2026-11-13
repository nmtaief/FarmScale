import { NextRequest, NextResponse } from "next/server";
import { ALL_RAJSHAHI_UPAZILAS } from "@/lib/recommend/recommendData";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";

export const maxDuration = 60; // 60s max execution for cron

export async function GET(req: NextRequest) {
  return handleSync(req);
}

export async function POST(req: NextRequest) {
  return handleSync(req);
}

async function handleSync(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  // Protect route if CRON_SECRET is configured
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: Record<string, any> = {};
  const supabase = getSupabase();
  const nowIso = new Date().toISOString();

  // Process all 67 upazilas in polite batches of 5
  for (let i = 0; i < ALL_RAJSHAHI_UPAZILAS.length; i += 5) {
    const batch = ALL_RAJSHAHI_UPAZILAS.slice(i, i + 5);

    await Promise.all(
      batch.map(async (u) => {
        const uid = u.upazila_en.toLowerCase().replace(/\s+/g, "_");
        const lat = Math.round(u.lat * 100) / 100;
        const lon = Math.round(u.lon * 100) / 100;

        try {
          const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,windspeed_10m_max&timezone=Asia%2FDhaka`;
          const res = await fetch(url, { headers: { "User-Agent": "FarmScale-Cron/1.0" } });
          if (!res.ok) return;

          const data = await res.json();
          const daily = data.daily || {};

          const rainSums: number[] = daily.precipitation_sum || [];
          const maxTemps: number[] = daily.temperature_2m_max || [];
          const maxRain = rainSums.length > 0 ? Math.max(...rainSums) : 0;
          const maxT = maxTemps.length > 0 ? Math.max(...maxTemps) : 0;

          const alertsBn: string[] = [];
          const alertsEn: string[] = [];

          if (maxRain >= 15.0) {
            alertsBn.push("অতিবৃষ্টির সতর্কতা: জমিতে পানি নিষ্কাশনের ব্যবস্থা রাখুন এবং সার ছিটানো বন্ধ রাখুন।");
            alertsEn.push("Heavy Rain Alert: Ensure drainage and hold fertilizer application.");
          } else if (maxRain >= 2.0) {
            alertsBn.push("মাঝারি বৃষ্টিপাতের সম্ভাবনা: সেচ দেওয়ার প্রয়োজন নেই।");
            alertsEn.push("Moderate Rain: Irrigation is not required.");
          } else {
            alertsBn.push("আবহাওয়া শুষ্ক ও অনুকূল: বীজ বপন ও জমি প্রস্তুতের উপযুক্ত সময়।");
            alertsEn.push("Favorable Dry Weather: Good window for sowing and field prep.");
          }

          if (maxT >= 35.0) {
            alertsBn.push("তাপপ্রবাহ সতর্কতা: ফসলে তাপজনিত ধকল রোধে আর্দ্রতা বজায় রাখুন।");
            alertsEn.push("Heat Stress Alert: Maintain field moisture to protect crops.");
          }

          const record = {
            upazila_id: uid,
            district_en: u.district_en,
            district_bn: u.district_bn,
            upazila_en: u.upazila_en,
            upazila_bn: u.upazila_bn,
            lat,
            lon,
            forecast_7days: daily,
            temp_min: daily.temperature_2m_min?.[0] || 18,
            temp_max: daily.temperature_2m_max?.[0] || 30,
            rain_sum: maxRain,
            rain_probability: daily.precipitation_probability_max?.[0] || 0,
            wind_max: daily.windspeed_10m_max?.[0] || 10,
            alerts_bn: alertsBn,
            alerts_en: alertsEn,
            last_updated: nowIso,
          };

          results[uid] = record;

          // If Supabase is available, persist to weather_cache table
          if (supabase && isSupabaseConfigured) {
            await supabase.from("weather_cache").upsert(record, { onConflict: "upazila_id" });
          }
        } catch (err) {
          console.error(`Failed to sync weather for ${u.upazila_en}:`, err);
        }
      })
    );
  }

  return NextResponse.json({
    status: "ok",
    synced_upazilas: Object.keys(results).length,
    timestamp: nowIso,
  });
}
