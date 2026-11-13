"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useAppStore } from "@/lib/store/useAppStore";
import { FarmerWizard } from "./FarmerWizard";
import { MyFarmDashboard } from "./MyFarmDashboard";
import { ShieldCheck, Cpu, Smartphone, ChevronDown, ChevronUp, MapPin } from "lucide-react";
import Image from "next/image";
import { Link } from "@/i18n/routing";
import { LocateMeButton } from "@/components/ui/LocateMeButton";
import { RotationRing } from "@/components/season/RotationRing";

export const HomeFarmerJourney: React.FC = () => {
  const tLanding = useTranslations("landing");
  const tCommon = useTranslations("common");
  const savedFarm = useAppStore((s) => s.savedFarm);
  const [isMounted, setIsMounted] = useState(false);
  const [showSecondaryInfo, setShowSecondaryInfo] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const pilotLocations = [
    { name: "Rajshahi Sadar", lat: "24.37° N", lon: "88.60° E" },
    { name: "Godagari (Barind)", lat: "24.46° N", lon: "88.33° E" },
    { name: "Tanore", lat: "24.58° N", lon: "88.57° E" },
    { name: "Paba", lat: "24.43° N", lon: "88.62° E" },
  ];

  return (
    <div className="space-y-8 pb-16">
      {/* Honest sample notice banner (Part A.8) */}
      <div className="p-3.5 rounded-lg bg-leaf/10 border border-leaf/30 text-xs text-primary leading-relaxed flex items-start gap-2 shadow-2xs">
        <span className="font-bold text-leaf shrink-0 mt-0.5">পাইলট প্রাক্কলন:</span>
        <div>
          {tCommon("honestSampleBanner")}
        </div>
      </div>

      {/* Main Farmer Journey: State A (Wizard) or State B (My Farm Dashboard) */}
      {!isMounted ? (
        <div className="min-h-[400px] flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-leaf border-t-transparent animate-spin" />
        </div>
      ) : savedFarm ? (
        <MyFarmDashboard />
      ) : (
        <FarmerWizard />
      )}

      {/* Secondary / Scientific Context Section (Collapsible in State B, visible in State A) */}
      <div className="border-t border-border/80 pt-8 mt-12 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base sm:text-lg font-serif font-bold text-primary">
              NASA উপগ্রহ তথ্য ও বৈজ্ঞানিক ভিত্তি
            </h3>
            <p className="text-xs text-secondary">
              বরেন্দ্র বহুমুখী উন্নয়ন কর্তৃপক্ষ (BMDA) ও নাসা আর্থ সায়েন্স ভিত্তিক বিশ্লেষণ
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowSecondaryInfo((prev) => !prev)}
            className="text-xs text-leaf font-medium flex items-center gap-1 hover:underline p-2"
          >
            {showSecondaryInfo ? "সংক্ষেপ করুন" : "বিস্তারিত দেখুন"}
            {showSecondaryInfo ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {showSecondaryInfo && (
          <div className="space-y-8 transition-all animate-fadeIn">
            {/* Field Shift Story & Rotation Ring Illustration */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-2">
              <div className="lg:col-span-7 space-y-4">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-gold">
                  NASA Space Apps Challenge 2026 – Field Shift
                </span>
                <h4 className="text-xl sm:text-2xl font-serif font-bold text-primary m-0">
                  Adapting Farms with Ground-Truth and Satellite Earth Data
                </h4>
                <p className="text-sm text-secondary leading-relaxed m-0">
                  Continuous flooded boro rice has dropped Barind groundwater from 26 ft to over 113 ft. FarmScale introduces high-value mustard and legume rotations that restore the aquifer while boosting net profit.
                </p>

                {/* Quick Pilot Coordinates & GPS Trigger */}
                <div className="flex flex-wrap items-center gap-1.5 pt-2 text-xs text-secondary">
                  <LocateMeButton variant="chip" />
                  <span className="font-medium mr-1 ml-1">Pilot areas:</span>
                  {pilotLocations.map((loc) => (
                    <Link
                      key={loc.name}
                      href="/explore"
                      className="px-2.5 py-1 rounded-full bg-surface border border-border hover:border-gold hover:text-primary transition-colors inline-flex items-center gap-1 text-[11px]"
                    >
                      <MapPin className="w-3 h-3 text-water" />
                      <span>{loc.name}</span>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-5 flex flex-col items-center justify-center p-6 rounded-lg bg-surface border border-border shadow-card relative overflow-hidden">
                <div className="absolute top-3 right-3">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-secondary px-2 py-0.5 rounded bg-bg border border-border">
                    3-Season Cycle
                  </span>
                </div>

                <RotationRing size={220} />

                <p className="text-xs text-secondary text-center mt-3 max-w-xs leading-relaxed">
                  Kharif-1 pulses (mungbean) fix soil nitrogen before monsoon rice.
                </p>
              </div>
            </section>

            {/* Visual Showcase: Real Local Agro-Scientific Imagery */}
            <section className="rounded-lg overflow-hidden border border-border bg-surface shadow-card">
              <div className="relative h-56 sm:h-64 w-full">
                <Image
                  src="/images/hero_crop_fields.jpg"
                  alt="Lush agricultural mosaic of crop rotation fields in Bengal delta"
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
                  className="object-cover"
                  priority={false}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-forest/90 via-forest/40 to-transparent flex items-end p-5">
                  <div className="text-white max-w-2xl space-y-1">
                    <span className="text-xs font-mono font-semibold uppercase tracking-wider text-gold">
                      Barind Aquifer Restoration
                    </span>
                    <p className="text-xs sm:text-sm text-gray-200 leading-relaxed max-w-xl">
                      Replacing water-intensive boro with mustard and mungbean saves up to 60% groundwater while increasing annual farm profit.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* 3 Trust Points */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
              <div className="p-5 rounded-md bg-surface border border-border shadow-card space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-full bg-water/15 text-water flex items-center justify-center">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <h5 className="text-base font-serif font-bold text-primary">
                    {tLanding("trustPoint1Title")}
                  </h5>
                  <p className="text-xs text-secondary leading-relaxed">
                    {tLanding("trustPoint1Desc")} Coarse gridded climatology calibrated for the Barind delta.
                  </p>
                </div>
              </div>

              <div className="p-5 rounded-md bg-surface border border-border shadow-card space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-full bg-leaf/15 text-leaf flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <h5 className="text-base font-serif font-bold text-primary">
                    {tLanding("trustPoint2Title")}
                  </h5>
                  <p className="text-xs text-secondary leading-relaxed">
                    {tLanding("trustPoint2Desc")} Every recommendation explicitly explains its water savings and soil recovery.
                  </p>
                </div>
              </div>

              <div className="p-5 rounded-md bg-surface border border-border shadow-card space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-full bg-gold/20 text-forest dark:text-gold flex items-center justify-center">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <h5 className="text-base font-serif font-bold text-primary">
                    {tLanding("trustPoint3Title")}
                  </h5>
                  <p className="text-xs text-secondary leading-relaxed">
                    {tLanding("trustPoint3Desc")} Designed for rural Android phones with offline persistence and touch-first navigation.
                  </p>
                </div>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
};

