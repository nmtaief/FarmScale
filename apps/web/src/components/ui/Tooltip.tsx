"use client";

import React, { useState, useRef, useEffect, useId } from "react";
import { Info } from "lucide-react";
import { clsx } from "clsx";

export interface TooltipProps {
  content: React.ReactNode;
  children?: React.ReactNode;
  term?: string;
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  term,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLSpanElement>(null);
  const id = useId();

  // Close on Escape or click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <span
      ref={containerRef}
      className={clsx("relative inline-flex items-center", className)}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
      onFocus={() => setIsOpen(true)}
      onBlur={() => setIsOpen(false)}
    >
      {children ? (
        <span
          className="inline-flex items-center cursor-help"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-describedby={isOpen ? id : undefined}
        >
          {children}
        </span>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="inline-flex items-center gap-1 text-inherit underline decoration-dotted underline-offset-4 cursor-help touch-target min-h-6 min-w-6 p-0.5 rounded focus-visible:ring-2 focus-visible:ring-gold"
          aria-describedby={isOpen ? id : undefined}
          aria-expanded={isOpen}
        >
          <span>{term}</span>
          <Info className="w-3.5 h-3.5 text-secondary inline-block flex-shrink-0" />
        </button>
      )}

      {isOpen && (
        <span
          id={id}
          role="tooltip"
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-64 max-w-[90vw] p-3 text-xs leading-relaxed text-forest bg-white dark:bg-card dark:text-textPrimary rounded-sm shadow-raised border border-border pointer-events-none"
        >
          {content}
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-white dark:border-t-card" />
        </span>
      )}
    </span>
  );
};
