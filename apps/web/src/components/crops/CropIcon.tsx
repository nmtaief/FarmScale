import React from "react";

export type CropType =
  | "potato"
  | "mungbean"
  | "rice"
  | "mustard"
  | "lentil"
  | "wheat"
  | "boro_rice"
  | "aus_rice"
  | "aman_rice"
  | string;

export const CROP_NAMES: Record<"bn" | "en", Record<string, string>> = {
  bn: {
    potato: "আলু",
    mungbean: "মুগ",
    rice: "আমন ধান",
    mustard: "সরিষা",
    lentil: "মসুর",
    wheat: "গম",
    boro_rice: "বোরো ধান",
    aus_rice: "আউশ ধান",
    aman_rice: "আমন ধান",
    fallow: "পতিত",
  },
  en: {
    potato: "Potato",
    mungbean: "Mungbean",
    rice: "Aman rice",
    mustard: "Mustard",
    lentil: "Lentil",
    wheat: "Wheat",
    boro_rice: "Boro rice",
    aus_rice: "Aus rice",
    aman_rice: "Aman rice",
    fallow: "Fallow",
  },
};

const CROP_BG: Record<string, string> = {
  potato: "#F6E7CF",
  mungbean: "#DDEFD8",
  rice: "#FBEFC2",
  mustard: "#FFF4B8",
  lentil: "#F8DFCB",
  wheat: "#FFF4B8",
  boro_rice: "#FBEFC2",
  aus_rice: "#FBEFC2",
  aman_rice: "#FBEFC2",
  fallow: "#EAEAEA",
};

export function normalizeCropKey(raw: string): string {
  const k = raw.toLowerCase().trim();
  if (k.includes("potato") || k.includes("আলু")) return "potato";
  if (k.includes("mung") || k.includes("মুগ")) return "mungbean";
  if (k.includes("mustard") || k.includes("সরিষা")) return "mustard";
  if (k.includes("lentil") || k.includes("মসুর")) return "lentil";
  if (k.includes("wheat") || k.includes("গম")) return "wheat";
  if (k.includes("boro") || k.includes("বোরো")) return "rice";
  if (k.includes("aus") || k.includes("আউশ")) return "rice";
  if (k.includes("aman") || k.includes("আমন") || k.includes("rice") || k.includes("ধান")) return "rice";
  return k;
}

interface CropIconProps {
  crop: CropType;
  size?: number;
  className?: string;
  showName?: boolean;
  lang?: "bn" | "en";
}

export const CropIcon: React.FC<CropIconProps> = ({
  crop,
  size = 48,
  className = "",
  showName = false,
  lang = "bn",
}) => {
  const normalized = normalizeCropKey(crop);
  const bg = CROP_BG[normalized] || "#EEF3EA";
  const name =
    CROP_NAMES[lang][normalized] ||
    CROP_NAMES[lang][crop] ||
    crop;

  const renderGraphic = () => {
    switch (normalized) {
      case "rice":
        return (
          <>
            <path
              d="M24 42V20"
              stroke="#8a6a00"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <g fill="#E0A800">
              <ellipse cx="24" cy="11" rx="3" ry="5" />
              <ellipse
                cx="18"
                cy="16"
                rx="3"
                ry="5"
                transform="rotate(-25 18 16)"
              />
              <ellipse
                cx="30"
                cy="16"
                rx="3"
                ry="5"
                transform="rotate(25 30 16)"
              />
              <ellipse
                cx="17"
                cy="24"
                rx="3"
                ry="5"
                transform="rotate(-35 17 24)"
              />
              <ellipse
                cx="31"
                cy="24"
                rx="3"
                ry="5"
                transform="rotate(35 31 24)"
              />
            </g>
          </>
        );

      case "mustard":
        return (
          <>
            <path
              d="M24 42V16M24 32l-7-6M24 27l7-6"
              stroke="#3d7a3d"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <g fill="#F2B800">
              <circle cx="24" cy="11" r="4.5" />
              <circle cx="15" cy="21" r="4" />
              <circle cx="33" cy="17" r="4" />
              <circle cx="19" cy="15" r="3.5" />
            </g>
          </>
        );

      case "potato":
        return (
          <>
            <ellipse
              cx="24"
              cy="26"
              rx="15"
              ry="10.5"
              fill="#C9954B"
              transform="rotate(-15 24 26)"
            />
            <g fill="#8a5a1f">
              <circle cx="18" cy="24" r="1.5" />
              <circle cx="27" cy="29" r="1.5" />
              <circle cx="31" cy="23" r="1.5" />
            </g>
          </>
        );

      case "lentil":
        return (
          <g fill="#D9772B">
            <ellipse cx="17" cy="26" rx="8.5" ry="5.5" />
            <ellipse cx="31" cy="21" rx="8.5" ry="5.5" />
            <ellipse cx="27" cy="33" rx="8.5" ry="5.5" />
          </g>
        );

      case "mungbean":
      default:
        return (
          <>
            <path
              d="M9 35C15 14 32 9 41 14C35 33 20 41 9 35Z"
              fill="#5FA35A"
            />
            <g fill="#2F6B34">
              <circle cx="19" cy="28" r="2.3" />
              <circle cx="25" cy="24" r="2.3" />
              <circle cx="31" cy="20" r="2.3" />
            </g>
          </>
        );
    }
  };

  const svg = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      aria-hidden="true"
      className="block mx-auto flex-shrink-0"
    >
      <rect width="48" height="48" rx="14" fill={bg} />
      {renderGraphic()}
    </svg>
  );

  if (showName) {
    return (
      <div className={`crop text-center ${className}`}>
        {svg}
        <span className="block mt-1 text-sm font-medium leading-tight">
          {name}
        </span>
      </div>
    );
  }

  return svg;
};

