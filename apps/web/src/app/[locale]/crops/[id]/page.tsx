import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { ArrowLeft, Droplets, Sprout, DollarSign, Calendar, ExternalLink } from "lucide-react";
import { SAMPLE_CROPS } from "@farmscale/scoring";
import { routing } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";

export function generateStaticParams() {
  const params: { locale: string; id: string }[] = [];
  for (const locale of routing.locales) {
    for (const id of Object.keys(SAMPLE_CROPS)) {
      params.push({ locale, id });
    }
  }
  return params;
}

interface CropDetailPageProps {
  params: Promise<{ locale: string; id: string }>;
}

export async function generateMetadata({ params }: CropDetailPageProps): Promise<Metadata> {
  const { id, locale } = await params;
  const crop = SAMPLE_CROPS[id];
  const tCrops = await getTranslations({ locale, namespace: "crops" });
  const cropName = crop ? tCrops(crop.id) : id;
  return {
    title: `${cropName} – Agronomic Traits | FarmScale`,
    description: `${cropName} water efficiency, soil impact, and rotation traits for Barind delta farming.`,
    alternates: {
      canonical: `https://farmscale-web.vercel.app/${locale}/crops/${id}`,
      languages: {
        en: `https://farmscale-web.vercel.app/en/crops/${id}`,
        bn: `https://farmscale-web.vercel.app/bn/crops/${id}`,
      },
    },
  };
}

export default async function CropDetailPage({ params }: CropDetailPageProps) {
  const { id, locale } = await params;
  const crop = SAMPLE_CROPS[id];

  if (!crop) {
    notFound();
  }

  const tCrops = await getTranslations({ locale, namespace: "crops" });
  const tTraits = await getTranslations({ locale, namespace: "cropTraits" });
  const tSeasons = await getTranslations({ locale, namespace: "seasons" });
  const tCommon = await getTranslations({ locale, namespace: "common" });

  const cropName = tCrops(crop.id);
  const seasonName = tSeasons(crop.season);
  const soilBenefitDesc = tTraits(`soilBenefit.${crop.id}`);
  const waterNeedDesc = tTraits(`waterNeed.${crop.id}`);

  const traits = [
    {
      name: tTraits("waterEfficiency"),
      value: `${crop.waterNeedRating} / 10`,
      desc: waterNeedDesc,
      source: "FAO-56 Irrigation and Drainage / BARI Agronomy Division",
      icon: Droplets,
      color: "text-water",
    },
    {
      name: tTraits("soilRegeneration"),
      value: `${crop.soilBenefitRating} / 10`,
      desc: soilBenefitDesc,
      source: "BARI Agronomy Division / Soil Science Division",
      icon: Sprout,
      color: "text-leaf",
    },
    {
      name: tTraits("incomeMargin"),
      value: `${crop.incomeRating} / 10`,
      desc: "Gross market price relative to local production input costs in Rajshahi.",
      source: "Department of Agricultural Marketing (DAM) / BARI",
      icon: DollarSign,
      color: "text-gold-text",
    },
    {
      name: tTraits("growthDuration"),
      value: seasonName,
      desc: "Optimal planting window in Bangladesh agro-ecological calendar.",
      source: "Bangladesh Agricultural Research Institute (BARI)",
      icon: Calendar,
      color: "text-primary",
    },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-16">
      {/* Honest sample notice banner */}
      <div className="p-3.5 rounded-md bg-leaf/10 border border-leaf/30 text-xs text-primary leading-relaxed">
        <span className="font-bold text-leaf mr-1.5">পাইলট প্রাক্কলন:</span>
        {tCommon("honestSampleBanner")}
      </div>

      {/* Back Link */}
      <Link href="/crops">
        <Button variant="ghost" size="sm" className="gap-2 -ml-2">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Crop Library</span>
        </Button>
      </Link>

      {/* Main Header */}
      <div className="p-6 rounded-lg bg-surface border border-border shadow-card space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-secondary px-2.5 py-1 rounded bg-bg border border-border">
            {seasonName}
          </span>
          <Chip state="sample">Sample crop traits</Chip>
        </div>

        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-primary m-0">
          {cropName}
        </h1>

        <p className="text-secondary text-sm leading-relaxed m-0">
          Crop trait profiles are evaluated by the FarmScale scoring engine when ranking rotations for the Barind delta. Every trait is accompanied by a transparent citation and sample data tag.
        </p>
      </div>

      {/* Individual Trait Cards */}
      <div className="space-y-4">
        <h2 className="text-lg font-serif font-bold text-primary">
          Agronomic Profile & Telemetry
        </h2>

        {traits.map((trait) => {
          const Icon = trait.icon;
          return (
            <div
              key={trait.name}
              className="p-5 rounded-md bg-surface border border-border shadow-xs space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className={`w-5 h-5 ${trait.color}`} />
                  <h3 className="font-serif font-bold text-base text-primary m-0">
                    {trait.name}
                  </h3>
                </div>
                <span className="font-mono font-bold text-primary text-sm px-2 py-0.5 rounded bg-bg border border-border">
                  {trait.value}
                </span>
              </div>

              <p className="text-secondary text-sm leading-relaxed m-0">
                {trait.desc}
              </p>

              <div className="flex items-center justify-between text-xs text-muted pt-2 border-t border-border/80">
                <span>Source: {trait.source}</span>
                <Chip state="sample">Sample</Chip>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Navigation Back to Planner */}
      <div className="pt-4 flex items-center justify-between">
        <Link href="/crops">
          <Button variant="outline" size="sm">
            <span>All Crops</span>
          </Button>
        </Link>
        <Link href="/plan">
          <Button variant="primary" size="sm">
            <span>Test in Rotation Planner</span>
          </Button>
        </Link>
      </div>
    </div>
  );
}
