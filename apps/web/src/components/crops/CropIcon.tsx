import React from "react";

export type CropType =
  | "potato"
  | "mungbean"
  | "rice"
  | "mustard"
  | "lentil"
  | "wheat"
  | "maize"
  | "onion"
  | "chickpea"
  | "sesame"
  | "groundnut"
  | "jute"
  | "garlic"
  | "chili"
  | "watermelon"
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
    maize: "ভুট্টা",
    onion: "পেঁয়াজ",
    chickpea: "ছোলা",
    sesame: "তিল",
    groundnut: "চিনাবাদাম",
    jute: "পাট",
    garlic: "রসুন",
    chili: "মরিচ",
    watermelon: "তরমুজ",
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
    maize: "Maize/Corn",
    onion: "Onion",
    chickpea: "Chickpea",
    sesame: "Sesame",
    groundnut: "Groundnut",
    jute: "Jute",
    garlic: "Garlic",
    chili: "Chili",
    watermelon: "Watermelon",
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
  wheat: "#FFF0BD",
  maize: "#FFF3B3",
  onion: "#F8D7DA",
  chickpea: "#EEDBCE",
  sesame: "#E4EDE2",
  groundnut: "#F5E4D3",
  jute: "#E8F0DC",
  garlic: "#FAF5E4",
  chili: "#FEE2E2",
  watermelon: "#DCFCE7",
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
  if (k.includes("maize") || k.includes("corn") || k.includes("ভুট্টা")) return "maize";
  if (k.includes("onion") || k.includes("পেঁয়াজ") || k.includes("পিয়াজ")) return "onion";
  if (k.includes("chickpea") || k.includes("gram") || k.includes("ছোলা")) return "chickpea";
  if (k.includes("sesame") || k.includes("til") || k.includes("তিল")) return "sesame";
  if (k.includes("peanut") || k.includes("groundnut") || k.includes("বাদাম")) return "groundnut";
  if (k.includes("jute") || k.includes("পাট")) return "jute";
  if (k.includes("garlic") || k.includes("রসুন")) return "garlic";
  if (k.includes("chili") || k.includes("মরিচ")) return "chili";
  if (k.includes("watermelon") || k.includes("তরমুজ")) return "watermelon";
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

      case "wheat":
        return (
          <>
            <path
              d="M24 42V15"
              stroke="#A87E00"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <g fill="#E6AE10">
              <ellipse cx="24" cy="10" rx="3" ry="5.5" />
              <ellipse cx="19" cy="17" rx="3" ry="5" transform="rotate(-30 19 17)" />
              <ellipse cx="29" cy="17" rx="3" ry="5" transform="rotate(30 29 17)" />
              <ellipse cx="19" cy="25" rx="3" ry="5" transform="rotate(-30 19 25)" />
              <ellipse cx="29" cy="25" rx="3" ry="5" transform="rotate(30 29 25)" />
            </g>
          </>
        );

      case "maize":
        return (
          <>
            <path d="M18 38C18 38 21 28 24 20C27 28 30 38 30 38" stroke="#4D7C0F" strokeWidth="2.5" fill="none" />
            <path d="M19 14C19 8 29 8 29 14C29 24 27 30 24 32C21 30 19 24 19 14Z" fill="#EAB308" />
            <g fill="#CA8A04">
              <circle cx="22" cy="14" r="1.3" />
              <circle cx="26" cy="14" r="1.3" />
              <circle cx="24" cy="18" r="1.3" />
              <circle cx="22" cy="22" r="1.3" />
              <circle cx="26" cy="22" r="1.3" />
              <circle cx="24" cy="26" r="1.3" />
            </g>
          </>
        );

      case "onion":
        return (
          <>
            <path d="M24 10V18" stroke="#15803D" strokeWidth="2" strokeLinecap="round" />
            <path d="M20 12L24 18L28 12" stroke="#15803D" strokeWidth="1.5" strokeLinecap="round" />
            <ellipse cx="24" cy="28" rx="12" ry="11" fill="#C2410C" />
            <ellipse cx="24" cy="28" rx="8" ry="10" fill="#EA580C" />
            <path d="M24 39V42" stroke="#78350F" strokeWidth="1.5" strokeLinecap="round" />
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

      case "chickpea":
        return (
          <g fill="#B45309">
            <ellipse cx="20" cy="25" rx="7.5" ry="8" />
            <ellipse cx="28" cy="23" rx="7" ry="7.5" />
            <path d="M20 17L22 19M28 15L29 17" stroke="#78350F" strokeWidth="1.5" strokeLinecap="round" />
          </g>
        );

      case "sesame":
        return (
          <g fill="#4B5563">
            <ellipse cx="21" cy="22" rx="3.5" ry="5.5" transform="rotate(-15 21 22)" fill="#1F2937" />
            <ellipse cx="27" cy="26" rx="3.5" ry="5.5" transform="rotate(25 27 26)" fill="#374151" />
            <ellipse cx="22" cy="31" rx="3" ry="5" transform="rotate(-35 22 31)" fill="#111827" />
          </g>
        );

      case "groundnut":
        return (
          <g fill="#D97706">
            <ellipse cx="20" cy="25" rx="7" ry="9" />
            <ellipse cx="28" cy="25" rx="7" ry="9" />
            <path d="M20 20C24 22 24 28 20 30M28 20C24 22 24 28 28 30" stroke="#92400E" strokeWidth="1.5" />
          </g>
        );

      case "garlic":
        return (
          <>
            <path d="M24 10V18" stroke="#15803D" strokeWidth="2" strokeLinecap="round" />
            <ellipse cx="24" cy="28" rx="11" ry="10" fill="#FAF5E4" />
            <path d="M18 20C15 25 15 32 18 36M30 20C33 25 33 32 30 36M24 18V38" stroke="#D1C7A7" strokeWidth="1.5" />
          </>
        );

      case "chili":
        return (
          <>
            <path d="M21 12C23 15 24 18 24 20" stroke="#15803D" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M24 20C27 25 28 32 23 38C20 42 16 41 18 36C20 30 22 25 24 20Z" fill="#DC2626" />
          </>
        );

      case "watermelon":
        return (
          <>
            <ellipse cx="24" cy="26" rx="14" ry="11" fill="#15803D" />
            <ellipse cx="24" cy="26" rx="11" ry="8" fill="#16A34A" />
            <path d="M14 26C18 32 30 32 34 26" stroke="#166534" strokeWidth="2" strokeDasharray="3 3" />
          </>
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
