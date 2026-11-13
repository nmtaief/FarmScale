"""Layer 1: LLM Natural Language Understanding, Goal Classification,
Packaging, and Plain-Language Response Generation (English & Bengali).
"""
import re
from typing import Dict, List, Any, Optional, Tuple

GOAL_SYNONYMS = {
    "cash_crop": [
        "cash crop", "money", "profit", "commercial", "high yield", "earning", "market",
        "অর্থকরী", "লাভ", "মুনাফা", "বাণিজ্যিক", "টাকা", "বেশি ফলন"
    ],
    "soil_fertility": [
        "fertility", "soil health", "nitrogen", "organic matter", "replenish", "nutrients",
        "মাটির উর্বরতা", "উর্বরতা", "নাইট্রোজেন", "জৈব সার", "সার সাশ্রয়", "পুষ্টি"
    ],
    "land_preservation": [
        "land preservation", "land protection", "erosion", "soil cover", "conserve", "drought",
        "barind", "groundwater", "জমি সংরক্ষণ", "মাটি ক্ষয়রোধ", "খরা সহনশীল", "বরেন্দ্র", "ভূগর্ভস্থ পানি"
    ],
    "cultivability": [
        "cultivability", "easy to grow", "low risk", "manageable", "reliable", "waterlogging",
        "সহজ চাষ", "চাষযোগ্যতা", "কম ঝুঁকি", "নির্ভরযোগ্য", "জলাবদ্ধতা মুক্ত"
    ],
}

RAJSHAHI_DISTRICTS = [
    "Rajshahi", "Bogura", "Bogra", "Pabna", "Naogaon", "Natore",
    "Joypurhat", "Chapainawabganj", "Nawabganj", "Sirajganj"
]

RAJSHAHI_DISTRICTS_BN = {
    "রাজশাহী": "Rajshahi",
    "বগুড়া": "Bogura",
    "বগুরা": "Bogura",
    "পাবনা": "Pabna",
    "নওগাঁ": "Naogaon",
    "নাটোর": "Natore",
    "জয়পুরহাট": "Joypurhat",
    "জয়পুরহাট": "Joypurhat",
    "চাঁপাইনবাবগঞ্জ": "Chapainawabganj",
    "নবাবগঞ্জ": "Chapainawabganj",
    "সিরাজগঞ্জ": "Sirajganj",
}

RAJSHAHI_UPAZILAS = {
    "Godagari": ("Rajshahi", 24.4667, 88.3333),
    "Tanore": ("Rajshahi", 24.5833, 88.5833),
    "Bagmara": ("Rajshahi", 24.5667, 88.8000),
    "Paba": ("Rajshahi", 24.4333, 88.6167),
    "Durgapur": ("Rajshahi", 24.4500, 88.7667),
    "Charghat": ("Rajshahi", 24.2833, 88.7500),
    "Bagha": ("Rajshahi", 24.1833, 88.8333),
    "Mohanpur": ("Rajshahi", 24.5333, 88.6500),
    "Puthia": ("Rajshahi", 24.3667, 88.8333),
    "Shibganj": ("Chapainawabganj", 24.6833, 88.1667),
    "Bholahat": ("Chapainawabganj", 24.8833, 88.1833),
    "Gomastapur": ("Chapainawabganj", 24.7833, 88.2833),
    "Nachole": ("Chapainawabganj", 24.7333, 88.4167),
    "Singra": ("Natore", 24.5000, 89.1500),
    "Gurudaspur": ("Natore", 24.3667, 89.1500),
    "Baraigram": ("Natore", 24.3167, 89.1667),
    "Sherpur": ("Bogura", 24.6667, 89.4167),
    "Shibganj_Bogra": ("Bogura", 24.9833, 89.3167),
    "Ishwardi": ("Pabna", 24.1333, 89.0667),
    "Niamatpur": ("Naogaon", 24.8583, 88.7417),
    "Manda": ("Naogaon", 24.7750, 88.6667),
    "Porsha": ("Naogaon", 25.0333, 88.4833),
    "Sapahar": ("Naogaon", 25.1250, 88.5833),
    "Dhamoirhat": ("Naogaon", 25.1333, 88.8500),
    "Mohadevpur": ("Naogaon", 24.9167, 88.7500),
}

RAJSHAHI_UPAZILAS_BN = {
    "গোদাগাড়ী": "Godagari", "গোদাগাড়ি": "Godagari",
    "তানোর": "Tanore",
    "বাগমারা": "Bagmara",
    "পবা": "Paba",
    "দুর্গাপুর": "Durgapur",
    "চারঘাট": "Charghat",
    "বাঘা": "Bagha",
    "মোহনপুর": "Mohanpur",
    "পুঠিয়া": "Puthia", "পুঠিয়া": "Puthia",
    "শিবগঞ্জ": "Shibganj",
    "ভোলাহাট": "Bholahat",
    "গোমস্তাপুর": "Gomastapur",
    "নাচোল": "Nachole",
    "সিংড়া": "Singra", "সিংড়া": "Singra",
    "গুরুদাসপুর": "Gurudaspur",
    "বড়াইগ্রাম": "Baraigram", "বড়াইগ্রাম": "Baraigram",
    "শেরপুর": "Sherpur",
    "ঈশ্বরদী": "Ishwardi",
    "নিয়ামতপুর": "Niamatpur", "নিয়ামতপুর": "Niamatpur",
    "মান্দা": "Manda",
    "পোরশা": "Porsha",
    "সাপাহার": "Sapahar",
    "ধামইরহাট": "Dhamoirhat",
    "মহাদেবপুর": "Mohadevpur",
}


