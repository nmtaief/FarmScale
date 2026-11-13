"use client";

import React, { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/Button";
import {
  Sparkles,
  Send,
  Loader2,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  X,
  Settings2,
  MapPin,
  Check,
  ArrowRight,
  WifiOff,
} from "lucide-react";
import { useAppStore, type LocationInfo } from "@/lib/store/useAppStore";
import { LocateMeButton } from "@/components/ui/LocateMeButton";
import { useRouter, usePathname } from "@/i18n/routing";

interface RankedRotation {
  rank: number;
  id: string;
  name: string;
  matchScore: number;
  pattern: string[];
  suitability: string;
  telemetryNote: string;
  crops: {
    rabi: { name: string; water: number; income: number; soil: number };
    kharif1: { name: string; water: number; income: number; soil: number };
    kharif2: { name: string; water: number; income: number; soil: number };
  };
}

interface AdvisorResponse {
  status: string;
  location: LocationInfo;
  intent: {
    goal: string;
    language: string;
    season: string;
  };
  ranked_rotations: RankedRotation[];
  plain_language_answer: string;
  model_used: string;
}

export const AiAssistantSlot: React.FC = () => {
  const t = useTranslations("ai");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const location = useAppStore((state) => state.location);
  const setPriorities = useAppStore((state) => state.setPriorities);
  const aiModalOpen = useAppStore((state) => state.aiModalOpen);
  const setAiModalOpen = useAppStore((state) => state.setAiModalOpen);

  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AdvisorResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Voice recording state
  const [isListening, setIsListening] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Settings modal state
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("openrouter/free");
  const [keySaved, setKeySaved] = useState(false);

  useEffect(() => {
    const savedKey = localStorage.getItem("farmscale_openrouter_key") || "";
    const savedModel = localStorage.getItem("farmscale_openrouter_model") || "openrouter/free";
    setApiKey(savedKey);
    setModel(savedModel);
  }, []);

  const handleSaveSettings = () => {
    localStorage.setItem("farmscale_openrouter_key", apiKey.trim());
    localStorage.setItem("farmscale_openrouter_model", model);
    setKeySaved(true);
    setTimeout(() => {
      setKeySaved(false);
      setSettingsOpen(false);
    }, 1200);
  };

  // Web Speech API Voice Recognition (bn-BD)
  const handleToggleVoice = () => {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert(
        locale === "bn"
          ? "আপনার ব্রাউজারে ভয়েস সাপোর্ট নেই। অনুগ্রহ করে টাইপ করে প্রশ্ন লিখুন।"
          : "Voice recognition is not supported in this browser. Please type your query."
      );
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "bn-BD";
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);

      recognition.onresult = (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript;
        if (transcript) {
          setPrompt(transcript);
          setIsListening(false);
          handleAsk(transcript);
        }
      };

      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  // Web Speech Synthesis Read-Aloud
  const handleReadAloud = (textToSpeak: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = locale === "bn" ? "bn-BD" : "en-US";
    utterance.rate = 0.95;

    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);

    setIsPlayingAudio(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleAsk = async (customPrompt?: string) => {
    const query = (customPrompt !== undefined ? customPrompt : prompt).trim();
    if (!query) return;

    setLoading(true);
    setError(null);
    setResult(null);

    // Offline check & fallback
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setLoading(false);
      setResult({
        status: "offline",
        location,
        intent: { goal: "water_saving", language: "bn", season: "rabi" },
        ranked_rotations: [
          {
            rank: 1,
            id: "mustard-mungbean-aman",
            name: "সরিষা → মুগ ডাল → আমন ধান",
            matchScore: 8.8,
            pattern: ["mustard", "mungbean", "rice"],
            suitability: "৬০% কম সেচ ও মাটির নাইট্রোজেন বৃদ্ধি",
            telemetryNote: "সংরক্ষিত বরেন্দ্র অফলাইন ডাটা",
            crops: {
              rabi: { name: "সরিষা", water: 8, income: 8, soil: 7 },
              kharif1: { name: "মুগ ডাল", water: 8, income: 6, soil: 9 },
              kharif2: { name: "রোপা আমন", water: 6, income: 7, soil: 6 },
            },
          },
        ],
        plain_language_answer:
          "আপনি বর্তমানে অফলাইনে আছেন। বরেন্দ্র মাটির সংরক্ষিত তথ্যানুযায়ী, রবি মৌসুমে সরিষা (বারি-১৪/১৮) এবং খরিপ-১ এ মুগ ডাল (বারি-৬) চাষ করলে বোরো ধানের চেয়ে ৬০% পানি সাশ্রয় হবে এবং জমিতে প্রাকৃতিক নাইট্রোজেন বাড়বে।",
        model_used: "Offline Local Knowledge",
      });
      return;
    }

    try {
      const res = await fetch("/api/advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: query,
          location,
          apiKey: apiKey.trim() || undefined,
          model,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const data = await res.json();
      if (data.status === "error") {
        throw new Error(data.message || "Failed to generate recommendation");
      }

      setResult(data);
    } catch (err: any) {
      setError(
        locale === "bn"
          ? "কৃষি উপদেষ্টার সাথে সংযোগ স্থাপন করা সম্ভব হয়নি। সংরক্ষিত তথ্য দেখতে নিচের বোতাম চাপুন।"
          : err.message || "Could not reach FarmScale advisor."
      );
    } finally {
      setLoading(false);
    }
  };

  const applyToPlanner = (goal: string) => {
    if (goal === "soil_fertility") {
      setPriorities({ water: 4, income: 4, soil: 10 });
    } else if (goal === "land_preservation") {
      setPriorities({ water: 10, income: 2, soil: 5 });
    } else {
      setPriorities({ water: 2, income: 10, soil: 4 });
    }
    setAiModalOpen(false);
    router.push("/plan");
  };

  // Quick Bangla prompts without emoji dependency
  const quickPrompts = [
    { label: t("quickPrompt1"), query: "কম পানিতে শীতকালে কী কী ফসল ভালো হবে?" },
    { label: t("quickPrompt2"), query: "মাটির নাইট্রোজেন ও উর্বরতা বাড়াতে কোন ফসল আবর্তন করব?" },
    { label: t("quickPrompt3"), query: "বোরো ধানের বদলে অধিক লাভজনক কোন ফসল চাষ করা যায়?" },
    { label: t("quickPrompt4"), query: "বরেন্দ্র মাটিতে সরিষা চাষে কখন এবং কয়টি সেচ দিতে হয়?" },
  ];

  if (pathname === "/" || pathname === "") return null;

  return (
    <>
      {/* 1. Floating Trigger Button (Bottom-Right, always accessible, z-40) */}
      <div className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-40">
        <button
          type="button"
          onClick={() => setAiModalOpen(true)}
          className="flex items-center gap-2 px-4 py-3 rounded-full bg-forest text-gold hover:bg-forest/90 shadow-raised font-bold text-sm border-2 border-gold touch-target transition-all transform hover:scale-105"
          aria-label="Open FarmScale AI Voice Advisor"
        >
          <Mic className="w-5 h-5 text-gold animate-pulse" />
          <span className="text-white hidden xs:inline">{t("ask")}</span>
          <span className="p-1 rounded-full bg-gold/20 text-gold">
            <Sparkles className="w-4 h-4" />
          </span>
        </button>
      </div>

      {/* 2. Modal Sheet / Dialog */}
      {aiModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div className="w-full sm:max-w-xl max-h-[92vh] sm:max-h-[85vh] bg-surface rounded-t-2xl sm:rounded-2xl border border-border shadow-raised flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-surface border-b border-border">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-full bg-gold/20 text-forest dark:text-gold">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-serif font-bold text-primary m-0">
                    {locale === "bn" ? "ফার্মস্কেল কৃষি উপদেষ্টা" : "FarmScale AI Advisor"}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-secondary">
                    <MapPin className="w-3 h-3 text-water" />
                    <span>{location.name}</span>
                    <LocateMeButton variant="icon" />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setSettingsOpen((prev) => !prev)}
                  className="p-2 rounded-lg text-secondary hover:text-primary transition-colors touch-target"
                  title="LLM Settings"
                >
                  <Settings2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setAiModalOpen(false)}
                  className="p-2 rounded-lg text-secondary hover:text-primary transition-colors touch-target"
                  aria-label="Close dialog"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Optional Settings Panel */}
            {settingsOpen && (
              <div className="p-4 bg-bg border-b border-border space-y-3 text-xs">
                <div>
                  <label className="font-semibold block text-primary mb-1">
                    OpenRouter API Key (Optional)
                  </label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk-or-v1-..."
                    className="w-full p-2 rounded bg-surface border border-border text-primary font-mono text-xs focus:ring-1 focus:ring-gold outline-none"
                  />
                </div>
                <div className="flex items-center justify-between pt-1">
                  <Button variant="primary" size="sm" onClick={handleSaveSettings}>
                    {keySaved ? <Check className="w-3.5 h-3.5 mr-1" /> : null}
                    <span>{keySaved ? "Saved" : "Save Key"}</span>
                  </Button>
                </div>
              </div>
            )}

            {/* Scrollable Conversation Body */}
            <div className="p-4 space-y-4 overflow-y-auto flex-1 text-sm">
              {/* Quick Prompts */}
              <div className="space-y-1.5">
                <span className="text-xs text-secondary font-semibold block">
                  {locale === "bn" ? "দ্রুত প্রশ্ন নির্বাচন করুন:" : "Quick Questions:"}
                </span>
                <div className="flex flex-wrap gap-2">
                  {quickPrompts.map((qp, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setPrompt(qp.query);
                        handleAsk(qp.query);
                      }}
                      className="px-3 py-1.5 rounded-full bg-bg border border-border hover:border-gold text-xs text-primary transition-colors touch-target"
                    >
                      {qp.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input Area: Voice Mic + Text + Send Button */}
              <div className="space-y-2 pt-2">
                <div className="relative">
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleAsk();
                      }
                    }}
                    placeholder={
                      locale === "bn"
                        ? "আপনার প্রশ্ন লিখুন অথবা মাইক্রোফোন বোতাম চেপে মুখে বলুন..."
                        : "Ask about crops, irrigation, or soil..."
                    }
                    rows={2}
                    className="w-full p-3 pr-24 rounded-xl bg-bg border border-border text-primary text-sm focus:outline-none focus:ring-2 focus:ring-gold resize-none"
                  />
                  <div className="absolute right-2 bottom-2.5 flex items-center gap-1.5">
                    {/* Voice Input Button */}
                    <button
                      type="button"
                      onClick={handleToggleVoice}
                      className={`p-2 rounded-full border transition-all touch-target ${
                        isListening
                          ? "bg-red-500 text-white border-red-500 animate-pulse"
                          : "bg-surface text-secondary hover:text-forest border-border"
                      }`}
                      title={isListening ? t("listening") : t("voicePrompt")}
                    >
                      {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </button>

                    {/* Send Button */}
                    <button
                      type="button"
                      onClick={() => handleAsk()}
                      disabled={loading || !prompt.trim()}
                      className="p-2 rounded-full bg-forest text-white hover:bg-forest/90 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs touch-target"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                {isListening && (
                  <div className="text-xs text-red-600 font-semibold flex items-center gap-1.5 px-1 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-red-600" />
                    <span>{t("listening")}</span>
                  </div>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 text-xs text-red-700 dark:text-red-300">
                  {error}
                </div>
              )}

              {/* Loading Indicator */}
              {loading && (
                <div className="p-6 text-center space-y-2">
                  <Loader2 className="w-7 h-7 animate-spin text-forest mx-auto" />
                  <p className="text-xs text-secondary">
                    {locale === "bn"
                      ? "বরেন্দ্র মাটির তথ্য ও কৃত্রিম বুদ্ধিমত্তা পর্যালোচনা হচ্ছে..."
                      : "Consulting FarmScale agronomic rules..."}
                  </p>
                </div>
              )}

              {/* Grounded Short (<= 5 Lines) Answer */}
              {result && (
                <div className="p-4 rounded-xl bg-bg border border-leaf/40 shadow-xs space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="p-1 rounded-full bg-leaf/20 text-leaf">
                        <Sparkles className="w-4 h-4" />
                      </span>
                      <span className="font-bold text-xs text-leaf uppercase tracking-wider">
                        {locale === "bn" ? "কৃষি পরামর্শ" : "Recommendation"}
                      </span>
                    </div>

                    {/* Read Aloud Button */}
                    <button
                      type="button"
                      onClick={() => handleReadAloud(result.plain_language_answer)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-semibold touch-target ${
                        isPlayingAudio ? "bg-leaf text-white border-leaf" : "bg-surface text-secondary hover:text-primary border-border"
                      }`}
                    >
                      {isPlayingAudio ? (
                        <>
                          <VolumeX className="w-3.5 h-3.5 animate-pulse" />
                          <span>{locale === "bn" ? "থামুন" : "Stop"}</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>{locale === "bn" ? "শুনুন" : "Listen"}</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Concise Plain-Language Text (<=5 lines) */}
                  <p className="text-sm text-primary leading-relaxed m-0 font-medium whitespace-pre-line">
                    {result.plain_language_answer}
                  </p>

                  {/* Grounded Top Recommendation */}
                  {result.ranked_rotations?.[0] && (
                    <div className="p-3 rounded-lg bg-surface border border-border flex items-center justify-between gap-2">
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-secondary font-bold uppercase block">
                          {locale === "bn" ? "সেরা ফসল চক্র" : "Top Ranked Rotation"}
                        </span>
                        <span className="font-serif font-bold text-primary text-sm">
                          {result.ranked_rotations[0].name}
                        </span>
                      </div>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => applyToPlanner(result.intent.goal)}
                        className="gap-1 text-xs"
                      >
                        <span>{locale === "bn" ? "প্ল্যানে প্রয়োগ" : "Apply"}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  )}

                  <div className="text-[10px] text-muted flex items-center justify-between pt-1 border-t border-border/80">
                    <span>Model: {result.model_used}</span>
                    <span>BARI / NASA POWER calibrated</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
