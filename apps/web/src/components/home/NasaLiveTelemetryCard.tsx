"use client";

import React, { useState, useEffect } from "react";
import {
  Satellite,
  Sun,
  Droplets,
  Wind,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  Sparkles,
  TrendingUp,
} from "lucide-react";

interface NasaTelemetryData {
  status: string;
  isLiveApi: boolean;
  location: {
    upazila: string;
    lat: number;
    lon: number;
  };
  current_month: string;
  telemetry: {
    solar_radiation_mj: number;
    rootzone_wetness_pct: number;
    relative_humidity_pct: number;
    temperature_mean_c: number;
    temperature_max_c: number;
    temperature_min_c: number;
    daily_precipitation_mm: number;
    drought_stress_level: string;
  };
  agronomic_implications: {
    solar_insight_bn: string;
    solar_insight_en: string;
    soil_moisture_insight_bn: string;
    soil_moisture_insight_en: string;
    disease_risk_bn: string;
    disease_risk_en: string;
  };
  meta: {
    source: string;
    api_endpoint: string;
    updated_at: string;
  };
}

interface NasaLiveTelemetryCardProps {
  lat: number;
  lng: number;
  upazilaNameBn: string;
  upazilaNameEn: string;
  lang?: "bn" | "en";
}

export const NasaLiveTelemetryCard: React.FC<NasaLiveTelemetryCardProps> = ({
  lat,
  lng,
  upazilaNameBn,
  upazilaNameEn,
  lang = "bn",
}) => {
  const [data, setData] = useState<NasaTelemetryData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isCancelled = false;
    const fetchNasa = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/nasa-power?lat=${lat}&lng=${lng}&upazila=${encodeURIComponent(upazilaNameEn)}`);
        if (!res.ok) throw new Error("NASA fetch failed");
        const json: NasaTelemetryData = await res.json();
        if (!isCancelled) {
          setData(json);
        }
      } catch {
        // Handled gracefully
      } finally {
        if (!isCancelled) setLoading(false);
      }
    };

    fetchNasa();
    return () => {
      isCancelled = true;
    };
  }, [lat, lng, upazilaNameEn]);

  if (!data && !loading) return null;

  const t = data?.telemetry;
  const implications = data?.agronomic_implications;

  return (
    <div className="bg-gradient-to-br from-slate-900 via-[#0d1d29] to-[#072419] text-white rounded-2xl p-4 sm:p-5 border border-emerald-500/30 shadow-card relative overflow-hidden">
      {/* Background Satellite Grid Accent */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-radial from-emerald-500/10 to-transparent pointer-events-none -mr-16 -mt-16 rounded-full" />

      {/* Header with Live NASA Status Indicator */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center shrink-0">
            <Satellite className="w-4 h-4 text-emerald-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm sm:text-base text-white tracking-wide">
                {lang === "bn" ? "NASA আর্থ অবজারভেশন লাইভ টেলিমেট্রি" : "NASA Earth Observation Live Telemetry"}
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/40">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>{lang === "bn" ? "নাসা এপিআই লাইভ" : "NASA API LIVE"}</span>
              </span>
            </div>
            <span className="text-xs text-slate-300 block">
              {lang === "bn"
                ? `${upazilaNameBn} স্থানাঙ্ক (${lat}° N, ${lng}° E) • NASA POWER Agroclimatology`
                : `${upazilaNameEn} Coords (${lat}° N, ${lng}° E) • NASA POWER Agroclimatology`}
            </span>
          </div>
        </div>

        <div className="text-right text-[11px] text-slate-400 font-mono">
          <span>{lang === "bn" ? "উৎস: data.nasa.gov & POWER" : "Source: data.nasa.gov & POWER"}</span>
        </div>
      </div>

      {/* 4 Live Telemetry Tiles */}
      {t && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 mb-4">
          {/* Tile 1: Solar Radiation */}
          <div className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-3 transition-all">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] text-slate-300 font-medium">
                {lang === "bn" ? "সৌর বিকিরণ (Solar)" : "Solar Radiation"}
              </span>
              <Sun className="w-4 h-4 text-amber-400" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl font-black text-amber-300 font-mono">
                {t.solar_radiation_mj}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">MJ/m²/d</span>
            </div>
            <span className="text-[10px] text-amber-200/80 block mt-1 leading-tight">
              {lang === "bn" ? "সালোকসংশ্লেষণ শক্তি" : "Photosynthesis energy"}
            </span>
          </div>

          {/* Tile 2: Rootzone Soil Moisture */}
          <div className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-3 transition-all">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] text-slate-300 font-medium">
                {lang === "bn" ? "রুটজোন আর্দ্রতা" : "Rootzone Moisture"}
              </span>
              <Droplets className="w-4 h-4 text-sky-400" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl font-black text-sky-300 font-mono">
                {t.rootzone_wetness_pct}%
              </span>
              <span className="text-[10px] text-slate-400 font-medium">
                {t.drought_stress_level === "high"
                  ? lang === "bn" ? "(শুষ্ক)" : "(Dry)"
                  : lang === "bn" ? "(সন্তোষজনক)" : "(Good)"}
              </span>
            </div>
            <span className="text-[10px] text-sky-200/80 block mt-1 leading-tight">
              {lang === "bn" ? "NASA SMAP স্যাটেলাইট" : "NASA SMAP Satellite"}
            </span>
          </div>

          {/* Tile 3: Relative Humidity */}
          <div className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-3 transition-all">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] text-slate-300 font-medium">
                {lang === "bn" ? "আপেক্ষিক আর্দ্রতা" : "Relative Humidity"}
              </span>
              <Wind className="w-4 h-4 text-teal-400" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl font-black text-teal-300 font-mono">
                {t.relative_humidity_pct}%
              </span>
              <span className="text-[10px] text-slate-400 font-medium">RH2M</span>
            </div>
            <span className="text-[10px] text-teal-200/80 block mt-1 leading-tight">
              {lang === "bn" ? "রোগবালাই সংবেদনশীলতা" : "Disease susceptibility"}
            </span>
          </div>

          {/* Tile 4: Mean Temperature */}
          <div className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-3 transition-all">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] text-slate-300 font-medium">
                {lang === "bn" ? "গড় তাপমাত্রা" : "Mean Temperature"}
              </span>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl font-black text-emerald-300 font-mono">
                {t.temperature_mean_c}°C
              </span>
              <span className="text-[10px] text-slate-400 font-medium">
                {t.temperature_min_c}°–{t.temperature_max_c}°
              </span>
            </div>
            <span className="text-[10px] text-emerald-200/80 block mt-1 leading-tight">
              {lang === "bn" ? "টেলিমেট্রি T2M" : "Telemetry T2M"}
            </span>
          </div>
        </div>
      )}

      {/* Dynamic Actionable Recommendation Banner based on live NASA data */}
      {implications && (
        <div className="bg-emerald-950/60 border border-emerald-500/30 rounded-xl p-3 text-xs text-emerald-100 flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-gold shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-gold block">
              {lang === "bn"
                ? "NASA ক্লাইমেট টেলিমেট্রি অনুযায়ী স্বয়ংক্রিয় কৃষি নির্দেশনা:"
                : "NASA Climate Telemetry Agronomic Recommendation:"}
            </span>
            <p className="m-0 leading-relaxed text-slate-200">
              {lang === "bn" ? implications.solar_insight_bn : implications.solar_insight_en}{" "}
              {lang === "bn" ? implications.soil_moisture_insight_bn : implications.soil_moisture_insight_en}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
