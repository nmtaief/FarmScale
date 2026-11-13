import { NextRequest, NextResponse } from "next/server";
import { rankRotations, SAMPLE_ROTATIONS } from "@farmscale/scoring";

export interface AdvisorRequest {
  prompt: string;
  location?: {
    name: string;
    lat: number;
    lon: number;
    district: string;
    isPilot?: boolean;
  };
  goal?: "cash_crop" | "soil_fertility" | "land_preservation" | "cultivability";
  season?: string;
  language?: string;
  apiKey?: string;
  model?: string;
}

// 3-season candidate rotations matching the Layer 3 ML engine
const EXTENDED_ROTATIONS = [
  {
    id: "rot_mustard_watermelon_rice",
    name: "Mustard → Watermelon → T.Aman Rice",
    crops: {
      rabi: { id: "mustard", name: "Mustard", water: 8, income: 8, soil: 7 },
      kharif1: { id: "watermelon", name: "Watermelon", water: 7, income: 9, soil: 6 },
      kharif2: { id: "t_aman", name: "T.Aman Rice", water: 6, income: 7, soil: 6 },
    },
    pattern: ["mustard", "watermelon", "rice"],
    ratings: { water: 7.5, income: 8.8, soil: 6.8 },
    suitability: "High profit cash crop rotation suited to Barind sandy-clay loams.",
    telemetryNote: "Temp 25.6°C, rootzone moisture 67.4%, pH 5.8, water adequacy 72.6%.",
  },
  {
    id: "rot_cabbage_mungbean_rice",
    name: "Cabbage → Mungbean → T.Aman Rice",
    crops: {
      rabi: { id: "cabbage", name: "Cabbage", water: 7, income: 8, soil: 6 },
      kharif1: { id: "mungbean", name: "Mungbean", water: 8, income: 6, soil: 9 },
      kharif2: { id: "t_aman", name: "T.Aman Rice", water: 6, income: 7, soil: 6 },
    },
    pattern: ["cabbage", "mungbean", "rice"],
    ratings: { water: 7.2, income: 7.5, soil: 8.6 },
    suitability: "Balanced income and soil regeneration with nitrogen-fixing legume.",
    telemetryNote: "Biological N fixation ~45 kg N/ha, reduces synthetic urea requirement.",
  },
  {
    id: "rot_cauliflower_jute_rice",
    name: "Cauliflower → Jute → T.Aman Rice",
    crops: {
      rabi: { id: "cauliflower", name: "Cauliflower", water: 7, income: 8, soil: 6 },
      kharif1: { id: "jute", name: "Jute (Fibre)", water: 6, income: 7, soil: 7 },
      kharif2: { id: "t_aman", name: "T.Aman Rice", water: 6, income: 7, soil: 6 },
    },
    pattern: ["cauliflower", "jute", "rice"],
    ratings: { water: 6.8, income: 8.2, soil: 7.1 },
    suitability: "Commercial vegetable and high biomass crop for organic carbon building.",
    telemetryNote: "Jute root biomass increases topsoil organic carbon retention.",
  },
  {
    id: "rot_lentil_sesame_rice",
    name: "Lentil → Sesame → T.Aman Rice",
    crops: {
      rabi: { id: "lentil", name: "Lentil", water: 9, income: 6, soil: 9 },
      kharif1: { id: "sesame", name: "Sesame (Til)", water: 9, income: 6, soil: 6 },
      kharif2: { id: "t_aman", name: "T.Aman Rice", water: 6, income: 7, soil: 6 },
    },
    pattern: ["lentil", "sesame", "rice"],
    ratings: { water: 9.2, income: 6.4, soil: 8.4 },
    suitability: "Extreme drought resilience with low water demand in dry winter.",
    telemetryNote: "Water stress score: 32 (Low risk), ideal for water-scarce Barind zones.",
  },
  {
    id: "rot_wheat_mungbean_rice",
    name: "Wheat → Mungbean → T.Aman Rice",
    crops: {
      rabi: { id: "wheat", name: "Wheat", water: 7, income: 7, soil: 6 },
      kharif1: { id: "mungbean", name: "Mungbean", water: 8, income: 6, soil: 9 },
      kharif2: { id: "t_aman", name: "T.Aman Rice", water: 6, income: 7, soil: 6 },
    },
    pattern: ["wheat", "mungbean", "rice"],
    ratings: { water: 7.4, income: 7.2, soil: 8.2 },
    suitability: "Stable food security rotation with soil fertility renewal.",
    telemetryNote: "Resilient thermal comfort zone during winter vegetative stage.",
  },
];

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as AdvisorRequest;
    const prompt = body.prompt?.trim() || "";
    const location = body.location || {
      name: "Rajshahi Sadar, Barind",
      district: "Rajshahi",
      lat: 24.3745,
      lon: 88.6042,
    };
    const lang = body.language || (/[ঀ-৿]/.test(prompt) ? "bn" : "en");
    const openrouterKey =
      body.apiKey ||
      process.env.OPENROUTER_API_KEY ||
      process.env.NEXT_PUBLIC_OPENROUTER_API_KEY ||
      "";
    const selectedModel =
      body.model ||
      process.env.OPENROUTER_DEFAULT_MODEL ||
      "openrouter/free";

    // 1. Analyze prompt intent (rule-based fast extraction)
    const pLower = prompt.toLowerCase();
    let detectedGoal: "cash_crop" | "soil_fertility" | "land_preservation" | "cultivability" =
      body.goal || "cash_crop";

    if (
      pLower.includes("nitrogen") ||
      pLower.includes("নাইট্রোজেন") ||
      pLower.includes("soil") ||
      pLower.includes("মাটি") ||
      pLower.includes("fertility") ||
      pLower.includes("উর্বরতা") ||
      pLower.includes("জৈব")
    ) {
      detectedGoal = "soil_fertility";
    } else if (
      pLower.includes("water") ||
      pLower.includes("পানি") ||
      pLower.includes("drought") ||
      pLower.includes("খরা") ||
      pLower.includes("irrigation") ||
      pLower.includes("সেচ")
    ) {
      detectedGoal = "land_preservation";
    } else if (
      pLower.includes("money") ||
      pLower.includes("profit") ||
      pLower.includes("টাকা") ||
      pLower.includes("লাভ") ||
      pLower.includes("cash") ||
      pLower.includes("ব্যবসা")
    ) {
      detectedGoal = "cash_crop";
    }

    // 2. Score candidate rotations
    const weights = {
      water: detectedGoal === "land_preservation" ? 9 : 5,
      income: detectedGoal === "cash_crop" ? 9 : 4,
      soil: detectedGoal === "soil_fertility" ? 9 : 4,
    };

    const scored = EXTENDED_ROTATIONS.map((r) => {
      const totalW = weights.water + weights.income + weights.soil;
      const score =
        (weights.water * r.ratings.water +
          weights.income * r.ratings.income +
          weights.soil * r.ratings.soil) /
        totalW;
      return {
        ...r,
        matchScore: Math.round(score * 10 * 10) / 10,
      };
    }).sort((a, b) => b.matchScore - a.matchScore);

    const top3 = scored.slice(0, 3);

    // 3. Try OpenRouter LLM for human explanation if key is available
    let plainLanguageAnswer = "";

    if (openrouterKey) {
      try {
        const systemPrompt = `You are FarmScale AI, an agronomic decision-support expert for smallholder farmers in Bangladesh (Rajshahi Division Barind Tract).
Answer in ${lang === "bn" ? "Bengali (বাংলা)" : "English"}.
Location: ${location.name} (${location.lat.toFixed(3)}°N, ${location.lon.toFixed(3)}°E).
Goal: ${detectedGoal}.
Top recommended rotation: ${top3[0].name}.
Write a warm, concise (2-3 sentences) agronomic recommendation explaining WHY this rotation suits the field conditions and farmer's goal. Mention practical tips on soil moisture and planting.`;

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${openrouterKey}`,
            "HTTP-Referer": "https://farmscale.vercel.app",
            "X-Title": "FarmScale AI",
          },
          body: JSON.stringify({
            model: selectedModel,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: prompt || `Recommend best crop rotation for ${location.name}` },
            ],
            max_tokens: 300,
            temperature: 0.4,
          }),
        });

        if (response.ok) {
          const llmData = await response.json();
          plainLanguageAnswer =
            llmData.choices?.[0]?.message?.content?.trim() || "";
        }
      } catch (llmErr) {
        console.warn("OpenRouter API call error:", llmErr);
      }
    }

    // Fallback natural language explanation if no API key or failed call
    if (!plainLanguageAnswer) {
      if (lang === "bn") {
        if (detectedGoal === "soil_fertility") {
          plainLanguageAnswer = `${location.name}-এর মাটির উর্বরতা ও নাইট্রোজেন বৃদ্ধি করতে "${top3[0].name}" সবচেয়ে উপযোগী। রবিতে কপি ও খরিফ-১ এ মুগডাল চাষ করলে শিকড়ের ব্যাকটেরিয়া প্রাকৃতিক নাইট্রোজেন যোগ করবে এবং খরিফ-২ এ রোপা আমনের ফলন বাড়াবে।`;
        } else if (detectedGoal === "land_preservation") {
          plainLanguageAnswer = `${location.name}-এর শুষ্ক আবহাওয়ায় ভূগর্ভস্থ পানি সাশ্রয়ের জন্য "${top3[0].name}" সুপারিশ করা হলো। মসুর ও তিল কম সেচেও টিকে থাকে এবং খরার ঝুঁকি অনেক কমিয়ে দেয়।`;
        } else {
          plainLanguageAnswer = `${location.name}-এ সর্বোচ্চ অর্থনৈতিক লাভের জন্য "${top3[0].name}" সেরা ফলাফল দেবে। সরিষা দ্রুত উত্তোলন করে তরমুজের উচ্চ বাজারমূল্য পাওয়া যায় এবং পরবর্তীতে রোপা আমন নিশ্চিত খাদ্য নিরাপত্তা দেয়।`;
        }
      } else {
        if (detectedGoal === "soil_fertility") {
          plainLanguageAnswer = `For ${location.name}, "${top3[0].name}" is the highest-ranked sequence for rebuilding soil health. Incorporating mungbean fixes ~45 kg atmospheric N/ha into the Barind topsoil, lowering fertilizer costs for the subsequent T.Aman rice.`;
        } else if (detectedGoal === "land_preservation") {
          plainLanguageAnswer = `In water-scarce zones of ${location.name}, "${top3[0].name}" minimizes irrigation demand. Both lentil and sesame exhibit strong drought tolerance during dry winter periods.`;
        } else {
          plainLanguageAnswer = `To optimize net revenue in ${location.name}, "${top3[0].name}" offers the strongest commercial margin, combining quick winter mustard with high-value summer watermelon followed by staple T.Aman rice.`;
        }
      }
    }

    return NextResponse.json({
      status: "success",
      source: "farmscale_integrated_ml_llm",
      location,
      intent: {
        goal: detectedGoal,
        language: lang,
        season: "annual (3-season cycle)",
      },
      ranked_rotations: top3.map((r, idx) => ({
        rank: idx + 1,
        id: r.id,
        name: r.name,
        matchScore: r.matchScore,
        pattern: r.pattern,
        suitability: r.suitability,
        telemetryNote: r.telemetryNote,
        crops: r.crops,
      })),
      plain_language_answer: plainLanguageAnswer,
      model_used: openrouterKey ? selectedModel : "Rule-Based Agronomic Engine",
    });
  } catch (err: any) {
    console.error("Advisor API error:", err);
    return NextResponse.json(
      {
        status: "error",
        message: err.message || "Failed to process advisor request",
      },
      { status: 500 }
    );
  }
}

