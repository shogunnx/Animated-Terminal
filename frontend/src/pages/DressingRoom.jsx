import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { TSV_CHARACTERS } from "../content/tsvContent.js";
import { addLike, getLikes, getCharacterRank } from "../utils/engagement.js";

const CLOTHING_CATEGORIES = {
  tops: [
    "Crop Top", "T-Shirt", "Tank Top", "Blouse", "Jacket", "Hoodie", "Sweater", "Button-Up",
    "Halter Top", "Tube Top", "Off-Shoulder", "Turtleneck", "V-Neck", "Cardigan", "Blazer", "Vest",
    "Camisole", "Bodysuit", "Corset", "Kimono", "Wrap Top", "Peasant Top", "Peplum Top", "Bell Sleeve",
    "Cold Shoulder", "Polo Shirt", "Henley", "Sports Bra", "Leather Jacket", "Denim Jacket", "Bomber Jacket",
    "Trench Coat", "Peacoat", "Windbreaker", "Puffer Jacket", "Flannel", "Mesh Top", "Lace Top",
    // 30 New Additions
    "Crop Hoodie", "Longline T-Shirt", "Asymmetric Top", "Sequin Top", "Silk Blouse", "Cashmere Sweater", "Zip-Up Hoodie", "Ribbed Tank",
    "Satin Camisole", "Cut-Out Top", "Bandeau Top", "Backless Top", "One-Shoulder Top", "Cape Top", "Bolero Jacket", "Moto Jacket",
    "Varsity Jacket", "Shearling Jacket", "Suede Jacket", "Quilted Jacket", "Cropped Blazer", "Oversized Blazer", "Utility Vest", "Puffer Vest",
    "Racerback Tank", "Muscle Tee", "Baseball Jersey", "Graphic Tee", "Tie-Dye Top", "Velvet Top"
  ],
  bottoms: [
    "Jeans", "Shorts", "Skirt", "Leggings", "Dress Pants", "Cargo Pants", "Mini Skirt",
    "Maxi Skirt", "Midi Skirt", "Pencil Skirt", "A-Line Skirt", "Pleated Skirt", "Jean Shorts", "Bike Shorts",
    "High-Waisted Pants", "Low-Rise Jeans", "Wide Leg Pants", "Capri Pants", "Joggers", "Sweatpants", "Leather Pants",
    "Palazzo Pants", "Culottes", "Flare Jeans", "Bootcut Jeans", "Skinny Jeans", "Mom Jeans", "Boyfriend Jeans",
    "Ripped Jeans", "Denim Skirt", "Wrap Skirt", "Tennis Skirt", "Cargo Skirt", "Yoga Pants", "Track Pants",
    "Dress Shorts", "Bermuda Shorts", "Hot Pants",
    // 30 New Additions
    "Leather Skirt", "Suede Skirt", "Tulle Skirt", "Asymmetric Skirt", "Tiered Skirt", "Button-Front Skirt", "Slit Skirt", "Circle Skirt",
    "Cargo Shorts", "Running Shorts", "Board Shorts", "Paper Bag Pants", "Harem Pants", "Straight Leg Jeans", "Barrel Leg Jeans", "White Jeans",
    "Black Jeans", "Distressed Jeans", "Embroidered Jeans", "Coated Jeans", "Jeggings", "Faux Leather Pants", "Velvet Pants", "Corduroy Pants",
    "Cropped Pants", "Ankle Pants", "Bell Bottom Pants", "Satin Pants", "Plaid Skirt", "Sequin Skirt"
  ],
  shoes: [
    "Sneakers", "Heels", "Boots", "Sandals", "Wedges", "Flats", "Combat Boots",
    "Stiletto Heels", "Platform Heels", "Ankle Boots", "Knee-High Boots", "Thigh-High Boots", "Chelsea Boots", "Cowboy Boots",
    "Rain Boots", "Loafers", "Oxfords", "Mary Janes", "Mules", "Slides", "Flip Flops", "Espadrilles",
    "Ballet Flats", "Pointed Flats", "Gladiator Sandals", "Strappy Heels", "Slingback Heels", "Kitten Heels", "Block Heels",
    "Chunky Sneakers", "High-Top Sneakers", "Slip-On Shoes", "Canvas Shoes", "Running Shoes", "Court Shoes", "Pumps",
    "Peep-Toe Heels", "Ankle Strap Heels",
    // 30 New Additions
    "Over-the-Knee Boots", "Lace-Up Boots", "Sock Boots", "Western Boots", "Hiking Boots", "Platform Sneakers", "Designer Sneakers", "Retro Sneakers",
    "Velvet Heels", "Metallic Heels", "Clear Heels", "Embellished Heels", "T-Strap Heels", "D'Orsay Heels", "Cone Heels", "Stiletto Boots",
    "Fur-Lined Boots", "Studded Boots", "Snake Print Heels", "Leopard Print Flats", "Embroidered Flats", "Driving Moccasins", "Boat Shoes", "Platform Sandals",
    "Jelly Sandals", "Sport Sandals", "Fisherman Sandals", "Strappy Sandals", "Toe Ring Sandals", "Clogs",
    // 20 More Heels
    "Red Bottom Heels", "Glitter Heels", "Holographic Heels", "Transparent Heels", "Lucite Heels", "Crystal Heels", "Pearl Heels", "Feather Heels",
    "Bow Heels", "Ankle Wrap Heels", "Lace-Up Heels", "Cut-Out Heels", "Geometric Heels", "Sculptured Heels", "Wedge Heels", "Cork Heels",
    "Espadrille Wedges", "Mule Heels", "Pointed Toe Pumps", "Almond Toe Heels"
  ],
  hairstyles: [
    "Long", "Short", "Ponytail", "Bun", "Braided", "Wavy", "Straight", "Curly",
    "Bob", "Pixie Cut", "Shaggy", "Layered", "Bangs", "Side Swept", "Updo", "Half-Up Half-Down",
    "Messy Bun", "Top Knot", "French Braid", "Fishtail Braid", "Dutch Braid", "Crown Braid", "Space Buns", "Pigtails",
    "Beach Waves", "Loose Curls", "Tight Curls", "Afro", "Locs", "Twists", "Cornrows", "High Ponytail",
    "Low Ponytail", "Side Ponytail", "Slicked Back", "Mohawk", "Undercut", "Asymmetric Cut",
    // 30 New Additions
    "Blunt Cut Bob", "Lob (Long Bob)", "Shag Cut", "Wolf Cut", "Butterfly Cut", "Curtain Bangs", "Micro Bangs", "Wispy Bangs",
    "Pin Curls", "Finger Waves", "Victory Rolls", "Gibson Tuck", "Chignon", "Waterfall Braid", "Rope Braid", "Halo Braid",
    "Boxer Braids", "Pull-Through Braid", "Milkmaid Braids", "Bubble Ponytail", "Twisted Ponytail", "Wrapped Ponytail", "Braided Updo", "Twisted Updo",
    "Sleek Bun", "Textured Bun", "Ballerina Bun", "Dreadlocks", "Faux Hawk", "Buzz Cut",
    // 20 More Popular Hairstyles
    "Vintage Waves", "Hollywood Curls", "Retro Flip", "Bouffant", "Beehive", "Rachel Cut", "Farrah Fawcett Feathered", "Mullet",
    "Karen Cut", "E-Girl Hair", "Anime Protagonist Spikes", "Two-Tone Hair", "Ombre", "Balayage", "Highlights", "Money Pieces",
    "Face-Framing Layers", "Curtain Layers", "Shaggy Layers", "Wet Look Slick"
  ],
  accessories: [
    "Belt", "Necklace", "Earrings", "Watch", "Bracelet", "Hat", "Sunglasses", "Bag",
    "Choker", "Pendant", "Chain Necklace", "Hoop Earrings", "Stud Earrings", "Drop Earrings", "Cuff Bracelet", "Bangle",
    "Anklet", "Ring", "Hair Clip", "Headband", "Scrunchie", "Bow", "Beanie", "Baseball Cap", "Bucket Hat",
    "Fedora", "Wide Brim Hat", "Beret", "Backpack", "Crossbody Bag", "Clutch", "Tote Bag", "Hobo Bag",
    "Satchel", "Fanny Pack", "Scarf", "Bandana", "Gloves",
    // 30 New Additions
    "Statement Belt", "Chain Belt", "Western Belt", "Waist Bag", "Layered Necklaces", "Pearl Necklace", "Statement Necklace", "Body Chain",
    "Tassel Earrings", "Chandelier Earrings", "Huggie Earrings", "Ear Cuff", "Stackable Rings", "Midi Rings", "Cocktail Ring", "Smart Watch",
    "Leather Bracelet", "Charm Bracelet", "Tennis Bracelet", "Visor", "Newsboy Cap", "Panama Hat", "Sun Hat", "Aviator Sunglasses",
    "Cat-Eye Sunglasses", "Round Sunglasses", "Mini Bag", "Chain Bag", "Bucket Bag", "Woven Bag"
  ],
  presetCostumes: [
    "School Uniform", "Gothic Lolita", "Maid Outfit", "Nurse Uniform", "Police Officer", "Military Uniform",
    "Pirate Captain", "Witch Costume", "Vampire Gothic", "Angel Wings", "Devil Costume", "Cat Girl",
    "Bunny Suit", "Cheerleader", "Rockstar Outfit", "Cyberpunk Street", "Steampunk Victorian", "Medieval Knight",
    "Samurai Warrior", "Ninja Assassin", "Cowgirl Western", "1950s Pin-Up", "1920s Flapper", "1980s Retro",
    "Beach Summer", "Winter Wonderland", "Formal Evening Gown", "Casual Street Style", "Business Professional", "Athleisure Sports"
  ]
};

