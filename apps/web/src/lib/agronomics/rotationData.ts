export type LandUnit = "bigha" | "decimal" | "acre" | "hectare";

export interface RotationAgronomics {
  waterSavingHeadlineBn: string;
  waterSavingHeadlineEn: string;
  waterSavingPercent: number;
  costPerBigha: number; // in BDT
  profitPerBigha: number; // in BDT
  yieldSummaryBn: string;
  yieldSummaryEn: string;
  boroProfitComparisonBn: string;
  boroProfitComparisonEn: string;
  tradeoffBn: string;
  tradeoffEn: string;
  nextSteps: {
    sowingBn: string;
    sowingEn: string;
    varietyBn: string;
    varietyEn: string;
    irrigationBn: string;
    irrigationEn: string;
  };
}

export const ROTATION_AGRONOMICS: Record<string, RotationAgronomics> = {
  "mustard-mungbean-aman": {
    waterSavingHeadlineBn: "পানি ৬০% কম লাগবে",
    waterSavingHeadlineEn: "Uses 60% less water",
    waterSavingPercent: 60,
    costPerBigha: 22500,
    profitPerBigha: 28000,
    yieldSummaryBn: "সরিষা ৪–৫ মণ + মুগ ৩–৪ মণ + আমন ১৪–১৬ মণ",
    yieldSummaryEn: "Mustard 4–5 maunds + Mungbean 3–4 maunds + Aman 14–16 maunds",
    boroProfitComparisonBn: "বোরো ধানের চেয়ে লাভ প্রায় ৯,০০০ টাকা বেশি এবং গভীর সেচের খরচ ৬০% কমবে।",
    boroProfitComparisonEn: "Approx 9,000 Tk higher profit than boro, with 60% lower irrigation cost.",
    tradeoffBn: "সরিষা কাটার পর জমি দ্রুত তৈরি করে চৈত্রের মধ্যেই মুগ ডাল বপন সম্পন্ন করতে হবে।",
    tradeoffEn: "Must prepare soil quickly after mustard harvest to sow mungbean within Chaitra.",
    nextSteps: {
      sowingBn: "সরিষা: ১৫ অক্টো–১৫ নভে (কার্তিক); মুগ: মার্চ–এপ্রিল (চৈত্র); আমন: জুলাই–আগস্ট (আষাঢ়)",
      sowingEn: "Mustard: 15 Oct–15 Nov; Mungbean: Mar–Apr; Aman: Jul–Aug",
      varietyBn: "বারি সরিষা-১৪ বা ১৮, বারি মুগ-৬, ব্রি ধান-৮৭",
      varietyEn: "BARI Sarisha-14 or 18, BARI Mung-6, BRRI Dhan-87",
      irrigationBn: "সরিষায় ১–২টি হালকা সেচ, মুগে ১টি সেচ (বোরোর ২০–২৫ সেচের তুলনায় বিশাল সাশ্রয়)",
      irrigationEn: "1–2 irrigations for mustard, 1 for mungbean (vs 20–25 for boro)",
    },
  },
  "wheat-mungbean-aman": {
    waterSavingHeadlineBn: "পানি ৪৫% কম লাগবে",
    waterSavingHeadlineEn: "Uses 45% less water",
    waterSavingPercent: 45,
    costPerBigha: 24000,
    profitPerBigha: 24500,
    yieldSummaryBn: "গম ১২–১৪ মণ + মুগ ৩–৪ মণ + আমন ১৪–১৬ মণ",
    yieldSummaryEn: "Wheat 12–14 maunds + Mungbean 3–4 maunds + Aman 14–16 maunds",
    boroProfitComparisonBn: "বোরোর চেয়ে সেচ খরচ ৪৫% কম; ব্লাস্ট প্রতিরোধী উন্নত জিংক গম ব্যবহারে ঝুঁকি কম।",
    boroProfitComparisonEn: "45% lower irrigation cost than boro; blast-resistant zinc wheat cuts risk.",
    tradeoffBn: "গম কাটতে দেরি হলে মুগ ডাল বপনের সময় কিছুটা কমে যেতে পারে।",
    tradeoffEn: "Late wheat harvest can compress the planting window for kharif-1 mungbean.",
    nextSteps: {
      sowingBn: "গম: ১৫–৩০ নভেম্বর (অগ্রহায়ণ); মুগ: এপ্রিল; আমন: জুলাই–আগস্ট",
      sowingEn: "Wheat: 15–30 Nov; Mungbean: April; Aman: Jul–Aug",
      varietyBn: "বারি গম-৩৩ (ব্লাস্ট প্রতিরোধী, জিংকসমৃদ্ধ), বারি মুগ-৬, ব্রি ধান-৭৫",
      varietyEn: "BARI Gom-33 (blast-resistant, zinc-rich), BARI Mung-6, BRRI Dhan-75",
      irrigationBn: "গমে ২–৩টি নিয়ন্ত্রিত সেচ (মুড়িকাটা ও ফুল আসার সময়ে)",
      irrigationEn: "2–3 scheduled irrigations for wheat (crown root initiation and flowering)",
    },
  },
  "lentil-aus-aman": {
    waterSavingHeadlineBn: "পানি ৫০% কম লাগবে",
    waterSavingHeadlineEn: "Uses 50% less water",
    waterSavingPercent: 50,
    costPerBigha: 21000,
    profitPerBigha: 26000,
    yieldSummaryBn: "মসুর ৩–৪ মণ + আউশ ১০–১২ মণ + আমন ১২–১৪ মণ",
    yieldSummaryEn: "Lentil 3–4 maunds + Aus 10–12 maunds + Aman 12–14 maunds",
    boroProfitComparisonBn: "মসুর ডালে মাটির নাইট্রোজেন বৃদ্ধি পায় এবং বাজারে চড়া মূল্যে বিক্রি করা যায়।",
    boroProfitComparisonEn: "Lentil fixes natural soil nitrogen and commands premium market price.",
    tradeoffBn: "মসুরের জমিতে বৃষ্টির পানি জমলে শিকড় পচে ক্ষতি হতে পারে; পানি নিষ্কাশন ব্যবস্থা ভালো রাখা আবশ্যক।",
    tradeoffEn: "Lentil is vulnerable to waterlogging; adequate surface drainage is essential.",
    nextSteps: {
      sowingBn: "মসুর: নভেম্বর (কার্তিক–অগ্রহায়ণ); আউশ: এপ্রিল–মে (বৈশাখ); আমন: আগস্ট",
      sowingEn: "Lentil: Nov; Aus: Apr–May; Aman: August",
      varietyBn: "বারি মসুর-৮, ব্রি ধান-৪৮ বা ৯৮, ব্রি ধান-৮৭",
      varietyEn: "BARI Masur-8, BRRI Dhan-48 or 98, BRRI Dhan-87",
      irrigationBn: "মসুরে ১টি হালকা সেচ বা মাটির জো রসে চাষ; আউশে বৃষ্টি ঘাটতিতে সম্পূরক সেচ",
      irrigationEn: "1 light irrigation for lentil; supplementary for aus if dry",
    },
  },
  "boro-fallow-aman": {
    waterSavingHeadlineBn: "পানি সাশ্রয় হয় না (অতিরিক্ত সেচ)",
    waterSavingHeadlineEn: "Zero water savings (Heavy irrigation)",
    waterSavingPercent: 0,
    costPerBigha: 28000,
    profitPerBigha: 16500,
    yieldSummaryBn: "বোরো ২০–২৪ মণ + আমন ১৪–১৬ মণ",
    yieldSummaryEn: "Boro 20–24 maunds + Aman 14–16 maunds",
    boroProfitComparisonBn: "প্রচলিত পদ্ধতি; তবে গভীর নলকূপের ভারী বিদ্যুৎ ও ডিজেল খরচের কারণে লাভ কম থাকে।",
    boroProfitComparisonEn: "Traditional practice; heavy electricity and diesel fuel costs lower net margins.",
    tradeoffBn: "টানা নিমজ্জিত চাষে বরেন্দ্রর ভূগর্ভস্থ পানি প্রতি বছর ১-২ ফুট নিচে নামছে এবং ভবিষ্যতে গভীর নলকূপ অচল হওয়ার ঝুঁকি রয়েছে।",
    tradeoffEn: "Lowers regional aquifer by 1-2 ft annually, risking severe long-term irrigation depletion.",
    nextSteps: {
      sowingBn: "বোরো: ডিসেম্বর–জানুয়ারি (পৌষ); আমন: জুলাই–আগস্ট (আষাঢ়)",
      sowingEn: "Boro: Dec–Jan; Aman: Jul–Aug",
      varietyBn: "ব্রি ধান-২৯ / ব্রি ধান-৮৯, ব্রি ধান-৪৯",
      varietyEn: "BRRI Dhan-29 / 89, BRRI Dhan-49",
      irrigationBn: "বোরো মৌসুমে ২০–২৫টি টানা গভীর সেচ প্রয়োজন",
      irrigationEn: "20–25 heavy continuous irrigations required during winter",
    },
  },
};

/**
 * Scale figures based on land unit:
 * 1 Bigha = 33 Decimal
 * 1 Decimal = 1/33 Bigha (~0.0303)
 * 1 Acre = 100 Decimal = 100/33 Bigha (~3.0303)
 * 1 Hectare = 7.475 Bigha
 */
export function getUnitMultiplier(unit: LandUnit): number {
  switch (unit) {
    case "decimal":
      return 1 / 33;
    case "acre":
      return 100 / 33;
    case "hectare":
      return 7.475;
    case "bigha":
    default:
      return 1;
  }
}

export function formatBDT(amount: number, locale = "bn"): string {
  const rounded = Math.round(amount);
  if (locale === "bn") {
    const bengaliDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
    return rounded.toLocaleString("en-IN").replace(/[0-9]/g, (d) => bengaliDigits[+d]) + " ৳";
  }
  return "৳ " + rounded.toLocaleString("en-US");
}

