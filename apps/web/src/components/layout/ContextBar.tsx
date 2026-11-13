"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { MapPin, Calendar, SlidersHorizontal, BookOpen } from "lucide-react";
import { useAppStore } from "@/lib/store/useAppStore";
import { Link, usePathname } from "@/i18n/routing";
import { LocateMeButton } from "@/components/ui/LocateMeButton";

export const ContextBar: React.FC = () => {
  const pathname = usePathname();
  const tContext = useTranslations("context");
  const tSeasons = useTranslations("seasons");

  const location = useAppStore((state) => state.location);
  const viewMode = useAppStore((state) => state.viewMode);
  const toggleViewMode = useAppStore((state) => state.toggleViewMode);

  if (pathname === "/" || pathname === "") return null;

  return (
    <div className="sticky top-16 z-30 w-full border-b border-border/80 bg-surface/90 backdrop-blur-sm transition-colors py-2 px-4 shadow-2xs">
      <div className="max-w-content mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Left: Location & Season Info */}
        <div className="flex items-center gap-3">
          {/* Location link */}
          <div className="flex items-center gap-1.5">
            <Link
              href="/explore"
              className="flex items-center gap-1.5 text-primary hover:text-gold transition-colors font-medium touch-target min-h-[36px]"
            >
              <MapPin className="w-3.5 h-3.5 text-water flex-shrink-0" />
              <span className="truncate max-w-[200px] sm:max-w-none">
                {location.name}
              </span>
            </Link>
            <LocateMeButton variant="icon" />
          </div>

          <span className="text-border hidden sm:inline">|</span>

          {/* Current season indicator */}
          <div className="hidden sm:flex items-center gap-1.5 text-secondary">
            <Calendar className="w-3.5 h-3.5 text-leaf flex-shrink-0" />
            <span>{tSeasons("rabi")}</span>
          </div>
        </div>

        {/* Right: Simple vs. Expert View Toggle */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={toggleViewMode}
            className={`touch-target min-h-[36px] px-3 py-1.5 rounded-full border text-xs font-semibold flex items-center gap-1.5 transition-all ${
              viewMode === "expert"
                ? "bg-leaf/15 text-leaf border-leaf/40 font-bold"
                : "bg-surface text-primary border-border hover:bg-surface-hover"
            }`}
            aria-label={`Toggle between simple and expert views. Currently: ${viewMode}`}
          >
            {viewMode === "expert" ? (
              <>
                <BookOpen className="w-3.5 h-3.5 text-leaf" aria-hidden="true" />
                <span>{tContext("expertView")}</span>
              </>
            ) : (
              <>
                <SlidersHorizontal className="w-3.5 h-3.5 text-secondary" aria-hidden="true" />
                <span>{tContext("simpleView")}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
