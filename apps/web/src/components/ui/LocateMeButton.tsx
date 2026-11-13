"use client";

import React, { useState } from "react";
import { useLocale } from "next-intl";
import { Navigation, Loader2, Check, AlertCircle, Info } from "lucide-react";
import { useAppStore, type LocationInfo } from "@/lib/store/useAppStore";
import { requestUserLocation } from "@/lib/location/geolocation";

interface LocateMeButtonProps {
  variant?: "primary" | "secondary" | "icon" | "chip";
  className?: string;
  onLocated?: (location: LocationInfo) => void;
  showLabel?: boolean;
}

export const LocateMeButton: React.FC<LocateMeButtonProps> = ({
  variant = "chip",
  className = "",
  onLocated,
  showLabel = true,
}) => {
  const locale = useLocale();
  const setStoreLocation = useAppStore((s) => s.setLocation);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<"success" | "error" | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [outsideNotice, setOutsideNotice] = useState<string | null>(null);

  const handleLocate = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setLoading(true);
    setFeedback(null);
    setErrorMessage(null);
    setOutsideNotice(null);

    const result = await requestUserLocation(locale);
    setLoading(false);

    if (result.status === "success" && result.location) {
      setStoreLocation(result.location);
      if (onLocated) {
        onLocated(result.location);
      }
      setFeedback("success");

      if (result.outsidePilotNotice) {
        setOutsideNotice(result.outsidePilotNotice);
        setTimeout(() => setOutsideNotice(null), 6000);
      } else {
        setTimeout(() => setFeedback(null), 3000);
      }
    } else {
      setFeedback("error");
      setErrorMessage(result.error || "Location access failed.");
      setTimeout(() => {
        setFeedback(null);
        setErrorMessage(null);
      }, 4500);
    }
  };

  if (variant === "icon") {
    return (
      <div className="relative inline-flex items-center">
        <button
          type="button"
          onClick={handleLocate}
          disabled={loading}
          title={outsideNotice || errorMessage || (locale === "bn" ? "আমার জিপিএস লোকেশন নিন" : "Access device GPS location")}
          aria-label="Access device GPS location"
          className={`p-1.5 rounded-full border transition-all text-xs flex items-center justify-center touch-target min-h-[36px] min-w-[36px] ${
            feedback === "success"
              ? "bg-leaf text-white border-leaf"
              : feedback === "error"
              ? "bg-amber-100 text-amber-800 border-amber-300"
              : "bg-surface text-secondary hover:text-water hover:border-water border-border"
          } ${className}`}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin text-water" />
          ) : feedback === "success" ? (
            <Check className="w-4 h-4" />
          ) : feedback === "error" ? (
            <AlertCircle className="w-4 h-4" />
          ) : (
            <Navigation className="w-4 h-4" />
          )}
        </button>

        {outsideNotice && (
          <div className="absolute right-0 top-full mt-2 z-50 p-3 rounded-lg bg-surface border border-gold shadow-raised text-xs text-primary leading-tight min-w-[240px] max-w-xs animate-in fade-in">
            <div className="flex items-start gap-1.5 font-medium text-amber-800 dark:text-amber-300">
              <Info className="w-4 h-4 flex-shrink-0 text-gold" />
              <span>{outsideNotice}</span>
            </div>
          </div>
        )}

        {errorMessage && (
          <span className="absolute left-0 bottom-full mb-1 z-50 text-[10px] bg-bg/95 border border-border shadow-raised rounded px-2 py-1 text-red-600 whitespace-nowrap">
            {errorMessage}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="relative inline-flex flex-col">
      <button
        type="button"
        onClick={handleLocate}
        disabled={loading}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all touch-target min-h-[36px] ${
          feedback === "success"
            ? "bg-leaf/15 text-leaf border-leaf/40 font-bold"
            : feedback === "error"
            ? "bg-red-50 text-red-700 border-red-200"
            : "bg-surface text-primary border-border hover:border-gold hover:text-primary"
        } ${className}`}
      >
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-water" />
        ) : feedback === "success" ? (
          <Check className="w-3.5 h-3.5 text-leaf" />
        ) : feedback === "error" ? (
          <AlertCircle className="w-3.5 h-3.5 text-red-600" />
        ) : (
          <Navigation className="w-3.5 h-3.5 text-water" />
        )}
        {showLabel && (
          <span>
            {loading
              ? locale === "bn" ? "খোঁজা হচ্ছে..." : "Locating..."
              : feedback === "success"
              ? locale === "bn" ? "শনাক্তকৃত" : "Located"
              : feedback === "error"
              ? locale === "bn" ? "ব্যর্থ" : "Retry"
              : locale === "bn" ? "আমার অবস্থান" : "Use My Location"}
          </span>
        )}
      </button>

      {outsideNotice && (
        <div className="absolute top-full mt-2 left-0 z-50 p-3 rounded-lg bg-surface border border-gold shadow-raised text-xs text-primary leading-tight min-w-[240px] max-w-xs animate-in fade-in">
          <div className="flex items-start gap-1.5 font-medium text-amber-800 dark:text-amber-300">
            <Info className="w-4 h-4 flex-shrink-0 text-gold" />
            <span>{outsideNotice}</span>
          </div>
        </div>
      )}
    </div>
  );
};
