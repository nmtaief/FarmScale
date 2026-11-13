"use client";

import React, { forwardRef } from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
  disabledReason?: string;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className,
      variant = "primary",
      size = "md",
      disabled,
      disabledReason,
      type = "button",
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "touch-target font-sans font-semibold rounded-sm transition-all duration-150 inline-flex items-center justify-center gap-2 select-none focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-gold focus-visible:ring-offset-2";

    const sizeStyles = {
      sm: "h-10 px-3 text-sm min-w-[44px]",
      md: "h-11 px-4 text-base min-w-[44px]",
      lg: "h-12 px-6 text-lg min-w-[48px]",
    };

    const variantStyles = {
      // Primary: gold fill, forest text, weight 600. Pressed: deeper amber and moves 1px
      primary:
        "bg-gold text-forest shadow-sm hover:brightness-105 active:bg-gold-pressed active:translate-y-px",
      // Secondary: white fill, 1.5px leaf border, leaf text
      secondary:
        "bg-surface text-leaf border-[1.5px] border-leaf hover:bg-surface-hover active:translate-y-px",
      // Ghost: no fill, forest text, underline on hover
      ghost:
        "bg-transparent text-primary hover:underline underline-offset-4 active:translate-y-px",
      outline:
        "bg-transparent text-primary border border-border hover:bg-surface-hover active:translate-y-px",
    };

    const disabledStyles =
      "disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:shadow-none disabled:transform-none";

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled}
        title={disabled && disabledReason ? disabledReason : undefined}
        aria-disabled={disabled}
        className={twMerge(
          clsx(
            baseStyles,
            sizeStyles[size],
            variantStyles[variant],
            disabledStyles,
            className
          )
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
