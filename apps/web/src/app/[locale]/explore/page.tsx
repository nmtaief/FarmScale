"use client";

import React, { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Search, MapPin, Check, ArrowRight, Droplets, Sprout, AlertTriangle, ShieldCheck } from "lucide-react";
import { useAppStore, type LocationInfo } from "@/lib/store/useAppStore";
import { LocateMeButton } from "@/components/ui/LocateMeButton";
import { toBengaliNumerals } from "@/lib/i18n/numerals";

export default function ExplorePage() {
  const tCommon = useTranslations("common");
  const locale = useLocale();

  const storeLocation = useAppStore((s) => s.location);
  const setStoreLocation = useAppStore((s) => s.setLocation);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPin, setSelectedPin] = useState<LocationInfo>(storeLocation);

  const locations: (LocationInfo & { soil: string; soilBn: string; waterRisk: string; waterRiskBn: string })[] = [
    {
      name: "Rajshahi Sadar, Barind",
      lat: 24.3745,
      lon: 88.6042,
      district: "Rajshahi",
      isPilot: true,
      soil: "Weathered Red-Brown Terrace Soil",
      soilBn: "লালচে বাদামী বরেন্দ্র এঁটেল মাটি (জৈব কার্বন ০.৬৮%)",
      waterRisk: "High groundwater depletion (~113 ft DTW level)",
      waterRiskBn: "গভীর নলকূপে পানির তীব্র সংকট (১১৩ ফুটের নিচে স্তর)",
    },
    {
      name: "Godagari Upazila",
      lat: 24.4667,
      lon: 88.3333,
      district: "Rajshahi",
      isPilot: true,
      soil: "Hard Red Clay / Silty Loam",
      soilBn: "শক্ত লাল মাটি ও পলি দোআঁশ (পানি ধারণক্ষমতা কম)",
      waterRisk: "Critical dry-season water stress",
      waterRiskBn: "শীতকালে তীব্র খরা ও সেচ সংকট (সরিষা ও ডাল উপযুক্ত)",
    },
    {
      name: "Tanore Upazila",
      lat: 24.5833,
      lon: 88.575,
      district: "Rajshahi",
      isPilot: true,
      soil: "Low-permeability Heavy Clay",
      soilBn: "ভারী এঁটেল মাটি (লাঙল স্তর শক্ত)",
      waterRisk: "Extreme aquifer depletion zone",
      waterRiskBn: "অতিরিক্ত সেচ ঝুঁকিপূর্ণ বরেন্দ্র এলাকা",
    },
    {
      name: "Paba Upazila",
      lat: 24.4333,
      lon: 88.625,
      district: "Rajshahi",
      isPilot: true,
      soil: "Alluvial Silt Loam near Padma",
      soilBn: "পদ্মা বিধৌত পলিময় দোআঁশ মাটি",
      waterRisk: "Moderate water stress; pulse-friendly",
      waterRiskBn: "মাঝারি সেচ ঝুঁকি; ডাল ও তৈলবীজের জন্য অনুকূল",
    },
    {
      name: "Naogaon Sadar",
      lat: 24.8167,
      lon: 88.9333,
      district: "Naogaon",
      isPilot: true,
      soil: "Grey Terrace Soil & Silt",
      soilBn: "ধূসর বরেন্দ্র মাটি ও পলি দোআঁশ",
      waterRisk: "Seasonal winter drought",
      waterRiskBn: "রবি মৌসুমে পানির স্বল্পতা",
    },
    {
      name: "Natore Sadar",
      lat: 24.4167,
      lon: 88.9833,
      district: "Natore",
      isPilot: true,
      soil: "Chalan Beel Floodplain Clay",
      soilBn: "চলন বিল সংলগ্ন নরম এঁটেল মাটি",
      waterRisk: "Pre-monsoon heat and delayed rains",
      waterRiskBn: "প্রাক-বর্ষা খরা ও শুষ্ক শীতকাল",
    },
  ];

  const filteredLocations = locations.filter(
    (loc) =>
      loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.soilBn.includes(searchQuery)
  );

  const handleSelectLocation = (loc: LocationInfo) => {
    setSelectedPin(loc);
    setStoreLocation(loc);
  };

  const activeSelected = locations.find((l) => l.name === selectedPin.name) || locations[0];

  return (
    <div className="space-y-6 pb-16">
      {/* Honest sample notice banner */}
      <div className="p-3.5 rounded-md bg-leaf/10 border border-leaf/30 text-xs text-primary leading-relaxed">
        <span className="font-bold text-leaf mr-1.5">পাইলট প্রাক্কলন:</span>
        {tCommon("honestSampleBanner")}
      </div>

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
        <div>
          <span className="text-xs uppercase font-mono font-bold tracking-wider text-secondary">
            {locale === "bn" ? "বরেন্দ্র পাইলট উপজেলা নির্বাচন" : "Barind Pilot Upazila Directory"}
          </span>
          <h1 className="text-2xl sm:text-4xl font-serif font-bold text-primary m-0">
            {locale === "bn" ? "আপনার এলাকা বা জমি বেছে নিন" : "Select Your Field Location"}
          </h1>
          <p className="text-sm text-secondary m-0 mt-1">
            {locale === "bn"
              ? "রাজশাহী ও বরেন্দ্র অঞ্চলের ৬টি পাইলট উপজেলার জলবায়ু ও মাটির তথ্য দেখতে যেকোনো উপজেলা ট্যাপ করুন।"
              : "Select a pilot upazila across the Barind delta to load climate telemetry and optimized crop rotation plans."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <LocateMeButton variant="chip" onLocated={(loc) => setSelectedPin(loc)} />
          <Chip state="sample">{tCommon("sampleData")}</Chip>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="p-2 rounded-lg bg-surface border border-border shadow-card max-w-md">
        <div className="flex items-center gap-2 px-3 py-2 bg-bg rounded border border-border">
          <Search className="w-4 h-4 text-secondary flex-shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={locale === "bn" ? "উপজেলা বা জেলা খুঁজুন (যেমন গোদাগাড়ী)..." : "Search upazila (e.g. Godagari)..."}
            className="w-full bg-transparent text-sm text-primary focus:outline-none placeholder:text-muted"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="text-xs text-secondary hover:text-primary px-1.5"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Interactive Pilot Upazilas Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredLocations.map((loc) => {
          const isSelected = selectedPin.name === loc.name;
          return (
            <button
              key={loc.name}
              type="button"
              onClick={() => handleSelectLocation(loc)}
              className={`p-4 rounded-xl border text-left transition-all touch-target flex flex-col justify-between space-y-3 ${
                isSelected
                  ? "bg-leaf/10 border-leaf ring-2 ring-leaf/40 shadow-card"
                  : "bg-surface border-border hover:border-gold"
              }`}
            >
              <div className="space-y-1 w-full">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-secondary px-2 py-0.5 rounded bg-bg border border-border">
                    {loc.district}
                  </span>
                  {isSelected && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-leaf">
                      <Check className="w-4 h-4" />
                      {locale === "bn" ? "নির্বাচিত জমি" : "Active Field"}
                    </span>
                  )}
                </div>

                <h3 className="text-lg font-serif font-bold text-primary m-0 pt-1">
                  {loc.name}
                </h3>
                <span className="font-mono text-[11px] text-muted block">
                  {toBengaliNumerals(loc.lat, locale)}° N, {toBengaliNumerals(loc.lon, locale)}° E
                </span>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-border/80 text-xs w-full">
                <div className="flex items-start gap-1.5 text-secondary">
                  <Sprout className="w-3.5 h-3.5 text-leaf flex-shrink-0 mt-0.5" />
                  <span>{locale === "bn" ? loc.soilBn : loc.soil}</span>
                </div>
                <div className="flex items-start gap-1.5 text-secondary">
                  <Droplets className="w-3.5 h-3.5 text-water flex-shrink-0 mt-0.5" />
                  <span className="text-amber-800 dark:text-amber-300 font-medium">
                    {locale === "bn" ? loc.waterRiskBn : loc.waterRisk}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Location Summary Panel */}
      <div className="p-6 rounded-xl bg-surface border border-border shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-full bg-water/20 text-water">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-secondary font-medium">
                {locale === "bn" ? "বর্তমান নির্বাচিত এলাকা" : "Currently Selected Field Location"}
              </span>
              <h2 className="text-xl font-serif font-bold text-primary m-0">
                {activeSelected.name}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="outline" size="sm">
                <span>{locale === "bn" ? "জমির অবস্থা দেখুন" : "View Field Data"}</span>
              </Button>
            </Link>
            <Link href="/plan">
              <Button variant="primary" size="sm">
                <span>{locale === "bn" ? "এই জমির ফসল পর্যায় দেখুন" : "Plan Rotations for this Field"}</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1 text-xs">
          <div className="p-3 rounded-lg bg-bg border border-border">
            <span className="text-secondary font-medium block mb-1">
              {locale === "bn" ? "পাইলট জোন স্ট্যাটাস" : "Pilot Zone Status"}
            </span>
            <span className="font-bold text-leaf flex items-center gap-1">
              <ShieldCheck className="w-4 h-4" />
              {locale === "bn" ? "বরেন্দ্র ট্র্যাক্ট সক্রিয় পাইলট" : "Active Barind Pilot"}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-bg border border-border">
            <span className="text-secondary font-medium block mb-1">
              {locale === "bn" ? "মাটির গঠন ও কার্বন" : "Soil Texture & Carbon"}
            </span>
            <span className="font-bold text-primary">
              {locale === "bn" ? activeSelected.soilBn : activeSelected.soil}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-bg border border-border">
            <span className="text-secondary font-medium block mb-1">
              {locale === "bn" ? "সেচ ও ভূগর্ভস্থ পানি" : "Aquifer & Irrigation"}
            </span>
            <span className="font-bold text-amber-700 dark:text-amber-400">
              {locale === "bn" ? activeSelected.waterRiskBn : activeSelected.waterRisk}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
