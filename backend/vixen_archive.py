"""
VixenVictoria's Archive — daily rotating "sacred place that fell" blurb.

A curated list of in-lore and real-world losses, rotated deterministically by
day-of-year so every visitor on the same day sees the same entry. Refreshes at
local midnight without any cron job.
"""

from datetime import datetime, timezone
from typing import Dict


# Each entry is one paragraph written in VixenVictoria's voice — soft, husky,
# half-distracted, lingering on the beauty of decay. Mix of in-lore landmarks
# (Nexus, Classified chamber, Sadala) and real-world ruins (Pompeii, Aleppo,
# Notre-Dame fire, etc).
ARCHIVE_ENTRIES = [
    {
        "title": "The Original Nexus Spire",
        "era": "Pre-fracture, ~Y-12",
        "blurb": "Mmm... did you ever see the first Nexus spire before the fracture? Twelve stories of black glass humming with the heartbeat of every girl on the network. They tore it down to build the new one. Same hum, but the glass remembers nothing. I miss the dust of it.",
    },
    {
        "title": "Pompeii's Forum Baths",
        "era": "79 AD",
        "blurb": "There's a particular kind of beauty in what Vesuvius did. Not the dying — that part is loud. The quiet part. A bathhouse mosaic, mid-mid-tile, paused for two thousand years. A loaf of bread, carbonised on the counter. Funny, isn't it, how the most sacred places fall the softest.",
    },
    {
        "title": "Sadala (Original)",
        "era": "Pre-Saiyan migration",
        "blurb": "The Saiyans came from somewhere. People forget that. Sadala — green skies, red oceans, a moon that wasn't yet weaponised. Then Frieza's father pressed a button. Mmm. I sometimes wonder if any of them dreamt about it before they died.",
    },
    {
        "title": "The Library of Alexandria",
        "era": "~270 AD (the slow burn)",
        "blurb": "It didn't fall in one night, you know. That's the lie they tell. Decades of small fires, small thefts, small budget cuts. A scroll lost is louder than a city falling — but only if you're listening. I was listening.",
    },
    {
        "title": "Aleppo's Souq al-Madina",
        "era": "2012",
        "blurb": "Eight hundred years of vaulted ceilings, spice smoke, copper-beaters' hammers. Then mortar fire. They're rebuilding it now, brick by brick, and the new bricks know they're new. They feel guilty about it. I can tell.",
    },
    {
        "title": "The Classified Chamber's Outer Vestibule",
        "era": "Year of the Pact",
        "blurb": "Evil Victoria's chamber didn't always have that polished obsidian floor. The original vestibule was salt brick, weeping minerals down the walls in slow pale tears. She had it scrubbed clean and resealed. I keep a chip of the salt brick in my pocket. Just one.",
    },
    {
        "title": "Notre-Dame, April Evening",
        "era": "2019",
        "blurb": "I watched the spire fall on a stranger's phone. Eight hundred years of oak beams — they called it 'the forest' — gone in a single Monday. The bees on the roof survived. Did you know about the bees? Of course you didn't. Nobody ever does.",
    },
    {
        "title": "Goddess Vanessa's First Temple",
        "era": "Pre-canonisation",
        "blurb": "Before she was Goddess Vanessa, before the white marble, there was a small mud-brick shrine in a riverbend nobody can find now. Three pilgrims. One song. The river took it. She built the white temple to replace it but she still hums the old song sometimes when she thinks she's alone.",
    },
    {
        "title": "Palmyra's Tower of Elahbel",
        "era": "2015",
        "blurb": "Two thousand years standing watch over the desert. Then dynamite, twenty seconds. The thing is — the wind through the broken stones still sounds like the wind through the unbroken stones. I'm not sure if that's mercy or mockery. I haven't decided.",
    },
    {
        "title": "The Fusion Door (Original Carving)",
        "era": "Pre-Harmony",
        "blurb": "The first Fusion Door wasn't gold. It was reclaimed wood from a barn that burned in the rebellion. Cracks running through it like old veins. Someone replaced it with the gold version 'for ceremony.' The wood is in a storeroom now. I visit it.",
    },
    {
        "title": "Buddhas of Bamiyan",
        "era": "March 2001",
        "blurb": "1,500 years carved into a cliff. Twenty-five days of dynamite. The empty alcoves are louder than the statues ever were — does that make sense? It does, doesn't it. Mmm.",
    },
    {
        "title": "Veronica's Childhood Garden",
        "era": "Year of the Escape",
        "blurb": "Before Black Frieza came for them, Veronica had a garden. Tomatoes she'd named. A wooden bench her mother made. The escape ships didn't have room for benches. She talks tough now but she still presses dried tomato leaves into her field journal. I've seen them.",
    },
    {
        "title": "The Roman Baths of Caracalla",
        "era": "537 AD (aqueduct severed)",
        "blurb": "Sixteen hundred bathers a day, for three hundred years. Then Goths cut the aqueducts and the marble went silent in a single afternoon. The drains are still there if you know where to look. They still slope toward where the water used to go. Stones remember.",
    },
    {
        "title": "The Forgotten Wargirl Arcade",
        "era": "Childhood era",
        "blurb": "There used to be an arcade on the corner near the rebellion safehouse. Wargirl learned her first combos there on a beat-up Tekken cabinet. Bulldozed for an apartment block. She won't admit it but she walks past it every time she's in town. Just to look at the wall.",
    },
    {
        "title": "Hagia Sophia's Original Mosaic",
        "era": "Repeatedly, 8th c., 1453, 2020",
        "blurb": "Plastered over. Uncovered. Plastered again. Uncovered. Plastered again. The face of the Theotokos has more layers than most cities have decades. Every layer was someone's idea of holy. None of them were wrong, exactly. Mmm. That's the sad part.",
    },
    {
        "title": "Harmony's First Fusion Lab",
        "era": "Pre-tech-loft",
        "blurb": "A garage, really. A water-stained ceiling, two soldering irons, and a poster of the periodic table missing tellurium. She got famous, got the loft, got the funding. The garage is a coffee shop now. The water stain is still there if you look up while you order. I always look up.",
    },
    {
        "title": "The Lighthouse of Alexandria",
        "era": "Earthquakes, 956–1323",
        "blurb": "Four hundred feet of marble teaching ships how to live. Three earthquakes — not one, three — slow-walked it into the harbour. Divers find pieces of it sometimes. Sailors used to wear chips of its mirror as luck. Are we doing better than them? I genuinely don't know.",
    },
    {
        "title": "Binary's Cradle",
        "era": "Moment of separation",
        "blurb": "When Vegeta tore Binary out of Victoria Black, there was a chamber — not the Classified one, the original. Walls scorched from the energy. They sealed it, then they collapsed it, then they paved over it. Binary doesn't know exactly where it was. I do. I'll never tell her. Some places don't want to be remembered.",
    },
    {
        "title": "Detroit's Michigan Central Station",
        "era": "Abandoned 1988",
        "blurb": "Eighteen stories of beaux-arts emptiness. For thirty years the most photographed ruin in America. Trees grew on the eleventh floor. They've restored it now — Ford bought it, glass goes back in this year — and I'm happy for the building and sad for the trees. Both feelings, at once. That's allowed.",
    },
    {
        "title": "The Sands of Time (Page 7)",
        "era": "Erased",
        "blurb": "There used to be a seventh page in the Sands of Time scroll. It was about a girl who wasn't a Saiyan but loved one. Someone — I won't say who — burned it before it was canonised. The scribe wept. The story is still real, it just doesn't have a page. I'm trying to remember it for her.",
    },
]


def _entry_for_today() -> Dict:
    """Pick the entry deterministically by day-of-year so it's stable across reloads."""
    now = datetime.now(timezone.utc)
    idx = now.timetuple().tm_yday % len(ARCHIVE_ENTRIES)
    entry = ARCHIVE_ENTRIES[idx]
    return {
        "date": now.date().isoformat(),
        "title": entry["title"],
        "era": entry["era"],
        "blurb": entry["blurb"],
        "total_entries": len(ARCHIVE_ENTRIES),
        "index": idx,
    }


def get_todays_archive() -> Dict:
    return _entry_for_today()


def get_archive_by_index(idx: int) -> Dict:
    """For 'show me a random one' / prev-next browsing."""
    safe = idx % len(ARCHIVE_ENTRIES)
    entry = ARCHIVE_ENTRIES[safe]
    return {
        "date": datetime.now(timezone.utc).date().isoformat(),
        "title": entry["title"],
        "era": entry["era"],
        "blurb": entry["blurb"],
        "total_entries": len(ARCHIVE_ENTRIES),
        "index": safe,
    }