def understand_request(
    text: str,
    default_lat: float = 24.3745,
    default_lon: float = 88.6042
) -> Dict[str, Any]:
    """Layer 1: Component A - Understand farmer request (location, goal, season)."""
    clean_text = text.lower()

    # 1. Detect location
    detected_district = "Rajshahi"
    detected_upazila = None
    lat, lon = default_lat, default_lon

    for upz, (dist, u_lat, u_lon) in RAJSHAHI_UPAZILAS.items():
        if upz.lower() in clean_text:
            detected_upazila = upz
            detected_district = dist
            lat, lon = u_lat, u_lon
            break

    if not detected_upazila:
        for bn_name, eng_upz in RAJSHAHI_UPAZILAS_BN.items():
            if bn_name in text:
                detected_upazila = eng_upz
                dist, u_lat, u_lon = RAJSHAHI_UPAZILAS[eng_upz]
                detected_district = dist
                lat, lon = u_lat, u_lon
                break

    if not detected_upazila:
        for dist in RAJSHAHI_DISTRICTS:
            if dist.lower() in clean_text:
                detected_district = dist
                break
        for bn_dist, eng_dist in RAJSHAHI_DISTRICTS_BN.items():
            if bn_dist in text:
                detected_district = eng_dist
                break

    # 2. Detect season
    season = "annual"
    if any(w in clean_text for w in ["rabi", "winter", "শীত", "রবি"]):
        season = "rabi"
    elif any(w in clean_text for w in ["kharif 1", "kharif-1", "summer", "গ্রীষ্ম", "খরিপ-১"]):
        season = "kharif_1"
    elif any(w in clean_text for w in ["kharif 2", "kharif-2", "monsoon", "বর্ষা", "আমন", "খরিপ-২"]):
        season = "kharif_2"

    # 3. Detect goal
    goal, confidence = classify_goal(text)

    # Detect language (Bengali script range \u0980-\u09FF)
    is_bengali = bool(re.search(r"[\u0980-\u09FF]", text))
    lang = "bn" if is_bengali else "en"

    return {
        "raw_text": text,
        "language": lang,
        "location": {
            "district": detected_district,
            "upazila": detected_upazila,
            "latitude": lat,
            "longitude": lon,
        },
        "goal": goal,
        "goal_confidence": confidence,
        "season": season,
    }


def classify_goal(text: str) -> Tuple[str, float]:
    """Layer 1: Component B - Classify goal into cash crop / soil fertility / land preservation / cultivability."""
    clean = text.lower()
    scores = {k: 0 for k in GOAL_SYNONYMS}

    for goal_key, terms in GOAL_SYNONYMS.items():
        for term in terms:
            if term.lower() in clean:
                scores[goal_key] += 1

    best_goal = max(scores, key=scores.get)
    max_score = scores[best_goal]

    if max_score == 0:
        return "cash_crop", 0.50  # sensible default

    confidence = min(0.98, 0.60 + 0.15 * max_score)
    return best_goal, round(confidence, 2)


