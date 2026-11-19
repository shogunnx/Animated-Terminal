# Reference lookup (fan-wiki pageimages) + reference prompt/engine wiring - no Fal generation
import asyncio
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import pytest
from reference_lookup import find_references, _hosts, _queries
from dressing_room import build_reference_prompt, OutfitRequest, REFERENCE_ENGINES


def run(c):
    return asyncio.get_event_loop().run_until_complete(c) if False else asyncio.run(c)


# Lookup: Zeo example
def test_zeo_example():
    hits = run(find_references(['Zeo Gold Ranger', 'Zeo Gold Ranger Golden Power Staff']))
    titles = {h["title"] for h in hits}
    print([(h["name"], h["title"], h["host"], len(h["bytes"])) for h in hits])
    assert len(hits) == 2
    assert titles == {"Gold Zeo Ranger", "Golden Power Staff"}
    for h in hits:
        assert h["host"] == "powerrangers.fandom.com"
        assert len(h["bytes"]) > 1000
        assert h["page_url"].startswith("https://powerrangers.fandom.com/wiki/")


# Lookup: other franchises
def test_other_franchises():
    hits = run(find_references(["Link's Master Sword", 'Super Saiyan Rosé', 'Optimus Prime Cosplay Armor']))
    print([(h["name"], h["title"], h["host"]) for h in hits])
    hosts = {h["name"]: h["host"] for h in hits}
    assert hosts.get("Link's Master Sword") == "zelda.fandom.com"
    assert hosts.get("Super Saiyan Rosé") == "dragonball.fandom.com"
    assert hosts.get("Optimus Prime Cosplay Armor") == "transformers.fandom.com"


# Cap at 3
def test_cap_three():
    hits = run(find_references(['Zeo Gold Ranger', 'Golden Power Staff', 'Master Sword', 'Optimus Prime', 'Goku']))
    assert len(hits) <= 3
    assert all(h["name"] in ['Zeo Gold Ranger', 'Golden Power Staff', 'Master Sword'] for h in hits)


# Unknown name
def test_unknown_no_crash():
    hits = run(find_references(['Qzxvbnmplk Wrtyhgfd Zzqqxx', '', '   ']))
    assert hits == []


def test_empty_list():
    assert run(find_references([])) == []


# Prompt labelling
def test_build_reference_prompt():
    refs = [{"name": "Zeo Gold Ranger Golden Power Staff", "title": "Golden Power Staff"},
            {"name": "Zeo Gold Ranger", "title": "Gold Zeo Ranger"}]
    p = build_reference_prompt("BASE PROMPT", refs)
    assert p.startswith("Image 1 is the woman")
    assert 'Image 2 is the official reference for "Zeo Gold Ranger Golden Power Staff" (Golden Power Staff)' in p
    assert 'Image 3 is the official reference for "Zeo Gold Ranger" (Gold Zeo Ranger)' in p
    assert p.endswith("BASE PROMPT")
    assert build_reference_prompt("X", []) == "X"


# Request model + engines
def test_request_fields_and_engines():
    r = OutfitRequest(character_id="vixen_victoria", character_name="VixenVictoria", character_description="d", outfit_description="x",
                      use_references=True, reference_engine="kontext-max", reference_items=["a", "b"])
    assert r.use_references is True and r.reference_engine == "kontext-max" and r.reference_items == ["a", "b"]
    d = OutfitRequest(character_id="v", character_name="V", character_description="d", outfit_description="x")
    assert d.use_references is False and d.reference_engine == "nano-banana-pro"
    assert REFERENCE_ENGINES["nano-banana-pro"] == "fal-ai/nano-banana-pro/edit"
    assert REFERENCE_ENGINES["kontext-max"] == "fal-ai/flux-pro/kontext/max/multi"
