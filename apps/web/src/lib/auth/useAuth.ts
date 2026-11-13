"use client";

import { useEffect, useState, useCallback } from "react";
import { getSupabase, isSupabaseConfigured } from "../supabase/client";

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  language_preference: "bn" | "en";
}

export interface UserFarmData {
  district_en: string;
  district_bn: string;
  upazila_en: string;
  upazila_bn: string;
  lat: number;
  lon: number;
  land_size: number;
  land_unit: "bigha" | "decimal" | "acre";
  soil_type?: string;
  irrigation_access?: string;
  chosen_plan_key?: string;
  chosen_crops?: string[];
  start_season?: string;
}

export function useAuth() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase || !isSupabaseConfigured) {
      // Offline / guest mode: Check local storage for guest session
      try {
        const local = localStorage.getItem("farmscale_guest_profile");
        if (local) setUser(JSON.parse(local));
      } catch {}
      setLoading(false);
      return;
    }

    // Get current session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        setAuthError(error.message);
      } else if (session?.user) {
        const u = session.user;
        setUser({
          id: u.id,
          email: u.email || "",
          name: u.user_metadata?.full_name || u.user_metadata?.name || u.email?.split("@")[0] || "Farmer",
          avatar_url: u.user_metadata?.avatar_url || u.user_metadata?.picture,
          language_preference: "bn",
        });
      }
      setLoading(false);
    });

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const u = session.user;
        setUser({
          id: u.id,
          email: u.email || "",
          name: u.user_metadata?.full_name || u.user_metadata?.name || u.email?.split("@")[0] || "Farmer",
          avatar_url: u.user_metadata?.avatar_url || u.user_metadata?.picture,
          language_preference: "bn",
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Check if Google OAuth provider is enabled on Supabase
  const checkGoogleProviderEnabled = async (): Promise<boolean> => {
    try {
      const res = await fetch(
        "https://xccrinduutnbyuumvonr.supabase.co/auth/v1/settings",
        {
          headers: {
            apikey:
              process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
              process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
              "sb_publishable_ENT7Wm9kxSoRqATRovmejQ_fWEWV-J8",
          },
        }
      );
      if (res.ok) {
        const data = await res.json();
        return Boolean(data?.external?.google);
      }
    } catch {}
    return false;
  };

  const signInWithDemo = useCallback(
    (name = "নূর মোহাম্মদ তায়েফ", email = "nmtaief.agro@gmail.com") => {
      const demoUser: UserProfile = {
        id: "usr_demo_taief",
        email,
        name,
        avatar_url: "https://lh3.googleusercontent.com/a/default-user=s96-c",
        language_preference: "bn",
      };
      try {
        localStorage.setItem(
          "farmscale_guest_profile",
          JSON.stringify(demoUser)
        );
      } catch {}
      setUser(demoUser);
    },
    []
  );

  const signInWithGoogle = useCallback(async () => {
    setAuthError(null);
    const supabase = getSupabase();
    if (!supabase || !isSupabaseConfigured) {
      signInWithDemo();
      return;
    }

    // Check if provider is enabled on Supabase to prevent raw JSON 400 error
    const isGoogleEnabled = await checkGoogleProviderEnabled();
    if (!isGoogleEnabled) {
      setAuthError(
        "Supabase ড্যাশবোর্ডে Google Provider এখনও চালু করা হয়নি। টেস্ট প্রোফাইল ব্যবহার করুন অথবা Supabase-এ Google চালু করুন।"
      );
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo:
            typeof window !== "undefined" ? window.location.origin : undefined,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setAuthError(err?.message || "Google sign in failed");
    }
  }, [signInWithDemo]);

  // Direct forced OAuth (if user just enabled it in dashboard)
  const forceSignInWithGoogle = useCallback(async () => {
    setAuthError(null);
    const supabase = getSupabase();
    if (!supabase || !isSupabaseConfigured) {
      signInWithDemo();
      return;
    }
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo:
            typeof window !== "undefined" ? window.location.origin : undefined,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setAuthError(err?.message || "Google sign in failed");
    }
  }, [signInWithDemo]);

  const signOut = useCallback(async () => {
    const supabase = getSupabase();
    if (supabase && isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    try {
      localStorage.removeItem("farmscale_guest_profile");
      localStorage.removeItem("farmscale_saved_farm");
    } catch {}
    setUser(null);
  }, []);

  // Save farm settings to Postgres (or localStorage fallback)
  const saveFarm = useCallback(
    async (farm: UserFarmData) => {
      try {
        localStorage.setItem("farmscale_saved_farm", JSON.stringify(farm));
      } catch {}

      const supabase = getSupabase();
      if (!supabase || !isSupabaseConfigured || !user) return;

      try {
        await supabase.from("user_farms").upsert(
          {
            user_id: user.id,
            district_en: farm.district_en,
            district_bn: farm.district_bn,
            upazila_en: farm.upazila_en,
            upazila_bn: farm.upazila_bn,
            lat: farm.lat,
            lon: farm.lon,
            land_size: farm.land_size,
            land_unit: farm.land_unit,
            soil_type: farm.soil_type || "clay_loam",
            irrigation_access: farm.irrigation_access || "deep_tubewell",
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );
      } catch (err) {
        console.error("Failed to persist farm to Supabase:", err);
      }
    },
    [user]
  );

  // Load saved farm settings
  const loadSavedFarm = useCallback(async (): Promise<UserFarmData | null> => {
    const supabase = getSupabase();
    if (supabase && isSupabaseConfigured && user) {
      try {
        const { data, error } = await supabase
          .from("user_farms")
          .select("*")
          .eq("user_id", user.id)
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (data && !error) {
          return {
            district_en: data.district_en,
            district_bn: data.district_bn,
            upazila_en: data.upazila_en,
            upazila_bn: data.upazila_bn,
            lat: data.lat,
            lon: data.lon,
            land_size: data.land_size,
            land_unit: data.land_unit,
            soil_type: data.soil_type,
            irrigation_access: data.irrigation_access,
          };
        }
      } catch {}
    }

    // Fallback to local storage
    try {
      const local = localStorage.getItem("farmscale_saved_farm");
      if (local) return JSON.parse(local);
    } catch {}

    return null;
  }, [user]);

  return {
    user,
    loading,
    authError,
    signInWithGoogle,
    signInWithDemo,
    forceSignInWithGoogle,
    checkGoogleProviderEnabled,
    signOut,
    saveFarm,
    loadSavedFarm,
    isConfigured: isSupabaseConfigured,
  };
}
