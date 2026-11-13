"use client";

import React, { useTransition } from "react";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/routing";
import { Globe } from "lucide-react";

export const LanguageSwitcher: React.FC = () => {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const languages = [
    { code: "bn", label: "বাংলা" },
    { code: "en", label: "English" },
  ] as const;

  const handleSelect = (nextLocale: "en" | "bn") => {
    if (nextLocale === locale) return;
    startTransition(() => {
      router.replace(pathname, { locale: nextLocale });
    });
  };

  return (
    <div className="relative inline-flex items-center gap-1 bg-surface border border-border rounded-full p-0.5">
      <Globe className="w-4 h-4 ml-2 text-secondary flex-shrink-0" aria-hidden="true" />
      <span className="sr-only">Switch language</span>
      <div className="flex items-center gap-0.5" role="group" aria-label="Language selection">
        {languages.map((lang) => {
          const isActive = locale === lang.code;
          return (
            <button
              key={lang.code}
              type="button"
              disabled={isPending}
              onClick={() => handleSelect(lang.code)}
              aria-pressed={isActive}
              className={`touch-target min-h-[34px] px-2.5 py-1 text-xs font-medium rounded-full transition-all duration-150 ${
                isActive
                  ? "bg-gold text-forest font-semibold shadow-sm"
                  : "text-secondary hover:text-primary hover:bg-surface-hover"
              }`}
            >
              {lang.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
