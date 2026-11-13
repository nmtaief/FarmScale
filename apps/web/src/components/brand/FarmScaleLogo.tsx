import React from "react";

interface FarmScaleLogoProps {
  size?: number;
  className?: string;
}

export const FarmScaleLogo: React.FC<FarmScaleLogoProps> = ({
  size = 38,
  className = "",
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      aria-hidden="true"
      className={className}
    >
      <rect width="48" height="48" rx="13" fill="#1B3B2B" />
      <path
        d="M24 38V22"
        stroke="#E0A800"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <path
        d="M24 25C24 17 18 13 11 14C11 21 16 26 24 25Z"
        fill="#7DBB6E"
      />
      <path
        d="M24 21C24 13 29 9 37 10C37 17 32 22 24 21Z"
        fill="#E0A800"
      />
      <path
        d="M14 38H34"
        stroke="#7DBB6E"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
    </svg>
  );
};

