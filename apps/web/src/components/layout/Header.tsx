"use client";

import React from "react";
import { Link, usePathname } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { MapPin } from "lucide-react";
import { FarmScaleLogo } from "@/components/brand/FarmScaleLogo";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { ThemeToggle } from "./ThemeToggle";
import { useAppStore } from "@/lib/store/useAppStore";

export const Header: React.FC = () => {
  const t = useTranslations("nav");
  const tCommon = useTranslations("common");
  const pathname = usePathname();
  const location = useAppStore((state) => state.location);

  const navLinks = [
    { href: "/", label: t("home") },
    { href: "/explore", label: t("explore") },
    { href: "/dashboard", label: t("dashboard") },
    { href: "/plan", label: t("plan") },
    { href: "/crops", label: t("crops") },
    { href: "/more", label: t("more") },
  ];

  const isHome = pathname === "/" || pathname === "";
  if (isHome) return null;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-bg/95 backdrop-blur-md transition-colors">
      <div className="max-w-[560px] md:max-w-content mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo & Location Indicator */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2.5 text-primary font-bold text-xl tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold rounded-sm px-1 py-0.5"
          >
            <FarmScaleLogo size={36} />
            <span className="font-bold text-[22px] tracking-tight">{tCommon("appName")}</span>
          </Link>

          {/* Location Chip on secondary pages */}
          {!isHome && (
            <Link
              href="/explore"
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-surface text-secondary border border-border rounded-full hover:border-gold transition-colors focus-visible:ring-2 focus-visible:ring-gold"
              title="Current selected location"
            >
              <MapPin className="w-3.5 h-3.5 text-water" aria-hidden="true" />
              <span className="font-sans font-medium text-primary mr-1.5">
                {location.district}
              </span>
              <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 bg-leaf/10 text-leaf rounded-full font-bold">
                Pilot
              </span>
            </Link>
          )}
        </div>

        {/* Desktop Top Navigation (>= 900px) on secondary pages only */}
        {!isHome && (
          <nav
            className="hidden md:flex items-center gap-1"
            aria-label="Main Navigation"
          >
            {navLinks.map((link) => {
              const isActive =
                link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`touch-target px-3 py-2 rounded-sm text-sm font-medium transition-colors ${
                    isActive
                      ? "text-primary font-semibold border-b-2 border-gold"
                      : "text-secondary hover:text-primary hover:bg-surface"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        )}

        {/* Right side controls: Language switcher and Theme toggle (Max 4 items in header) */}
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
};
