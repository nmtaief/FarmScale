"""Network-free mock LLM provider for tests and demo mode."""

from __future__ import annotations

import json
import re
from typing import Any

from crop_layer.loader import get_gazetteer


def _has_bangla(text: str) -> bool:
    return bool(re.search(r"[\u0980-\u09ff]", text))


def _extract_json_block(text: str) -> dict[str, Any] | None:
    """Extract the first JSON object embedded in a prompt."""
    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end == -1 or end <= start:
        return None
    try:
        return json.loads(text[start : end + 1])
    except json.JSONDecodeError:
        return None


class MockProvider:
    """Deterministic, network-free LLM provider for tests and demo mode."""

    name = "mock"

    def list_models(self) -> list[str]:
        return ["mock-farmscale-v1"]

    def chat(
        self,
        messages: list[dict[str, str]],
        model: str = "mock-farmscale-v1",
        temperature: float = 0.0,
        max_tokens: int = 1024,
        json_mode: bool = False,
    ) -> dict[str, Any]:
        sys_text = "\n".join(m["content"] for m in messages if m.get("role") == "system")
        user_text = "\n".join(m["content"] for m in messages if m.get("role") == "user")

        if "FARMSCALE_TASK:INTENT_PARSER" in sys_text:
            out_text = json.dumps(self._mock_intent(user_text), ensure_ascii=False)
        elif "FARMSCALE_TASK:INTERPRETER" in sys_text:
            out_text = json.dumps(self._mock_interpret(user_text), ensure_ascii=False)
        elif "FARMSCALE_TASK:OPTION_DETAIL" in sys_text:
            out_text = json.dumps(self._mock_detail(user_text), ensure_ascii=False)
        else:
            out_text = self._mock_followup(user_text)

        return {
            "text": out_text,
            "usage": {"input_tokens": len(user_text) // 4, "output_tokens": len(out_text) // 4, "total_tokens": (len(user_text) + len(out_text)) // 4},
            "latency": 0.01,
            "provider": self.name,
            "model": model or "mock-farmscale-v1",
        }

    def _mock_intent(self, user_text: str) -> dict[str, Any]:
        ctx = _extract_json_block(user_text) or {}
        raw_msg = str(ctx.get("message", user_text))
        lower = raw_msg.lower()
        lang = ctx.get("language") or ("bn" if _has_bangla(raw_msg) else "en")

        # Goal detection
        goal: str | None = ctx.get("goal_id")
        intent = "advise"
        if not goal:
            if any(k in lower for k in ("most production", "maximum yield", "সবচেয়ে বেশি ফলন", "বেশি ফলন")):
                goal = "max_production"
            elif any(k in lower for k in ("profit", "cash", "income", "লাভ", "আয়")):
                goal = "cash_crop"
            elif any(k in lower for k in ("fertility", "fertile", "soil", "উর্বরতা", "মাটির উর্বরতা")):
                goal = "soil_fertility"
            elif any(k in lower for k in ("protect", "preserve", "erosion", "রক্ষা", "সংরক্ষণ")):
                goal = "land_preservation"
            elif any(k in lower for k in ("easier", "cultivate", "cultivability", "চাষের উপযোগী", "চাষযোগ্য")):
                goal = "cultivability"
            else:
                goal = "cash_crop"

        # Location extraction from Rajshahi Division gazetteer
        loc = dict(ctx.get("location") or {})
        if not loc.get("upazila") and not loc.get("latitude"):
            gaz = get_gazetteer()
            for d in gaz.get("districts", []):
                for u in d["upazilas"]:
                    if u["upazila"].lower() in lower or (u.get("upazila_bn") and u["upazila_bn"] in raw_msg):
                        loc = {"district": d["district"], "upazila": u["upazila"]}
                        break
                if loc.get("upazila"):
                    break
            if not loc.get("upazila"):
                for d in gaz.get("districts", []):
                    if d["district"].lower() in lower or (d.get("district_bn") and d["district_bn"] in raw_msg):
                        loc = {"district": d["district"], "upazila": None}
                        break

        missing_loc = not (loc.get("upazila") or loc.get("district") or (loc.get("latitude") is not None and loc.get("longitude") is not None))
        clarifying = None
        confidence = 0.92
        if missing_loc:
            confidence = 0.35
            clarifying = (
                "আপনি কোন জেলা ও উপজেলায় চাষ করেন?"
                if lang == "bn"
                else "Which district and upazila in Rajshahi Division is your farm in?"
            )

        return {
            "intent": intent,
            "goal": goal,
            "location": {
                "district": loc.get("district"),
                "upazila": loc.get("upazila"),
                "latitude": loc.get("latitude"),
                "longitude": loc.get("longitude"),
            },
            "season": ctx.get("season", "annual"),
            "language": lang,
            "constraints": {
                "irrigation_available": None,
                "land_size": None,
                "avoid_crops": [],
            },
            "confidence": confidence,
            "clarifying_question": clarifying,
        }

    def _mock_interpret(self, user_text: str) -> dict[str, Any]:
        ctx = _extract_json_block(user_text) or {}
        lang = ctx.get("language", "en")
        ml = ctx.get("ml_payload") or {}
        telemetry = ml.get("telemetry_used") or {}
        weather = telemetry.get("nasa_power_weather") or {}
        smap = telemetry.get("smap_soil_moisture") or {}
        soil = telemetry.get("soilgrids_soil") or {}
        precip_unit = ctx.get("precip_unit", "mm/day")
        meta = ml.get("ml_metadata") or {}

        temp = weather.get("temp_mean_c")
        precip = weather.get("precip_mm")
        sm_pctl = smap.get("sm_rootzone_pctl")
        ph = soil.get("ph")

        options = []
        for rot in ml.get("ranked_rotations") or []:
            m = rot.get("metrics") or {}
            env = rot.get("environmental_factors") or {}
            name = rot.get("bengali_name") if (lang == "bn" and rot.get("bengali_name")) else rot.get("name")
            if lang == "bn":
                reason = (
                    f"স্কোর {rot['score']}, মোট ফলন {m.get('total_yield_t_ha')} t/ha, "
                    f"নিট নাইট্রোজেন ভারসাম্য {m.get('net_n_balance_kg_ha')} kg N/ha, "
                    f"তাপমাত্রা {temp}°C এবং মাটির pH {ph}।"
                )
                tel_note = (
                    f"তাপমাত্রা {temp}°C, বৃষ্টিপাত {precip} {precip_unit}, "
                    f"মূল-অঞ্চলের আর্দ্রতা {sm_pctl}% পর্সেন্টাইল, মাটির pH {ph}, "
                    f"পানির পর্যাপ্ততা {env.get('water_adequacy_pct')}%।"
                )
            else:
                reason = (
                    f"Score {rot['score']}, total yield {m.get('total_yield_t_ha')} t/ha, "
                    f"net N balance {m.get('net_n_balance_kg_ha')} kg N/ha, "
                    f"suited to {temp}°C mean temp and soil pH {ph}."
                )
                tel_note = (
                    f"Temp {temp}°C, precip {precip} {precip_unit}, "
                    f"rootzone moisture {sm_pctl} percentile, soil pH {ph}, "
                    f"water adequacy {env.get('water_adequacy_pct')}%."
                )
            options.append(
                {
                    "rank": rot["rank"],
                    "id": rot["id"],
                    "name": name,
                    "score": rot["score"],
                    "reason": reason,
                    "telemetry_note": tel_note,
                }
            )

        data_status = meta.get("data_status")
        data_status_note = None
        if data_status and str(data_status).lower() == "preparing":
            data_status_note = (
                "কিছু তথ্য এখনো প্রস্তুত হচ্ছে (preparing)।"
                if lang == "bn"
                else "Note: some satellite/soil data is still being prepared."
            )

        if lang == "bn":
            summary = f"আপনার এলাকার গড় তাপমাত্রা {temp}°C, বৃষ্টিপাত {precip} {precip_unit} এবং মাটির pH {ph} অনুযায়ী নিচের ৩টি শস্য পর্যায় সাজানো হয়েছে।"
            caveat = "এগুলো কোনো নিশ্চিত ফলন বা লাভের প্রতিশ্রুতি নয়। চূড়ান্ত সিদ্ধান্তের আগে আপনার স্থানীয় কৃষি সম্প্রসারণ কর্মকর্তার সাথে পরামর্শ করুন।"
        else:
            summary = f"Based on local conditions ({temp}°C mean temperature, {precip} {precip_unit} precipitation, soil pH {ph}), here are the top ranked rotations."
            caveat = "These are model-based estimates, not guaranteed yields or profits. Please confirm with your local agriculture extension officer."

        return {
            "summary": summary,
            "options": options,
            "telemetry_summary": f"Temp {temp}°C, precip {precip} {precip_unit}, soil pH {ph}, rootzone moisture {sm_pctl} pctl.",
            "caveat": caveat,
            "data_status_note": data_status_note,
        }

    def _mock_detail(self, user_text: str) -> dict[str, Any]:
        ctx = _extract_json_block(user_text) or {}
        lang = ctx.get("language", "en")
        rot = ctx.get("option") or {}
        m = rot.get("metrics") or {}
        env = rot.get("environmental_factors") or {}
        seasons = rot.get("seasons") or []
        pattern = rot.get("pattern") or []
        crops_meta = {c["id"]: c for c in (ctx.get("layer2_crops") or []) if isinstance(c, dict) and "id" in c}

        breakdown = []
        for s, cid in zip(seasons, pattern):
            c = crops_meta.get(cid, {})
            cname = c.get("name_bn") if lang == "bn" else c.get("name_en", cid)
            dur = c.get("duration_days")
            yld = c.get("typical_yield_t_ha")
            if lang == "bn":
                breakdown.append(f"{s}: {cname or cid}" + (f" ({dur} দিন, সাধারণ ফলন {yld} t/ha)" if dur and yld else ""))
            else:
                breakdown.append(f"{s}: {cname or cid}" + (f" ({dur} days, typical yield {yld} t/ha)" if dur and yld else ""))

        title = rot.get("bengali_name") if (lang == "bn" and rot.get("bengali_name")) else rot.get("name", "Rotation")
        if lang == "bn":
            metrics_summary = (
                f"মোট সময়কাল {m.get('total_duration_days')} দিন, মোট ফলন {m.get('total_yield_t_ha')} t/ha, "
                f"নিট নাইট্রোজেন ভারসাম্য {m.get('net_n_balance_kg_ha')} kg N/ha, "
                f"মাটির আচ্ছাদন স্কোর {m.get('soil_cover_score')}, খরা সহনশীলতা {m.get('drought_resilience')}।"
            )
            telemetry_fit = (
                f"তাপমাত্রা উপযোগিতা {env.get('thermal_comfort_pct')}%, pH উপযোগিতা {env.get('ph_suitability_pct')}%, "
                f"পানির পর্যাপ্ততা {env.get('water_adequacy_pct')}%।"
            )
            caveat = "চূড়ান্ত সিদ্ধান্তের আগে স্থানীয় কৃষি কর্মকর্তার সাথে পরামর্শ করুন।"
        else:
            metrics_summary = (
                f"Total duration {m.get('total_duration_days')} days, total yield {m.get('total_yield_t_ha')} t/ha, "
                f"net N balance {m.get('net_n_balance_kg_ha')} kg N/ha, "
                f"soil cover score {m.get('soil_cover_score')}, drought resilience {m.get('drought_resilience')}."
            )
            telemetry_fit = (
                f"Thermal comfort {env.get('thermal_comfort_pct')}%, pH suitability {env.get('ph_suitability_pct')}%, "
                f"water adequacy {env.get('water_adequacy_pct')}%."
            )
            caveat = "Not a guarantee of yield or profit. Confirm with your local agriculture extension officer."

        return {
            "rank": rot.get("rank", 1),
            "title": title,
            "season_breakdown": breakdown,
            "metrics_summary": metrics_summary,
            "telemetry_fit": telemetry_fit,
            "caveat": caveat,
        }

    def _mock_followup(self, user_text: str) -> str:
        if _has_bangla(user_text):
            return "পূর্বের ফলাফলের ভিত্তিতে: অনুগ্রহ করে প্রদর্শিত মেট্রিক্স দেখুন এবং চূড়ান্ত সিদ্ধান্তের আগে স্থানীয় কৃষি কর্মকর্তার সাথে পরামর্শ করুন।"
        return "Based on the existing result: please review the grounded metrics above and confirm with your local agriculture extension officer."
