"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Code2, Copy, Check, Terminal, Database, ShieldCheck, AlertCircle } from "lucide-react";

export default function GatewayPage() {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const endpoints = [
    {
      method: "GET",
      path: "/v1/climate?lat=24.3745&lon=88.6042",
      title: "Climate Summary (NASA POWER)",
      desc: "Fetches gridded annual precipitation, temperature extremes, and seasonal onset shift for the 50 km cell.",
      responseExample: `{
  "state": "live",
  "source": "NASA POWER Climatology",
  "updatedAt": "2026-10-24T06:00:00Z",
  "data": {
    "gridLat": 24.5,
    "gridLon": 88.5,
    "annualPrecipMm": 1625,
    "extremeHeatDays": 42,
    "monsoonOnsetShiftDays": 12,
    "signalCodes": ["lower_rainfall_trend", "later_monsoon_onset"]
  }
}`,
    },
    {
      method: "GET",
      path: "/v1/soil?lat=24.3745&lon=88.6042",
      title: "Soil Baseline (ISRIC SoilGrids & SMAP)",
      desc: "Returns root-zone soil moisture percentiles, organic carbon fraction, and pH for the field.",
      responseExample: `{
  "state": "live",
  "source": "ISRIC SoilGrids & NASA SMAP",
  "updatedAt": "2026-10-24T06:00:00Z",
  "data": {
    "organicCarbonPercent": 0.68,
    "ph": 5.8,
    "rootZoneMoistureVol": 0.18,
    "textureClass": "sandy_loam",
    "signalCodes": ["depleted_soil_organic_matter", "dry_season_water_deficit"]
  }
}`,
    },
    {
      method: "POST",
      path: "/v1/rotations/rank",
      title: "Rotation Ranking Engine",
      desc: "Ranks candidate 3-season crop rotations based on farmer priorities (water, income, soil).",
      responseExample: `{
  "state": "live",
  "source": "FarmScale Scoring Engine v1.0",
  "updatedAt": "2026-10-24T06:00:00Z",
  "data": {
    "topRotations": [
      {
        "rank": 1,
        "id": "mustard-mungbean-aman",
        "score": 7.4,
        "crops": ["mustard", "mungbean", "aman_rice"],
        "whyCodes": ["low_water_demand_winter", "legume_nitrogen_boost"]
      }
    ]
  }
}`,
    },
  ];

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="space-y-8 pb-16 max-w-4xl mx-auto">
      {/* Title */}
      <div className="border-b border-border pb-4 space-y-2">
        <span className="text-xs uppercase font-mono font-bold tracking-wider text-secondary">
          Developer API & Integration Docs
        </span>
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-primary m-0">
          Public Data Gateway
        </h1>
        <p className="text-sm text-secondary leading-relaxed max-w-2xl m-0">
          Programmatic access to NASA Earth observations, ISRIC soil profiles, and crop rotation suitability scoring for researchers, agricultural extension platforms, and partners.
        </p>
      </div>

      {/* Gateway Status & Rate Limits Notice */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-md bg-surface border border-border space-y-1">
          <span className="text-xs font-mono text-secondary uppercase font-bold">Protocol</span>
          <div className="font-mono text-sm font-bold text-primary">REST / JSON (v1)</div>
          <span className="text-[11px] text-muted">HTTPS TLS 1.3</span>
        </div>

        <div className="p-4 rounded-md bg-surface border border-border space-y-1">
          <span className="text-xs font-mono text-secondary uppercase font-bold">Public Rate Limit</span>
          <div className="font-mono text-sm font-bold text-primary">60 req / min</div>
          <span className="text-[11px] text-muted">Anonymous client IP tier</span>
        </div>

        <div className="p-4 rounded-md bg-surface border border-border space-y-1">
          <span className="text-xs font-mono text-secondary uppercase font-bold">Resolution</span>
          <div className="font-mono text-sm font-bold text-primary">~50 km Gridded Cell</div>
          <span className="text-[11px] text-muted">NASA POWER global grid</span>
        </div>
      </div>

      {/* Endpoints Specification */}
      <div className="space-y-6">
        <h2 className="text-xl font-serif font-bold text-primary">
          Core Gateway Endpoints
        </h2>

        {endpoints.map((ep, idx) => (
          <div
            key={ep.path}
            className="rounded-lg bg-surface border border-border shadow-card overflow-hidden space-y-4 p-5"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-leaf/15 text-leaf">
                  {ep.method}
                </span>
                <span className="font-mono text-xs sm:text-sm font-bold text-primary">
                  {ep.path}
                </span>
              </div>
              <span className="text-xs text-secondary font-medium">{ep.title}</span>
            </div>

            <p className="text-xs text-secondary leading-relaxed m-0">
              {ep.desc}
            </p>

            {/* Code Block with Copy Button */}
            <div className="relative rounded-md bg-forest text-white p-4 font-mono text-xs overflow-x-auto">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10 text-[11px] text-gray-300">
                <span>Response Format (JSON)</span>
                <button
                  type="button"
                  onClick={() => handleCopy(ep.responseExample, idx)}
                  className="flex items-center gap-1 text-gold hover:text-white transition-colors"
                  aria-label="Copy JSON example"
                >
                  {copiedIndex === idx ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-leaf" />
                      <span className="text-leaf">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="m-0 leading-relaxed text-gray-200">
                {ep.responseExample}
              </pre>
            </div>
          </div>
        ))}
      </div>

      {/* API Key Policy Notice */}
      <div className="p-5 rounded-lg bg-surface-hover border border-dashed border-border text-xs text-secondary space-y-2">
        <div className="font-semibold text-primary flex items-center gap-1.5">
          <AlertCircle className="w-4 h-4 text-secondary" />
          <span>Authentication and Key Policy</span>
        </div>
        <p className="m-0 leading-relaxed text-[11px]">
          Public endpoints for educational and smallholder decision-support require no API keys. High-volume institutional and extension partner integrations are provisioned through the separate Developer Admin Console.
        </p>
      </div>
    </div>
  );
}
