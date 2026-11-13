"use client";

import React from "react";
import { Link, usePathname } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { Home, Activity, Wheat, MoreHorizontal } from "lucide-react";

export const BottomTabBar: React.FC = () => {
  const t = useTranslations("nav");
  const pathname = usePathname();

  const tabs = [
    { href: "/", label: t("home"), icon: Home },
    { href: "/dashboard", label: t("myField"), icon: Activity },
    { href: "/crops", label: t("crops"), icon: Wheat },
    { href: "/more", label: t("more"), icon: MoreHorizontal },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-md border-t border-border pb-safe transition-colors shadow-sheet"
      aria-label="Mobile Bottom Navigation"
    >
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive =
            tab.href === "/"
              ? pathname === "/"
              : pathname.startsWith(tab.href);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center justify-center flex-1 h-full min-h-[48px] min-w-[48px] transition-colors rounded-sm touch-target ${
                isActive
                  ? "text-forest dark:text-gold font-bold"
                  : "text-secondary hover:text-primary"
              }`}
            >
              <span
                className={`p-1 rounded-full transition-transform ${
                  isActive ? "bg-gold text-forest shadow-xs scale-105" : ""
                }`}
              >
                <Icon className="w-5 h-5" aria-hidden="true" />
              </span>
              <span className="text-[11px] leading-tight mt-0.5 tracking-tight font-medium">
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
