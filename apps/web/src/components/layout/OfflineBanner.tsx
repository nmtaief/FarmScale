"use client";

import React, { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { WifiOff } from "lucide-react";
import { useAppStore } from "@/lib/store/useAppStore";

export const OfflineBanner: React.FC = () => {
  const t = useTranslations("context");
  const isStoreOffline = useAppStore((state) => state.isOffline);
  const setIsOffline = useAppStore((state) => state.setIsOffline);
  const [browserOffline, setBrowserOffline] = useState(false);

  useEffect(() => {
    // Check initial browser status
    if (typeof navigator !== "undefined") {
      setBrowserOffline(!navigator.onLine);
    }

    const handleOnline = () => {
      setBrowserOffline(false);
      setIsOffline(false);
    };

    const handleOffline = () => {
      setBrowserOffline(true);
      setIsOffline(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [setIsOffline]);

  const showBanner = browserOffline || isStoreOffline;

  if (!showBanner) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="w-full bg-heat/15 border-b border-heat/30 text-heat py-1.5 px-4 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
    >
      <WifiOff className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
      <span>{t("offlineNotice")}</span>
    </div>
  );
};