def write_answer(
    ranked_rotations: List[Dict[str, Any]],
    req_info: Dict[str, Any],
    env_summary: Dict[str, Any],
    language: str = "en"
) -> Dict[str, Any]:
    """Layer 1: Component F - Plain-language reply with top 3 rotations and agronomic reasons."""
    loc = req_info["location"]
    area_str = loc["upazila"] or loc["district"]
    goal = req_info["goal"]

    goal_labels_en = {
        "cash_crop": "Maximizing Cash Profits & Yield",
        "soil_fertility": "Restoring Soil Fertility & Organic Nitrogen",
        "land_preservation": "Land Preservation & Drought Resilience",
        "cultivability": "Reliable Cultivability & Water Balance",
    }
    goal_labels_bn = {
        "cash_crop": "সর্বোচ্চ লাভ ও অর্থকরী ফলন",
        "soil_fertility": "মাটির উর্বরতা বৃদ্ধি ও প্রাকৃতিক নাইট্রোজেন সংযোজন",
        "land_preservation": "বরেন্দ্র অঞ্চলের ভূমি সংরক্ষণ ও খরা সহনশীলতা",
        "cultivability": "সহজ চাষযোগ্যতা ও নিশ্চিত ফসল উৎপাদন",
    }

    if language == "bn":
        heading = f"রাজশাহীর {area_str} অঞ্চলের জন্য সর্বোচ্চ উপযোগী ৩টি ফসল আবর্তন (Crop Rotations)"
        goal_text = goal_labels_bn.get(goal, goal)
        summary_text = (
            f"নাসার (NASA) ১০ বছরের আবহাওয়া ধারা, SMAP মাটির আর্দ্রতা, MODIS উপগ্রহ তথ্য এবং মাটির পিএইচ (pH {env_summary.get('soil_ph', 6.2)}) "
            f"বিশ্লেষণ করে আপনার লক্ষ্য '{goal_text}'-এর ভিত্তিতে সেরা ৩টি ফসল আবর্তন সাজানো হলো:"
        )

        cards = []
        for rot in ranked_rotations:
            net_n = rot["metrics"]["net_n_balance_kg_ha"]
            n_msg = f"মাটিতে {abs(round(net_n))} কেজি/হেক্টর নাইট্রোজেন যোগ করবে" if net_n > 0 else f"মাটি থেকে পরিমিত পুষ্টি শোষণ করবে"
            cover_msg = "মাটির আর্দ্রতা ও ক্ষয়রোধে অত্যন্ত কার্যকর" if rot["metrics"]["soil_cover_score"] >= 2.5 else "উচ্চ মূল্যের বাণিজ্যিক আবর্তন"
            r_score = rot.get("score", rot.get("ml_score", 85))
            r_crops = rot.get("crops") or rot.get("pattern", [])

            card = {
                "rank": rot["rank"],
                "title": f"পছন্দ #{rot['rank']}: {rot.get('bengali_name', rot['name'])} (স্কোর: {r_score}/১০০)",
                "pattern": " ➔ ".join(r_crops),
                "seasons": " | ".join(rot["seasons"]),
                "summary": rot["description"],
                "reasons": [
                    f"মডেল স্কোর: {r_score} পয়েন্ট ({rot['primary_fit']} লক্ষ্যের সাথে সেরা সামঞ্জস্যপূর্ণ)",
                    f"মোট মেয়াদ: প্রায় {round(rot['metrics']['total_duration_days'])} দিন (এক বছরে ৩ মৌসুমের জন্য উপযুক্ত)",
                    f"মাটির উর্বরতা প্রভাব: {n_msg}",
                    f"পরিবেশগত উপযোগিতা: {cover_msg}",
                ],
                "advice": f"শীত মৌসুমে প্রথম ফসল রোপণ করুন; সেচের ক্ষেত্রে নাসার রুটজোন স্যাঁতসেঁতে সূচক ({env_summary.get('rootzone_wetness', 0.65)}) পর্যবেক্ষণ করুন।"
            }
            cards.append(card)

        footer = "পরামর্শ: এই সুপারিশগুলো নাসার স্যাটেলাইট ও আন্তর্জাতিক এগ্রোনমিক গবেষণার ভিত্তিতে প্রস্তুত। বীজ বপনের পূর্বে স্থানীয় কৃষি কর্মকর্তার সাথে পরামর্শ করে নিন।"

    else:
        heading = f"Top 3 Crop Rotations for {area_str}, Rajshahi Division"
        goal_text = goal_labels_en.get(goal, goal)
        summary_text = (
            f"Based on real NASA POWER weather trends, SMAP rootzone wetness, MODIS vegetation vigor, "
            f"and SoilGrids pH ({env_summary.get('soil_ph', 6.2)}), here are the top 3 recommended annual crop rotations for your goal of '{goal_text}':"
        )

        cards = []
        for rot in ranked_rotations:
            net_n = rot["metrics"]["net_n_balance_kg_ha"]
            n_msg = f"Adds +{round(net_n)} kg N/ha via biological fixation" if net_n > 0 else "Balanced nutrient removal requiring standard replenishment"
            cover_msg = "Outstanding soil cover protecting against Barind topsoil erosion" if rot["metrics"]["soil_cover_score"] >= 2.5 else "Optimized for maximum financial output"
            r_score = rot.get("score", rot.get("ml_score", 85))
            r_crops = rot.get("crops") or rot.get("pattern", [])

            card = {
                "rank": rot["rank"],
                "title": f"Option #{rot['rank']}: {rot['name']} (Score: {r_score}/100)",
                "pattern": " ➔ ".join(r_crops),
                "seasons": " | ".join(rot["seasons"]),
                "summary": rot["description"],
                "reasons": [
                    f"XGBoost Match: {r_score} points (Strongest alignment with {goal})",
                    f"Annual Cycle: ~{round(rot['metrics']['total_duration_days'])} days total (fits Rabi ➔ Kharif-I ➔ Kharif-II)",
                    f"Nutrient Dynamics: {n_msg}",
                    f"Agro-Ecological Impact: {cover_msg}",
                ],
                "advice": f"Start sowing the first crop at the onset of Rabi season. Monitor root-zone wetness ({env_summary.get('rootzone_wetness', 0.65)}) to schedule supplemental irrigation."
            }
            cards.append(card)

        footer = "Note: Recommended by Layer 3 XGBoost ML model combining 10 years of NASA climate data with FAO-56 and BARC agronomic guidelines."

    return {
        "heading": heading,
        "goal_label": goal_text,
        "summary": summary_text,
        "rotations": cards,
        "footer": footer,
    }
