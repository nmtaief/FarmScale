"use client";

import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { AlertCircle, CheckCircle2, Clock, HelpCircle } from "lucide-react";

export type ChipState = "sample" | "live" | "unavailable" | "stale" | "default";

export interface ChipProps extends React.HTMLAttributes<HTMLSpanElement> {
  state?: ChipState;
  selected?: boolean;
  interactive?: boolean;
  icon?: React.ReactNode;
}

export const Chip: React.FC<ChipProps> = ({
  children,
  className,
  state = "default",
  selected = false,
  interactive = false,
  icon,
  ...props
}) => {
  const stateStyles = {
    // Visible "Sample data" tag - amber bordered tag
    sample:
      "bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950/50 dark:text-amber-200 dark:border-amber-700/60",
    live: "bg-leaf/15 text-leaf border border-leaf/30 dark:bg-leaf/25 dark:text-leaf dark:border-leaf/50",
    unavailable:
      "bg-neutral-150 text-neutral-600 border border-neutral-300 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700",
    stale:
      "bg-heat/15 text-heat border border-heat/30 dark:bg-heat/20 dark:text-heat",
    default:
      "bg-surface text-primary border border-border hover:border-border-strong",
  };

  const selectedStyles = selected
    ? "bg-gold text-forest border-gold font-semibold shadow-sm"
    : "";

  const interactiveStyles = interactive
    ? "cursor-pointer select-none active:scale-98 min-h-[44px] min-w-[44px] touch-target"
    : "min-h-[26px]";

  const defaultIcon =
    state === "sample" ? (
      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
    ) : state === "live" ? (
      <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
    ) : state === "stale" ? (
      <Clock className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
    ) : state === "unavailable" ? (
      <HelpCircle className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
    ) : null;

  return (
    <span
      className={twMerge(
        clsx(
          "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium tracking-wide transition-colors",
          stateStyles[state],
          selectedStyles,
          interactiveStyles,
          className
        )
      )}
      {...props}
    >
      {icon || defaultIcon}
      <span>{children}</span>
    </span>
  );
};
