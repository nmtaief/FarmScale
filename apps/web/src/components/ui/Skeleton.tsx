"use client";

import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  shape?: "rectangle" | "circle" | "text";
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  shape = "rectangle",
  ...props
}) => {
  const shapeStyles = {
    rectangle: "rounded-sm",
    circle: "rounded-full",
    text: "rounded h-4 w-full",
  };

  return (
    <div
      aria-hidden="true"
      className={twMerge(
        clsx(
          "bg-border/60 animate-pulse motion-reduce:animate-none",
          shapeStyles[shape],
          className
        )
      )}
      {...props}
    />
  );
};
