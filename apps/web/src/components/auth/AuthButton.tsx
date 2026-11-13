"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/auth/useAuth";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { LogIn, LogOut, User, Sprout, AlertCircle, Loader2, X, Check, ShieldCheck, ExternalLink } from "lucide-react";

interface AuthButtonProps {
  lang: "bn" | "en";
  onOpenMyFarm?: () => void;
}

export const AuthButton: React.FC<AuthButtonProps> = ({ lang, onOpenMyFarm }) => {
  const {
    user,
    loading,
    authError,
    signInWithGoogle,
    signInWithDemo,
    forceSignInWithGoogle,
    checkGoogleProviderEnabled,
    signOut,
  } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [checkingProvider, setCheckingProvider] = useState(false);

  const t = {
    bn: {
      signIn: "Google দিয়ে সাইন ইন",
      signOut: "সাইন আউট",
      myFarm: "আমার খামার (সংরক্ষিত তথ্য)",
      guest: "অতিথি কৃষক",
      saving: "Google একাউন্টে সংযুক্ত",
      google: "Google একাউন্ট দিয়ে প্রবেশ করুন",
      error: "লগইনে সমস্যা হয়েছে। আবার চেষ্টা করুন।",
      modalTitle: "Google Authentication (গুগল সাইন-ইন)",
      modalSubtitle:
        "আপনার জমির আকার, মাটির ধরন ও ৩-ফসলি পরিকল্পনা ক্লাউডে নিরাপদে সংরক্ষণ করতে Google একাউন্টে প্রবেশ করুন।",
      continueGoogle: "Google প্রোফাইল দিয়ে সরাসরি প্রবেশ (ইন্সট্যান্ট ডেমো)",
      liveGoogleBtn: "লাইভ Google সাইন-ইন রিডাইরেক্ট (Live OAuth)",
      testLogin: "Google টেস্ট একাউন্টে প্রবেশ করুন (Instant Demo)",
      configuredNote: "Supabase Postgres ও Row Level Security (RLS) দ্বারা সংরক্ষিত।",
      unconfiguredWarning:
        "⚠️ আপনার Supabase প্রজেক্টে (xccrinduutnbyuumvonr) Google Provider এখনও সক্রিয় (ON) করা হয়নি।",
      howToSetup: "Supabase-এ আসল Google Login চালুর ৩ ধাপ:",
      step1: "১. Google Cloud Console-এ OAuth Client ID (Web Application) তৈরি করুন।",
      step2: "২. Authorized Redirect URI-তে দিন: https://xccrinduutnbyuumvonr.supabase.co/auth/v1/callback",
      step3: "৩. Supabase Dashboard -> Auth -> Providers -> Google চালু করে Client ID ও Secret দিয়ে Save দিন।",
      close: "বন্ধ করুন",
    },
    en: {
      signIn: "Sign in with Google",
      signOut: "Sign out",
      myFarm: "My Farm (Saved Data)",
      guest: "Guest Farmer",
      saving: "Connected via Google",
      google: "Sign in with your Google account",
      error: "Sign in failed. Please try again.",
      modalTitle: "Google Authentication",
      modalSubtitle:
        "Sign in with your Google account to securely persist your farm size, soil type, and crop rotation plans.",
      continueGoogle: "Sign in with Google Profile (Instant Demo)",
      liveGoogleBtn: "Live Google OAuth Redirect",
      testLogin: "Sign in with Google Test Profile (Instant Demo)",
      configuredNote: "Secured with Supabase Postgres & Row-Level Security (RLS).",
      unconfiguredWarning:
        "⚠️ Google Provider is currently disabled in your Supabase project (xccrinduutnbyuumvonr).",
      howToSetup: "3 Steps to enable Live Google Auth in Supabase:",
      step1: "1. Create an OAuth Client ID in Google Cloud Console.",
      step2: "2. Set Authorized Redirect URI: https://xccrinduutnbyuumvonr.supabase.co/auth/v1/callback",
      step3: "3. In Supabase Dashboard -> Auth -> Providers -> Google, enable and paste credentials.",
      close: "Close",
    },
  }[lang];

  const handleSignInClick = async () => {
    setCheckingProvider(true);
    try {
      const isGoogleEnabled = await checkGoogleProviderEnabled();
      if (isGoogleEnabled) {
        forceSignInWithGoogle();
      } else {
        setShowConfigModal(true);
      }
    } catch {
      setShowConfigModal(true);
    } finally {
      setCheckingProvider(false);
    }
  };

  if (loading || checkingProvider) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-slate-500 text-sm font-medium animate-pulse">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        <span>...</span>
      </div>
    );
  }


  if (user) {
    return (
      <div className="relative inline-block text-left">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-full border border-emerald-600/30 bg-emerald-50 hover:bg-emerald-100/80 text-emerald-950 font-bold text-xs sm:text-sm shadow-xs transition min-h-[42px] cursor-pointer"
          aria-expanded={menuOpen}
          aria-label={t.myFarm}
        >
          {user.avatar_url ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={user.avatar_url} alt="" className="w-6 h-6 rounded-full border border-emerald-700/40 object-cover" />
          ) : (
            <div className="w-6 h-6 rounded-full bg-emerald-800 text-white flex items-center justify-center text-xs font-bold">
              {user.name.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="max-w-[120px] sm:max-w-[150px] truncate">{user.name}</span>
        </button>

        {menuOpen && (
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2">
            <div className="px-4 py-2.5 border-b border-slate-100">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{t.saving}</span>
              </div>
              <p className="font-bold text-slate-900 truncate text-sm mt-0.5">{user.name}</p>
              <p className="text-xs text-slate-500 truncate">{user.email}</p>
            </div>

            {onOpenMyFarm && (
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onOpenMyFarm();
                }}
                className="w-full text-left px-4 py-3 text-sm text-slate-800 hover:bg-emerald-50 flex items-center gap-2.5 font-semibold transition min-h-[44px] cursor-pointer"
              >
                <Sprout className="w-4 h-4 text-emerald-700" />
                <span>{t.myFarm}</span>
              </button>
            )}

            <button
              onClick={() => {
                setMenuOpen(false);
                signOut();
              }}
              className="w-full text-left px-4 py-3 text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 font-medium transition min-h-[44px] cursor-pointer border-t border-slate-100"
            >
              <LogOut className="w-4 h-4 text-rose-500" />
              <span>{t.signOut}</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="relative inline-block">
        <button
          onClick={handleSignInClick}
          className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-slate-300 bg-white hover:bg-slate-50 hover:border-slate-400 text-slate-800 font-bold text-xs sm:text-sm shadow-xs transition min-h-[42px] cursor-pointer group"
          title={t.google}
        >
          <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span className="whitespace-nowrap">{t.signIn}</span>
        </button>

        {authError && (
          <div className="absolute right-0 mt-2 w-80 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-2xl p-3 shadow-xl z-50 space-y-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">{t.error}</p>
                <p className="text-[11px] text-rose-600 mt-0.5 leading-tight">{authError}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowConfigModal(true)}
              className="w-full text-center py-1.5 px-3 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-900 font-semibold text-[11px] transition cursor-pointer"
            >
              {lang === "bn" ? "টেস্ট প্রোফাইলে প্রবেশ বা সহায়তা দেখুন" : "View Help or Use Demo"}
            </button>
          </div>
        )}
      </div>

      {/* Google Auth Status / Connect Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative space-y-4">
            <button
              onClick={() => setShowConfigModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition min-h-[36px] min-w-[36px]"
              aria-label={t.close}
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center">
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-900 leading-snug">{t.modalTitle}</h3>
                <p className="text-xs text-slate-500">{t.configuredNote}</p>
              </div>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed">
              {t.modalSubtitle}
            </p>

            {/* Instant Demo Google Sign-in */}
            <button
              type="button"
              onClick={() => {
                signInWithDemo();
                setShowConfigModal(false);
              }}
              className="w-full py-3.5 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm flex items-center justify-center gap-2.5 shadow-md active:scale-[0.99] transition min-h-[50px] cursor-pointer"
            >
              <svg className="w-5 h-5 bg-white rounded-full p-0.5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{t.continueGoogle}</span>
            </button>

            {/* Supabase Status & Setup Guide */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-950 space-y-2.5">
              <div className="flex items-center gap-1.5 font-bold text-amber-900">
                <AlertCircle className="w-4 h-4 text-amber-700 flex-shrink-0" />
                <span>{t.unconfiguredWarning}</span>
              </div>

              <div className="text-[11px] text-amber-900 space-y-1.5 pt-1.5 border-t border-amber-200">
                <p className="font-bold">{t.howToSetup}</p>
                <p>{t.step1}</p>
                <div>
                  <span className="block mb-1">{lang === "bn" ? "২. Authorized Redirect URI-তে দিন:" : "2. Authorized Redirect URI:"}</span>
                  <code className="bg-amber-100/90 px-2 py-1 rounded text-[10px] select-all font-mono font-bold text-amber-950 block border border-amber-300 break-all">
                    https://xccrinduutnbyuumvonr.supabase.co/auth/v1/callback
                  </code>
                </div>
                <p>{t.step3}</p>
              </div>

              <div className="pt-2 border-t border-amber-200/80 flex items-center justify-between gap-2">
                <span className="text-[11px] text-amber-800 font-medium">
                  {lang === "bn" ? "সেটআপ শেষ করে থাকলে:" : "If already configured:"}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    forceSignInWithGoogle();
                    setShowConfigModal(false);
                  }}
                  className="px-3 py-1.5 bg-white border border-amber-300 hover:bg-amber-100 text-amber-950 rounded-lg font-bold text-[11px] transition cursor-pointer"
                >
                  {t.liveGoogleBtn}
                </button>
              </div>
            </div>


            <button
              type="button"
              onClick={() => setShowConfigModal(false)}
              className="w-full py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
            >
              {t.close}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
