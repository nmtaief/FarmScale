"use client";

import React, { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import {
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Volume2,
  VolumeX,
  Droplets,
  Sun,
  CloudRain,
  Share2,
  Printer,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  MapPin,
  Check,
  CalendarRange,
  Sprout,
  ShieldAlert,
  Sliders,
} from "lucide-react";
import { useAppStore } from "@/lib/store/useAppStore";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import {
  getCropCalendar,
  formatReadableDate,
  daysBetween,
  getTodayDateString,
  determineCurrentStage,
  type Task,
} from "@/lib/agronomics/planGenerator";
import { toBengaliNumerals } from "@/lib/i18n/numerals";

export const MyFarmDashboard: React.FC = () => {
  const tCommon = useTranslations("common");
  const locale = useLocale();

  const savedFarm = useAppStore((s) => s.savedFarm);
  const cropCycle = useAppStore((s) => s.cropCycle);
  const tasks = useAppStore((s) => s.tasks);
  const updateTaskStatus = useAppStore((s) => s.updateTaskStatus);
  const shiftTasks = useAppStore((s) => s.shiftTasks);
  const clearSavedFarm = useAppStore((s) => s.clearSavedFarm);
  const setAiModalOpen = useAppStore((s) => s.setAiModalOpen);

  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [delayModalOpen, setDelayModalOpen] = useState(false);
  const [delayDaysInput, setDelayDaysInput] = useState(3);
  const [delayWarning, setDelayWarning] = useState<string | null>(null);
  const [fullCalendarOpen, setFullCalendarOpen] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);

  if (!savedFarm || !cropCycle) {
    return null;
  }

  const today = getTodayDateString();
  const template = getCropCalendar(cropCycle.crop);
  const currentStage = determineCurrentStage(template, cropCycle.sowingDate, today);

  // Day count since sowing
  const daysSinceSowing = Math.max(0, daysBetween(cropCycle.sowingDate, today));

  // Partition tasks
  const overdueTasks = tasks.filter(
    (t) => t.status === "pending" && daysBetween(today, t.dueDate) < 0
  );

  const todayTasks = tasks.filter(
    (t) => t.status === "pending" && daysBetween(today, t.dueDate) === 0
  );

  // If no task specifically due today, show next available pending task as primary
  const activeTodayTasks =
    todayTasks.length > 0
      ? todayTasks
      : tasks.filter((t) => t.status === "pending").slice(0, 2);

  const next7DaysTasks = tasks.filter(
    (t) =>
      t.status === "pending" &&
      daysBetween(today, t.dueDate) > 0 &&
      daysBetween(today, t.dueDate) <= 7
  );

  const allPendingTasks = tasks.filter((t) => t.status === "pending");

  // Calibrated 3-day weather strip for Barind / Rajshahi
  const weatherForecast = [
    {
      dayBn: "আজ",
      dayEn: "Today",
      tempMax: 29,
      tempMin: 18,
      rainProb: 0,
      icon: Sun,
      conditionBn: "রৌদ্রোজ্জ্বল ও শুষ্ক",
      conditionEn: "Sunny & dry",
    },
    {
      dayBn: "আগামীকাল",
      dayEn: "Tomorrow",
      tempMax: 28,
      tempMin: 19,
      rainProb: 15,
      icon: Droplets,
      conditionBn: "হালকা মেঘলা",
      conditionEn: "Partly cloudy",
    },
    {
      dayBn: "পরশু",
      dayEn: "Day after",
      tempMax: 30,
      tempMin: 18,
      rainProb: 5,
      icon: Sun,
      conditionBn: "উষ্ণ ও শুষ্ক",
      conditionEn: "Warm & dry",
    },
  ];

  // Weather sensitive advice
  const weatherNoticeBn =
    "আবহাওয়া পূর্বাভাস: আগামী ৩ দিন বৃষ্টির সম্ভাবনা নেই। মাটি শুকিয়ে গেলে নির্ধারিত সেচ বা উপরিপ্রয়োগ চালিয়ে নিন।";

  // Audio Speech Synthesis
  const handleReadTask = (task: Task) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    if (playingAudioId === task.id) {
      window.speechSynthesis.cancel();
      setPlayingAudioId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const textToSpeak =
      locale === "bn"
        ? `${task.titleBn}। করণীয়: ${task.instructionBn}। কেন করবেন: ${task.whyBn}। ${task.scaledDosageBn ? `প্রয়োজনীয় মাত্রা: ${task.scaledDosageBn}` : ""}`
        : `${task.titleEn}. Instruction: ${task.instructionEn}. Why: ${task.whyEn}.`;

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = locale === "bn" ? "bn-BD" : "en-US";
    utterance.rate = 0.95;

    utterance.onend = () => setPlayingAudioId(null);
    utterance.onerror = () => setPlayingAudioId(null);

    setPlayingAudioId(task.id);
    window.speechSynthesis.speak(utterance);
  };

  // Shift Dates / Delay Handler
  const handleApplyDelay = () => {
    const res = shiftTasks(delayDaysInput);
    if (res.warningBn) {
      setDelayWarning(locale === "bn" ? res.warningBn : res.warningEn || res.warningBn);
    } else {
      setDelayWarning(null);
      setDelayModalOpen(false);
    }
  };

  // WhatsApp / SMS Share Handler
  const handleShareWeeklyTasks = () => {
    const taskLines = (activeTodayTasks.concat(next7DaysTasks))
      .map((t) => `• [${t.dueDate}] ${t.titleBn}: ${t.instructionBn}`)
      .join("\n");

    const message = `ফার্মস্কেল - আমার খামার (${savedFarm.locationName}):\n🌾 ফসল: ${template.cropNameBn}\n📅 বর্তমান পর্যায়: ${currentStage.labelBn} (বপনের ${toBengaliNumerals(daysSinceSowing, "bn")}তম দিন)\n\nআজ ও আগামী সপ্তাহের করণীয়:\n${taskLines}\n\n🔗 অ্যাপ লিংক: https://farmscale-web.vercel.app`;

    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");

    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(message).catch(() => {});
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 2000);
    }
  };

  return (
    <div className="space-y-6 pb-16 max-w-2xl mx-auto">
      {/* Honest sample notice banner */}
      <div className="p-3.5 rounded-md bg-leaf/10 border border-leaf/30 text-xs text-primary leading-relaxed">
        <span className="font-bold text-leaf mr-1.5">পাইলট প্রাক্কলন:</span>
        {tCommon("honestSampleBanner")}
      </div>

      {/* 1. Header: My Farm Status Card */}
      <div className="p-5 rounded-2xl bg-surface border-2 border-forest/20 shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-full bg-forest text-gold">
                <Sprout className="w-5 h-5" />
              </span>
              <div>
                <h1 className="text-xl sm:text-2xl font-serif font-bold text-primary m-0">
                  {template.cropNameBn}
                </h1>
                <div className="flex items-center gap-2 text-xs text-secondary mt-0.5">
                  <span className="font-bold text-forest dark:text-leaf">
                    {toBengaliNumerals(savedFarm.landSize, locale)} {savedFarm.unit === "decimal" ? "শতক" : savedFarm.unit === "acre" ? "একর" : "বিঘা"} জমি
                  </span>
                  <span>•</span>
                  <span>{savedFarm.locationName}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="px-3 py-1 rounded-full bg-gold/20 text-forest dark:text-gold text-xs font-bold font-mono">
              {locale === "bn" ? `বপনের ${toBengaliNumerals(daysSinceSowing, "bn")}তম দিন` : `Day ${daysSinceSowing} since sowing`}
            </span>
          </div>
        </div>

        {/* Current Stage Visual Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-secondary font-medium">
              {locale === "bn" ? "বর্তমান পর্যায়:" : "Current Stage:"}
            </span>
            <span className="font-bold text-primary">
              {locale === "bn" ? currentStage.labelBn : currentStage.labelEn}
            </span>
          </div>

          {/* Stepped progress indicators */}
          <div className="grid grid-cols-6 gap-1.5">
            {template.stages.map((st, i) => {
              const isPast = daysSinceSowing >= st.dayOffset;
              const isCurrent = currentStage.id === st.id;
              return (
                <div key={st.id} className="space-y-1">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      isCurrent
                        ? "bg-gold ring-2 ring-gold/40"
                        : isPast
                        ? "bg-forest"
                        : "bg-border"
                    }`}
                  />
                  <span className="text-[9px] text-secondary truncate block text-center leading-tight">
                    {st.labelBn.split(" ")[0]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. Weather Strip (Next 3 Days) */}
      <div className="p-4 rounded-xl bg-surface border border-border shadow-xs space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-primary flex items-center gap-1.5">
            <Sun className="w-4 h-4 text-gold" />
            {locale === "bn" ? "মাঠের ৩ দিনের আবহাওয়া (বরেন্দ্র জোন):" : "3-Day Field Weather:"}
          </span>
          <span className="text-[10px] text-muted font-mono">NASA POWER</span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {weatherForecast.map((w, i) => {
            const Icon = w.icon;
            return (
              <div key={i} className="p-2.5 rounded-lg bg-bg border border-border text-center space-y-1">
                <span className="text-[11px] font-bold text-primary block">
                  {locale === "bn" ? w.dayBn : w.dayEn}
                </span>
                <Icon className="w-5 h-5 mx-auto text-gold" />
                <span className="font-mono text-xs font-bold text-primary block">
                  {toBengaliNumerals(w.tempMax, locale)}° / {toBengaliNumerals(w.tempMin, locale)}°
                </span>
                <span className="text-[10px] text-secondary block">
                  {locale === "bn" ? w.conditionBn : w.conditionEn}
                </span>
              </div>
            );
          })}
        </div>

        <p className="text-[11px] text-secondary m-0 pt-1 leading-snug">
          {weatherNoticeBn}
        </p>
      </div>

      {/* 3. "বাকি আছে" (Overdue Tasks) if any */}
      {overdueTasks.length > 0 && (
        <div className="p-4 rounded-xl bg-red-500/10 border-2 border-red-500/30 space-y-3">
          <div className="flex items-center gap-2 text-red-700 dark:text-red-400 font-bold text-sm">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 animate-pulse" />
            <span>
              {locale === "bn"
                ? `বাকি আছে (${toBengaliNumerals(overdueTasks.length, "bn")}টি কাজ পিছিয়ে রয়েছে)`
                : `Overdue Tasks (${overdueTasks.length} pending)`}
            </span>
          </div>

          <div className="space-y-2.5">
            {overdueTasks.map((task) => (
              <div
                key={task.id}
                className="p-3.5 rounded-lg bg-surface border border-red-300 dark:border-red-900 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <span className="text-xs font-bold text-primary block">
                    {task.titleBn}
                  </span>
                  <span className="text-xs text-secondary block">
                    {task.instructionBn}
                  </span>
                  <span className="text-[11px] text-red-600 font-medium block">
                    নির্ধারিত তারিখ ছিল: {formatReadableDate(task.dueDate, locale)}
                  </span>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => updateTaskStatus(task.id, "done")}
                    className="gap-1 font-bold"
                  >
                    <Check className="w-4 h-4 text-forest" />
                    <span>{locale === "bn" ? "হয়েছে ✓" : "Done"}</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. "আজকের কাজ" (Today's Tasks - Large Action Cards) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-serif font-bold text-primary m-0 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-forest dark:text-gold" />
            <span>{locale === "bn" ? "আজকের কাজ" : "Today's Farm Tasks"}</span>
          </h2>
          <span className="text-xs text-secondary">
            {formatReadableDate(today, locale)}
          </span>
        </div>

        {activeTodayTasks.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-surface border border-border space-y-2">
            <CheckCircle2 className="w-8 h-8 text-leaf mx-auto" />
            <h3 className="text-base font-bold text-primary m-0">
              {locale === "bn" ? "আজকের সব কাজ সম্পন্ন হয়েছে!" : "All tasks completed for today!"}
            </h3>
            <p className="text-xs text-secondary m-0">
              {locale === "bn" ? "আগামী সপ্তাহের কাজগুলো নিচে দেখুন।" : "Check upcoming tasks below."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeTodayTasks.map((task) => (
              <div
                key={task.id}
                className="p-5 rounded-2xl bg-surface border-2 border-forest/30 shadow-card space-y-3"
              >
                <div className="flex items-start justify-between gap-2 border-b border-border/80 pb-3">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-bg text-secondary">
                      {task.type.replace("_", " ")}
                    </span>
                    <h3 className="text-lg sm:text-xl font-serif font-bold text-primary m-0">
                      {locale === "bn" ? task.titleBn : task.titleEn}
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleReadTask(task)}
                    className="p-2 rounded-full border border-border hover:bg-surface-hover text-secondary touch-target"
                    title="Listen to instruction"
                  >
                    {playingAudioId === task.id ? (
                      <VolumeX className="w-5 h-5 text-leaf animate-pulse" />
                    ) : (
                      <Volume2 className="w-5 h-5" />
                    )}
                  </button>
                </div>

                {/* Plain language instruction */}
                <p className="text-sm text-primary font-medium leading-relaxed m-0">
                  {locale === "bn" ? task.instructionBn : task.instructionEn}
                </p>

                {/* Why line */}
                <div className="p-2.5 rounded-lg bg-bg border border-border text-xs text-secondary">
                  <strong className="text-primary mr-1">
                    {locale === "bn" ? "কেন করবেন:" : "Why:"}
                  </strong>
                  <span>{locale === "bn" ? task.whyBn : task.whyEn}</span>
                </div>

                {/* Scaled dosage if present */}
                {task.scaledDosageBn && (
                  <div className="text-xs font-bold text-forest dark:text-leaf">
                    {locale === "bn" ? `প্রয়োজনীয় মাত্রা (${toBengaliNumerals(savedFarm.landSize, "bn")} বিঘার জন্য): ${task.scaledDosageBn}` : `Dose: ${task.scaledDosageEn}`}
                  </div>
                )}

                {/* Buttons: [হয়েছে ✓] [পরে করব] [শুনুন 🔊] */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-border">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="primary"
                      size="md"
                      onClick={() => updateTaskStatus(task.id, "done")}
                      className="gap-1.5 touch-target min-h-[46px] font-bold"
                    >
                      <Check className="w-4 h-4 text-forest" />
                      <span>{locale === "bn" ? "হয়েছে ✓" : "Done"}</span>
                    </Button>

                    <Button
                      variant="outline"
                      size="md"
                      onClick={() => updateTaskStatus(task.id, "skipped")}
                      className="touch-target min-h-[46px] text-secondary"
                    >
                      <span>{locale === "bn" ? "পরে করব" : "Skip / Later"}</span>
                    </Button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleReadTask(task)}
                    className="text-xs text-secondary hover:text-primary flex items-center gap-1 font-semibold touch-target min-h-[36px]"
                  >
                    <Volume2 className="w-4 h-4" />
                    <span>{locale === "bn" ? "শুনুন 🔊" : "Listen"}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 5. "আসছে" (Next 7 Days Tasks) */}
      <section className="space-y-3">
        <h2 className="text-base font-serif font-bold text-primary m-0 flex items-center gap-2">
          <Clock className="w-4 h-4 text-secondary" />
          <span>{locale === "bn" ? "আসছে (পরবর্তী ৭ দিনের কাজ)" : "Next 7 Days"}</span>
        </h2>

        {next7DaysTasks.length === 0 ? (
          <p className="text-xs text-secondary m-0">
            {locale === "bn" ? "পরবর্তী ৭ দিনে কোনো নতুন কাজ নেই।" : "No tasks scheduled in the next 7 days."}
          </p>
        ) : (
          <div className="space-y-2">
            {next7DaysTasks.map((t) => (
              <div
                key={t.id}
                className="p-3.5 rounded-xl bg-surface border border-border flex items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-0.5">
                  <span className="font-mono text-muted text-[10px]">
                    {formatReadableDate(t.dueDate, locale)}
                  </span>
                  <h4 className="font-bold text-primary text-sm m-0">
                    {locale === "bn" ? t.titleBn : t.titleEn}
                  </h4>
                  <p className="text-secondary line-clamp-1 m-0">
                    {locale === "bn" ? t.instructionBn : t.instructionEn}
                  </p>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateTaskStatus(t.id, "done")}
                  className="flex-shrink-0 touch-target"
                >
                  <span>{locale === "bn" ? "হয়েছে" : "Done"}</span>
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 6. Action Bar: Delay Shift, Voice Advisor, New Plan, Print/Share */}
      <div className="p-4 rounded-2xl bg-surface border border-border shadow-xs space-y-3">
        <span className="text-xs font-bold text-secondary block">
          {locale === "bn" ? "খামারের নিয়ন্ত্রণ ও সহায়তা:" : "Farm Actions & Support:"}
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {/* Button 1: Delay Shift Modal */}
          <Button
            variant="outline"
            size="md"
            onClick={() => setDelayModalOpen(true)}
            className="w-full justify-start gap-2 touch-target min-h-[46px]"
          >
            <Clock className="w-4 h-4 text-water" />
            <span>{locale === "bn" ? "দেরি হয়েছে / তারিখ বদলান" : "Shift / Reschedule Dates"}</span>
          </Button>

          {/* Button 2: Ask Question (Context-aware Voice AI) */}
          <Button
            variant="outline"
            size="md"
            onClick={() => setAiModalOpen(true)}
            className="w-full justify-start gap-2 touch-target min-h-[46px]"
          >
            <Sparkles className="w-4 h-4 text-gold-text" />
            <span>{locale === "bn" ? "সমস্যা হয়েছে? জিজ্ঞাসা করুন" : "Ask AI Advisor"}</span>
          </Button>

          {/* Button 3: WhatsApp Share */}
          <Button
            variant="outline"
            size="md"
            onClick={handleShareWeeklyTasks}
            className="w-full justify-start gap-2 touch-target min-h-[46px]"
          >
            <Share2 className="w-4 h-4 text-leaf" />
            <span>{shareSuccess ? (locale === "bn" ? "কপি হয়েছে!" : "Copied!") : (locale === "bn" ? "হোয়াটসঅ্যাপে শেয়ার" : "Share Weekly Plan")}</span>
          </Button>

          {/* Button 4: Print Calendar */}
          <Button
            variant="outline"
            size="md"
            onClick={() => window.print()}
            className="w-full justify-start gap-2 touch-target min-h-[46px]"
          >
            <Printer className="w-4 h-4 text-secondary" />
            <span>{locale === "bn" ? "ছাপুন / এক পাতার চার্ট" : "Print 1-Page Chart"}</span>
          </Button>
        </div>

        {/* Reset / New Plan button */}
        <div className="pt-2 border-t border-border flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              if (confirm(locale === "bn" ? "আপনি কি বর্তমান খামার রিসেট করে নতুন পরিকল্পনা তৈরি করতে চান?" : "Start a new farm plan?")) {
                clearSavedFarm();
              }
            }}
            className="text-xs text-red-600 hover:underline flex items-center gap-1 font-semibold touch-target min-h-[36px]"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{locale === "bn" ? "নতুন পরিকল্পনা শুরু করুন" : "Start New Plan"}</span>
          </button>
        </div>
      </div>

      {/* 7. Full Date-Wise Calendar View (Collapsible) */}
      <div className="p-4 rounded-2xl bg-surface border border-border shadow-xs space-y-3">
        <button
          type="button"
          onClick={() => setFullCalendarOpen((p) => !p)}
          className="w-full flex items-center justify-between text-sm font-serif font-bold text-primary touch-target min-h-[40px]"
        >
          <span className="flex items-center gap-2">
            <CalendarRange className="w-4 h-4 text-forest" />
            <span>{locale === "bn" ? "পুরো পরিকল্পনা (দিনপঞ্জি তালিকা)" : "Full Sowing-to-Harvest Calendar"}</span>
          </span>
          {fullCalendarOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {fullCalendarOpen && (
          <div className="space-y-2.5 pt-2 border-t border-border">
            {tasks.map((t, idx) => (
              <div
                key={t.id}
                className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-3 ${
                  t.status === "done"
                    ? "bg-bg/50 border-border opacity-70"
                    : "bg-surface border-border"
                }`}
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-muted">
                      {formatReadableDate(t.dueDate, locale)}
                    </span>
                    {t.status === "done" && (
                      <span className="text-[10px] text-leaf font-bold">✓ সম্পন্ন</span>
                    )}
                  </div>
                  <span className="font-bold text-primary text-sm block">
                    {locale === "bn" ? t.titleBn : t.titleEn}
                  </span>
                  <span className="text-secondary block">
                    {locale === "bn" ? t.instructionBn : t.instructionEn}
                  </span>
                </div>

                {t.status === "pending" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateTaskStatus(t.id, "done")}
                    className="flex-shrink-0"
                  >
                    <span>✓</span>
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 8. Link Row to Secondary Pages */}
      <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs">
        <Link
          href="/dashboard"
          className="p-3 rounded-xl bg-surface border border-border hover:border-water font-semibold text-primary shadow-xs"
        >
          <span className="block text-base mb-1">📊</span>
          <span>{locale === "bn" ? "জমির অবস্থা" : "Field Data"}</span>
        </Link>
        <Link
          href="/crops"
          className="p-3 rounded-xl bg-surface border border-border hover:border-gold font-semibold text-primary shadow-xs"
        >
          <span className="block text-base mb-1">🌾</span>
          <span>{locale === "bn" ? "ফসলের তথ্য" : "Crops Library"}</span>
        </Link>
        <Link
          href="/more"
          className="p-3 rounded-xl bg-surface border border-border hover:border-forest font-semibold text-primary shadow-xs"
        >
          <span className="block text-base mb-1">⚙️</span>
          <span>{locale === "bn" ? "আরও অপশন" : "More & Settings"}</span>
        </Link>
      </div>

      {/* Delay / Shift Remaining Dates Modal */}
      {delayModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-sm p-5 rounded-2xl bg-surface border border-border shadow-raised space-y-4">
            <h3 className="text-lg font-serif font-bold text-primary m-0">
              {locale === "bn" ? "তারিখ বদলান / পিছিয়ে দিন" : "Shift Remaining Tasks"}
            </h3>
            <p className="text-xs text-secondary m-0">
              {locale === "bn"
                ? "কোন কারণে দেরি হলে বাকি কাজগুলো কত দিন পিছিয়ে দিতে চান?"
                : "Shift all pending tasks forward by N days:"}
            </p>

            <div className="flex items-center gap-2">
              {[3, 5, 7, 10].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDelayDaysInput(d)}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-colors ${
                    delayDaysInput === d
                      ? "bg-forest text-white border-forest"
                      : "bg-bg border-border text-secondary"
                  }`}
                >
                  +{toBengaliNumerals(d, locale)} {locale === "bn" ? "দিন" : "days"}
                </button>
              ))}
            </div>

            {delayWarning && (
              <div className="p-3 rounded-lg bg-amber-500/15 border border-amber-500/30 text-xs text-amber-800 dark:text-amber-300">
                {delayWarning}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setDelayWarning(null);
                  setDelayModalOpen(false);
                }}
              >
                <span>{locale === "bn" ? "বাতিল" : "Cancel"}</span>
              </Button>
              <Button variant="primary" size="sm" onClick={handleApplyDelay}>
                <span>{locale === "bn" ? "তারিখ আপডেট করুন" : "Apply Shift"}</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

