import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { TSV_CHARACTERS } from "../content/tsvContent.js";
import { addLike, getLikes, getCharacterRank } from "../utils/engagement.js";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "";

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
    "Retro 80s", "Retro 90s", "Art Nouveau", "Art Deco", "Pop Art", "Minimalist",
    // Realistic & Photorealistic Styles
    "8K Ultra Realistic", "8K Photorealistic Portrait", "8K Cinematic", "8K Fashion Photography",
    "Hyperrealistic", "Photorealistic", "Ultra Realistic 4K", "Cinema Quality 8K", "DSLR Photography",
    "Studio Portrait Photography", "Fashion Magazine Editorial", "Vogue Cover Style", "High Fashion Photoshoot",
    "Glamour Photography", "Beauty Photography", "Professional Headshot", "Red Carpet Photography",
    "Cinematic Film Still", "Movie Poster Realistic", "HDR Photography", "RAW Photo Style",
    "Natural Light Portrait", "Golden Hour Photography", "Dramatic Studio Lighting", "Rembrandt Lighting",
    "High Key Photography", "Low Key Photography", "Fine Art Photography", "Editorial Beauty",
    "Realistic Digital Painting", "Hyper Detailed Realistic"
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
  
  // TryOn mode state
  const [isTryOnMode, setIsTryOnMode] = useState(false);
  const [isHeadshotMode, setIsHeadshotMode] = useState(false);
  const [garmentImages, setGarmentImages] = useState([]); // Up to 4 garment images
  const [tryOnResults, setTryOnResults] = useState([]); // Multiple results from TryOn
  const [generatedResults, setGeneratedResults] = useState([]); // Multiple results from standard generation
  const [headshotBackground, setHeadshotBackground] = useState("neutral");
  const [headshotExpression, setHeadshotExpression] = useState("neutral");
  
  // DeviantArt state
  const [daAuthenticated, setDaAuthenticated] = useState(false);
  const [daPosting, setDaPosting] = useState(false);
  const [daPostResult, setDaPostResult] = useState(null);
  const [daError, setDaError] = useState(null);

  // Use ref to track if initial setup is done
  const initializedRef = useRef(false);
  const currentCharIdRef = useRef(null);

  useEffect(() => {
    if (!id) return;
    
    const char = TSV_CHARACTERS.find(c => c.id === id);
    if (!char || char.isSpecial) return;
    
    // Only run initialization once per character
    if (currentCharIdRef.current === id && initializedRef.current) {
      return;
    }
    
    currentCharIdRef.current = id;
    initializedRef.current = true;
    
    setSelectedCharacter(char);
    setLikeCount(getLikes(char.id));
    
    // For Community OC, start with blank slate
    if (char.requiresUpload) {
      setBaseImage(null);
      setBaseImageSource(null);
    } else {
      // For regular characters, load base image
      checkAndLoadBaseImage(char.id);
    }
    
    // Check DeviantArt auth (only once)
    checkDeviantArtAuth();
  }, [id]);
  
  // Separate effect for DeviantArt message listener
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data?.type === 'deviantart_auth_success') {
        setDaAuthenticated(true);
        setDaError(null);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);
  
  // Community OC requires manual upload - no auto-loading
  
  const checkDeviantArtAuth = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/deviantart/auth-status`);
      const data = await response.json();
      setDaAuthenticated(data.authenticated);
    } catch (err) {
      console.error("Failed to check DA auth status:", err);
    }
  };
  
  const handleDeviantArtAuth = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/deviantart/auth-url`);
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
      
      const response = await fetch(`${BACKEND_URL}/api/deviantart/post-outfit`, {
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
      const response = await fetch(`${BACKEND_URL}/api/deviantart/view-url/${encodeURIComponent(selectedCharacter.name)}`);
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
    // Skip for Community OC - they must upload
    const char = TSV_CHARACTERS.find(c => c.id === charId);
    if (char?.requiresUpload) return;
    
    // Priority 1: Try Nexus
    try {
      const response = await fetch(`${BACKEND_URL}/api/nexus/api/characters`);
      const characters = await response.json();
      const nexusChar = characters.find(c => 
        c.displayName?.toLowerCase() === charId.replace(/_/g, " ").toLowerCase()
      );
      if (nexusChar && nexusChar.avatar_image) {
        setBaseImage(nexusChar.avatar_image);
        setBaseImageSource("nexus");
        return; // Found Nexus image, done
      }
    } catch (err) {
      console.error("Failed to fetch Nexus image:", err);
    }
    
    // Priority 2: Try local portrait
    if (char && char.portrait) {
      setBaseImage(char.portrait);
      setBaseImageSource("portrait");
      return;
    }
    
    // Priority 3: Check for stored base image
    try {
      const response = await fetch(`${BACKEND_URL}/api/dressing-room/has-base/${charId}`);
      const data = await response.json();
      
      if (data.has_base_image) {
        const imgResponse = await fetch(`${BACKEND_URL}/api/dressing-room/get-base/${charId}`);
        if (imgResponse.ok) {
          const imgData = await imgResponse.json();
          setBaseImage(`data:image/png;base64,${imgData.image_base64}`);
          setBaseImageSource("stored");
          return;
        }
      }
    } catch (err) {
      console.error("Failed to check stored base image:", err);
    }
    
    // No image found
    setBaseImageSource("placeholder");
  };

  // Separate function for "Try Nexus" button
  const fetchNexusImage = async (charId) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/nexus/api/characters`);
      const characters = await response.json();
      const nexusChar = characters.find(c => 
        c.displayName?.toLowerCase() === charId.replace(/_/g, " ").toLowerCase()
      );
      if (nexusChar && nexusChar.avatar_image) {
        setBaseImage(nexusChar.avatar_image);
        setBaseImageSource("nexus");
      }
    } catch (err) {
      console.error("Failed to fetch Nexus image:", err);
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
    // PRIORITY 1: Custom prompt always wins if provided
    if (customPrompt.trim()) {
      console.log("[DEBUG] Using custom prompt:", customPrompt.trim());
      return customPrompt.trim();
    }

    console.log("[DEBUG] No custom prompt, using selections");
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

    // Add pairs mode - include BOTH character names explicitly
    if (showPairsMode && secondCharacter) {
      const char1Name = selectedCharacter?.name || "first character";
      const char2Name = secondCharacter?.name || "second character";
      
      // Prepend the two characters to the prompt
      const pairsPrefix = `${char1Name} and ${char2Name} together`;
      basePrompt = basePrompt ? `${pairsPrefix}, ${basePrompt}` : pairsPrefix;
      
      // Add pairs activity if selected
      if (selectedItems.pairsMature) {
        basePrompt = `${basePrompt}, ${selectedItems.pairsMature}`;
      }
      if (selectedItems.pairsFun) {
        basePrompt = `${basePrompt}, ${selectedItems.pairsFun}`;
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

    // TryOn mode - uses garment images
    if (isTryOnMode) {
      await handleTryOnGenerate();
      return;
    }

    // Headshot mode - creates close-up portrait
    if (isHeadshotMode) {
      await handleHeadshotGenerate();
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
      // Build request body
      // For uploaded images (including Community OC), always send as base64
      const isUploadedImage = baseImageSource === "upload" || selectedCharacter.requiresUpload;
      
      const requestBody = {
        character_id: selectedCharacter.id,
        character_name: selectedCharacter.name,
        character_description: selectedCharacter.subtitle || "anime character",
        outfit_description: outfitDesc,
        reference_image_url: baseImageSource === "nexus" ? baseImage : null,
        reference_image_base64: isUploadedImage ? baseImage : null,
        save_as_base: isUploadedImage
      };
      
      // Add second character info for Pairs mode
      if (showPairsMode && secondCharacter) {
        requestBody.second_character_id = secondCharacter.id;
        requestBody.second_character_name = secondCharacter.name;
        requestBody.is_pairs_mode = true;
      }
      
      const response = await fetch(`${BACKEND_URL}/api/dressing-room/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to generate image");
      }

      const data = await response.json();
      
      // Handle multiple results (4 images)
      if (data.images && data.images.length > 0) {
        const results = data.images.map(img => `data:image/png;base64,${img.image_base64}`);
        setGeneratedResults(results);
        setGeneratedImage(results[0]); // Set first as main display
      } else {
        // Fallback for single image response
        setGeneratedImage(`data:image/png;base64,${data.image_base64}`);
        setGeneratedResults([`data:image/png;base64,${data.image_base64}`]);
      }
      
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

  // Handle TryOn mode generation with actual garment images
  const handleTryOnGenerate = async () => {
    if (garmentImages.length === 0) {
      setError("Please upload at least one garment/accessory image for TryOn mode");
      return;
    }

    setLoading(true);
    setError(null);
    setTryOnResults([]);

    try {
      const isUploadedImage = baseImageSource === "upload" || selectedCharacter?.requiresUpload;
      
      const requestBody = {
        model_image_url: baseImageSource === "nexus" ? baseImage : null,
        model_image_base64: isUploadedImage ? baseImage?.split(',').pop() : null,
        garment_image_urls: garmentImages.filter(g => g.startsWith('http')),
        garment_image_base64s: garmentImages.filter(g => !g.startsWith('http')).map(g => g.split(',').pop()),
        num_samples: 4,
        mode: "balanced"
      };
      
      const response = await fetch(`${BACKEND_URL}/api/dressing-room/tryon`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to generate try-on images");
      }

      const data = await response.json();
      
      // Set results - multiple images
      const results = data.images.map(img => `data:image/png;base64,${img.image_base64}`);
      setTryOnResults(results);
      
      // Also set the first result as the main generated image
      if (results.length > 0) {
        setGeneratedImage(results[0]);
      }
      
      window.dispatchEvent(new Event('tsv_outfit_generated'));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle garment image upload for TryOn mode
  const handleGarmentUpload = (e) => {
    const files = Array.from(e.target.files);
    if (garmentImages.length + files.length > 4) {
      setError("Maximum 4 garment images allowed");
      return;
    }

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setGarmentImages(prev => [...prev.slice(0, 3), event.target.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeGarmentImage = (index) => {
    setGarmentImages(prev => prev.filter((_, i) => i !== index));
  };

  // Handle Headshot mode generation
  const handleHeadshotGenerate = async () => {
    setLoading(true);
    setError(null);
    setGeneratedResults([]);

    try {
      const isUploadedImage = baseImageSource === "upload" || selectedCharacter?.requiresUpload;
      
      const requestBody = {
        character_name: selectedCharacter.name,
        character_id: selectedCharacter.id,
        reference_image_url: baseImageSource === "nexus" ? baseImage : null,
        reference_image_base64: isUploadedImage ? baseImage?.split(',').pop() : null,
        background: headshotBackground,
        expression: headshotExpression
      };
      
      const response = await fetch(`${BACKEND_URL}/api/dressing-room/headshot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to generate headshot");
      }

      const data = await response.json();
      
      // Handle multiple results (4 images)
      if (data.images && data.images.length > 0) {
        const results = data.images.map(img => `data:image/png;base64,${img.image_base64}`);
        setGeneratedResults(results);
        setGeneratedImage(results[0]);
      } else {
        setGeneratedImage(`data:image/png;base64,${data.image_base64}`);
        setGeneratedResults([`data:image/png;base64,${data.image_base64}`]);
      }
      
      window.dispatchEvent(new Event('tsv_outfit_generated'));
    } catch (err) {
      setError(err.message);
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

      await fetch(`${BACKEND_URL}/api/dressing-room/track`, {
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
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div className="tsv-title" style={{ fontSize: 14 }}>DRESSING ROOM</div>
              <div style={{ fontSize: 12, opacity:.72, marginTop: 8 }}>
                Select a character to dress up with AI-generated outfits
              </div>
            </div>
            <button
              className="tsv-btn"
              onClick={() => nav("/dressing-room-analytics")}
              style={{ 
                fontSize: 10, 
                padding: "8px 12px",
                background: "linear-gradient(135deg, rgba(0,255,255,.2), rgba(0,191,255,.1))",
                borderColor: "#00bfff"
              }}
            >
              📊 Analytics
            </button>
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
              data-testid={`character-card-${c.id}`}
              style={{
                padding: 14,
                textAlign: "left",
                cursor: "pointer",
                border: c.requiresUpload ? "2px dashed rgba(0,255,136,.5)" : "1px solid rgba(255,255,255,.14)",
                background: c.requiresUpload 
                  ? "linear-gradient(180deg, rgba(0,255,136,.12), rgba(0,204,255,.08))"
                  : "linear-gradient(180deg, rgba(255,255,255,.10), rgba(255,255,255,.06))"
              }}
            >
              <div className="tsv-title" style={{ fontSize: 14, color: c.accent }}>{c.name}</div>
              <div style={{ fontSize: 11, opacity:.72, marginTop: 6 }}>{c.subtitle}</div>
              {c.requiresUpload && (
                <div style={{ 
                  fontSize: 10, 
                  color: "#00FF88", 
                  marginTop: 8, 
                  padding: "4px 8px", 
                  background: "rgba(0,255,136,.15)", 
                  borderRadius: 6,
                  display: "inline-block"
                }}>
                  📁 Upload Required
                </div>
              )}
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
            {selectedCharacter.requiresUpload ? "UPLOAD YOUR CHARACTER" : "BASE IMAGE REQUIRED"}
          </div>
          
          {/* Community OC specific messaging */}
          {selectedCharacter.requiresUpload ? (
            <div style={{ fontSize: 10, opacity: 0.9, marginBottom: 12, color: "#00FF88", padding: "8px 12px", background: "rgba(0,255,136,.1)", borderRadius: 8, border: "1px dashed rgba(0,255,136,.3)" }}>
              📁 Upload an image of your OC to use as the base. This image will be used for all outfit generations in this session.
            </div>
          ) : (
            <div style={{ fontSize: 10, opacity: 0.7, marginBottom: 8, color: "#ffa500" }}>
              ⚠️ You must upload a base image of {selectedCharacter.name} to generate outfits
            </div>
          )}
          
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            {/* Only show Nexus button for non-Community OC characters */}
            {!selectedCharacter.requiresUpload && (
              <button
                className="tsv-btn"
                data-testid="try-nexus-btn"
                style={{ 
                  fontSize: 10, 
                  padding: "6px 10px",
                  opacity: baseImageSource === "nexus" ? 1 : 0.5
                }}
                onClick={() => { setBaseImageSource("nexus"); fetchNexusImage(selectedCharacter.id); }}
              >
                Try Nexus
              </button>
            )}
            <label style={{ flex: 1 }}>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: "none" }}
                data-testid="base-image-upload-input"
              />
              <button
                className="tsv-btn"
                data-testid="upload-image-btn"
                style={{ 
                  fontSize: 10, 
                  padding: "6px 10px",
                  width: "100%",
                  opacity: baseImageSource === "upload" || selectedCharacter.requiresUpload ? 1 : 0.5,
                  background: selectedCharacter.requiresUpload 
                    ? "linear-gradient(135deg, rgba(0,255,136,.3), rgba(0,204,255,.2))"
                    : baseImageSource === "upload" 
                      ? `linear-gradient(135deg, ${selectedCharacter.accent}40, ${selectedCharacter.glow}30)`
                      : undefined,
                  borderColor: selectedCharacter.requiresUpload ? "#00FF88" : undefined
                }}
                onClick={(e) => { e.preventDefault(); e.target.previousSibling.click(); }}
              >
                {selectedCharacter.requiresUpload ? "📁 Upload Your OC Image" : "📁 Upload Image"}
              </button>
            </label>
          </div>

          {/* Base Image Display */}
          <div className="tsv-scanlines tsv-noise" style={{ 
            borderRadius: 16, 
            border: selectedCharacter.requiresUpload && !baseImage 
              ? "2px dashed rgba(0,255,136,.4)" 
              : "1px solid rgba(255,255,255,.10)", 
            overflow: "hidden",
            position: "relative",
            minHeight: 300,
            background: selectedCharacter.requiresUpload && !baseImage ? "rgba(0,255,136,.03)" : undefined
          }}>
            {baseImage ? (
              <img 
                src={baseImage} 
                alt={selectedCharacter.name}
                data-testid="base-image-preview"
                style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
              />
            ) : (
              <div style={{ 
                display: "flex", 
                flexDirection: "column",
                alignItems: "center", 
                justifyContent: "center",
                minHeight: 300,
                opacity: 0.7,
                padding: 20,
                textAlign: "center"
              }}>
                {selectedCharacter.requiresUpload ? (
                  <>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>📤</div>
                    <div className="tsv-title" style={{ fontSize: 12, color: "#00FF88" }}>
                      Upload Your OC Image
                    </div>
                    <div style={{ fontSize: 10, marginTop: 8, opacity: 0.6 }}>
                      Your character will appear here after upload
                    </div>
                  </>
                ) : (
                  <div className="tsv-title" style={{ fontSize: 12 }}>
                    No base image available
                  </div>
                )}
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
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {/* Select from existing characters */}
                <div style={{ fontSize: 10, opacity: 0.7, marginBottom: 4 }}>Select a character:</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {TSV_CHARACTERS.filter(c => !c.isSpecial && c.id !== selectedCharacter?.id && !c.requiresUpload).map((char) => (
                    <button
                      key={char.id}
                      className="tsv-btn"
                      data-testid={`second-char-${char.id}`}
                      onClick={() => {
                        setSecondCharacter(char);
                        setSecondImage(char.portrait || `https://nexus-multiverse.emergent.host/characters/${char.id}`);
                        setSecondImageSource("character");
                        setShowPairsMode(true);
                      }}
                      style={{ 
                        fontSize: 9, 
                        padding: "6px 10px", 
                        background: "rgba(255,105,180,.15)", 
                        borderColor: char.accent || "#ff69b4"
                      }}
                    >
                      {char.name}
                    </button>
                  ))}
                </div>
                
                {/* Or upload custom image */}
                <div style={{ fontSize: 10, opacity: 0.7, marginTop: 8 }}>Or upload custom:</div>
                <label style={{ flex: 1 }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleSecondImageUpload}
                    style={{ display: "none" }}
                  />
                  <button
                    className="tsv-btn"
                    data-testid="upload-second-char-btn"
                    style={{ fontSize: 10, padding: "8px", width: "100%", background: "rgba(255,105,180,.15)", borderColor: "#ff69b4" }}
                    onClick={(e) => { e.preventDefault(); e.target.closest('label').querySelector('input').click(); }}
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
            
            {/* Results Grid - Show all 4 variations */}
            {generatedResults.length > 1 && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 10, opacity: 0.6, marginBottom: 8 }}>
                  {generatedResults.length} variations generated - click to select:
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                  {generatedResults.map((img, idx) => (
                    <img
                      key={idx}
                      src={img}
                      alt={`Variation ${idx + 1}`}
                      onClick={() => setGeneratedImage(img)}
                      style={{
                        width: "100%",
                        aspectRatio: "3/4",
                        objectFit: "cover",
                        borderRadius: 8,
                        border: generatedImage === img 
                          ? `2px solid ${selectedCharacter?.accent || '#ffa500'}` 
                          : "1px solid rgba(255,255,255,.2)",
                        cursor: "pointer",
                        boxShadow: generatedImage === img 
                          ? `0 0 10px ${selectedCharacter?.accent || '#ffa500'}50` 
                          : "none",
                        transition: "all 0.2s ease"
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
            
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
        
        {/* Mode Toggle: Text Prompt vs TryOn vs Headshot */}
        <div style={{ marginBottom: 14, padding: 12, borderRadius: 12, background: "rgba(255,165,0,.1)", border: "1px solid rgba(255,165,0,.3)" }}>
          <div className="tsv-title" style={{ fontSize: 11, opacity:.85, marginBottom: 10, color: "#ffa500" }}>
            🎭 GENERATION MODE
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <button
              onClick={() => { setIsTryOnMode(false); setIsHeadshotMode(false); setTryOnResults([]); }}
              className="tsv-pill"
              style={{
                flex: 1,
                minWidth: 80,
                fontSize: 10,
                padding: "8px 10px",
                cursor: "pointer",
                borderColor: (!isTryOnMode && !isHeadshotMode) ? "#ffa500" : "rgba(255,255,255,.14)",
                background: (!isTryOnMode && !isHeadshotMode) ? "rgba(255,165,0,.25)" : "rgba(255,255,255,.10)",
                boxShadow: (!isTryOnMode && !isHeadshotMode) ? "0 0 12px rgba(255,165,0,.4)" : "none"
              }}
            >
              📝 Outfit
            </button>
            <button
              onClick={() => { setIsTryOnMode(true); setIsHeadshotMode(false); }}
              className="tsv-pill"
              style={{
                flex: 1,
                minWidth: 80,
                fontSize: 10,
                padding: "8px 10px",
                cursor: "pointer",
                borderColor: isTryOnMode ? "#ff69b4" : "rgba(255,255,255,.14)",
                background: isTryOnMode ? "rgba(255,105,180,.25)" : "rgba(255,255,255,.10)",
                boxShadow: isTryOnMode ? "0 0 12px rgba(255,105,180,.4)" : "none"
              }}
            >
              👗 TryOn
            </button>
            <button
              onClick={() => { setIsTryOnMode(false); setIsHeadshotMode(true); setTryOnResults([]); }}
              className="tsv-pill"
              style={{
                flex: 1,
                minWidth: 80,
                fontSize: 10,
                padding: "8px 10px",
                cursor: "pointer",
                borderColor: isHeadshotMode ? "#00bfff" : "rgba(255,255,255,.14)",
                background: isHeadshotMode ? "rgba(0,191,255,.25)" : "rgba(255,255,255,.10)",
                boxShadow: isHeadshotMode ? "0 0 12px rgba(0,191,255,.4)" : "none"
              }}
            >
              🎬 Headshot
            </button>
          </div>
          <div style={{ fontSize: 9, opacity: 0.6, marginTop: 8 }}>
            {isTryOnMode 
              ? "Upload actual garment/accessory images to virtually try them on"
              : isHeadshotMode
              ? "Create a close-up portrait for talking head setups"
              : "Describe the outfit using text or select from presets below"
            }
          </div>
        </div>

        {/* Headshot Mode Options */}
        {isHeadshotMode && (
          <div style={{ marginBottom: 14, padding: 12, borderRadius: 12, background: "rgba(0,191,255,.1)", border: "1px solid rgba(0,191,255,.3)" }}>
            <div className="tsv-title" style={{ fontSize: 11, opacity:.85, marginBottom: 10, color: "#00bfff" }}>
              🎬 HEADSHOT OPTIONS
            </div>
            
            {/* Background Selection */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 10, opacity: 0.7, marginBottom: 6 }}>Background:</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {[
                  { value: "neutral", label: "Neutral" },
                  { value: "studio", label: "Studio" },
                  { value: "blurred", label: "Blurred" },
                  { value: "none", label: "Keep Original" }
                ].map(bg => (
                  <button
                    key={bg.value}
                    onClick={() => setHeadshotBackground(bg.value)}
                    className="tsv-pill"
                    style={{
                      fontSize: 9,
                      padding: "5px 10px",
                      cursor: "pointer",
                      borderColor: headshotBackground === bg.value ? "#00bfff" : "rgba(255,255,255,.14)",
                      background: headshotBackground === bg.value ? "rgba(0,191,255,.3)" : "rgba(255,255,255,.08)"
                    }}
                  >
                    {bg.label}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Expression Selection */}
            <div>
              <div style={{ fontSize: 10, opacity: 0.7, marginBottom: 6 }}>Expression:</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {[
                  { value: "neutral", label: "Neutral" },
                  { value: "smile", label: "Smile" },
                  { value: "serious", label: "Serious" },
                  { value: "friendly", label: "Friendly" }
                ].map(expr => (
                  <button
                    key={expr.value}
                    onClick={() => setHeadshotExpression(expr.value)}
                    className="tsv-pill"
                    style={{
                      fontSize: 9,
                      padding: "5px 10px",
                      cursor: "pointer",
                      borderColor: headshotExpression === expr.value ? "#00bfff" : "rgba(255,255,255,.14)",
                      background: headshotExpression === expr.value ? "rgba(0,191,255,.3)" : "rgba(255,255,255,.08)"
                    }}
                  >
                    {expr.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TryOn Mode - Garment Upload Section */}
        {isTryOnMode && (
          <div style={{ marginBottom: 14, padding: 12, borderRadius: 12, background: "rgba(255,105,180,.1)", border: "1px solid rgba(255,105,180,.3)" }}>
            <div className="tsv-title" style={{ fontSize: 11, opacity:.85, marginBottom: 10, color: "#ff69b4" }}>
              👗 GARMENT IMAGES ({garmentImages.length}/4)
            </div>
            <div style={{ fontSize: 9, opacity: 0.6, marginBottom: 10 }}>
              Upload photos of clothes/accessories to try on. Best with flat-lay or on-model photos.
            </div>
            
            {/* Upload button */}
            <label style={{
              display: "block",
              padding: "10px 16px",
              background: "rgba(255,105,180,.2)",
              border: "1px dashed rgba(255,105,180,.5)",
              borderRadius: 8,
              cursor: "pointer",
              textAlign: "center",
              fontSize: 11,
              marginBottom: 10
            }}>
              📁 Upload Garment Images
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleGarmentUpload}
                style={{ display: "none" }}
              />
            </label>
            
            {/* Display uploaded garments */}
            {garmentImages.length > 0 && (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {garmentImages.map((img, idx) => (
                  <div key={idx} style={{ position: "relative" }}>
                    <img 
                      src={img} 
                      alt={`Garment ${idx + 1}`}
                      style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 8, border: "1px solid rgba(255,105,180,.5)" }}
                    />
                    <button
                      onClick={() => removeGarmentImage(idx)}
                      style={{
                        position: "absolute",
                        top: -5,
                        right: -5,
                        width: 18,
                        height: 18,
                        borderRadius: "50%",
                        background: "#ff4444",
                        border: "none",
                        color: "white",
                        fontSize: 10,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            {/* TryOn Results Grid */}
            {tryOnResults.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 10, opacity: 0.7, marginBottom: 8 }}>Generated Results:</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
                  {tryOnResults.map((img, idx) => (
                    <img
                      key={idx}
                      src={img}
                      alt={`Result ${idx + 1}`}
                      onClick={() => setGeneratedImage(img)}
                      style={{
                        width: "100%",
                        aspectRatio: "3/4",
                        objectFit: "cover",
                        borderRadius: 8,
                        border: generatedImage === img ? "2px solid #ff69b4" : "1px solid rgba(255,255,255,.2)",
                        cursor: "pointer"
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

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
            {customPrompt.trim() && (
              <span style={{ color: "#00FF88", marginLeft: 8, fontSize: 10 }}>✓ ACTIVE - Will override selections</span>
            )}
          </div>
          <textarea
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="E.g., 'red crop top with white leather chaki shirt pants with red belt and red wedge heels'"
            style={{
              width: "100%",
              minHeight: 100,
              borderRadius: 14,
              border: customPrompt.trim() ? "2px solid rgba(0,255,136,.5)" : "1px solid rgba(255,255,255,.16)",
              background: customPrompt.trim() ? "rgba(0,255,136,.08)" : "rgba(0,0,0,.22)",
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
          disabled={loading || (selectedCharacter?.requiresUpload && !baseImage)}
          data-testid="generate-outfit-btn"
          style={{ 
            width: "100%", 
            marginTop: 14,
            background: (loading || (selectedCharacter?.requiresUpload && !baseImage)) ? "rgba(100,100,100,.3)" : undefined,
            cursor: (loading || (selectedCharacter?.requiresUpload && !baseImage)) ? "not-allowed" : "pointer"
          }}
        >
          {loading ? "GENERATING..." : (selectedCharacter?.requiresUpload && !baseImage) ? "📁 UPLOAD IMAGE FIRST" : "🎨 GENERATE OUTFIT"}
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
