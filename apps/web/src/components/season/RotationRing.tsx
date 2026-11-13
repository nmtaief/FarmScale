"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";

export interface RotationRingProps {
  selectedSeason?: "rabi" | "kharif_1" | "kharif_2";
  onSelectSeason?: (season: "rabi" | "kharif_1" | "kharif_2") => void;
  className?: string;
  size?: number;
}

export const RotationRing: React.FC<RotationRingProps> = ({
  selectedSeason = "rabi",
  onSelectSeason,
  className = "",
  size = 280,
}) => {
  const t = useTranslations("seasons");
  const [activeSeason, setActiveSeason] = useState<"rabi" | "kharif_1" | "kharif_2">(
    selectedSeason
  );

  const handleSelect = (season: "rabi" | "kharif_1" | "kharif_2") => {
    setActiveSeason(season);
    onSelectSeason?.(season);
  };

  // Center coordinate and radius for SVG arcs
  const center = size / 2;
  const radius = size * 0.38;
  const strokeWidth = size * 0.12;

  // Three equal arcs (120 deg each) with 4 deg gap
  const arcs = [
    {
      id: "rabi" as const,
      name: t("rabi"),
      period: "Nov – Mar (Winter)",
      startAngle: 154,
      endAngle: 266,
      color: "var(--color-gold)",
      activeColor: "#D9A21B",
      crop: "Mustard / Wheat / Lentil",
    },
    {
      id: "kharif_1" as const,
      name: t("kharif_1"),
      period: "Apr – Jul (Pre-monsoon)",
      startAngle: 274,
      endAngle: 386,
      color: "var(--color-water)",
      activeColor: "#2E7DA6",
      crop: "Mungbean / Aus Rice",
    },
    {
      id: "kharif_2" as const,
      name: t("kharif_2"),
      period: "Jul – Nov (Monsoon)",
      startAngle: 34,
      endAngle: 146,
      color: "var(--color-leaf)",
      activeColor: "#2F7D4F",
      crop: "Aman Rice",
    },
  ];

  // Helper to calculate SVG arc path
  const polarToCartesian = (cx: number, cy: number, r: number, angleInDegrees: number) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: cx + r * Math.cos(angleInRadians),
      y: cy + r * Math.sin(angleInRadians),
    };
  };

  const describeArc = (cx: number, cy: number, r: number, startAngle: number, endAngle: number) => {
    const start = polarToCartesian(cx, cy, r, endAngle);
    const end = polarToCartesian(cx, cy, r, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    return ["M", start.x, start.y, "A", r, r, 0, largeArcFlag, 0, end.x, end.y].join(" ");
  };

  const currentArc = arcs.find((a) => a.id === activeSeason) || arcs[0];

  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="transform rotate-0"
        >
          {arcs.map((arc) => {
            const isSelected = activeSeason === arc.id;
            return (
              <path
                key={arc.id}
                d={describeArc(center, center, radius, arc.startAngle, arc.endAngle)}
                fill="none"
                stroke={arc.color}
                strokeWidth={isSelected ? strokeWidth * 1.15 : strokeWidth}
                strokeLinecap="round"
                className="cursor-pointer transition-all duration-200 hover:opacity-90"
                style={{
                  opacity: isSelected ? 1 : 0.65,
                  filter: isSelected ? "drop-shadow(0px 2px 6px rgba(20,41,31,0.25))" : undefined,
                }}
                onClick={() => handleSelect(arc.id)}
                role="button"
                tabIndex={0}
                aria-label={`${arc.name}: ${arc.crop}`}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    handleSelect(arc.id);
                  }
                }}
              />
            );
          })}
        </svg>

        {/* Center Disc: Active Season Details */}
        <div
          className="absolute inset-0 m-auto flex flex-col items-center justify-center text-center p-4 rounded-full bg-surface shadow-raised border border-border"
          style={{ width: size * 0.52, height: size * 0.52 }}
        >
          <span className="text-[10px] uppercase font-mono tracking-wider text-secondary font-bold">
            Season
          </span>
          <span className="text-xs sm:text-sm font-serif font-bold text-primary truncate max-w-[90%]">
            {currentArc.name.split(" ")[0]}
          </span>
          <span className="text-[10px] text-secondary font-medium leading-tight mt-0.5">
            {currentArc.crop.split(" / ")[0]}
          </span>
        </div>
      </div>

      {/* Mobile-friendly Segmented Selector Tabs */}
      <div className="flex items-center gap-1.5 mt-4 p-1 rounded-full bg-surface border border-border shadow-2xs">
        {arcs.map((arc) => {
          const isSelected = activeSeason === arc.id;
          return (
            <button
              key={arc.id}
              type="button"
              onClick={() => handleSelect(arc.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-all touch-target min-h-[36px] ${
                isSelected
                  ? "bg-gold text-forest shadow-xs font-bold"
                  : "text-secondary hover:text-primary hover:bg-surface-hover"
              }`}
            >
              {arc.name.split(" ")[0]}
            </button>
          );
        })}
      </div>
    </div>
  );
};
