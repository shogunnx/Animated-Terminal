# YOU! tile: gender-neutral outfit prompt (free, no generation)
import re, sys, os, subprocess
import pytest
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from dressing_room import build_outfit_prompt, OutfitRequest, neutralize

ITEMS = [None, {"top": "red crop top", "bottom": "black skirt", "shoes": "boots"},
         {"top": "hoodie", "accessories": "her necklace"}]


def _req(cid, items, **kw):
    return OutfitRequest(character_name="YOU!" if cid == "you" else "VixenVictoria", character_id=cid,
                         character_description="a woman, she has long hair", outfit_description="a leather jacket she likes",
                         outfit_items=items, **kw)


@pytest.mark.parametrize("items", ITEMS)
@pytest.mark.parametrize("flags", [{}, {"preserve_body": True, "preserve_pose": True, "preserve_background": True},
                                   {"preserve_face": False, "preserve_hair": False, "preserve_skin_tone": False}])
def test_you_prompt_neutral(items, flags):
    p, _ = build_outfit_prompt(_req("you", items, **flags))
    low = p.lower()
    for w in ["she", "her", "woman", "herself", "hers"]:
        assert not re.search(rf"\b{w}\b", low), f"'{w}' found: {p}"


def test_you_prompt_uses_neutral_terms():
    p, _ = build_outfit_prompt(_req("you", ITEMS[1]))
    assert re.search(r"\b(they|their|person|themselves)\b", p.lower())


def test_vixen_prompt_still_gendered():
    p, _ = build_outfit_prompt(_req("vixen_victoria", ITEMS[1]))
    low = p.lower()
    assert re.search(r"\bwoman\b", low) or re.search(r"\bshe\b", low)


def test_neutralize_edge():
    out = neutralize("She wears her dress. The woman is herself.")
    assert "She" not in out and "her " not in out and "woman" not in out
