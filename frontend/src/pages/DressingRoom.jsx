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
    "Crop Hoodie", "Longline T-Shirt", "Asymmetric Top", "Sequin Top", "Silk Blouse", "Cashmere Sweater",
    // Sexy Tops
    "Sheer Mesh Top", "Fishnet Top", "Latex Top", "PVC Bodysuit", "Leather Bustier", "Strappy Bra Top", 
    "Chain Mail Top", "Deep V Crop", "Side Boob Top", "Underboob Crop", "Body Harness", "Cupless Corset", 
    "Wet Look Top", "Snakeskin Top", "Feather Top", "Jeweled Bra Top", "Crystal Chainmail", "Barely There Halter", 
    "String Bikini Top", "Micro Crop", "Navel Tie Top", "Open Back Bodysuit", "Caged Bralette", "Shredded Top", 
    "Net Sleeve Top", "Transparent Blouse", "Liquid Metal Top", "Holographic Crop", "Satin Slip Top", "Velvet Bustier"
  ],
  bottoms: [
    "Jeans", "Shorts", "Skirt", "Leggings", "Dress Pants", "Cargo Pants", "Mini Skirt",
    "Maxi Skirt", "Midi Skirt", "Pencil Skirt", "A-Line Skirt", "Pleated Skirt", "Jean Shorts", "Bike Shorts",
    "High-Waisted Pants", "Low-Rise Jeans", "Wide Leg Pants", "Capri Pants", "Joggers", "Sweatpants", "Leather Pants",
    "Palazzo Pants", "Culottes", "Flare Jeans", "Bootcut Jeans", "Skinny Jeans", "Mom Jeans", "Boyfriend Jeans",
    // Sexy Bottoms
    "Micro Mini Skirt", "High Slit Skirt", "Sheer Skirt", "Latex Skirt", "PVC Skirt", "Chain Skirt", 
    "Barely There Skirt", "Thong Skirt", "Cutout Skirt", "Strappy Skirt", "Fishnet Skirt", "See-Through Pants", 
    "Leather Hot Pants", "Latex Leggings", "Wet Look Leggings", "Garter Belt Bottom", "Suspender Shorts", 
    "Booty Shorts", "Cheeky Shorts", "Brazilian Cut Shorts", "Hip Hugger Jeans", "Painted-On Jeans", 
    "Liquid Latex Pants", "Body Paint Pants", "Holographic Shorts", "Satin Mini Skirt", "Velvet Hot Pants",
    "Lace Pencil Skirt", "Mesh Leggings", "Bodycon Skirt"
  ],
  shoes: [
    "Sneakers", "Heels", "Boots", "Sandals", "Wedges", "Flats", "Combat Boots",
    "Stiletto Heels", "Platform Heels", "Ankle Boots", "Knee-High Boots", "Thigh-High Boots", "Chelsea Boots",
    "Cowboy Boots", "Loafers", "Oxfords", "Mary Janes", "Mules", "Slides", "Espadrilles",
    "Ballet Flats", "Pointed Flats", "Gladiator Sandals", "Strappy Heels", "Slingback Heels", "Kitten Heels",
    // Sexy Homely Shoes
    "Fuzzy Slippers", "Silk House Slippers", "Feather Mules", "Satin Slides", "Velvet Loafers", "Marabou Heels",
    "Bedroom Heels", "Peep-Toe Slippers", "Lace Flats", "Cozy UGG Boots", "Fluffy Platform Slippers", 
    "Satin Ballet Slippers", "Sheer Stockings Barefoot", "Anklet Barefoot", "Toe Ring Barefoot", "Silk Socks",
    "Fishnet Ankle Socks", "Lace Socks with Heels", "Barefoot with Anklets", "House Wedges", "Indoor Stilettos",
    "Chenille Slippers", "Memory Foam Slides", "Cashmere Socks", "Silk Bed Socks", "Boudoir Heels",
    "Ribbon Tie Flats", "Faux Fur Slides", "Satin Kitten Heels", "Pearl Strap Sandals"
  ],
  hairstyles: [
    "Long", "Short", "Ponytail", "Bun", "Braided", "Wavy", "Straight", "Curly",
    "Bob", "Pixie Cut", "Shaggy", "Layered", "Bangs", "Side Swept", "Updo", "Half-Up Half-Down",
    "Messy Bun", "Top Knot", "French Braid", "Fishtail Braid", "Dutch Braid", "Crown Braid", "Space Buns", "Pigtails",
    "Beach Waves", "Loose Curls", "Tight Curls", "Afro", "Locs", "Twists", "Cornrows", "High Ponytail",
    "Bombshell Waves", "Pin-Up Curls", "Sultry Side Sweep", "Tousled Bedroom Hair", "Windswept Waves",
    "Messy Sex Hair", "Wet Look Waves", "Glossy Straight", "Siren Curls", "Vixen Waves", "Goddess Braids",
    "Mermaid Waves", "Long Flowing Hair", "Cascading Curls", "Voluminous Blowout", "Big Hair Energy"
  ],
  accessories: [
    "Belt", "Necklace", "Earrings", "Watch", "Bracelet", "Hat", "Sunglasses", "Bag",
    "Choker", "Pendant", "Chain Necklace", "Hoop Earrings", "Stud Earrings", "Drop Earrings", "Cuff Bracelet",
    "Anklet", "Ring", "Hair Clip", "Headband", "Scrunchie", "Bow", "Body Chain", "Layered Necklaces",
    "Pearl Necklace", "Statement Necklace", "Tassel Earrings", "Chandelier Earrings", "Ear Cuff"
  ],
  positions: [
    "Standing", "Sitting", "Laying on Stomach", "Laying on Back", "Kneeling", "Squatting", "Leaning Forward", "Leaning Back",
    "Arms Crossed", "Hands on Hips", "One Hand on Hip", "Peace Sign", "Waving", "Pointing", "Thumbs Up", "Heart Hands",
    "Looking Over Shoulder", "Side Profile", "Three-Quarter View", "Full Frontal",
    // 30 More Positions
    "Sprawled Out", "Curled Up", "Stretching", "Arching Back", "On All Fours", "Crawling", "Crouching",
    "Legs Spread", "Legs Crossed", "One Leg Up", "Hands Behind Head", "Hands on Knees", "Hands on Face",
    "Touching Hair", "Blowing Kiss", "Finger on Lips", "Hand on Chest", "Hand on Hip Turned", "Dancing Pose",
    "Jumping", "Floating", "Hovering", "Flying Pose", "Action Stance", "Fighting Stance", "Yoga Pose",
    "Meditation Pose", "Sleeping Position", "Sensual Recline", "Pin-Up Pose"
  ],
  presetCostumes: [
    "School Uniform", "Gothic Lolita", "Maid Outfit", "Nurse Uniform", "Police Officer", "Military Uniform",
    "Pirate Captain", "Witch Costume", "Vampire Gothic", "Angel Wings", "Devil Costume", "Cat Girl",
    "Bunny Suit", "Cheerleader", "Rockstar Outfit", "Cyberpunk Street", "Steampunk Victorian", "Medieval Knight",
    "Samurai Warrior", "Ninja Assassin", "Cowgirl Western", "1950s Pin-Up", "1920s Flapper", "1980s Retro",
    "Beach Summer", "Winter Wonderland", "Formal Evening Gown", "Casual Street Style", "Business Professional", "Athleisure Sports",
    // Power Rangers
    "Mighty Morphin Red Ranger", "Mighty Morphin Pink Ranger", "Mighty Morphin Blue Ranger", "Mighty Morphin Yellow Ranger",
    // Marvel & DC
    "Iron Man Suit", "Captain America", "Black Widow Spy", "Scarlet Witch", "Wonder Woman Amazonian", "Harley Quinn",
    // 40 Popular Presets
    "Catwoman Suit", "Princess Leia", "Sailor Moon", "Lara Croft", "Kim Possible", "Elastigirl", "Jessica Rabbit",
    "Bayonetta", "2B NieR", "Tifa Lockhart", "Chun-Li", "Cammy White", "Mai Shiranui", "D.Va Overwatch",
    "Widowmaker", "Loba Apex", "Ahri League", "Jinx Arcane", "Raven Teen Titans", "Starfire", "Poison Ivy",
    "Catwoman Classic", "Storm X-Men", "Jean Grey Phoenix", "Black Cat Marvel", "Elektra", "Psylocke",
    "Emma Frost", "Mystique", "She-Hulk", "Gamora", "Nebula", "Mantis", "Wanda Vision", "Agatha Harkness",
    "Daenerys Targaryen", "Cersei Lannister", "Yennefer Witcher", "Triss Merigold", "Ciri Witcher", "Geralt Armor"
  ],
  artStyles: [
    "Anime Style", "Manga Style", "Semi-Realistic Anime", "Chibi Style", "Kawaii Style", "Western Animation",
    "Disney Style", "Pixar 3D", "Studio Ghibli", "Makoto Shinkai", "Comic Book Style", "Marvel Comics",
    "DC Comics Style", "Graphic Novel", "Noir Style", "Cel Shaded", "Watercolor Painting", "Oil Painting",
    "Digital Art", "Concept Art", "Fantasy Art", "Sci-Fi Art", "Cyberpunk Aesthetic", "Vaporwave",
    "Retro 80s", "Retro 90s", "Art Nouveau", "Art Deco", "Pop Art", "Minimalist"
  ],
  backgrounds: [
    // 30 Backgrounds
    "Bedroom", "Living Room", "Kitchen", "Bathroom", "Luxury Penthouse", "Cozy Cabin", "Beach House",
    "Rooftop Terrace", "Garden Patio", "Swimming Pool", "Hot Tub", "Sauna", "Gym", "Dance Studio",
    "Photography Studio", "Red Carpet", "Nightclub", "Bar Lounge", "Restaurant", "Hotel Suite",
    "Spa Room", "Massage Table", "Yoga Studio", "Boxing Ring", "Racing Track", "Concert Stage",
    "Forest Clearing", "Mountain Peak", "Desert Sunset", "Underwater Fantasy"
  ],
  gestures: [
    // 30 Gestures
    "Winking", "Blowing a Kiss", "Licking Lips", "Biting Lip", "Smiling Seductively", "Smirking", "Pouting",
    "Sticking Tongue Out", "Finger on Chin", "Hand Under Chin", "Playing with Hair", "Twirling Hair",
    "Brushing Hair Back", "Covering Mouth", "Whispering", "Shushing", "Come Hither Finger", "Beckoning",
    "Waving Goodbye", "Throwing Kiss", "Making Heart with Hands", "Peace Sign Near Face", "Flexing",
    "Showing Off Nails", "Applying Lipstick", "Looking in Mirror", "Taking Selfie", "Blowing Smoke",
    "Sipping Drink", "Eating Seductively"
  ],
  pairsMature: [
    // 40 Mature Pair Activities
    "Passionate Embrace", "Slow Dancing Together", "Gazing Into Eyes", "Whispering Secrets", "Feeding Each Other",
    "Sharing Wine", "Candlelit Dinner", "Bubble Bath Together", "Massage Exchange", "Cuddling on Couch",
    "Spooning in Bed", "Forehead Kiss", "Neck Kiss", "Hand Holding Walk", "Piggyback Ride",
    "Carrying Bridal Style", "Sitting on Lap", "Straddling", "Back Hug", "Front Embrace",
    "Nose to Nose", "Eskimo Kiss", "Butterfly Kisses", "Tangled Legs", "Intertwined Fingers",
    "Playing Footsie", "Pillow Fight", "Tickle Fight", "Wrestling Playfully", "Pinning Down",
    "Being Pinned", "Tied Up", "Blindfolded", "Handcuffed", "Collar and Leash",
    "Dominating Pose", "Submissive Pose", "Power Exchange", "Mirror Pose", "Symmetrical Pose"
  ],
  pairsFun: [
    // 40 Fun Pair Activities
    "High Five", "Fist Bump", "Victory Pose Together", "Jumping Together", "Running Together",
    "Racing Each Other", "Playing Video Games", "Board Game Battle", "Cooking Together", "Baking Together",
    "Making Pizza", "Food Fight", "Snowball Fight", "Water Balloon Fight", "Paintball Battle",
    "Nerf Gun War", "Hide and Seek", "Tag You're It", "Thumb Wrestling", "Arm Wrestling",
    "Dance Battle", "Karaoke Duet", "Singing Together", "Playing Instruments", "Jamming Session",
    "Yoga Partner Pose", "Acro Yoga", "Trust Fall", "Lift and Spin", "Dip Dance Move",
    "Tango Pose", "Salsa Move", "Breakdance Battle", "TikTok Dance", "Photobooth Poses",
    "Silly Faces", "Matching Outfits", "Cosplay Together", "Halloween Costumes", "Best Friends Pose"
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
    positions: "",
    presetCostumes: "",
    artStyles: "",
    backgrounds: "",
    gestures: "",
    pairsMature: "",
    pairsFun: ""
  });
  const [generatedImage, setGeneratedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  
  // Second image for pairs
  const [secondImage, setSecondImage] = useState(null);
  const [secondImageSource, setSecondImageSource] = useState("none"); // none, upload, character
  const [secondCharacter, setSecondCharacter] = useState(null);
  const [showPairsMode, setShowPairsMode] = useState(false);
  
  // DeviantArt state
  const [daAuthenticated, setDaAuthenticated] = useState(false);
  const [daPosting, setDaPosting] = useState(false);
  const [daPostResult, setDaPostResult] = useState(null);
  const [daError, setDaError] = useState(null);

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
    
    // Check DeviantArt auth status
    checkDeviantArtAuth();
    
    // Listen for DeviantArt OAuth callback
    const handleMessage = (event) => {
      if (event.data?.type === 'deviantart_auth_success') {
        setDaAuthenticated(true);
        setDaError(null);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [id]);
  
  const checkDeviantArtAuth = async () => {
    try {
      const response = await fetch('/api/deviantart/auth-status');
      const data = await response.json();
      setDaAuthenticated(data.authenticated);
    } catch (err) {
      console.error("Failed to check DA auth status:", err);
    }
  };
  
  const handleDeviantArtAuth = async () => {
    try {
      const response = await fetch('/api/deviantart/auth-url');
      const data = await response.json();
      
      if (data.auth_url) {
        // Open OAuth popup
        const popup = window.open(
          data.auth_url,
          'DeviantArt Authorization',
          'width=600,height=700,scrollbars=yes'
        );
        
        // Check if popup was blocked
        if (!popup) {
          setDaError("Popup blocked! Please allow popups for this site.");
        }
      }
    } catch (err) {
      setDaError("Failed to start DeviantArt authorization");
    }
  };
  
  const handlePostToDeviantArt = async () => {
    if (!generatedImage || !selectedCharacter) return;
    
    setDaPosting(true);
    setDaError(null);
    setDaPostResult(null);
    
    try {
      // Generate a title based on outfit
      const outfitDesc = generateOutfitPrompt();
      const title = `${selectedCharacter.name} - ${outfitDesc.slice(0, 50)}${outfitDesc.length > 50 ? '...' : ''}`;
      
      const response = await fetch('/api/deviantart/post-outfit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_base64: generatedImage,
          character_name: selectedCharacter.name,
          title: title,
          description: `AI-generated outfit for ${selectedCharacter.name} from TSV Terminal Dressing Room.\n\nOutfit: ${outfitDesc}`,
          tags: ['ai-art', 'digital-art', selectedCharacter.name.toLowerCase().replace(/\s+/g, '-'), 'tsv-terminal', 'character-outfit'],
          is_mature: false
        })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setDaPostResult(data);
      } else {
        setDaError(data.detail || 'Failed to post to DeviantArt');
      }
    } catch (err) {
      setDaError(err.message || 'Network error');
    } finally {
      setDaPosting(false);
    }
  };
  
  const handleViewOnDeviantArt = async () => {
    if (!selectedCharacter) return;
    
    try {
      const response = await fetch(`/api/deviantart/view-url/${encodeURIComponent(selectedCharacter.name)}`);
      const data = await response.json();
      
      if (data.gallery_url) {
        window.open(data.gallery_url, '_blank');
      }
    } catch (err) {
      // Fallback to generic profile
      window.open('https://www.deviantart.com/thesaiyanvictoria', '_blank');
    }
  };

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

    let basePrompt = "";

    // If a preset costume is selected, use it as the primary description
    if (selectedItems.presetCostumes) {
      const parts = [selectedItems.presetCostumes];
      // Add other selected items as modifiers
      if (selectedItems.hairstyles) parts.push(`with ${selectedItems.hairstyles} hair`);
      if (selectedItems.accessories) parts.push(`and ${selectedItems.accessories}`);
      if (selectedItems.positions) parts.push(`in ${selectedItems.positions} position`);
      basePrompt = parts.join(" ");
    } else {
      // Otherwise, build from individual items
      const parts = [];
      if (selectedItems.tops) parts.push(selectedItems.tops);
      if (selectedItems.bottoms) parts.push(selectedItems.bottoms);
      if (selectedItems.shoes) parts.push(selectedItems.shoes);
      if (selectedItems.hairstyles) parts.push(`${selectedItems.hairstyles} hair`);
      if (selectedItems.accessories) parts.push(selectedItems.accessories);
      if (selectedItems.positions) parts.push(`${selectedItems.positions} position`);
      basePrompt = parts.join(", ");
    }

    // Add background if selected
    if (selectedItems.backgrounds) {
      basePrompt = basePrompt ? `${basePrompt}, in ${selectedItems.backgrounds} background` : `in ${selectedItems.backgrounds} background`;
    }

    // Add gesture if selected
    if (selectedItems.gestures) {
      basePrompt = basePrompt ? `${basePrompt}, ${selectedItems.gestures}` : selectedItems.gestures;
    }

    // Add pairs activity if in pairs mode
    if (showPairsMode && secondImage) {
      if (selectedItems.pairsMature) {
        basePrompt = basePrompt ? `${basePrompt}, two people ${selectedItems.pairsMature}` : `two people ${selectedItems.pairsMature}`;
      }
      if (selectedItems.pairsFun) {
        basePrompt = basePrompt ? `${basePrompt}, two people ${selectedItems.pairsFun}` : `two people ${selectedItems.pairsFun}`;
      }
    }

    // Add art style as a suffix if selected
    if (selectedItems.artStyles && basePrompt) {
      basePrompt = `${basePrompt}, rendered in ${selectedItems.artStyles}`;
    } else if (selectedItems.artStyles && !basePrompt) {
      basePrompt = `rendered in ${selectedItems.artStyles}`;
    }

    return basePrompt;
  };

  const handleSecondImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSecondImage(reader.result);
        setSecondImageSource("upload");
        setShowPairsMode(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectSecondCharacter = (char) => {
    setSecondCharacter(char);
    // Try to load base image for second character
    const charFile = `/app/backend/base_images/${char.id}.png`;
    setSecondImage(char.portrait || null);
    setSecondImageSource("character");
    setShowPairsMode(true);
  };

  const clearSecondImage = () => {
    setSecondImage(null);
    setSecondImageSource("none");
    setSecondCharacter(null);
    setShowPairsMode(false);
    setSelectedItems(prev => ({ ...prev, pairsMature: "", pairsFun: "" }));
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
      
      // Track usage analytics
      trackUsage(outfitDesc, true);
      
      // Dispatch event for TerminalPolish component
      window.dispatchEvent(new Event('tsv_outfit_generated'));
    } catch (err) {
      setError(err.message);
      // Track failed generation
      trackUsage(outfitDesc, false);
    } finally {
      setLoading(false);
    }
  };

  // Track usage for analytics
  const trackUsage = async (outfitDesc, success) => {
    try {
      // Get or create session ID
      let sessionId = sessionStorage.getItem('tsv_session_id');
      if (!sessionId) {
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        sessionStorage.setItem('tsv_session_id', sessionId);
      }

      await fetch("/api/dressing-room/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          character_id: selectedCharacter.id,
          character_name: selectedCharacter.name,
          outfit_description: outfitDesc,
          selections: selectedItems,
          has_second_character: showPairsMode && !!secondImage,
          second_character_name: secondCharacter?.name || null,
          pair_activity: selectedItems.pairsMature || selectedItems.pairsFun || null,
          generated_successfully: success,
          user_agent: navigator.userAgent,
          session_id: sessionId
        })
      });
    } catch (err) {
      console.error("Failed to track usage:", err);
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
            minHeight: 300
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
                minHeight: 300,
                opacity: 0.5
              }}>
                <div className="tsv-title" style={{ fontSize: 12 }}>
                  No base image available
                </div>
              </div>
            )}
          </div>

          {/* Second Image for Pairs */}
          <div style={{ marginTop: 14, padding: 12, borderRadius: 12, background: "rgba(255,105,180,.08)", border: "1px solid rgba(255,105,180,.25)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div className="tsv-title" style={{ fontSize: 11, opacity:.85, color: "#ff69b4" }}>
                💕 SECOND CHARACTER (PAIRS MODE)
              </div>
              {secondImage && (
                <button
                  className="tsv-btn"
                  onClick={clearSecondImage}
                  style={{ fontSize: 9, padding: "4px 8px", background: "rgba(255,0,0,.2)", borderColor: "#ff4444" }}
                >
                  ✕ Remove
                </button>
              )}
            </div>
            <div style={{ fontSize: 9, opacity: 0.6, marginBottom: 10 }}>
              Add a second character to create couple/duo images with the Pairs activities below
            </div>
            
            {!secondImage ? (
              <div style={{ display: "flex", gap: 8 }}>
                <label style={{ flex: 1 }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleSecondImageUpload}
                    style={{ display: "none" }}
                  />
                  <button
                    className="tsv-btn"
                    style={{ fontSize: 10, padding: "8px", width: "100%", background: "rgba(255,105,180,.15)", borderColor: "#ff69b4" }}
                    onClick={(e) => { e.preventDefault(); e.target.previousSibling.click(); }}
                  >
                    📁 Upload 2nd Character
                  </button>
                </label>
              </div>
            ) : (
              <div style={{ 
                borderRadius: 12, 
                border: "2px solid #ff69b4",
                overflow: "hidden",
                position: "relative",
                maxHeight: 200
              }}>
                <img 
                  src={secondImage} 
                  alt="Second character"
                  style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
                />
                {secondCharacter && (
                  <div style={{ 
                    position: "absolute", 
                    bottom: 0, 
                    left: 0, 
                    right: 0, 
                    padding: "4px 8px", 
                    background: "rgba(0,0,0,.7)",
                    fontSize: 10,
                    color: "#ff69b4"
                  }}>
                    {secondCharacter.name}
                  </div>
                )}
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
            <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
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
              
              {/* DeviantArt POST Button */}
              {daAuthenticated ? (
                <button 
                  className="tsv-btn"
                  onClick={handlePostToDeviantArt}
                  disabled={daPosting}
                  style={{ 
                    fontSize: 11, 
                    padding: "8px",
                    background: daPosting 
                      ? "rgba(100,100,100,.3)" 
                      : "linear-gradient(135deg, #00d46a40, #05cc4730)",
                    borderColor: "#00d46a",
                    cursor: daPosting ? "not-allowed" : "pointer"
                  }}
                >
                  {daPosting ? "⏳ POSTING..." : "🎨 POST"}
                </button>
              ) : (
                <button 
                  className="tsv-btn"
                  onClick={handleDeviantArtAuth}
                  style={{ 
                    fontSize: 11, 
                    padding: "8px",
                    background: "linear-gradient(135deg, #ff990040, #ff660030)",
                    borderColor: "#ff9900"
                  }}
                >
                  🔐 CONNECT DA
                </button>
              )}
              
              {/* DeviantArt VIEW Button */}
              <button 
                className="tsv-btn"
                onClick={handleViewOnDeviantArt}
                style={{ 
                  fontSize: 11, 
                  padding: "8px",
                  background: "linear-gradient(135deg, #05cc4740, #00d46a30)",
                  borderColor: "#05cc47"
                }}
              >
                👁️ VIEW
              </button>
            </div>
            
            {/* DeviantArt Post Result/Error */}
            {daPostResult && (
              <div style={{ 
                marginTop: 10, 
                padding: 10, 
                borderRadius: 8, 
                background: "rgba(0,212,106,.1)",
                border: "1px solid rgba(0,212,106,.4)",
                fontSize: 11
              }}>
                <div style={{ color: "#00d46a", marginBottom: 6 }}>✅ Posted to DeviantArt!</div>
                {daPostResult.deviation_url && (
                  <a 
                    href={daPostResult.deviation_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ color: "#05cc47", textDecoration: "underline" }}
                  >
                    View on DeviantArt →
                  </a>
                )}
              </div>
            )}
            
            {daError && (
              <div style={{ 
                marginTop: 10, 
                padding: 10, 
                borderRadius: 8, 
                background: "rgba(255,153,0,.1)",
                border: "1px solid rgba(255,153,0,.4)",
                fontSize: 11,
                color: "#ff9900"
              }}>
                ⚠️ {daError}
                {!daAuthenticated && (
                  <div style={{ marginTop: 6 }}>
                    <button 
                      className="tsv-btn"
                      onClick={handleDeviantArtAuth}
                      style={{ fontSize: 10, padding: "4px 8px" }}
                    >
                      🔐 Connect DeviantArt
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Panel - Clothing Selection */}
      <div className="tsv-glass tsv-glow" style={{ padding: 14, maxHeight: "90vh", overflowY: "auto" }}>
        <div className="tsv-title" style={{ fontSize: 13, opacity:.88 }}>
          WARDROBE SELECTION
        </div>

        {/* Preset Costumes - Featured Section */}
        {CLOTHING_CATEGORIES.presetCostumes && (
          <div style={{ marginTop: 14, padding: 12, borderRadius: 12, background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.08)" }}>
            <div className="tsv-title" style={{ fontSize: 11, opacity:.85, marginBottom: 10 }}>
              ⭐ PRESET COSTUMES ({CLOTHING_CATEGORIES.presetCostumes.length})
            </div>
            <div style={{ fontSize: 9, opacity: 0.6, marginBottom: 10 }}>
              Quick outfit presets - select one for instant transformation!
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, maxHeight: 150, overflowY: "auto" }}>
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

        {/* Backgrounds Section */}
        {CLOTHING_CATEGORIES.backgrounds && (
          <div style={{ marginTop: 14, padding: 12, borderRadius: 12, background: "rgba(0,191,255,.05)", border: "1px solid rgba(0,191,255,.2)" }}>
            <div className="tsv-title" style={{ fontSize: 11, opacity:.85, marginBottom: 10, color: "#00bfff" }}>
              🏠 BACKGROUNDS ({CLOTHING_CATEGORIES.backgrounds.length})
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {CLOTHING_CATEGORIES.backgrounds.map((item) => (
                <button
                  key={item}
                  onClick={() => handleItemToggle("backgrounds", item)}
                  className="tsv-pill"
                  style={{
                    fontSize: 10,
                    padding: "5px 12px",
                    cursor: "pointer",
                    borderColor: selectedItems.backgrounds === item ? "#00bfff" : "rgba(0,191,255,.3)",
                    background: selectedItems.backgrounds === item 
                      ? "linear-gradient(135deg, rgba(0,191,255,.35), rgba(135,206,250,.2))"
                      : "rgba(0,191,255,.1)",
                    boxShadow: selectedItems.backgrounds === item ? "0 0 12px rgba(0,191,255,.4)" : "none"
                  }}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Gestures Section */}
        {CLOTHING_CATEGORIES.gestures && (
          <div style={{ marginTop: 14, padding: 12, borderRadius: 12, background: "rgba(255,215,0,.05)", border: "1px solid rgba(255,215,0,.2)" }}>
            <div className="tsv-title" style={{ fontSize: 11, opacity:.85, marginBottom: 10, color: "#ffd700" }}>
              🤟 GESTURES ({CLOTHING_CATEGORIES.gestures.length})
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {CLOTHING_CATEGORIES.gestures.map((item) => (
                <button
                  key={item}
                  onClick={() => handleItemToggle("gestures", item)}
                  className="tsv-pill"
                  style={{
                    fontSize: 10,
                    padding: "5px 12px",
                    cursor: "pointer",
                    borderColor: selectedItems.gestures === item ? "#ffd700" : "rgba(255,215,0,.3)",
                    background: selectedItems.gestures === item 
                      ? "linear-gradient(135deg, rgba(255,215,0,.35), rgba(255,255,150,.2))"
                      : "rgba(255,215,0,.1)",
                    boxShadow: selectedItems.gestures === item ? "0 0 12px rgba(255,215,0,.4)" : "none"
                  }}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Pairs Section - Only show if second image is uploaded */}
        {showPairsMode && secondImage && (
          <>
            {/* Pairs Mature */}
            <div style={{ marginTop: 14, padding: 12, borderRadius: 12, background: "rgba(255,20,147,.08)", border: "1px solid rgba(255,20,147,.3)" }}>
              <div className="tsv-title" style={{ fontSize: 11, opacity:.85, marginBottom: 10, color: "#ff1493" }}>
                💋 PAIRS - MATURE ({CLOTHING_CATEGORIES.pairsMature.length})
              </div>
              <div style={{ fontSize: 9, opacity: 0.6, marginBottom: 10 }}>
                Romantic & intimate activities for two characters
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, maxHeight: 120, overflowY: "auto" }}>
                {CLOTHING_CATEGORIES.pairsMature.map((item) => (
                  <button
                    key={item}
                    onClick={() => handleItemToggle("pairsMature", item)}
                    className="tsv-pill"
                    style={{
                      fontSize: 10,
                      padding: "5px 12px",
                      cursor: "pointer",
                      borderColor: selectedItems.pairsMature === item ? "#ff1493" : "rgba(255,20,147,.3)",
                      background: selectedItems.pairsMature === item 
                        ? "linear-gradient(135deg, rgba(255,20,147,.35), rgba(255,182,193,.2))"
                        : "rgba(255,20,147,.1)",
                      boxShadow: selectedItems.pairsMature === item ? "0 0 12px rgba(255,20,147,.4)" : "none"
                    }}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            {/* Pairs Fun */}
            <div style={{ marginTop: 14, padding: 12, borderRadius: 12, background: "rgba(50,205,50,.08)", border: "1px solid rgba(50,205,50,.3)" }}>
              <div className="tsv-title" style={{ fontSize: 11, opacity:.85, marginBottom: 10, color: "#32cd32" }}>
                🎉 PAIRS - FUN ({CLOTHING_CATEGORIES.pairsFun.length})
              </div>
              <div style={{ fontSize: 9, opacity: 0.6, marginBottom: 10 }}>
                Fun & playful activities for two characters
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, maxHeight: 120, overflowY: "auto" }}>
                {CLOTHING_CATEGORIES.pairsFun.map((item) => (
                  <button
                    key={item}
                    onClick={() => handleItemToggle("pairsFun", item)}
                    className="tsv-pill"
                    style={{
                      fontSize: 10,
                      padding: "5px 12px",
                      cursor: "pointer",
                      borderColor: selectedItems.pairsFun === item ? "#32cd32" : "rgba(50,205,50,.3)",
                      background: selectedItems.pairsFun === item 
                        ? "linear-gradient(135deg, rgba(50,205,50,.35), rgba(144,238,144,.2))"
                        : "rgba(50,205,50,.1)",
                      boxShadow: selectedItems.pairsFun === item ? "0 0 12px rgba(50,205,50,.4)" : "none"
                    }}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Art Styles - Featured Section */}
        {CLOTHING_CATEGORIES.artStyles && (
          <div style={{ marginTop: 14, padding: 12, borderRadius: 12, background: "rgba(138,43,226,.05)", border: "1px solid rgba(138,43,226,.2)" }}>
            <div className="tsv-title" style={{ fontSize: 11, opacity:.85, marginBottom: 10 }}>
              🎨 ART STYLES ({CLOTHING_CATEGORIES.artStyles.length})
            </div>
            <div style={{ fontSize: 9, opacity: 0.6, marginBottom: 10 }}>
              Choose rendering style for your outfit (anime, realistic, comic, etc.)
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {CLOTHING_CATEGORIES.artStyles.map((item) => (
                <button
                  key={item}
                  onClick={() => handleItemToggle("artStyles", item)}
                  className="tsv-pill"
                  style={{
                    fontSize: 10,
                    padding: "5px 12px",
                    cursor: "pointer",
                    borderColor: selectedItems.artStyles === item ? "#8B2BDA" : "rgba(138,43,226,.3)",
                    background: selectedItems.artStyles === item 
                      ? "linear-gradient(135deg, rgba(138,43,226,.35), rgba(199,164,255,.2))"
                      : "rgba(138,43,226,.1)",
                    boxShadow: selectedItems.artStyles === item ? "0 0 12px rgba(138,43,226,.4)" : "none"
                  }}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Regular Clothing Categories */}
        {Object.entries(CLOTHING_CATEGORIES).filter(([cat]) => !['presetCostumes', 'artStyles', 'backgrounds', 'gestures', 'pairsMature', 'pairsFun'].includes(cat)).map(([category, items]) => (
          <div key={category} style={{ marginTop: 14 }}>
            <div className="tsv-title" style={{ fontSize: 11, opacity:.75, marginBottom: 8, textTransform: "uppercase" }}>
              {category} ({items.length})
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, maxHeight: 120, overflowY: "auto" }}>
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
