"use client";

import React, { useState, useMemo } from "react";
import { MapPin, Navigation, Check, X, Search, ChevronRight } from "lucide-react";
import {
  ALL_RAJSHAHI_UPAZILAS,
  RAJSHAHI_DISTRICTS,
  findNearestUpazila,
  type UpazilaRecord,
  type PilotArea,
} from "@/lib/recommend/recommendData";

interface BarindMapPickerProps {
  selectedAreaId?: string;
  lang?: "bn" | "en";
  onSelectArea: (
    area: PilotArea,
    details?: { lat: number; lng: number; isFar: boolean }
  ) => void;
  onClose?: () => void;
}

// 8 Districts geographic center coordinates for Division map
const DISTRICT_CENTROIDS: Record<
  string,
  { bn: string; en: string; lat: number; lon: number; upazilaCount: number }
> = {
  Rajshahi: { bn: "রাজশাহী", en: "Rajshahi", lat: 24.37, lon: 88.60, upazilaCount: 9 },
  Chapainawabganj: { bn: "চাঁপাইনবাবগঞ্জ", en: "Chapainawabganj", lat: 24.60, lon: 88.27, upazilaCount: 5 },
  Naogaon: { bn: "নওগাঁ", en: "Naogaon", lat: 24.81, lon: 88.94, upazilaCount: 11 },
  Joypurhat: { bn: "জয়পুরহাট", en: "Joypurhat", lat: 25.10, lon: 89.02, upazilaCount: 5 },
  Bogura: { bn: "বগুড়া", en: "Bogura", lat: 24.85, lon: 89.37, upazilaCount: 12 },
  Natore: { bn: "নাটোর", en: "Natore", lat: 24.41, lon: 88.98, upazilaCount: 7 },
  Sirajganj: { bn: "সিরাজগঞ্জ", en: "Sirajganj", lat: 24.45, lon: 89.71, upazilaCount: 9 },
  Pabna: { bn: "পাবনা", en: "Pabna", lat: 24.01, lon: 89.24, upazilaCount: 9 },
};

