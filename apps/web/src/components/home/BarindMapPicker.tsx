"use client";

import React, { useState } from "react";
import { MapPin, Navigation, Check, X } from "lucide-react";
import { PILOT_AREAS, type PilotArea } from "@/lib/recommend/recommendData";

interface BarindMapPickerProps {
  selectedAreaId?: string;
  lang?: "bn" | "en";
  onSelectArea: (area: PilotArea, details?: { lat: number; lng: number; isFar: boolean }) => void;
  onClose?: () => void;
}

export const BarindMapPicker: React.FC<BarindMapPickerProps> = ({
  selectedAreaId = "sadar",
  lang = "bn",
  onSelectArea,
  onClose,
}) => {
  // Map coordinate bounds for Barind / Rajshahi region:
  // Lat: 24.20 (minY) to 24.70 (maxY) -> height
  // Lng: 88.20 (minX) to 88.80 (maxX) -> width
  const minLng = 88.20;
  const maxLng = 88.80;
  const minLat = 24.20;
  const maxLat = 24.70;

  const toSvgX = (lng: number) => {
    return ((lng - minLng) / (maxLng - minLng)) * 360 + 20;
  };

  const toSvgY = (lat: number) => {
    // Invert Y because SVG coordinates increase downwards
    return ((maxLat - lat) / (maxLat - minLat)) * 260 + 20;
  };

  const fromSvgToCoords = (x: number, y: number) => {
    const lng = minLng + ((x - 20) / 360) * (maxLng - minLng);
    const lat = maxLat - ((y - 20) / 260) * (maxLat - minLat);
    return { lat: Math.round(lat * 1000) / 1000, lng: Math.round(lng * 1000) / 1000 };
  };

  const [customPin, setCustomPin] = useState<{ x: number; y: number; lat: number; lng: number } | null>(null);

  const handleMapClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * 400;
    const clickY = ((e.clientY - rect.top) / rect.height) * 300;

    const coords = fromSvgToCoords(clickX, clickY);

    // Find nearest pilot area
    let bestDist = Infinity;
    let nearest = PILOT_AREAS[0];

    for (const a of PILOT_AREAS) {
      const d = Math.hypot(a.lat - coords.lat, a.lng - coords.lng);
      if (d < bestDist) {
        bestDist = d;
        nearest = a;
      }
    }

    const isFar = bestDist > 0.35;
    setCustomPin({ x: clickX, y: clickY, lat: coords.lat, lng: coords.lng });
    onSelectArea(nearest, { lat: coords.lat, lng: coords.lng, isFar });
  };

  return (
    <div className="rounded-2xl border-2 border-forest/30 bg-surface p-4 shadow-card space-y-3 transition-all animate-fadeIn">
      <div className="flex items-center justify-between border-b border-border pb-2.5">
        <div className="flex items-center gap-2">
          <Navigation className="w-5 h-5 text-gold" />
          <span className="font-bold text-base text-primary">
            {lang === "bn" ? "বরেন্দ্র মানচিত্রে জমি বেছে নিন" : "Pick Your Field on Barind Map"}
          </span>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-secondary hover:text-primary hover:bg-bg transition-colors"
            aria-label="Close Map"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <p className="text-xs text-secondary leading-snug">
        {lang === "bn"
          ? "মানচিত্রের যেকোনো স্থানে বা উপজেলা পিনে ট্যাপ করুন। তাৎক্ষণিক নিকটস্থ পাইলট এলাকার হিসাব তৈরি হবে।"
          : "Tap anywhere on the map or tap an upazila pin to select your field location."}
      </p>

      {/* SVG Interactive Canvas */}
      <div className="relative rounded-xl overflow-hidden border border-border bg-[#EBF3E8] dark:bg-[#16251D]">
        <svg
          viewBox="0 0 400 300"
          className="w-full h-auto cursor-crosshair select-none"
          onClick={handleMapClick}
          role="img"
          aria-label="Interactive map of Rajshahi Barind Tract"
        >
          {/* Subtle grid lines */}
          <line x1="20" y1="20" x2="380" y2="20" stroke="#CCDBC7" strokeDasharray="3 3" />
          <line x1="20" y1="150" x2="380" y2="150" stroke="#CCDBC7" strokeDasharray="3 3" />
          <line x1="20" y1="280" x2="380" y2="280" stroke="#CCDBC7" strokeDasharray="3 3" />
          <line x1="100" y1="20" x2="100" y2="280" stroke="#CCDBC7" strokeDasharray="3 3" />
          <line x1="200" y1="20" x2="200" y2="280" stroke="#CCDBC7" strokeDasharray="3 3" />
          <line x1="300" y1="20" x2="300" y2="280" stroke="#CCDBC7" strokeDasharray="3 3" />

          {/* Padma River ribbon (SW border) */}
          <path
            d="M 10 260 Q 80 250 150 270 T 320 285 T 395 295"
            fill="none"
            stroke="#9BC4E2"
            strokeWidth="12"
            strokeLinecap="round"
            opacity="0.75"
          />
          <text x="210" y="278" fill="#507B9E" fontSize="9" fontWeight="bold">
            পদ্মা নদী (Padma River)
          </text>

          {/* Barind Tract Regional Boundary Indication */}
          <rect
            x="25"
            y="25"
            width="350"
            height="235"
            rx="20"
            fill="none"
            stroke="#1B3B2B"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            opacity="0.3"
          />
          <text x="35" y="42" fill="#5C6F63" fontSize="10" fontWeight="bold">
            বরেন্দ্র বহুমুখী উন্নয়ন অঞ্চল (Barind Tract Pilot Zone)
          </text>

          {/* 4 Pilot Upazila Markers */}
          {PILOT_AREAS.map((area) => {
            const x = toSvgX(area.lng);
            const y = toSvgY(area.lat);
            const isCurrent = selectedAreaId === area.id;

            return (
              <g
                key={area.id}
                className="cursor-pointer transition-transform hover:scale-110"
                onClick={(e) => {
                  e.stopPropagation();
                  setCustomPin(null);
                  onSelectArea(area, { lat: area.lat, lng: area.lng, isFar: false });
                }}
              >
                {/* Marker Halo */}
                <circle
                  cx={x}
                  cy={y}
                  r={isCurrent ? "18" : "12"}
                  fill={isCurrent ? "#E0A800" : "#1B3B2B"}
                  opacity={isCurrent ? "0.35" : "0.2"}
                  className={isCurrent ? "animate-pulse" : ""}
                />
                {/* Marker Center */}
                <circle
                  cx={x}
                  cy={y}
                  r="7"
                  fill={isCurrent ? "#E0A800" : "#1B3B2B"}
                  stroke="#FFFFFF"
                  strokeWidth="2.5"
                />
                {/* Label Tag */}
                <rect
                  x={x - 45}
                  y={y + 11}
                  width="90"
                  height="22"
                  rx="6"
                  fill={isCurrent ? "#1B3B2B" : "#FFFFFF"}
                  stroke={isCurrent ? "#E0A800" : "#D9E3D6"}
                  strokeWidth={isCurrent ? "1.5" : "1"}
                  filter="drop-shadow(0px 2px 3px rgba(0,0,0,0.15))"
                />
                <text
                  x={x}
                  y={y + 25}
                  textAnchor="middle"
                  fill={isCurrent ? "#FFFFFF" : "#14261C"}
                  fontSize="10"
                  fontWeight="bold"
                >
                  {lang === "bn" ? area.name_bn : area.name_en}
                </text>
              </g>
            );
          })}

          {/* Custom Dropped Pin */}
          {customPin && (
            <g transform={`translate(${customPin.x}, ${customPin.y})`}>
              <circle r="16" fill="#E0A800" opacity="0.4" className="animate-ping" />
              <path
                d="M 0 0 C -6 -14 -10 -20 0 -28 C 10 -20 6 -14 0 0 Z"
                fill="#E0A800"
                stroke="#1B3B2B"
                strokeWidth="1.5"
              />
              <circle cx="0" cy="-20" r="3" fill="#1B3B2B" />
            </g>
          )}
        </svg>
      </div>

      <div className="flex items-center justify-between text-xs text-secondary px-1">
        <span>📍 ট্যাপ করে যেকোনো জমি বা নলকূপের অবস্থান চিহ্নিত করুন</span>
        <span className="font-mono text-[11px] font-semibold text-primary">
          {customPin ? `${customPin.lat}°N, ${customPin.lng}°E` : "পাইলট গ্রিড"}
        </span>
      </div>
    </div>
  );
};

