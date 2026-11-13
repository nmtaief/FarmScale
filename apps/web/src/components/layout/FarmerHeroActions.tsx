"use client";

import React from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import { Sprout, Activity, Mic, ArrowRight, Calendar, Sparkles } from "lucide-react";
import { useAppStore } from "@/lib/store/useAppStore";

export const FarmerHeroActions: React.FC = () => {
  const tLanding = useTranslations("landing");
  const tSeasons = useTranslations("seasons");
  const locale = useLocale();
  const setAiModalOpen = useAppStore((s) => s.setAiModalOpen);

  return (
    <div className="space-y-4">
      {/* Current Season Badge with Bengali Months */}
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface border border-gold shadow-xs">
        <Calendar className="w-4 h-4 text-gold flex-shrink-0" />
        <span className="text-xs text-secondary font-medium">
          {tLanding("currentSeasonLabel")}:
        </span>
        <span className="text-xs font-bold text-primary">
          {tSeasons("rabi")}
        </span>
      </div>

      {/* 3 Big Farmer Action Cards (Min 48px touch targets, 18px body font) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
        {/* Button 1: What to grow this season? -> goes directly to /plan */}
        <Link
          href="/plan"
          className="group p-5 rounded-2xl bg-forest text-white hover:bg-forest/95 shadow-raised transition-all flex flex-col justify-between min-h-[140px] touch-target"
        >
          <div className="flex items-center justify-between w-full">
            <div className="p-3 rounded-full bg-white/15 text-gold">
              <Sprout className="w-7 h-7" />
            </div>
            <ArrowRight className="w-5 h-5 text-gold group-hover:translate-x-1 transition-transform" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg sm:text-xl font-bold leading-snug m-0 text-white">
              {tLanding("actionPlan")}
            </h2>
            <p className="text-xs text-white/80 leading-tight m-0">
              {tLanding("actionPlanSub")}
            </p>
          </div>
        </Link>

        {/* Button 2: My field's condition -> goes to /dashboard */}
        <Link
          href="/dashboard"
          className="group p-5 rounded-2xl bg-surface border-2 border-border hover:border-water shadow-card hover:shadow-raised transition-all flex flex-col justify-between min-h-[140px] touch-target"
        >
          <div className="flex items-center justify-between w-full">
            <div className="p-3 rounded-full bg-water/15 text-water">
              <Activity className="w-7 h-7" />
            </div>
            <ArrowRight className="w-5 h-5 text-secondary group-hover:text-water group-hover:translate-x-1 transition-transform" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg sm:text-xl font-bold leading-snug m-0 text-primary group-hover:text-water transition-colors">
              {tLanding("actionField")}
            </h2>
            <p className="text-xs text-secondary leading-tight m-0">
              {tLanding("actionFieldSub")}
            </p>
          </div>
        </Link>

        {/* Button 3: Ask a question (Voice) -> opens AI modal */}
        <button
          type="button"
          onClick={() => setAiModalOpen(true)}
          className="group p-5 rounded-2xl bg-surface border-2 border-border hover:border-gold shadow-card hover:shadow-raised transition-all flex flex-col justify-between min-h-[140px] text-left touch-target"
        >
          <div className="flex items-center justify-between w-full">
            <div className="p-3 rounded-full bg-gold/20 text-forest dark:text-gold">
              <Mic className="w-7 h-7 animate-pulse" />
            </div>
            <span className="p-1.5 rounded-full bg-leaf/15 text-leaf">
              <Sparkles className="w-4 h-4" />
            </span>
          </div>
          <div className="space-y-1">
            <h2 className="text-lg sm:text-xl font-bold leading-snug m-0 text-primary group-hover:text-gold-text transition-colors">
              {tLanding("actionAsk")}
            </h2>
            <p className="text-xs text-secondary leading-tight m-0">
              {tLanding("actionAskSub")}
            </p>
          </div>
        </button>
      </div>
    </div>
  );
};

