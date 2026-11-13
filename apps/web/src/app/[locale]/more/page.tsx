"use client";

import React from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Globe, Moon, Database, ShieldAlert, BookOpen, ExternalLink, Info, MapPin, Wheat, SlidersHorizontal } from "lucide-react";
import { useAppStore } from "@/lib/store/useAppStore";

export default function MorePage() {
  const locale = useLocale();
  const location = useAppStore((s) => s.location);
  const viewMode = useAppStore((s) => s.viewMode);
  const toggleViewMode = useAppStore((s) => s.toggleViewMode);

  return (
    <div className="space-y-8 pb-16 max-w-3xl mx-auto">
      {/* Title */}
      <div className="border-b border-border pb-4 space-y-1">
        <span className="text-xs uppercase font-mono font-bold tracking-wider text-secondary">
          {locale === "bn" ? "অতিরিক্ত অপশন ও সেটিংস" : "Preferences & Disclosures"}
        </span>
        <h1 className="text-2xl sm:text-4xl font-serif font-bold text-primary m-0">
          {locale === "bn" ? "সেটিংস ও তথ্যভাণ্ডার" : "Settings & More"}
        </h1>
      </div>

      {/* Quick Navigation to Crops & Gateway */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/crops"
          className="p-5 rounded-xl bg-surface border border-border hover:border-gold shadow-card transition-all flex items-center justify-between"
        >
          <div className="space-y-1">
            <span className="font-bold text-primary block text-base flex items-center gap-2">
              <Wheat className="w-5 h-5 text-gold-text" />
              {locale === "bn" ? "ফসলের তথ্যভাণ্ডার (লাইব্রেরি)" : "Crop Library"}
            </span>
            <span className="text-xs text-secondary block">
              {locale === "bn"
                ? "৮টি প্রধান রবি ও খরিপ ফসলের পুষ্টি ও সেচ বৈশিষ্ট্য"
                : "Browse verified crop profiles, traits, and water needs"}
            </span>
          </div>
          <Button variant="ghost" size="sm">
            <span>→</span>
          </Button>
        </Link>

        <Link
          href="/gateway"
          className="p-5 rounded-xl bg-surface border border-border hover:border-water shadow-card transition-all flex items-center justify-between"
        >
          <div className="space-y-1">
            <span className="font-bold text-primary block text-base flex items-center gap-2">
              <Database className="w-5 h-5 text-water" />
              {locale === "bn" ? "ডাটা গেটওয়ে ও এপিআই" : "Data Gateway & APIs"}
            </span>
            <span className="text-xs text-secondary block">
              {locale === "bn"
                ? "নাসা পাওয়ার ও এসএমএপি রিয়েল-টাইম ডাটা সিঙ্ক"
                : "Live NASA POWER, SMAP, and ML endpoints"}
            </span>
          </div>
          <Button variant="ghost" size="sm">
            <span>→</span>
          </Button>
        </Link>
      </section>

      {/* Preferences Section */}
      <section className="space-y-4">
        <h2 className="text-lg font-serif font-bold text-primary m-0">
          {locale === "bn" ? "ব্যবহারকারীর সেটিংস" : "User Preferences"}
        </h2>

        <div className="rounded-xl bg-surface border border-border shadow-card divide-y divide-border">
          {/* Language Selection */}
          <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="font-semibold text-sm text-primary block">
                {locale === "bn" ? "ভাষার নির্বাচন" : "Interface Language"}
              </span>
              <span className="text-xs text-secondary">
                বাংলা (Bangla) & English
              </span>
            </div>
            <LanguageSwitcher />
          </div>

          {/* Theme Mode */}
          <div className="p-4 flex items-center justify-between gap-3">
            <div>
              <span className="font-semibold text-sm text-primary block">
                {locale === "bn" ? "রঙের থিম" : "Color Theme"}
              </span>
              <span className="text-xs text-secondary">
                {locale === "bn" ? "দিন (হালকা) ও রাত (অন্ধকার) মোড" : "Switch between Agro Light and Night Dark modes"}
              </span>
            </div>
            <ThemeToggle />
          </div>

          {/* Simple vs Expert Mode */}
          <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="font-semibold text-sm text-primary block">
                {locale === "bn" ? "ভিউ মোড (সহজ বনাম বিশেষজ্ঞ)" : "Display View Mode"}
              </span>
              <span className="text-xs text-secondary">
                {locale === "bn"
                  ? "সহজ মোড: কৃষকদের জন্য বড় আইকন ও সাধারণ ভাষা; বিশেষজ্ঞ মোড: বিস্তারিত সূত্র ও সূচক"
                  : "Simple: Plain-language choice cards for farmers. Expert: Sliders, telemetry and raw formula."}
              </span>
            </div>
            <Button variant="outline" size="sm" onClick={toggleViewMode} className="gap-2">
              <SlidersHorizontal className="w-3.5 h-3.5 text-secondary" />
              <span>{viewMode === "simple" ? "Switch to Expert" : "Switch to Simple"}</span>
            </Button>
          </div>
        </div>
      </section>

      {/* About FarmScale & Pilot Region */}
      <section className="space-y-4">
        <h2 className="text-lg font-serif font-bold text-primary m-0">
          {locale === "bn" ? "পাইলট অঞ্চল ও বিজ্ঞানের উৎস" : "About FarmScale & Pilot Region"}
        </h2>

        <div className="rounded-xl bg-surface border border-border p-5 space-y-4 text-xs text-secondary leading-relaxed shadow-card">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-full bg-water/20 text-water">
              <MapPin className="w-4 h-4" />
            </span>
            <div>
              <span className="font-semibold text-primary block text-sm">
                Pilot Focus Region: Rajshahi / Barind Tract, Bangladesh
              </span>
              <span className="text-muted font-mono text-[11px]">
                Active Grid Cell: {location.lat}° N, {location.lon}° E
              </span>
            </div>
          </div>

          <p className="m-0">
            The Barind delta is experiencing severe aquifer depression due to continuous flooded boro rice cultivation, with deep tubewell pumping levels falling from 26 feet to over 113 feet. FarmScale is a decision-support platform designed to help smallholder farmers and agriculture extension officers transition toward sustainable crop rotations.
          </p>

          <ul className="space-y-2 m-0 pl-4 list-disc">
            <li>
              <strong className="text-primary">Coarse Gridded Climatology:</strong> NASA POWER data resolution is approximately 0.5° × 0.5° (~50 km). Telemetry reflects regional climatology, not micro-plot topography.
            </li>
            <li>
              <strong className="text-primary">SMAP Moisture History:</strong> NASA SMAP satellite observation series commenced in April 2015. Data prior to 2015 uses modeled reanalysis.
            </li>
            <li>
              <strong className="text-primary">Sample Crop Traits:</strong> All traits and suitability ratings are illustrative pilot figures labeled as sample data until final validation against BARI / FAO agronomic tables.
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}
