# Unit tests for strict outfit prompt builder (no Fal calls)
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from dressing_room import build_outfit_prompt, OutfitRequest


def req(items=None, **kw):
    return OutfitRequest(character_name="Vixen Victoria", character_id="vixen_victoria",
                         character_description="x", outfit_description=kw.pop("desc", "desc"),
                         outfit_items=items, **kw)


# Bug scenario: mermaid skirt + cork wedges + zeo staff
def test_mermaid_wedges_staff():
    p, g = build_outfit_prompt(req({"bottom": "Short Mermaid Skirt", "footwear": "Cork Platform Wedges",
                                    "prop": "a replica Zeo Gold Ranger Golden Power Staff cosplay prop"},
                                   preserve_pose=True))
    for s in ["Apply ALL 3 required changes", "BOTTOM: she wears Short Mermaid Skirt",
              "SHOES: she wears Cork Platform Wedges", "fully visible", "PROP: she is holding",
              "the same pose (only her hands may move to hold the prop)"]:
        assert s in p, s
    assert g == 5.0
    assert "Only change the clothing" not in p


# Pose/gesture override preserve_pose
def test_pose_gesture_drops_keep_pose():
    p, g = build_outfit_prompt(req({"position": "Sitting cross-legged", "gesture": "blowing a kiss"}, preserve_pose=True))
    assert "same pose" not in p
    assert "POSE: change her body pose to: Sitting cross-legged" in p
    assert "GESTURE: she is clearly blowing a kiss" in p
    assert g == 4.5


def test_gesture_only_drops_pose():
    p, _ = build_outfit_prompt(req({"gesture": "waving"}, preserve_pose=True))
    assert "same pose" not in p


def test_villainess_pose():
    p, _ = build_outfit_prompt(req({"villainess_pose": "hands on hips evil laugh"}, preserve_pose=True))
    assert "POSE: hands on hips evil laugh" in p and "same pose" not in p


def test_hair_overrides_preserve_hair():
    p, _ = build_outfit_prompt(req({"hair": "high ponytail"}, preserve_hair=True))
    assert "exact same hair" not in p and "HAIR:" in p
    p2, _ = build_outfit_prompt(req({"top": "red tee"}, preserve_hair=True))
    assert "exact same hair" in p2


def test_background_overrides_preserve_bg():
    p, _ = build_outfit_prompt(req({"background": "a beach"}, preserve_background=True))
    assert "exact same background" not in p and "BACKGROUND: place her in a beach" in p
    p2, _ = build_outfit_prompt(req({"top": "red tee"}, preserve_background=True))
    assert "exact same background" in p2


def test_fallback_no_items():
    p, g = build_outfit_prompt(req(None, desc="gold sparkle top"))
    assert p.startswith("Change the clothing/outfit to: gold sparkle top.")
    assert g == 3.5


def test_fallback_empty_items_dict():
    p, g = build_outfit_prompt(req({"top": "", "bottom": None}, desc="xyz"))
    assert "Change the clothing/outfit to: xyz" in p and g == 3.5


def test_face_always_kept():
    p, _ = build_outfit_prompt(req({"top": "t"}))
    assert "exact same face" in p
