"use client";

import React from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/Button";
import { DataCard } from "@/components/data/DataCard";
import { Chip } from "@/components/ui/Chip";
import { useAppStore } from "@/lib/store/useAppStore";
import {
  ArrowRight,
  MapPin,
  Compass,
  AlertCircle,
  Droplets,
  Sun,
  Sprout,
  Activity,
  Database,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { toBengaliNumerals } from "@/lib/i18n/numerals";

export default function DashboardPage() {
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const location = useAppStore((s) => s.location);
  const viewMode = useAppStore((s) => s.viewMode);

  return (
    <div className="space-y-6 pb-16">
      {/* Honest sample notice banner */}
      <div className="p-3.5 rounded-md bg-leaf/10 border border-leaf/30 text-xs text-primary leading-relaxed">
        <span className="font-bold text-leaf mr-1.5">পাইলট প্রাক্কলন:</span>
        {tCommon("honestSampleBanner")}
      </div>

      {/* Page Title & Context Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <span className="text-xs uppercase font-mono font-bold tracking-wider text-secondary">
            {locale === "bn" ? "মাটি ও আবহাওয়া পর্যবেক্ষণ" : "Climate & Soil Telemetry"}
          </span>
          <h1 className="text-2xl sm:text-4xl font-serif font-bold text-primary m-0">
            {locale === "bn" ? `জমির অবস্থা: ${location.name}` : `Field Dashboard: ${location.name}`}
          </h1>
          <p className="text-sm text-secondary m-0 mt-1">
            {locale === "bn"
              ? "নাসা স্যাটেলাইট ও মৃত্তিকা তথ্য থেকে আপনার জমির পানির স্তর, খরা ও মাটির স্বাস্থ্য পর্যালোচনা।"
              : "Satellite observations and ground measurements calibrated for the Barind delta."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/plan">
            <Button variant="primary" size="md" className="shadow-raised">
              <span>{locale === "bn" ? "ফসল চক্র দেখুন" : "See Rotations"}</span>
              <ArrowRight className="w-4 h-4 ml-1 text-forest" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Layout: 8 Columns Data Cards + 4 Columns Sticky Rail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (8 cols): 5 Core DataCards */}
        <div className="lg:col-span-8 space-y-6">
          {/* Card 1: Rainfall Trend */}
          <DataCard
            title={locale === "bn" ? "বৃষ্টিপাতের ইতিহাস (নাসা পাওয়ার)" : "Precipitation History"}
            statement={
              locale === "bn"
                ? "উত্তর-পশ্চিম বরেন্দ্রে ১৯৮৫ সাল থেকে বার্ষিক গড় বৃষ্টিপাত ২৫.৬% কমেছে।"
                : "Annual rainfall decreased 25.6% across northwest Bangladesh (1985–2025 Climatology)."
            }
            metricValue={toBengaliNumerals("1,625", locale)}
            metricUnit={locale === "bn" ? "মিমি / বছর (গড়)" : "mm / year"}
            changeNote={locale === "bn" ? "(জাতীয় গড় ২,৫৫০ মিমি-এর চেয়ে কম)" : "(vs. 2,550 mm national avg)"}
            source="NASA POWER API (10-Yr Climatology)"
            updatedAt="2024-11-01"
            state="sample"
            tableData={[
              { label: "1985-1995 Avg", value: "2,180 mm" },
              { label: "1995-2005 Avg", value: "1,940 mm" },
              { label: "2005-2015 Avg", value: "1,750 mm" },
              { label: "2015-2025 Avg", value: "1,625 mm" },
            ]}
            expertContent={
              <div className="space-y-1">
                <p>Monsoon onset shifted later by ~12 days. Rain intensity concentrated in fewer storm events.</p>
                <div className="font-mono text-[11px] text-muted">Grid resolution: 0.5° × 0.5° (~50 km)</div>
              </div>
            }
          >
            {/* Plain language banner for farmers */}
            {viewMode === "simple" && (
              <div className="p-3 rounded bg-amber-500/10 border border-amber-500/30 text-xs text-primary flex items-center gap-2 mb-2">
                <span className="w-3 h-3 rounded-full bg-amber-500 flex-shrink-0" />
                <span className="font-medium">
                  {locale === "bn"
                    ? "সতর্কতা: শুষ্ক শীতকালে বৃষ্টি প্রায় হয় না – বোরোর বদলে সরিষা বা গম চাষে সেচ সাশ্রয় হবে।"
                    : "Moderate Alert: Winter rainfall is scarce – low-water mustard or wheat cuts irrigation risk."}
                </span>
              </div>
            )}

            {/* Simple SVG Bar Trend with matching 1985-2025 ranges */}
            <div className="h-20 w-full flex items-end gap-3 pt-3">
              {[
                { year: "1985-95", h: "85%", v: "2,180" },
                { year: "1995-05", h: "75%", v: "1,940" },
                { year: "2005-15", h: "65%", v: "1,750" },
                { year: "2015-25", h: "52%", v: "1,625" },
              ].map((bar) => (
                <div key={bar.year} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full bg-water rounded-t-sm transition-all duration-300"
                    style={{ height: bar.h }}
                  />
                  <span className="text-[10px] font-mono text-secondary">{bar.year}</span>
                </div>
              ))}
            </div>
          </DataCard>

          {/* Card 2: Extreme Heat Days */}
          <DataCard
            title={locale === "bn" ? "তীব্র গরম ও তাপপ্রবাহ" : "Temperature Extremes"}
            statement={
              locale === "bn"
                ? "বরেন্দ্রে ৩৫° সেলসিয়াসের বেশি গরমের দিন বছরে ১৮ দিন বৃদ্ধি পেয়েছে।"
                : "Extreme heat days above 35°C increased by 18 days per year in the Barind."
            }
            metricValue={toBengaliNumerals("42", locale)}
            metricUnit={locale === "bn" ? "দিন / বছর (> ৩৫° সে.)" : "days / year > 35°C"}
            changeNote={locale === "bn" ? "(চৈত্রে তীব্র খরা ঝুঁকি)" : "(Pre-monsoon heat stress)"}
            source="NASA POWER API (MERRA-2 2m Temp)"
            updatedAt="2024-11-08"
            state="sample"
            tableData={[
              { label: "Pre-monsoon (Apr-May)", value: "26 days" },
              { label: "Monsoon (Jun-Aug)", value: "11 days" },
              { label: "Winter (Dec-Feb)", value: "0 days" },
            ]}
            expertContent={
              <p>Heat stress during flowering causes pollen sterility in dry-season crops. Early Rabi planting recommended.</p>
            }
          >
            {viewMode === "simple" && (
              <div className="p-3 rounded bg-amber-500/10 border border-amber-500/30 text-xs text-primary flex items-center gap-2 mb-2">
                <span className="w-3 h-3 rounded-full bg-amber-500 flex-shrink-0" />
                <span className="font-medium">
                  {locale === "bn"
                    ? "পরামর্শ: ফাল্গুন-চৈত্রে অতিরিক্ত গরমে দানার ক্ষতি এড়াতে কার্তিকের মধ্যেই রবি ফসল বপন করুন।"
                    : "Advice: Sow winter crops by Kartik to finish flowering before pre-monsoon heat waves."}
                </span>
              </div>
            )}
            <div className="h-16 w-full flex items-center gap-2">
              <div className="flex-1 bg-heat/15 h-3 rounded-full overflow-hidden">
                <div className="bg-heat h-full w-[65%]" />
              </div>
              <span className="text-xs font-mono text-heat font-bold">
                {locale === "bn" ? "উচ্চ খরা ঝুঁকি" : "High Heat Risk"}
              </span>
            </div>
          </DataCard>

          {/* Card 3: Soil Moisture Profile */}
          <DataCard
            title={locale === "bn" ? "মাটির রস ও আর্দ্রতা (নাসা SMAP)" : "Root-Zone Moisture"}
            statement={
              locale === "bn"
                ? "শীতকালে বরেন্দ্রের উপরের স্তরে রস শুকিয়ে যায়; সেচ ছাড়া বোরো ধান টেকে না।"
                : "Surface moisture in Rabi winter drops below wilting point without supplementary irrigation."
            }
            metricValue={viewMode === "expert" ? "0.18" : locale === "bn" ? "শুকনো" : "Dry"}
            metricUnit={viewMode === "expert" ? "m³ / m³ (Root zone)" : locale === "bn" ? "(শীতকালীন স্তর)" : "(Winter status)"}
            changeNote={locale === "bn" ? "(সেচ সাশ্রয়ী ফসল আবশ্যক)" : "(SMAP L4 Volumetric)"}
            source="NASA SMAP (Soil Moisture Active Passive)"
            updatedAt="2024-11-11"
            state="sample"
            tableData={[
              { label: "Surface (0-5 cm)", value: "0.12 m³/m³" },
              { label: "Root Zone (0-100 cm)", value: "0.18 m³/m³" },
              { label: "Wilting Threshold", value: "0.14 m³/m³" },
            ]}
            expertContent={
              <p>NASA SMAP telemetry available from 2015 onwards. Mustard requires ~60% less supplementary water than flooded boro paddy.</p>
            }
          >
            {/* Simple View Plain Language Traffic Light */}
            {viewMode === "simple" ? (
              <div className="p-3 rounded bg-red-500/10 border border-red-500/30 text-xs text-primary flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500 flex-shrink-0 animate-pulse" />
                <span className="font-medium">
                  {locale === "bn"
                    ? "সতর্কতা (লাল): মাটিতে আর্দ্রতা কম – ১-২ সেচে হয় এমন ফসল (সরিষা বা ডাল) দেওয়া শ্রেয়।"
                    : "High Stress (Red): Root-zone is dry – crops with 1–2 light irrigations (mustard/pulses) strongly recommended."}
                </span>
              </div>
            ) : (
              <div className="space-y-2 pt-2">
                <div className="flex justify-between text-xs text-secondary font-medium">
                  <span>Current Profile</span>
                  <span className="text-water font-mono font-bold">Stress Percentile: 24th</span>
                </div>
                <div className="w-full h-3 rounded-full bg-border overflow-hidden">
                  <div className="bg-water h-full w-[24%]" />
                </div>
              </div>
            )}
          </DataCard>

          {/* Card 4: Vegetation Health (NDVI) */}
          <DataCard
            title={locale === "bn" ? "ফসলের ক্যানোপি ও সবুজায়ন" : "Vegetation Greenness"}
            statement={
              locale === "bn"
                ? "বর্ষা মৌসুমে আমন ধানের ভালো ফলন হয়, তবে রবি মৌসুমে অনেক জমি পতিত থাকে।"
                : "NDVI anomaly indicates healthy monsoon rice canopy, but winter fallows remain bare."
            }
            metricValue={viewMode === "expert" ? "0.64" : locale === "bn" ? "উৎকৃষ্ট" : "Healthy"}
            metricUnit={viewMode === "expert" ? "NDVI index (0-1)" : locale === "bn" ? "(আমন মৌসুম)" : "(Monsoon)"}
            changeNote={locale === "bn" ? "(১০ বছরের চেয়ে +৮% বেশি)" : "(MODIS 16-day Composite)"}
            source="NASA MODIS / VIIRS Terra"
            updatedAt="2024-11-10"
            state="sample"
            expertContent={
              <p>Moderate Resolution Imaging Spectroradiometer 250m resolution. Winter fallow periods expose vulnerable topsoil to wind erosion.</p>
            }
          >
            <div className="h-16 w-full flex items-center justify-between p-3 rounded bg-leaf/10 border border-leaf/20 text-xs">
              <div className="flex items-center gap-2 text-leaf font-semibold">
                <span className="w-3 h-3 rounded-full bg-leaf flex-shrink-0" />
                <Sprout className="w-5 h-5" />
                <span>
                  {locale === "bn" ? "বর্ষার আমন ধান সবচেয়ে সতেজ থাকে" : "Peak Canopy Health: Kharif-2 Aman Rice"}
                </span>
              </div>
              <span className="font-mono font-bold text-leaf">
                {locale === "bn" ? "+৮% অগ্রগতি" : "+8% vs baseline"}
              </span>
            </div>
          </DataCard>

          {/* Card 5: Soil Properties Baseline */}
          <DataCard
            title={locale === "bn" ? "মাটির পুষ্টি ও জৈব পদার্থ" : "Soil Chemistry & Organic Matter"}
            statement={
              locale === "bn"
                ? "মাটিতে জৈব পদার্থ কম (০.৬৮%) – ডাল জাতীয় ফসল দিয়ে মাটির উর্বরতা বাড়ান।"
                : "Topsoil organic carbon is severely depleted at 0.68%, demanding legume nitrogen fixation."
            }
            metricValue={toBengaliNumerals("0.68", locale)}
            metricUnit={locale === "bn" ? "% জৈব কার্বন (লক্ষ্য: > ১.৫%)" : "% Organic Carbon (Target > 1.5%)"}
            changeNote={locale === "bn" ? "(উর্বরতা বাড়ানো জরুরি)" : "(Target: > 1.5%)"}
            source="ISRIC SoilGrids 250m / SRDI"
            updatedAt="2024-10-15"
            state="sample"
            tableData={[
              { label: "Organic Carbon (SOC)", value: "0.68%" },
              { label: "Soil pH (H₂O)", value: "5.8 (Mildly acidic)" },
              { label: "Texture Class", value: "Sandy Loam" },
              { label: "Cation Exchange (CEC)", value: "14.2 cmol/kg" },
            ]}
            expertContent={
              <p>Barind Tract weathered Pleistocene red-brown terrace soil. Low clay content accelerates moisture loss.</p>
            }
          >
            {/* Simple View Traffic Light */}
            <div className="p-3 rounded bg-red-500/10 border border-red-500/30 text-xs text-primary flex items-center gap-2 mb-2">
              <span className="w-3 h-3 rounded-full bg-red-500 flex-shrink-0 animate-pulse" />
              <span className="font-medium">
                {locale === "bn"
                  ? "সতর্কতা (লাল): মাটিতে জৈব পদার্থ কম – মুগ ডাল বা মসুর চাষ করলে প্রাকৃতিক নাইট্রোজেন যোগ হবে।"
                  : "Critical (Red): Soil carbon is low – plant mungbean or lentil to fix atmospheric nitrogen."}
              </span>
            </div>

            {viewMode === "expert" && (
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-2.5 rounded bg-bg border border-border">
                  <span className="text-[10px] text-secondary uppercase font-bold block">Soil pH</span>
                  <span className="font-mono text-base font-bold text-primary">5.8</span>
                  <span className="text-[10px] text-muted block">Slightly acidic</span>
                </div>
                <div className="p-2.5 rounded bg-bg border border-border">
                  <span className="text-[10px] text-secondary uppercase font-bold block">Soil Texture</span>
                  <span className="font-mono text-base font-bold text-primary">Sandy Loam</span>
                  <span className="text-[10px] text-muted block">Rapid percolation</span>
                </div>
              </div>
            )}
          </DataCard>
        </div>

        {/* Right Rail: Location Summary & Quick Action */}
        <aside className="lg:col-span-4 sticky top-28 space-y-6">
          <div className="p-5 rounded-lg bg-surface border border-border shadow-card space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-water" />
                <h3 className="font-serif font-bold text-base text-primary m-0">
                  {location.name}
                </h3>
              </div>
              <Chip state="sample">Pilot</Chip>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-border/80">
                <span className="text-secondary">{locale === "bn" ? "অক্ষাংশ / দ্রাঘিমাংশ" : "Coordinates"}</span>
                <span className="font-mono font-bold text-primary">
                  {toBengaliNumerals(location.lat, locale)}° N, {toBengaliNumerals(location.lon, locale)}° E
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/80">
                <span className="text-secondary">{locale === "bn" ? "জেলা" : "District"}</span>
                <span className="font-bold text-primary">{location.district}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-secondary">{locale === "bn" ? "পাইলট অঞ্চল" : "Pilot Zone"}</span>
                <span className="font-bold text-leaf">{locale === "bn" ? "বরেন্দ্র ট্র্যাক্ট" : "Barind Tract"}</span>
              </div>
            </div>

            <div className="pt-2">
              <Link href="/plan" className="w-full block">
                <Button variant="primary" size="md" className="w-full justify-center shadow-raised">
                  <span>{locale === "bn" ? "এই জমির ফসল পর্যায় দেখুন" : "View Crop Rotations"}</span>
                  <ArrowRight className="w-4 h-4 ml-1.5 text-forest" />
                </Button>
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
