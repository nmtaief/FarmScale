"""Tests for Layer 2: crop_layer data, provenance, gazetteer, and loader."""

import pytest

from crop_layer.loader import (
    canonical_crop_id,
    get_crop,
    get_gazetteer,
    get_local_core_crops,
    refresh,
    resolve_location_from_gazetteer,
    summarize_for_ml,
)


def test_gazetteer_has_all_8_districts():
    gaz = get_gazetteer()
    districts = gaz["districts"]
    assert len(districts) == 8
    names = {d["district"] for d in districts}
    assert names == {
        "Rajshahi",
        "Naogaon",
        "Natore",
        "Chapainawabganj",
        "Bogura",
        "Joypurhat",
        "Pabna",
        "Sirajganj",
    }
    for d in districts:
        assert len(d["upazilas"]) >= 5
        for u in d["upazilas"]:
            assert 23.5 <= u["latitude"] <= 25.5
            assert 88.0 <= u["longitude"] <= 90.0
            assert u["aez"]


def test_crop_profiles_have_required_fields_and_provenance():
    for cid in ("aman_rice", "mustard", "chickpea", "watermelon", "potato"):
        c = get_crop(cid)
        assert c is not None
        assert c["name_en"]
        assert c["name_bn"]
        assert c["source"] == "draft"
        assert c["confidence"] == "low"
        assert c["updated_at"]
        assert c["units"]
        assert c["price"]["status"] == "missing"
        assert c["production_cost"]["status"] == "missing"
        assert "N" in c["nutrient_uptake_per_tonne"]
        assert "P2O5" in c["nutrient_uptake_per_tonne"]
        assert "K2O" in c["nutrient_uptake_per_tonne"]


def test_crop_id_map_resolution():
    assert canonical_crop_id("rice") == "aman_rice"
    assert canonical_crop_id("T.Aman") == "aman_rice"
    assert get_crop("rice")["id"] == "aman_rice"


def test_get_local_core_crops_godagari_and_niamatpur():
    godagari = get_local_core_crops({"district": "Rajshahi", "upazila": "Godagari"}, season="annual")
    assert godagari["aez"] == "High Barind Tract"
    assert "Rabi" in godagari["crops_by_season"]
    assert len(godagari["crops_by_season"]["Rabi"]) > 0
    assert godagari["provenance"]["source"] == "draft"

    niamatpur = get_local_core_crops({"district": "Naogaon", "upazila": "Niamatpur"}, season="Rabi")
    assert list(niamatpur["crops_by_season"].keys()) == ["Rabi"]
    assert niamatpur["aez"] == "High Barind Tract"


def test_resolve_by_lat_lon():
    res = resolve_location_from_gazetteer(latitude=24.466, longitude=88.330)
    assert res is not None
    assert res["district"] == "Rajshahi"
    assert res["upazila"] == "Godagari"


def test_summarize_for_ml_is_compact():
    summary = summarize_for_ml({"district": "Natore", "upazila": "Singra"}, season="annual")
    assert summary["aez"] == "Chalan Beel"
    assert "mustard" in summary["candidate_crop_ids"]
    assert len(summary["crops"]) == len(summary["candidate_crop_ids"])
    assert "provenance" in summary


def test_invalid_location_raises():
    with pytest.raises(ValueError):
        get_local_core_crops({"district": "NonExistent", "upazila": "Nowhere"})


def test_refresh_stub():
    res = refresh()
    assert res["status"] == "not_implemented"
