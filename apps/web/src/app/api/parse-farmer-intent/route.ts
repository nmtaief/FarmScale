import { NextRequest, NextResponse } from "next/server";
import { KNOWN_AREAS, type KnownArea } from "@/lib/location/geolocation";

export interface ParsedFarmerIntent {
  locationName: string;
  district: string;
  lat: number;
  lon: number;
  landSize: number;
  unit: "bigha" | "decimal" | "acre";
  goal: "save_water" | "more_income" | "improve_soil" | "balanced";
  goalLabelBn: string;
  currentCrop: "boro_rice" | "wheat" | "mustard" | "fallow" | "other" | "none";
  currentCropLabelBn: string;
  confidence: number;
}

const DEFAULT_PARSED: ParsedFarmerIntent = {
  locationName: "Godagari Upazila",
  district: "Rajshahi",
  lat: 24.4667,
  lon: 88.3333,
  landSize: 1,
  unit: "bigha",
  goal: "save_water",
  goalLabelBn: "পানি বাঁচান",
  currentCrop: "boro_rice",
  currentCropLabelBn: "বোরো ধান",
  confidence: 0.8,
};

function parseWithRegex(text: string): ParsedFarmerIntent {
  const result: ParsedFarmerIntent = { ...DEFAULT_PARSED };
  const lower = text.toLowerCase();

  // 1. Location match
  if (lower.includes("গোদাগাড়ী") || lower.includes("গোদাগাড়ি") || lower.includes("godagari")) {
    result.locationName = "Godagari Upazila";
    result.district = "Rajshahi";
    result.lat = 24.4667;
    result.lon = 88.3333;
  } else if (lower.includes("তানোর") || lower.includes("tanore")) {
    result.locationName = "Tanore Upazila";
    result.district = "Rajshahi";
    result.lat = 24.5833;
    result.lon = 88.575;
  } else if (lower.includes("পবা") || lower.includes("paba")) {
    result.locationName = "Paba Upazila";
    result.district = "Rajshahi";
    result.lat = 24.4333;
    result.lon = 88.625;
  } else if (lower.includes("নওগাঁ") || lower.includes("naogaon")) {
    result.locationName = "Naogaon Sadar";
    result.district = "Naogaon";
    result.lat = 24.8167;
    result.lon = 88.9333;
  } else if (lower.includes("নাটোর") || lower.includes("natore")) {
    result.locationName = "Natore Sadar";
    result.district = "Natore";
    result.lat = 24.4167;
    result.lon = 88.9833;
  } else if (lower.includes("রাজশাহী") || lower.includes("rajshahi")) {
    result.locationName = "Rajshahi Sadar, Barind";
    result.district = "Rajshahi";
    result.lat = 24.3745;
    result.lon = 88.6042;
  }

  // 2. Land Size & Unit match
  // Convert Bengali numerals to Western digits for regex
  const bengaliDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  let normalizedText = lower;
  bengaliDigits.forEach((digit, idx) => {
    normalizedText = normalizedText.split(digit).join(String(idx));
  });

  const sizeUnitMatch = normalizedText.match(/(\d+(\.\d+)?)\s*(বিঘা|bigha|শতক|decimal|শতাংশ|একর|acre)?/);
  if (sizeUnitMatch && sizeUnitMatch[1]) {
    const parsedNum = parseFloat(sizeUnitMatch[1]);
    if (!isNaN(parsedNum) && parsedNum > 0 && parsedNum <= 500) {
      result.landSize = parsedNum;
    }
    const matchedUnit = sizeUnitMatch[3];
    if (matchedUnit) {
      if (matchedUnit.includes("শতক") || matchedUnit.includes("decimal") || matchedUnit.includes("শতাংশ")) {
        result.unit = "decimal";
      } else if (matchedUnit.includes("একর") || matchedUnit.includes("acre")) {
        result.unit = "acre";
      } else {
        result.unit = "bigha";
      }
    }
  }

  // 3. Goal match
  if (
    lower.includes("পানি") ||
    lower.includes("সেচ") ||
    lower.includes("খরচ কম") ||
    lower.includes("জল") ||
    lower.includes("water")
  ) {
    result.goal = "save_water";
    result.goalLabelBn = "পানি বাঁচান";
  } else if (
    lower.includes("টাকা") ||
    lower.includes("লাভ") ||
    lower.includes("আয়") ||
    lower.includes("দাম") ||
    lower.includes("income") ||
    lower.includes("profit")
  ) {
    result.goal = "more_income";
    result.goalLabelBn = "বেশি আয়";
  } else if (
    lower.includes("মাটি") ||
    lower.includes("উর্বর") ||
    lower.includes("নাইট্রোজেন") ||
    lower.includes("ডাল") ||
    lower.includes("soil")
  ) {
    result.goal = "improve_soil";
    result.goalLabelBn = "মাটি ভালো করুন";
  } else {
    result.goal = "balanced";
    result.goalLabelBn = "সব মিলিয়ে";
  }

  // 4. Current crop match
  if (lower.includes("বোরো") || lower.includes("ইরি") || lower.includes("ধান") || lower.includes("boro") || lower.includes("rice")) {
    result.currentCrop = "boro_rice";
    result.currentCropLabelBn = "বোরো ধান";
  } else if (lower.includes("গম") || lower.includes("wheat")) {
    result.currentCrop = "wheat";
    result.currentCropLabelBn = "গম";
  } else if (lower.includes("সরিষা") || lower.includes("mustard")) {
    result.currentCrop = "mustard";
    result.currentCropLabelBn = "সরিষা";
  } else if (lower.includes("পতিত") || lower.includes("কিছু না") || lower.includes("fallow") || lower.includes("nothing")) {
    result.currentCrop = "fallow";
    result.currentCropLabelBn = "পতিত জমি";
  } else {
    result.currentCrop = "boro_rice";
    result.currentCropLabelBn = "বোরো ধান";
  }

  return result;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text, apiKey, model } = body;

    if (!text || typeof text !== "string" || !text.trim()) {
      return NextResponse.json({
        status: "error",
        message: "No text input provided",
      }, { status: 400 });
    }

    const regexParsed = parseWithRegex(text);
    const openrouterKey = apiKey || process.env.OPENROUTER_API_KEY;

    // If OpenRouter key is provided, try LLM with strict JSON extraction
    if (openrouterKey) {
      try {
        const systemPrompt = `You are an agronomic intent parser for Bangladesh smallholder farmers.
Given a farmer's spoken or typed sentence in Bengali or English, extract their parameters in JSON:
{
  "locationName": "Godagari Upazila" | "Tanore Upazila" | "Paba Upazila" | "Rajshahi Sadar, Barind" | "Naogaon Sadar" | "Natore Sadar",
  "landSize": number (default 1),
  "unit": "bigha" | "decimal" | "acre" (default "bigha"),
  "goal": "save_water" | "more_income" | "improve_soil" | "balanced",
  "currentCrop": "boro_rice" | "wheat" | "mustard" | "fallow" | "other"
}
Return ONLY valid JSON.`;

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${openrouterKey}`,
            "HTTP-Referer": "https://farmscale.vercel.app",
            "X-Title": "FarmScale Intent Parser",
          },
          body: JSON.stringify({
            model: model || "openrouter/free",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: text },
            ],
            response_format: { type: "json_object" },
            max_tokens: 150,
            temperature: 0.1,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const parsed = JSON.parse(data.choices?.[0]?.message?.content || "{}");

          if (parsed.locationName || parsed.landSize || parsed.goal) {
            const merged: ParsedFarmerIntent = {
              locationName: parsed.locationName || regexParsed.locationName,
              district: regexParsed.district,
              lat: regexParsed.lat,
              lon: regexParsed.lon,
              landSize: Number(parsed.landSize) || regexParsed.landSize,
              unit: parsed.unit === "decimal" || parsed.unit === "acre" ? parsed.unit : regexParsed.unit,
              goal: parsed.goal || regexParsed.goal,
              goalLabelBn:
                parsed.goal === "more_income"
                  ? "বেশি আয়"
                  : parsed.goal === "improve_soil"
                  ? "মাটি ভালো করুন"
                  : parsed.goal === "balanced"
                  ? "সব মিলিয়ে"
                  : "পানি বাঁচান",
              currentCrop: parsed.currentCrop || regexParsed.currentCrop,
              currentCropLabelBn:
                parsed.currentCrop === "wheat"
                  ? "গম"
                  : parsed.currentCrop === "mustard"
                  ? "সরিষা"
                  : parsed.currentCrop === "fallow"
                  ? "পতিত জমি"
                  : "বোরো ধান",
              confidence: 0.95,
            };

            return NextResponse.json({
              status: "success",
              parsed: merged,
              source: "openrouter_llm",
            });
          }
        }
      } catch (llmErr) {
        console.warn("LLM intent parsing failed, using regex:", llmErr);
      }
    }

    // Fast, robust regex result
    return NextResponse.json({
      status: "success",
      parsed: regexParsed,
      source: "rule_engine",
    });
  } catch (err: any) {
    return NextResponse.json({
      status: "error",
      message: err.message || "Failed to parse farmer intent",
    }, { status: 500 });
  }
}

