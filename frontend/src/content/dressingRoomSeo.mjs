export const SITE_URL = "https://terminal.thesaiyanvictoria.com";
export const DRESSING_ROOM_URL = `${SITE_URL}/dressing-room`;

export const DRESSING_ROOM_SEO = {
  title: "AI DressingRoom | AI Outfit Generator & Character Fashion | TheSaiyanVictoria",
  description: "Create AI outfits, transform character clothing, explore fashion styles, and customize virtual characters with TheSaiyanVictoria DressingRoom.",
  canonical: DRESSING_ROOM_URL,
  image: `${SITE_URL}/og/dressing-room.jpg`,
  imageAlt: "TheSaiyanVictoria AI DressingRoom banner showing character outfit artwork",
};

export const DRESSING_ROOM_H1 = "AI DressingRoom: Create Outfits and Customize Virtual Characters";
export const DRESSING_ROOM_INTRO = "Explore TheSaiyanVictoria AI DressingRoom, a creative character-fashion tool where you can transform outfits, experiment with clothing styles, and customize virtual characters. Choose a character, select an outfit, or describe a new look to create AI-generated fashion variations.";

export const SEO_CHARACTERS = ["YOU (upload a photo of yourself)", "Victoria Black", "Wargirl", "Binary", "Vanessa", "Harmony", "Evil Victoria", "VixenVictoria", "Veronica", "Community OC (your own character)"];

export const DRESSING_ROOM_SECTIONS = [
  {
    heading: "How the AI DressingRoom works",
    parts: [
      { heading: "1. Choose a character, or yourself", text: "Pick one of TheSaiyanVictoria characters, choose YOU! to try outfits on a photo of yourself, or choose Community OC to bring your own original character." },
      { heading: "2. Set a reference image", text: "Use the character's Nexus image, pick an approved picture from the Nexus Media Library, or upload your own image. The AI works from this picture." },
      { heading: "3. Describe or pick a look", text: "Combine wardrobe pieces, choose a preset costume, or write your own outfit description, then generate. Each run creates several variations to compare." },
    ],
  },
  {
    heading: "Outfit transformations and customization",
    parts: [
      { heading: "Generation modes", text: "Outfit mode restyles the full look. Try-On places a specific garment on the character, Headshot creates close-up portraits, Foot to Head builds a full-length look, and Pairs mode stages two characters together." },
      { heading: "Keep what matters untouched", text: "Preservation switches ask the AI to keep the original face, hair, skin tone, body shape, pose, and background while only the clothing changes." },
    ],
  },
  {
    heading: "Available characters and fashion options",
    parts: [
      { heading: "Characters", text: `${SEO_CHARACTERS.join(", ")}.` },
      { heading: "Wardrobe", text: "Over a thousand options: tops, skirts and bottoms, dresses and gowns, 120 costumes, fashion trends, anime looks, Power Rangers and mecha cosplay, Dragon Ball-inspired outfits, sneakers, wedges, mules and heels, iconic anime hairstyles, gaming cosplay props, accessories, art styles, poses, and realistic backgrounds." },
    ],
  },
  {
    heading: "Image reference selection",
    parts: [
      { heading: "Use an existing picture", text: "Every character room has Try Nexus, Nexus Media Library, and Upload Image options. The selected picture is used only for your session and is never saved as the character's default." },
    ],
  },
  {
    heading: "Nexus Media Library integration",
    parts: [
      { heading: "Search approved images", text: "Open the Nexus Media Library inside any character room to search approved images by title, filename, tags, character, or asset ID, then use one as the base image without downloading or re-uploading it." },
      { heading: "Send results back", text: "Favorite results can be sent to the Nexus Media Library with optional credit and a note. Submissions stay private until an administrator approves them." },
    ],
  },
  {
    heading: "Saving your generated outfits",
    parts: [
      { heading: "Keep and share results", text: "Download any generated image to your device, send it to the Nexus Media Library for review, or connect your own DeviantArt account to publish it to a gallery folder of your choice." },
    ],
  },
];

export const DRESSING_ROOM_FAQ = [
  { q: "What is the TSV AI DressingRoom?", a: "It is an AI outfit generator inside TheSaiyanVictoria Terminal. You pick a character and a reference image, choose or describe an outfit, and the AI creates new fashion variations of that character." },
  { q: "Can I change a character's clothing?", a: "Yes, and you can try outfits on yourself with the YOU! tile. Pick wardrobe items or a preset costume, or type your own outfit description, then generate. Try-On, Headshot, Foot to Head, and Pairs modes offer other kinds of changes." },
  { q: "Can I use an existing image as a reference?", a: "Yes. Choose an approved image from the Nexus Media Library, use the character's Nexus image, or upload your own picture. The YOU! and Community OC rooms always use your uploaded photo, which is only used for that session." },
  { q: "Can I preserve the original character's face and pose?", a: "Yes. The Keep Untouched switches ask the AI to keep the face, hair, skin tone, body shape, pose, and background. AI results can still vary, so compare the variations and keep the best one." },
  { q: "Can I save my generated outfit?", a: "Yes. Use Save to download the image. You can also send it to the Nexus Media Library for approval, or post it to your own DeviantArt account." },
  { q: "Does generating outfits require credits?", a: "Visitors do not need an account or credits. Each generation uses TheSaiyanVictoria's AI image service, so generation may be paused temporarily if that service runs out of capacity." },
];

export const webApplicationJsonLd = () => ({
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "TheSaiyanVictoria AI DressingRoom",
  url: DRESSING_ROOM_URL,
  description: DRESSING_ROOM_SEO.description,
  applicationCategory: "DesignApplication",
  operatingSystem: "Any (web browser)",
  browserRequirements: "Requires JavaScript",
  image: DRESSING_ROOM_SEO.image,
  isAccessibleForFree: true,
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  featureList: ["AI outfit generation", "Virtual try-on", "AI headshots", "Character pairs", "Preserve face, hair, pose and background", "Nexus Media Library reference images"],
  publisher: { "@type": "Organization", name: "TheSaiyanVictoria", url: SITE_URL },
});
