"use client";

import React, { useState, useEffect } from "react";
import { useAuth, UserFarmData } from "@/lib/auth/useAuth";
import { ALL_RAJSHAHI_UPAZILAS, RAJSHAHI_DISTRICTS } from "@/lib/recommend/recommendData";
import { X, Sprout, Save, CheckCircle2, MapPin, Layers, Droplets, LogOut } from "lucide-react";

interface MyFarmModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: "bn" | "en";
  currentUpazilaEn?: string;
  currentDistrictEn?: string;
  onSaveLocation?: (districtEn: string, upazilaEn: string) => void;
}

export const MyFarmModal: React.FC<MyFarmModalProps> = ({
  isOpen,
  onClose,
  lang,
  currentUpazilaEn = "Godagari",
  currentDistrictEn = "Rajshahi",
  onSaveLocation,
}) => {
  const { user, saveFarm, loadSavedFarm, signOut } = useAuth();

  const [districtEn, setDistrictEn] = useState<string>(currentDistrictEn);
  const [upazilaEn, setUpazilaEn] = useState<string>(currentUpazilaEn);
  const [landSize, setLandSize] = useState<number>(1.0);
  const [landUnit, setLandUnit] = useState<"bigha" | "decimal" | "acre">("bigha");
  const [soilType, setSoilType] = useState<string>("clay_loam");
  const [irrigation, setIrrigation] = useState<string>("deep_tubewell");
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);

  const t = {
    bn: {
      title: "আমার খামার (My Farm)",
      subtitle: "আপনার জমির তথ্য সংরক্ষণ করুন, আমরা প্রতিবার ব্যক্তিগত সুপারিশ দেখাব।",
      district: "জেলা",
      upazila: "উপজেলা",
      landSize: "জমির পরিমাণ",
      unit: "একক",
      bigha: "বিঘা (৩৩ শতক)",
      decimal: "শতক / ডেসিমাল",
      acre: "একর",
      soil: "মাটির ধরন",
      clayLoam: "এঁটেল দোআঁশ (বরেন্দ্র লাল মাটি)",
      loam: "দোআঁশ মাটি",
      sandyLoam: "বেলে দোআঁশ মাটি",
      clay: "ভারী এঁটেল মাটি",
      irrigationSource: "সেচের ব্যবস্থা",
      deepTubewell: "বরেন্দ্র গভীর নলকূপ (BMDA)",
      shallowTubewell: "অগভীর নলকূপ (STW)",
      canal: "খাল / বিল / নদী",
      rainfed: "বৃষ্টি নির্ভর",
      saveBtn: "সংরক্ষণ করুন",
      savedMsg: "জমির তথ্য সফলভাবে সংরক্ষিত হয়েছে!",
      signOut: "সাইন আউট",
      close: "বন্ধ করুন",
    },
    en: {
      title: "My Farm",
      subtitle: "Save your farm details for personalized crop rotation recommendations.",
      district: "District",
      upazila: "Upazila",
      landSize: "Land Size",
      unit: "Unit",
      bigha: "Bigha (33 decimals)",
      decimal: "Decimal",
      acre: "Acre",
      soil: "Soil Type",
      clayLoam: "Clay Loam (Barind Red Soil)",
      loam: "Loam",
      sandyLoam: "Sandy Loam",
      clay: "Heavy Clay",
      irrigationSource: "Irrigation Access",
      deepTubewell: "Deep Tubewell (BMDA)",
      shallowTubewell: "Shallow Tubewell (STW)",
      canal: "Canal / River / Pond",
      rainfed: "Rainfed",
      saveBtn: "Save Farm Details",
      savedMsg: "Farm details saved successfully!",
      signOut: "Sign out",
      close: "Close",
    },
  }[lang];

  useEffect(() => {
    if (isOpen) {
      loadSavedFarm().then((saved) => {
        if (saved) {
          setDistrictEn(saved.district_en);
          setUpazilaEn(saved.upazila_en);
          setLandSize(saved.land_size || 1.0);
          setLandUnit(saved.land_unit || "bigha");
          if (saved.soil_type) setSoilType(saved.soil_type);
          if (saved.irrigation_access) setIrrigation(saved.irrigation_access);
        } else {
          setDistrictEn(currentDistrictEn);
          setUpazilaEn(currentUpazilaEn);
        }
      });
    }
  }, [isOpen, loadSavedFarm, currentDistrictEn, currentUpazilaEn]);

  if (!isOpen) return null;

  const filteredUpazilas = ALL_RAJSHAHI_UPAZILAS.filter(
    (u) => u.district_en.toLowerCase() === districtEn.toLowerCase()
  );

  const handleDistrictChange = (d: string) => {
    setDistrictEn(d);
    const newUpzs = ALL_RAJSHAHI_UPAZILAS.filter((u) => u.district_en.toLowerCase() === d.toLowerCase());
    if (newUpzs.length > 0) {
      setUpazilaEn(newUpzs[0].upazila_en);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const matchedUpz = ALL_RAJSHAHI_UPAZILAS.find(
      (u) => u.district_en.toLowerCase() === districtEn.toLowerCase() && u.upazila_en.toLowerCase() === upazilaEn.toLowerCase()
    );

    const farmData: UserFarmData = {
      district_en: districtEn,
      district_bn: matchedUpz?.district_bn || districtEn,
      upazila_en: upazilaEn,
      upazila_bn: matchedUpz?.upazila_bn || upazilaEn,
      lat: matchedUpz?.lat || 24.37,
      lon: matchedUpz?.lon || 88.60,
      land_size: landSize,
      land_unit: landUnit,
      soil_type: soilType,
      irrigation_access: irrigation,
    };

    await saveFarm(farmData);
    if (onSaveLocation) {
      onSaveLocation(districtEn, upazilaEn);
    }
    setSaving(false);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-emerald-800 text-white">
          <div className="flex items-center gap-2.5">
            <Sprout className="w-6 h-6 text-amber-300" />
            <div>
              <h2 className="text-lg font-bold tracking-tight">{t.title}</h2>
              {user && <p className="text-xs text-emerald-200">{user.email}</p>}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-emerald-700/60 transition min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label={t.close}
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-slate-800">
          <p className="text-xs text-slate-500">{t.subtitle}</p>

          {/* Location Cascading Select */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
            <div className="flex items-center gap-2 text-primary font-semibold text-sm">
              <MapPin className="w-4 h-4 text-emerald-700" />
              <span>অবস্থান (Location)</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">{t.district}</label>
                <select
                  value={districtEn}
                  onChange={(e) => handleDistrictChange(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white font-medium text-sm text-slate-800 focus:ring-2 focus:ring-primary min-h-[44px]"
                >
                  {RAJSHAHI_DISTRICTS.map((d) => (
                    <option key={d.en} value={d.en}>
                      {lang === "bn" ? d.bn : d.en}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">{t.upazila}</label>
                <select
                  value={upazilaEn}
                  onChange={(e) => setUpazilaEn(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white font-medium text-sm text-slate-800 focus:ring-2 focus:ring-primary min-h-[44px]"
                >
                  {filteredUpazilas.map((u) => (
                    <option key={u.upazila_en} value={u.upazila_en}>
                      {lang === "bn" ? u.upazila_bn : u.upazila_en}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Land Size & Unit */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
            <div className="flex items-center gap-2 text-primary font-semibold text-sm">
              <Layers className="w-4 h-4 text-emerald-700" />
              <span>জমির মাপ (Land Size)</span>
            </div>

            <div className="grid grid-cols-2 gap-3 items-center">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">{t.landSize}</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={landSize}
                  onChange={(e) => setLandSize(parseFloat(e.target.value) || 1.0)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white font-bold text-sm text-slate-800 focus:ring-2 focus:ring-primary min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">{t.unit}</label>
                <select
                  value={landUnit}
                  onChange={(e) => setLandUnit(e.target.value as any)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white font-medium text-sm text-slate-800 focus:ring-2 focus:ring-primary min-h-[44px]"
                >
                  <option value="bigha">{t.bigha}</option>
                  <option value="decimal">{t.decimal}</option>
                  <option value="acre">{t.acre}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Soil & Irrigation */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-amber-600" />
                <span>{t.soil}</span>
              </label>
              <select
                value={soilType}
                onChange={(e) => setSoilType(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white font-medium text-xs text-slate-800 min-h-[44px]"
              >
                <option value="clay_loam">{t.clayLoam}</option>
                <option value="loam">{t.loam}</option>
                <option value="sandy_loam">{t.sandyLoam}</option>
                <option value="clay">{t.clay}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1 flex items-center gap-1.5">
                <Droplets className="w-3.5 h-3.5 text-sky-600" />
                <span>{t.irrigationSource}</span>
              </label>
              <select
                value={irrigation}
                onChange={(e) => setIrrigation(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white font-medium text-xs text-slate-800 min-h-[44px]"
              >
                <option value="deep_tubewell">{t.deepTubewell}</option>
                <option value="shallow_tubewell">{t.shallowTubewell}</option>
                <option value="canal">{t.canal}</option>
                <option value="rainfed">{t.rainfed}</option>
              </select>
            </div>
          </div>

          {savedSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>{t.savedMsg}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
          {user ? (
            <button
              onClick={signOut}
              className="px-3.5 py-2.5 text-rose-600 hover:bg-rose-50 rounded-xl text-sm font-semibold flex items-center gap-1.5 transition min-h-[44px]"
            >
              <LogOut className="w-4 h-4" />
              <span>{t.signOut}</span>
            </button>
          ) : (
            <span className="text-xs text-slate-400">গেস্ট মোড</span>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-sm font-bold shadow-md hover:shadow transition flex items-center gap-2 min-h-[44px]"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "..." : t.saveBtn}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
