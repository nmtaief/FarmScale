"use client";

import React, { useId } from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export interface SliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  icon?: React.ReactNode;
  accentColor?: "water" | "leaf" | "gold" | "heat";
  description?: string;
  className?: string;
}

export const Slider: React.FC<SliderProps> = ({
  label,
  value,
  onChange,
  min = 0,
  max = 10,
  step = 1,
  unit = "",
  icon,
  accentColor = "gold",
  description,
  className,
}) => {
  const id = useId();

  const percentage = ((value - min) / (max - min)) * 100;

  const trackBgColors = {
    water: "bg-water",
    leaf: "bg-leaf",
    gold: "bg-gold",
    heat: "bg-heat",
  };

  return (
    <div className={twMerge(clsx("flex flex-col gap-2 w-full", className))}>
      <div className="flex items-center justify-between">
        <label
          htmlFor={id}
          className="flex items-center gap-2 text-sm font-semibold text-primary cursor-pointer"
        >
          {icon && <span className="text-secondary">{icon}</span>}
          <span>{label}</span>
        </label>
        <span
          className="font-mono text-base font-bold text-primary px-2.5 py-0.5 rounded-sm bg-surface border border-border"
          aria-live="polite"
        >
          {value}
          {unit}
        </span>
      </div>

      {description && (
        <p className="text-xs text-secondary m-0">{description}</p>
      )}

      <div className="relative flex items-center w-full min-h-[44px]">
        {/* Track background */}
        <div className="absolute w-full h-2 rounded-full bg-border overflow-hidden">
          <div
            className={clsx("h-full transition-all duration-100", trackBgColors[accentColor])}
            style={{ width: `${percentage}%` }}
          />
        </div>

        {/* Real accessible input */}
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-11 opacity-0 z-10 cursor-pointer touch-target m-0 focus-visible:outline-none"
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
          aria-label={label}
        />

        {/* Visible 44px thumb indicator that tracks with value */}
        <div
          className="absolute pointer-events-none w-7 h-7 rounded-full bg-surface border-2 border-primary shadow-raised flex items-center justify-center transition-all duration-75"
          style={{
            left: `calc(${percentage}% - 14px)`,
          }}
        >
          <div className={clsx("w-2.5 h-2.5 rounded-full", trackBgColors[accentColor])} />
        </div>
      </div>
    </div>
  );
};
