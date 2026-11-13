import React from "react";
import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { routing, type Locale } from "@/i18n/routing";
import { Header } from "@/components/layout/Header";
import { ContextBar } from "@/components/layout/ContextBar";
import { BottomTabBar } from "@/components/layout/BottomTabBar";
import { OfflineBanner } from "@/components/layout/OfflineBanner";
import { AiAssistantSlot } from "@/components/layout/AiAssistantSlot";
import "@/styles/globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5, // Allow up to 200%+ zoom for WCAG AA compliance
  themeColor: "#1B3B2B",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isBn = locale === "bn";

  const title = isBn
    ? "ফার্মস্কেল – নাসা স্যাটেলাইট তথ্যে বরেন্দ্র কৃষি পরিকল্পনা"
    : "FarmScale – Climate-Adapted Crop Rotations with NASA Earth Data";

  const description = isBn
    ? "নাসা স্যাটেলাইট ও মাটির তথ্য সমন্বয় করে রাজশাহী ও বরেন্দ্র অঞ্চলের জন্য উপযোগী ৩-ফসলি লাভজনক পর্যায় পরিকল্পনা।"
    : "Decision-support web app combining NASA Earth observations, local soil metrics and farmer priorities to plan resilient 3-season crop rotations.";

  return {
    title: {
      template: "%s | FarmScale",
      default: title,
    },
    description,
    metadataBase: new URL("https://farmscale-web.vercel.app"),
    alternates: {
      canonical: `/${locale}`,
      languages: {
        en: "/en",
        bn: "/bn",
        "x-default": "/bn",
      },
    },
    icons: {
      icon: "/favicon.ico",
    },
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

interface RootLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function RootLayout({
  children,
  params,
}: RootLayoutProps) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as Locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  // Determine script-specific class for font scoping
  const scriptClass = locale === "bn" ? "font-bengali" : "font-latin";

  return (
    <html lang={locale} className={scriptClass} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="/" />
        {/* Service Worker Registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').catch(function(){});
                });
              }
            `,
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col bg-bg text-primary transition-colors">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <OfflineBanner />
          <Header />
          <ContextBar />
          <main className="flex-1 pb-24 md:pb-12 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            {children}
          </main>
          <AiAssistantSlot />
          <BottomTabBar />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
