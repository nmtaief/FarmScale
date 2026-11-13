"""GOALS registry with English/Bangla labels, templates, and ML support flags."""

from __future__ import annotations

from typing import Any

GOALS: list[dict[str, Any]] = [
    {
        "id": "soil_fertility",
        "ml_goal": "soil_fertility",
        "supported_by_ml": True,
        "label_en": "Improve my soil fertility",
        "label_bn": "আমার জমির উর্বরতা বাড়াতে চাই",
        "phrase_en": "improves soil fertility",
        "phrase_bn": "জমির উর্বরতা বাড়ায়",
        "template_en": "I farm in {upazila}, {district}. I want a crop rotation that improves soil fertility for the {season} season. {constraints}",
        "template_bn": "আমি {district} জেলার {upazila} উপজেলায় চাষ করি। {season} মৌসুমে এমন শস্য পর্যায় চাই যা আমার জমির উর্বরতা বাড়ায়। {constraints}",
    },
    {
        "id": "cash_crop",
        "ml_goal": "cash_crop",
        "supported_by_ml": True,
        "label_en": "Most profit",
        "label_bn": "সবচেয়ে বেশি লাভ চাই",
        "phrase_en": "maximizes profit",
        "phrase_bn": "সবচেয়ে বেশি লাভ দেয়",
        "template_en": "I farm in {upazila}, {district}. I want a crop rotation that maximizes profit for the {season} season. {constraints}",
        "template_bn": "আমি {district} জেলার {upazila} উপজেলায় চাষ করি। {season} মৌসুমে সবচেয়ে বেশি লাভ দেয় এমন শস্য পর্যায় চাই। {constraints}",
    },
    {
        "id": "land_preservation",
        "ml_goal": "land_preservation",
        "supported_by_ml": True,
        "label_en": "Protect my land",
        "label_bn": "আমার জমি রক্ষা করতে চাই",
        "phrase_en": "protects my land from degradation",
        "phrase_bn": "আমার জমি রক্ষা করে",
        "template_en": "I farm in {upazila}, {district}. I want a crop rotation that protects my land for the {season} season. {constraints}",
        "template_bn": "আমি {district} জেলার {upazila} উপজেলায় চাষ করি। {season} মৌসুমে আমার জমি রক্ষা করে এমন শস্য পর্যায় চাই। {constraints}",
    },
    {
        "id": "cultivability",
        "ml_goal": "cultivability",
        "supported_by_ml": True,
        "label_en": "Make my land easier to cultivate",
        "label_bn": "জমি চাষের উপযোগী করতে চাই",
        "phrase_en": "makes my land easier to cultivate",
        "phrase_bn": "জমি চাষের উপযোগী করে",
        "template_en": "I farm in {upazila}, {district}. I want a crop rotation that makes my land easier to cultivate for the {season} season. {constraints}",
        "template_bn": "আমি {district} জেলার {upazila} উপজেলায় চাষ করি। {season} মৌসুমে জমি চাষের উপযোগী করে এমন শস্য পর্যায় চাই। {constraints}",
    },
    {
        "id": "max_production",
        "ml_goal": None,
        "supported_by_ml": False,
        "label_en": "Most production",
        "label_bn": "সবচেয়ে বেশি ফলন চাই",
        "phrase_en": "maximizes total production",
        "phrase_bn": "সবচেয়ে বেশি ফলন দেয়",
        "template_en": "I farm in {upazila}, {district}. I want a crop rotation that maximizes total production for the {season} season. {constraints}",
        "template_bn": "আমি {district} জেলার {upazila} উপজেলায় চাষ করি। {season} মৌসুমে সবচেয়ে বেশি ফলন দেয় এমন শস্য পর্যায় চাই। {constraints}",
        "disabled_reason": "No ML goal yet for max_production (see Open Question 1).",
    },
]

GOALS_BY_ID: dict[str, dict[str, Any]] = {g["id"]: g for g in GOALS}


def get_goal(goal_id: str | None) -> dict[str, Any] | None:
    if not goal_id:
        return None
    return GOALS_BY_ID.get(goal_id.strip().lower())
