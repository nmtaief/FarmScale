"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/auth/useAuth";
import { LogIn, LogOut, User, Sprout, AlertCircle, Loader2 } from "lucide-react";

interface AuthButtonProps {
  lang: "bn" | "en";
  onOpenMyFarm?: () => void;
}

export const AuthButton: React.FC<AuthButtonProps> = ({ lang, onOpenMyFarm }) => {
  const { user, loading, authError, signInWithGoogle, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const t = {
    bn: {
      signIn: "সাইন ইন",
      signOut: "সাইন আউট",
      myFarm: "আমার খামার",
      guest: "অতিথি কৃষক",
      saving: "তথ্য সংরক্ষিত হচ্ছে",
      google: "Google দিয়ে প্রবেশ",
      error: "লগইনে সমস্যা হয়েছে। আবার চেষ্টা করুন।",
    },
    en: {
      signIn: "Sign in",
      signOut: "Sign out",
      myFarm: "My Farm",
      guest: "Guest Farmer",
      saving: "Data is saved",
      google: "Sign in with Google",
      error: "Sign in failed. Please try again.",
    },
  }[lang];

  if (loading) {
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
          className="flex items-center gap-2 px-3 py-2 rounded-full border border-primary/20 bg-emerald-50 text-primary font-medium text-sm hover:bg-emerald-100 transition min-h-[44px]"
          aria-expanded={menuOpen}
          aria-label={t.myFarm}
        >
          {user.avatar_url ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={user.avatar_url} alt="" className="w-6 h-6 rounded-full border border-primary/30" />
          ) : (
            <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">
              {user.name.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="max-w-[100px] truncate">{user.name}</span>
        </button>

        {menuOpen && (
          <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2">
            <div className="px-4 py-2 border-b border-slate-100">
              <p className="text-xs text-slate-500">{t.saving}</p>
              <p className="font-semibold text-primary truncate text-sm">{user.name}</p>
            </div>

            {onOpenMyFarm && (
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onOpenMyFarm();
                }}
                className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 font-medium transition min-h-[44px]"
              >
                <Sprout className="w-4 h-4 text-emerald-600" />
                <span>{t.myFarm}</span>
              </button>
            )}

            <button
              onClick={() => {
                setMenuOpen(false);
                signOut();
              }}
              className="w-full text-left px-4 py-3 text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 font-medium transition min-h-[44px]"
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
    <div className="relative inline-block">
      <button
        onClick={signInWithGoogle}
        className="flex items-center gap-2 px-3.5 py-2 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm shadow-sm transition min-h-[44px]"
        title={t.google}
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24">
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
        <span>{t.signIn}</span>
      </button>

      {authError && (
        <div className="absolute right-0 mt-2 w-64 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl p-2.5 flex items-center gap-2 shadow-lg z-50">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{t.error}</span>
        </div>
      )}
    </div>
  );
};