export const BarindMapPicker: React.FC<BarindMapPickerProps> = ({
  selectedAreaId = "godagari",
  lang = "bn",
  onSelectArea,
  onClose,
}) => {
  const [selectedDistrict, setSelectedDistrict] = useState<string>("all");
  const [activeUpazila, setActiveUpazila] = useState<UpazilaRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Map coordinate bounds for entire Rajshahi Division (8 Districts, 67 Upazilas)
  // Lat: 23.80 (South Pabna) to 25.30 (North Joypurhat)
  // Lon: 88.05 (West Chapainawabganj) to 89.85 (East Sirajganj/Jamuna)
  const minLon = 88.05;
  const maxLon = 89.85;
  const minLat = 23.80;
  const maxLat = 25.30;

  const toSvgX = (lon: number) => {
    return ((lon - minLon) / (maxLon - minLon)) * 620 + 40;
  };

  const toSvgY = (lat: number) => {
    // Invert Y coordinate because SVG coordinates increase downwards
    return ((maxLat - lat) / (maxLat - minLat)) * 360 + 30;
  };

  const fromSvgToCoords = (x: number, y: number) => {
    const lon = minLon + ((x - 40) / 620) * (maxLon - minLon);
    const lat = maxLat - ((y - 30) / 360) * (maxLat - minLat);
    return {
      lat: Math.round(lat * 1000) / 1000,
      lon: Math.round(lon * 1000) / 1000,
    };
  };

  const filteredUpazilas = useMemo(() => {
    return ALL_RAJSHAHI_UPAZILAS.filter((u) => {
      const matchDistrict =
        selectedDistrict === "all" ||
        u.district_en.toLowerCase() === selectedDistrict.toLowerCase();
      const matchSearch =
        !searchQuery.trim() ||
        u.upazila_bn.includes(searchQuery.trim()) ||
        u.upazila_en.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        u.district_bn.includes(searchQuery.trim());
      return matchDistrict && matchSearch;
    });
  }, [selectedDistrict, searchQuery]);

  const handleSelectUpazila = (u: UpazilaRecord) => {
    setActiveUpazila(u);
    const pilotArea: PilotArea = {
      id: u.upazila_en.toLowerCase(),
      name_bn: u.upazila_bn,
      name_en: u.upazila_en,
      district_bn: u.district_bn,
      district_en: u.district_en,
      lat: u.lat,
      lng: u.lon,
      yieldFactor: 1.0,
    };
    onSelectArea(pilotArea, { lat: u.lat, lng: u.lon, isFar: false });
  };

  const handleMapCanvasClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * 700;
    const clickY = ((e.clientY - rect.top) / rect.height) * 420;

    const coords = fromSvgToCoords(clickX, clickY);
    const nearest = findNearestUpazila(coords.lat, coords.lon);
    handleSelectUpazila(nearest.upazila);
  };

  return (
    <div className="w-full rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 shadow-xl space-y-4 transition-all">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
            <Navigation className="w-5 h-5 text-emerald-700" />
          </div>
          <div>
            <h3 className="font-bold text-base sm:text-lg text-slate-900 leading-tight">
              {lang === "bn"
                ? "রাজশাহী বিভাগ ও বরেন্দ্র অঞ্চল মানচিত্র (৬৭টি উপজেলা)"
                : "Rajshahi Division & Barind Regional Map (67 Upazilas)"}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {lang === "bn"
                ? "মানচিত্রে যেকোনো জেলা বা উপজেলায় ট্যাপ করে আপনার জমি নির্বাচন করুন"
                : "Tap any district or upazila node to select your field location"}
            </p>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition min-w-[36px] min-h-[36px] flex items-center justify-center cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* 8 Districts Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => setSelectedDistrict("all")}
          className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition cursor-pointer min-h-[34px] ${
            selectedDistrict === "all"
              ? "bg-slate-900 text-white shadow-2xs"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          {lang === "bn" ? "সকল জেলা (৮টি)" : "All Districts (8)"}
        </button>
        {RAJSHAHI_DISTRICTS.map((d) => {
          const isSelected = selectedDistrict.toLowerCase() === d.en.toLowerCase();
          return (
            <button
              key={d.en}
              type="button"
              onClick={() => setSelectedDistrict(d.en)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition cursor-pointer min-h-[34px] ${
                isSelected
                  ? "bg-emerald-700 text-white shadow-2xs"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {lang === "bn" ? d.bn : d.en}
            </button>
          );
        })}
      </div>

      {/* Interactive Division SVG Map */}
      <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200 bg-[#F4F9F2] shadow-inner select-none">
        <svg
          viewBox="0 0 700 420"
          className="w-full h-auto cursor-crosshair"
          onClick={handleMapCanvasClick}
          role="img"
          aria-label="Map of Rajshahi Division with all 8 districts"
        >
          {/* Subtle Latitude/Longitude Grid */}
          <line x1="40" y1="30" x2="660" y2="30" stroke="#E1EFE0" strokeDasharray="3 3" />
          <line x1="40" y1="150" x2="660" y2="150" stroke="#E1EFE0" strokeDasharray="3 3" />
          <line x1="40" y1="270" x2="660" y2="270" stroke="#E1EFE0" strokeDasharray="3 3" />
          <line x1="40" y1="390" x2="660" y2="390" stroke="#E1EFE0" strokeDasharray="3 3" />
          <line x1="180" y1="30" x2="180" y2="390" stroke="#E1EFE0" strokeDasharray="3 3" />
          <line x1="350" y1="30" x2="350" y2="390" stroke="#E1EFE0" strokeDasharray="3 3" />
          <line x1="520" y1="30" x2="520" y2="390" stroke="#E1EFE0" strokeDasharray="3 3" />

          {/* Jamuna River on the East (Sirajganj & Bogura border) */}
          <path
            d="M 640 20 Q 610 120 625 210 T 635 340 T 650 410"
            fill="none"
            stroke="#9BC4E2"
            strokeWidth="14"
            strokeLinecap="round"
            opacity="0.75"
          />
          <text x="590" y="220" fill="#3D75A0" fontSize="10" fontWeight="bold">
            যমুনা নদী (Jamuna River)
          </text>

          {/* Padma River on South/South-West (Rajshahi & Pabna border) */}
          <path
            d="M 30 350 Q 150 330 260 350 T 430 380 T 610 405"
            fill="none"
            stroke="#9BC4E2"
            strokeWidth="16"
            strokeLinecap="round"
            opacity="0.8"
          />
          <text x="280" y="375" fill="#3D75A0" fontSize="11" fontWeight="bold">
            পদ্মা নদী (Padma River)
          </text>

          {/* District Boundary Indicators / Area Labels */}
          {Object.entries(DISTRICT_CENTROIDS).map(([key, d]) => {
            const cx = toSvgX(d.lon);
            const cy = toSvgY(d.lat);
            const isFilterActive =
              selectedDistrict === "all" ||
              selectedDistrict.toLowerCase() === key.toLowerCase();

            return (
              <g
                key={key}
                className="cursor-pointer transition-opacity"
                opacity={isFilterActive ? 1 : 0.3}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedDistrict(key);
                }}
              >
                {/* District Region Disc */}
                <circle
                  cx={cx}
                  cy={cy}
                  r="32"
                  fill="#E2EFE0"
                  stroke="#A7CE9F"
                  strokeWidth="1.5"
                  strokeDasharray="4 3"
                />
                {/* District Label Tag */}
                <rect
                  x={cx - 48}
                  y={cy - 12}
                  width="96"
                  height="24"
                  rx="12"
                  fill={isFilterActive ? "#1B3B2B" : "#FFFFFF"}
                  stroke={isFilterActive ? "#E0A800" : "#B8D7B0"}
                  strokeWidth="1.5"
                  filter="drop-shadow(0px 2px 4px rgba(0,0,0,0.12))"
                />
                <text
                  x={cx}
                  y={cy + 4}
                  textAnchor="middle"
                  fill={isFilterActive ? "#FFFFFF" : "#1B3B2B"}
                  fontSize="11"
                  fontWeight="bold"
                >
                  {lang === "bn" ? d.bn : d.en}
                </text>
              </g>
            );
          })}

          {/* Upazila Pins (Positioned accurately according to BBS geo-coordinates) */}
          {ALL_RAJSHAHI_UPAZILAS.map((u) => {
            const isDistrictMatch =
              selectedDistrict === "all" ||
              u.district_en.toLowerCase() === selectedDistrict.toLowerCase();
            if (!isDistrictMatch) return null;

            const x = toSvgX(u.lon);
            const y = toSvgY(u.lat);
            const isActive =
              activeUpazila?.upazila_en.toLowerCase() === u.upazila_en.toLowerCase();

            return (
              <g
                key={u.district_en + u.upazila_en}
                className="cursor-pointer group"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectUpazila(u);
                }}
              >
                {/* Active / Hover Ripple */}
                {isActive && (
                  <circle
                    cx={x}
                    cy={y}
                    r="14"
                    fill="#E0A800"
                    opacity="0.4"
                    className="animate-ping"
                  />
                )}
                {/* Clean Circular Pin */}
                <circle
                  cx={x}
                  cy={y}
                  r={isActive ? "7" : "4.5"}
                  fill={isActive ? "#E0A800" : "#0F5132"}
                  stroke="#FFFFFF"
                  strokeWidth="1.8"
                  className="transition-all hover:scale-150"
                />

                {/* Collision-Free Tooltip shown on hover/active only */}
                {(isActive || selectedDistrict !== "all") && (
                  <g transform={`translate(${x}, ${y - 12})`} pointerEvents="none">
                    <rect
                      x="-38"
                      y="-16"
                      width="76"
                      height="17"
                      rx="4"
                      fill={isActive ? "#E0A800" : "#1B3B2B"}
                      filter="drop-shadow(0px 1px 2px rgba(0,0,0,0.2))"
                    />
                    <text
                      x="0"
                      y="-4"
                      textAnchor="middle"
                      fill={isActive ? "#1B3B2B" : "#FFFFFF"}
                      fontSize="9"
                      fontWeight="bold"
                    >
                      {lang === "bn" ? u.upazila_bn : u.upazila_en}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Selected Upazila Banner / Confirm Card */}
      {activeUpazila && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-emerald-50 border border-emerald-300 rounded-2xl animate-in fade-in">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-xs">
              ✓
            </div>
            <div>
              <span className="text-xs text-emerald-800 font-semibold block">
                {lang === "bn" ? "নির্বাচিত অবস্থান:" : "Selected Field Location:"}
              </span>
              <p className="font-extrabold text-sm sm:text-base text-emerald-950">
                {lang === "bn"
                  ? `${activeUpazila.district_bn} > ${activeUpazila.upazila_bn}`
                  : `${activeUpazila.district_en} > ${activeUpazila.upazila_en}`}
                <span className="text-xs font-mono font-medium text-emerald-700 ml-2">
                  ({activeUpazila.lat}°N, {activeUpazila.lon}°E)
                </span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl font-bold text-xs shadow-xs transition flex items-center gap-1 cursor-pointer"
          >
            <span>{lang === "bn" ? "ফলাফল দেখুন" : "View Results"}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Upazila Quick Selection Grid */}
      <div className="pt-1 border-t border-slate-100">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-700">
            {lang === "bn"
              ? `উপজেলা তালিকা (${filteredUpazilas.length}টি)`
              : `Upazilas (${filteredUpazilas.length})`}
          </span>
          <span className="text-[11px] text-slate-500">
            {lang === "bn" ? "সরাসরি ট্যাপ করে নির্বাচন করুন" : "Tap directly to select"}
          </span>
        </div>

        <div className="max-h-40 overflow-y-auto grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-1.5 p-1 bg-slate-50 rounded-2xl border border-slate-200/80">
          {filteredUpazilas.map((u) => {
            const isMatch =
              activeUpazila?.upazila_en.toLowerCase() === u.upazila_en.toLowerCase();
            return (
              <button
                key={u.district_en + u.upazila_en}
                type="button"
                onClick={() => handleSelectUpazila(u)}
                className={`py-1.5 px-2 rounded-xl text-left text-xs font-medium transition cursor-pointer flex items-center justify-between min-h-[36px] ${
                  isMatch
                    ? "bg-emerald-700 text-white font-bold shadow-2xs"
                    : "bg-white text-slate-800 hover:bg-emerald-50 hover:text-emerald-950 border border-slate-200/80"
                }`}
              >
                <span className="truncate">{lang === "bn" ? u.upazila_bn : u.upazila_en}</span>
                {isMatch && <Check className="w-3.5 h-3.5 text-amber-300 flex-shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