export default function DressingRoom() {
  const { id } = useParams();
  const nav = useNavigate();
  
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [baseImage, setBaseImage] = useState(null);
  const [baseImageSource, setBaseImageSource] = useState("nexus"); // nexus, placeholder, upload
  const [customPrompt, setCustomPrompt] = useState("");
  const [selectedItems, setSelectedItems] = useState({
    tops: "",
    bottoms: "",
    shoes: "",
    hairstyles: "",
    accessories: "",
    presetCostumes: ""
  });
  const [generatedImage, setGeneratedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  useEffect(() => {
    if (id) {
      const char = TSV_CHARACTERS.find(c => c.id === id);
      if (char && !char.isSpecial) {
        setSelectedCharacter(char);
        checkAndLoadBaseImage(char.id);
        // Load current like count
        setLikeCount(getLikes(char.id));
      }
    }
  }, [id]);

  const handleLike = () => {
    if (selectedCharacter && !liked) {
      const newCount = addLike(selectedCharacter.id);
      setLikeCount(newCount);
      setLiked(true);
      
      // Reset liked state after animation
      setTimeout(() => setLiked(false), 2000);
    }
  };

  const checkAndLoadBaseImage = async (charId) => {
    // Priority 1: Try Nexus
    await fetchNexusImage(charId);
    
    // Priority 2: If no Nexus image, try local portrait
    if (!baseImage) {
      const char = TSV_CHARACTERS.find(c => c.id === charId);
      if (char && char.portrait) {
        setBaseImage(char.portrait);
        setBaseImageSource("portrait");
        return;
      }
    }
    
    // Priority 3: If no portrait, check for stored base image
    if (!baseImage) {
      try {
        const response = await fetch(`/api/dressing-room/has-base/${charId}`);
        const data = await response.json();
        
        if (data.has_base_image) {
          // Load the stored base image
          const imgResponse = await fetch(`/api/dressing-room/get-base/${charId}`);
          if (imgResponse.ok) {
            const imgData = await imgResponse.json();
            setBaseImage(`data:image/png;base64,${imgData.image_base64}`);
            setBaseImageSource("stored");
          }
        }
      } catch (err) {
        console.error("Failed to check stored base image:", err);
      }
    }
  };

  const fetchNexusImage = async (charId) => {
    try {
      const response = await fetch(`/api/nexus/api/characters`);
      const characters = await response.json();
      const nexusChar = characters.find(c => 
        c.displayName?.toLowerCase() === charId.replace(/_/g, " ").toLowerCase()
      );
      if (nexusChar && nexusChar.avatar_image) {
        setBaseImage(nexusChar.avatar_image);
        setBaseImageSource("nexus");
      } else {
        setBaseImage(null);
        setBaseImageSource("placeholder");
      }
    } catch (err) {
      console.error("Failed to fetch Nexus image:", err);
      setBaseImageSource("placeholder");
    }
  };

  const handleItemToggle = (category, item) => {
    setSelectedItems(prev => ({
      ...prev,
      [category]: prev[category] === item ? "" : item
    }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBaseImage(reader.result);
        setBaseImageSource("upload");
      };
      reader.readAsDataURL(file);
    }
  };

  const generateOutfitPrompt = () => {
    if (customPrompt.trim()) {
      return customPrompt.trim();
    }

    // If a preset costume is selected, use it as the primary description
    if (selectedItems.presetCostumes) {
      const parts = [selectedItems.presetCostumes];
      // Add other selected items as modifiers
      if (selectedItems.hairstyles) parts.push(`with ${selectedItems.hairstyles} hair`);
      if (selectedItems.accessories) parts.push(`and ${selectedItems.accessories}`);
      return parts.join(" ");
    }

    // Otherwise, build from individual items
    const parts = [];
    if (selectedItems.tops) parts.push(selectedItems.tops);
    if (selectedItems.bottoms) parts.push(selectedItems.bottoms);
    if (selectedItems.shoes) parts.push(selectedItems.shoes);
    if (selectedItems.hairstyles) parts.push(`${selectedItems.hairstyles} hair`);
    if (selectedItems.accessories) parts.push(selectedItems.accessories);

    return parts.join(", ");
  };

  const handleGenerate = async () => {
    if (!selectedCharacter) {
      setError("Please select a character first");
      return;
    }

    if (!baseImage) {
      setError("Please provide a base image (from Nexus or upload your own)");
      return;
    }

    const outfitDesc = generateOutfitPrompt();
    if (!outfitDesc) {
      setError("Please select clothing items or enter a custom description");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/dressing-room/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          character_id: selectedCharacter.id,
          character_name: selectedCharacter.name,
          character_description: selectedCharacter.subtitle || "anime character",
          outfit_description: outfitDesc,
          reference_image_url: baseImageSource === "nexus" ? baseImage : null,
          reference_image_base64: baseImageSource === "upload" ? baseImage : null,
          save_as_base: baseImageSource === "upload"  // Auto-save uploaded images
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to generate image");
      }

      const data = await response.json();
      setGeneratedImage(`data:image/png;base64,${data.image_base64}`);
      
      // Dispatch event for TerminalPolish component
      window.dispatchEvent(new Event('tsv_outfit_generated'));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!id) {
    // Character selection screen
    const characters = TSV_CHARACTERS.filter(c => !c.isSpecial);
    
    return (
      <div>
        <div className="tsv-glass tsv-glow" style={{ padding: 14, marginBottom: 14 }}>
          <div className="tsv-title" style={{ fontSize: 14 }}>DRESSING ROOM</div>
          <div style={{ fontSize: 12, opacity:.72, marginTop: 8 }}>
            Select a character to dress up with AI-generated outfits
          </div>
        </div>

        <div style={{ 
          display:"grid", 
          gridTemplateColumns:"repeat(auto-fit, minmax(280px, 1fr))", 
          gap: 14 
        }}>
          {characters.map((c) => (
            <button
              key={c.id}
              onClick={() => nav(`/dressing-room/${c.id}`)}
              className="tsv-glass tsv-glow"
              style={{
                padding: 14,
                textAlign: "left",
                cursor: "pointer",
                border: "1px solid rgba(255,255,255,.14)",
                background: "linear-gradient(180deg, rgba(255,255,255,.10), rgba(255,255,255,.06))"
              }}
            >
              <div className="tsv-title" style={{ fontSize: 14, color: c.accent }}>{c.name}</div>
              <div style={{ fontSize: 11, opacity:.72, marginTop: 6 }}>{c.subtitle}</div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (!selectedCharacter) {
    return (
      <div className="tsv-glass" style={{ padding: 16 }}>
        <div className="tsv-title">CHARACTER NOT FOUND</div>
        <button className="tsv-btn" style={{ marginTop: 12 }} onClick={() => nav("/dressing-room")}>
          Back to Selection
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, alignItems: "start" }}>
      {/* Left Panel - Character & Base Image */}
      <div className="tsv-glass tsv-glow" style={{ padding: 14 }}>
        <div className="tsv-title" style={{ fontSize: 14, color: selectedCharacter.accent }}>
          {selectedCharacter.name}
        </div>
        <div style={{ fontSize: 11, opacity:.72, marginTop: 6 }}>
          {selectedCharacter.subtitle}
        </div>

        {/* Base Image Selection */}
        <div style={{ marginTop: 14 }}>
          <div className="tsv-title" style={{ fontSize: 12, opacity:.88, marginBottom: 8 }}>
            BASE IMAGE REQUIRED
          </div>
          <div style={{ fontSize: 10, opacity: 0.7, marginBottom: 8, color: "#ffa500" }}>
            ⚠️ You must upload a base image of {selectedCharacter.name} to generate outfits
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <button
              className="tsv-btn"
              style={{ 
                fontSize: 10, 
                padding: "6px 10px",
                opacity: baseImageSource === "nexus" ? 1 : 0.5
              }}
              onClick={() => { setBaseImageSource("nexus"); fetchNexusImage(selectedCharacter.id); }}
            >
              Try Nexus
            </button>
            <label style={{ flex: 1 }}>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: "none" }}
              />
              <button
                className="tsv-btn"
                style={{ 
                  fontSize: 10, 
                  padding: "6px 10px",
                  width: "100%",
                  opacity: baseImageSource === "upload" ? 1 : 0.5,
                  background: baseImageSource === "upload" 
                    ? `linear-gradient(135deg, ${selectedCharacter.accent}40, ${selectedCharacter.glow}30)`
                    : undefined
                }}
                onClick={(e) => { e.preventDefault(); e.target.previousSibling.click(); }}
              >
                📁 Upload Image
              </button>
            </label>
          </div>

          {/* Base Image Display */}
          <div className="tsv-scanlines tsv-noise" style={{ 
            borderRadius: 16, 
            border: "1px solid rgba(255,255,255,.10)", 
            overflow: "hidden",
            position: "relative",
            minHeight: 400
          }}>
            {baseImage ? (
              <img 
                src={baseImage} 
                alt={selectedCharacter.name}
                style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
              />
            ) : (
              <div style={{ 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center",
                minHeight: 400,
                opacity: 0.5
              }}>
                <div className="tsv-title" style={{ fontSize: 12 }}>
                  No base image available
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Generated Image */}
        {generatedImage && (
          <div style={{ marginTop: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div className="tsv-title" style={{ fontSize: 12, opacity:.88 }}>
                GENERATED OUTFIT
              </div>
              <div style={{ fontSize: 10, opacity: 0.7, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ color: selectedCharacter.accent }}>♥ {likeCount}</span>
                <span style={{ opacity: 0.5 }}>RANK #{getCharacterRank(selectedCharacter.id) || '?'}</span>
              </div>
            </div>
            <div className="tsv-scanlines tsv-noise" style={{ 
              borderRadius: 16, 
              border: `2px solid ${selectedCharacter.accent}`,
              overflow: "hidden",
              boxShadow: `0 0 20px ${selectedCharacter.accent}40`,
              position: "relative"
            }}>
              <img 
                src={generatedImage} 
                alt="Generated outfit"
                style={{ width: "100%", display: "block" }}
              />
              
              {/* Like Button Overlay */}
              <button
                onClick={handleLike}
                disabled={liked}
                className="tsv-btn"
                style={{
                  position: "absolute",
                  bottom: 14,
                  right: 14,
                  padding: "8px 16px",
                  fontSize: 12,
                  background: liked ? `linear-gradient(135deg, ${selectedCharacter.accent}60, ${selectedCharacter.glow}40)` : `linear-gradient(135deg, ${selectedCharacter.accent}40, ${selectedCharacter.glow}20)`,
                  border: `2px solid ${selectedCharacter.accent}`,
                  boxShadow: liked ? `0 0 30px ${selectedCharacter.accent}` : `0 0 15px ${selectedCharacter.accent}40`,
                  transform: liked ? "scale(1.1)" : "scale(1)",
                  transition: "all 0.3s ease",
                  cursor: liked ? "default" : "pointer"
                }}
              >
                {liked ? "❤️ LIKED!" : "♥ LIKE OUTFIT"}
              </button>
            </div>
            
            {/* Action Buttons */}
            <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <button 
                className="tsv-btn"
                onClick={() => {
                  // Save to local storage
                  const saves = JSON.parse(localStorage.getItem('tsv_saved_outfits') || '[]');
                  saves.push({
                    characterId: selectedCharacter.id,
                    image: generatedImage,
                    timestamp: Date.now()
                  });
                  localStorage.setItem('tsv_saved_outfits', JSON.stringify(saves));
                  alert('Outfit saved locally!');
                }}
                style={{ fontSize: 11, padding: "8px" }}
              >
                💾 SAVE
              </button>
              <button 
                className="tsv-btn"
                onClick={() => {
                  alert('DeviantArt integration coming soon!');
                }}
                style={{ fontSize: 11, padding: "8px", opacity: 0.6 }}
              >
                🎨 POST TO DA
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Right Panel - Clothing Selection */}
      <div className="tsv-glass tsv-glow" style={{ padding: 14 }}>
        <div className="tsv-title" style={{ fontSize: 13, opacity:.88 }}>
          WARDROBE SELECTION
        </div>

        {/* Preset Costumes - Featured Section */}
        {CLOTHING_CATEGORIES.presetCostumes && (
          <div style={{ marginTop: 14, padding: 12, borderRadius: 12, background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.08)" }}>
            <div className="tsv-title" style={{ fontSize: 11, opacity:.85, marginBottom: 10 }}>
              ⭐ PRESET COSTUMES
            </div>
            <div style={{ fontSize: 9, opacity: 0.6, marginBottom: 10 }}>
              Quick outfit presets - select one for instant transformation!
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {CLOTHING_CATEGORIES.presetCostumes.map((item) => (
                <button
                  key={item}
                  onClick={() => handleItemToggle("presetCostumes", item)}
                  className="tsv-pill"
                  style={{
                    fontSize: 10,
                    padding: "5px 12px",
                    cursor: "pointer",
                    borderColor: selectedItems.presetCostumes === item ? selectedCharacter.accent : "rgba(255,255,255,.14)",
                    background: selectedItems.presetCostumes === item 
                      ? `linear-gradient(135deg, ${selectedCharacter.accent}35, ${selectedCharacter.glow}20)`
                      : "rgba(255,255,255,.10)",
                    boxShadow: selectedItems.presetCostumes === item ? `0 0 12px ${selectedCharacter.accent}40` : "none"
                  }}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Regular Clothing Categories */}
        {Object.entries(CLOTHING_CATEGORIES).filter(([cat]) => cat !== 'presetCostumes').map(([category, items]) => (
          <div key={category} style={{ marginTop: 14 }}>
            <div className="tsv-title" style={{ fontSize: 11, opacity:.75, marginBottom: 8, textTransform: "uppercase" }}>
              {category}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {items.map((item) => (
                <button
                  key={item}
                  onClick={() => handleItemToggle(category, item)}
                  className="tsv-pill"
                  style={{
                    fontSize: 10,
                    padding: "4px 10px",
                    cursor: "pointer",
                    borderColor: selectedItems[category] === item ? selectedCharacter.accent : "rgba(255,255,255,.14)",
                    background: selectedItems[category] === item 
                      ? `linear-gradient(135deg, ${selectedCharacter.accent}25, ${selectedCharacter.glow}15)`
                      : "rgba(255,255,255,.08)"
                  }}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* Custom Prompt */}
        <div style={{ marginTop: 14 }}>
          <div className="tsv-title" style={{ fontSize: 11, opacity:.75, marginBottom: 8 }}>
            CUSTOM OUTFIT DESCRIPTION
          </div>
          <textarea
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="E.g., 'red crop top with white leather chaki shirt pants with red belt and red wedge heels'"
            style={{
              width: "100%",
              minHeight: 100,
              borderRadius: 14,
              border: "1px solid rgba(255,255,255,.16)",
              background: "rgba(0,0,0,.22)",
              color: "rgba(255,255,255,.92)",
              padding: "10px 12px",
              fontSize: 12,
              fontFamily: "inherit",
              resize: "vertical"
            }}
          />
          <div style={{ fontSize: 10, opacity:.6, marginTop: 6 }}>
            Leave blank to use selected items above, or type a custom description
          </div>
        </div>

        {/* Generate Button */}
        <button
          className="tsv-btn"
          onClick={handleGenerate}
          disabled={loading}
          style={{ 
            width: "100%", 
            marginTop: 14,
            background: loading ? "rgba(100,100,100,.3)" : undefined,
            cursor: loading ? "not-allowed" : "pointer"
          }}
        >
          {loading ? "GENERATING..." : "🎨 GENERATE OUTFIT"}
        </button>

        {error && (
          <div style={{ 
            marginTop: 10, 
            padding: 10, 
            borderRadius: 8, 
            background: "rgba(255,0,0,.1)",
            border: "1px solid rgba(255,0,0,.3)",
            fontSize: 11,
            color: "#ff6666"
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Back Button */}
        <button
          className="tsv-btn"
          onClick={() => nav("/dressing-room")}
          style={{ width: "100%", marginTop: 10, opacity: 0.7 }}
        >
          ← Back to Character Selection
        </button>
      </div>
    </div>
  );
}
