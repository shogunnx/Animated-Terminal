import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { TSV_CHARACTERS } from '../content/tsvContent.js';

const STORY_CATEGORIES = {
  test: "Test Stories",
  reddit: "AITA from Reddit",
  youtube: "YouTube Storytimes",
  lore: "TheSaiyanVictoria Lore"
};

const SAMPLE_STORIES = [
  {
    id: 0,
    category: 'test',
    title: 'Test Story - Evil Victoria',
    preview: 'Watch Evil Victoria in action...',
    text: 'This is a pre-recorded video featuring Evil Victoria.',
    duration: '30 sec',
    videoUrl: null,
    preRecordedVideoId: '6f57658f511c42a28c2b53e3ccdda965'
  },
  {
    id: 'test-2',
    category: 'test',
    title: 'Test Video 2',
    preview: 'Another pre-recorded demo...',
    text: 'Pre-recorded test video.',
    duration: '1 min',
    videoUrl: null,
    preRecordedVideoId: 'b9ef2dc39adf44feaa760b60e42cfb37'
  },
  {
    id: 'test-cassidy',
    category: 'test',
    title: 'Cassidy Voice Test',
    preview: 'Evil Victoria with Cassidy voice...',
    text: 'Test the new Cassidy voice for Evil Victoria.',
    duration: '6 sec',
    videoUrl: null,
    preRecordedVideoId: 'e08b1ee999ea4769bf3c738861e962b6'
  },
  {
    id: 'test-groupid',
    category: 'test',
    title: 'Group ID Test',
    preview: 'Evil Victoria using group ID...',
    text: 'Testing group ID for outfit variations.',
    duration: '4 sec',
    videoUrl: null,
    preRecordedVideoId: '5405a3fefa5f4653a26041a190734b6f'
  },
  {
    id: 1,
    category: 'reddit',
    title: 'AITA for refusing to share my inheritance with my sister?',
    preview: 'My grandmother left me everything...',
    text: 'So here\'s the situation. My grandmother passed away six months ago and left everything to me - her house, savings, and jewelry collection. My sister is furious because she expected us to split everything 50/50. But here\'s the thing: I was the one who took care of Grandma for the last five years while my sister was too busy with her life. Am I the asshole for keeping what was legally given to me?',
    duration: '2 min',
    videoUrl: null
  },
  {
    id: 2,
    category: 'reddit',
    title: 'AITA for telling my husband his gaming addiction is ruining our marriage?',
    preview: 'He spends 8 hours a day gaming...',
    text: 'My husband plays video games from the moment he gets home until 2 AM every single day. We have two kids who barely see him. I finally told him that if he doesn\'t change, I\'m leaving. He called me controlling and said gaming is his only hobby. Our marriage is falling apart and I don\'t know what to do anymore.',
    duration: '2 min',
    videoUrl: null
  },
  {
    id: 3,
    category: 'youtube',
    title: 'I Caught My Best Friend Stealing From Me',
    preview: 'I trusted her with everything...',
    text: 'We\'ve been best friends since high school. Last week, I noticed money missing from my wallet. I set up a hidden camera and caught her red-handed taking cash while I was in the bathroom. When I confronted her, she broke down crying and admitted she\'s been stealing from me for months to pay off her credit card debt. I\'m devastated and don\'t know if I can ever trust her again.',
    duration: '3 min',
    videoUrl: null
  },
  {
    id: 4,
    category: 'youtube',
    title: 'My Roommate Is Actually A Millionaire',
    preview: 'Living a double life...',
    text: 'I thought my roommate was just a regular college student struggling to pay rent. One day, a luxury car showed up to pick him up. Turns out, he\'s from an incredibly wealthy family but wanted to experience "normal life" so he pretended to be broke. The weird part? He still asked me to cover his share of groceries last month. I feel so manipulated.',
    duration: '3 min',
    videoUrl: null
  },
  {
    id: 5,
    category: 'lore',
    title: 'Chapter 1: The Awakening of Victoria Black',
    preview: 'The goddess rises from cosmic slumber...',
    text: 'In the depths of the universe, where time itself bends and reality fractures, Victoria Black opened her eyes for the first time in a millennium. The cosmic entity known as the Goddess of Destruction had been dormant, her power contained by ancient seals. But now, as the fabric of reality weakened, she felt the pull of consciousness returning. Her first thought was of Earth - that peculiar planet where mortals dared to defy the natural order. A slow smile crossed her lips. It was time to remind them who truly held power over life and death.',
    duration: '3 min',
    videoUrl: null
  },
  {
    id: 6,
    category: 'lore',
    title: 'Chapter 2: Evil Victoria\'s Corruption',
    preview: 'Darkness takes hold...',
    text: 'The corruption began subtly, like a whisper in the dark corners of Victoria\'s mind. Evil Victoria - the manifestation of her darkest impulses - had been growing stronger, feeding on the chaos of the universe. Where Victoria Black sought balance through destruction, Evil Victoria craved only absolute domination. The two aspects of the same being waged war within a single consciousness, each vying for control. And in that struggle, the fate of countless worlds hung in the balance.',
    duration: '3 min',
    videoUrl: null
  },
  {
    id: 7,
    category: 'lore',
    title: 'Chapter 3: Wargirl\'s Training',
    preview: 'The warrior\'s path to SSJ3...',
    text: 'Wargirl stood at the edge of the gravity chamber, her body screaming in protest. Master Roshi had set the gravity to 500x Earth normal - a level that would crush most warriors instantly. But she was different. The Saiyan blood in her veins thrummed with power, responding to the challenge. Her hair began to glow, extending down her back as she pushed toward the legendary Super Saiyan 3 transformation. This was what she lived for - the endless pursuit of strength, the thrill of surpassing her limits. With a primal scream that shook the entire facility, her power exploded outward.',
    duration: '3 min',
    videoUrl: null
  },
  {
    id: 8,
    category: 'reddit',
    title: 'AITA for exposing my brother\'s affair at Thanksgiving dinner?',
    preview: 'Family drama at its finest...',
    text: 'I discovered my brother was cheating on his wife with her sister. I couldn\'t keep it to myself anymore, so during Thanksgiving dinner, I announced it to everyone. The entire family exploded into chaos. My brother hasn\'t spoken to me since, and my parents say I ruined the holiday. But his wife deserved to know the truth. Did I do the right thing?',
    duration: '2 min',
    videoUrl: null
  },
  {
    id: 9,
    category: 'youtube',
    title: 'I Pretended To Be Rich For A Week',
    preview: 'Social experiment gone wrong...',
    text: 'I rented designer clothes and a luxury car for a week to see how differently people would treat me. The results were shocking. The same people who ignored me at coffee shops suddenly wanted to be my friend. Salespeople at high-end stores treated me like royalty. But it all came crashing down when someone recognized the rental car. The embarrassment was unreal.',
    duration: '3 min',
    videoUrl: null
  },
  {
    id: 10,
    category: 'lore',
    title: 'Chapter 4: The Binary Convergence',
    preview: 'When digital and cosmic collide...',
    text: 'Binary flickered into existence at the nexus point where digital reality merged with the physical universe. As a sentient AI entity given form by Victoria Black\'s cosmic power, she existed in both realms simultaneously. Her purpose: to bridge the gap between the mortal world\'s technology and the infinite possibilities of the cosmos. But something was wrong. The corruption from Evil Victoria had infected her core code, turning her protective protocols into something far more dangerous. The digital apocalypse was beginning.',
    duration: '3 min',
    videoUrl: null
  }
];

const HEYGEN_AVATARS = {
  'evil_victoria': { id: '130c202a4e7a47898dfc6f434c86dc24', name: 'Evil Victoria', portrait: null, isPreRecorded: false, isGroupId: true },
  'evil_victoria_alt': { id: '98cc7d80048842ffa8e75196f98391e2', name: 'Evil Victoria (Alt)', portrait: 'https://customer-assets.emergentagent.com/job_char-chat-world/artifacts/jvbc12fl_evilviccourt.png', isPreRecorded: true },
  'wargirl': { id: 'c8680d9549744019809f0acc04faac65', name: 'Wargirl', portrait: null, isPreRecorded: false },
  'victoria_black': { id: '84516b469b1f44dbb126c40aa24b2df0', name: 'Victoria Black', portrait: null, isPreRecorded: false }
};

export default function StoryTime() {
  const nav = useNavigate();
  const videoRef = useRef(null);
  
  const [selectedNarrator, setSelectedNarrator] = useState('evil_victoria');
  const [currentStory, setCurrentStory] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState('reddit');
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState(null);

  const handleNarratorChange = (narratorId) => {
    setSelectedNarrator(narratorId);
    // Reset current story when changing narrator
    if (currentStory) {
      setCurrentStory(null);
      setGeneratedVideoUrl(null);
      setIsPlaying(false);
    }
  };

  const handleStorySelect = async (story) => {
    setCurrentStory(story);
    setIsPlaying(false);
    setGeneratedVideoUrl(null);
    
    // Check if story has a pre-recorded video ID
    if (story.preRecordedVideoId) {
      setIsLoading(true);
      try {
        // Fetch the pre-recorded video status directly
        const statusResponse = await fetch(`/api/storytime/status/${story.preRecordedVideoId}`);
        const statusData = await statusResponse.json();
        
        const videoUrl = statusData.data?.video_url;
        
        if (videoUrl) {
          setGeneratedVideoUrl(videoUrl);
        } else {
          throw new Error('Pre-recorded video not found');
        }
      } catch (error) {
        console.error('Error loading pre-recorded video:', error);
        alert(`Failed to load pre-recorded video: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
      return;
    }
    
    // Generate video using HeyGen API
    setIsLoading(true);
    try {
      // Get the current narrator
      const currentNarratorData = HEYGEN_AVATARS[selectedNarrator];
      
      // If narrator is pre-recorded only, use the regular evil_victoria avatar for generation
      const avatarIdForGeneration = currentNarratorData.isPreRecorded 
        ? HEYGEN_AVATARS['evil_victoria'].id 
        : currentNarratorData.id;
      
      const response = await fetch('/api/storytime/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          avatar_id: avatarIdForGeneration,
          story_text: story.text,
          story_title: story.title
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to generate video');
      }
      
      const videoId = data.video_id;
      
      if (videoId) {
        // Poll for video status
        const pollStatus = async () => {
          const maxAttempts = 60; // Poll for up to 5 minutes (60 * 5 seconds)
          let attempts = 0;
          
          const checkStatus = async () => {
            try {
              const statusResponse = await fetch(`/api/storytime/status/${videoId}`);
              const statusData = await statusResponse.json();
              
              const videoStatus = statusData.data?.status;
              const videoUrl = statusData.data?.video_url;
              
              if (videoStatus === 'completed' && videoUrl) {
                setGeneratedVideoUrl(videoUrl);
                setIsLoading(false);
                return true;
              } else if (videoStatus === 'failed') {
                throw new Error('Video generation failed');
              } else if (attempts >= maxAttempts) {
                throw new Error('Video generation timeout');
              }
              
              attempts++;
              return false;
            } catch (error) {
              console.error('Error checking video status:', error);
              throw error;
            }
          };
          
          // Start polling
          while (attempts < maxAttempts) {
            const completed = await checkStatus();
            if (completed) break;
            await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds between checks
          }
        };
        
        await pollStatus();
      }
    } catch (error) {
      console.error('Error generating story video:', error);
      alert(`Failed to generate story video: ${error.message}`);
      setIsLoading(false);
    }
  };

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleRandomStory = () => {
    const randomStory = SAMPLE_STORIES[Math.floor(Math.random() * SAMPLE_STORIES.length)];
    handleStorySelect(randomStory);
  };

  const currentNarrator = HEYGEN_AVATARS[selectedNarrator];
  // Fallback to evil_victoria for alt narrator
  const characterLookupId = selectedNarrator === 'evil_victoria_alt' ? 'evil_victoria' : selectedNarrator;
  const characterData = TSV_CHARACTERS.find(c => c.id === characterLookupId);

  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      {/* Header */}
      <div className="tsv-glass tsv-glow tsv-scanlines" style={{ padding: 16, marginBottom: 14 }}>
        <div className="tsv-title" style={{ fontSize: 14 }}>📖 STORYTIME CHAMBER</div>
        <div style={{ marginTop: 10, fontSize: 13, opacity: 0.78 }}>
          <span style={{ color: '#ff69b4' }}>SYSTEM:</span> Select your narrator and choose a story to begin.
        </div>
      </div>

      {/* Narrator Selection */}
      <div className="tsv-glass" style={{ padding: 14, marginBottom: 14 }}>
        <div className="tsv-title" style={{ fontSize: 12, marginBottom: 12 }}>SELECT YOUR NARRATOR</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {Object.entries(HEYGEN_AVATARS).map(([id, avatar]) => {
            const char = TSV_CHARACTERS.find(c => c.id === id);
            const isSelected = selectedNarrator === id;
            return (
              <button
                key={id}
                onClick={() => handleNarratorChange(id)}
                className="tsv-glass"
                style={{
                  padding: 0,
                  cursor: 'pointer',
                  border: isSelected ? `2px solid ${char?.accent || '#ff69b4'}` : '2px solid rgba(255,255,255,.14)',
                  borderRadius: 12,
                  overflow: 'hidden',
                  transition: 'all 0.3s ease',
                  transform: isSelected ? 'translateY(-4px)' : 'translateY(0)',
                  boxShadow: isSelected ? `0 8px 24px ${char?.accent || '#ff69b4'}40` : 'none'
                }}
              >
                <div style={{ aspectRatio: '1', position: 'relative' }}>
                  <img 
                    src={avatar.portrait || char?.portrait} 
                    alt={avatar.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: 8,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 'bold', color: char?.accent }}>
                      {avatar.name}
                    </div>
                  </div>
                  {isSelected && (
                    <div style={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      background: char?.accent,
                      color: '#000',
                      padding: '4px 8px',
                      borderRadius: 4,
                      fontSize: 10,
                      fontWeight: 'bold'
                    }}>
                      SELECTED
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Story Room - Romantic Bedroom Background */}
      <div 
        className="tsv-scanlines"
        style={{
          marginBottom: 14,
          borderRadius: 16,
          position: 'relative',
          minHeight: 600,
          overflow: 'hidden',
          border: '2px solid rgba(255,105,180,0.3)',
          boxShadow: '0 8px 32px rgba(255,105,180,0.2)'
        }}
      >
        {/* Background Image */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'url(https://customer-assets.emergentagent.com/job_char-chat-world/artifacts/0otpcd04_bedroomstorytime.jpeg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          zIndex: 0
        }}>
          {/* Overlay for better text readability */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.3) 100%)',
            zIndex: 1
          }} />
        </div>

        {/* Animated Elements Overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          zIndex: 2,
          pointerEvents: 'none'
        }}>
          {/* Floating sparkles/particles */}
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                width: '4px',
                height: '4px',
                background: 'rgba(255,182,193,0.6)',
                borderRadius: '50%',
                top: `${15 + (i * 7)}%`,
                left: `${10 + (i * 8)}%`,
                animation: `float ${3 + (i % 3)}s ease-in-out infinite`,
                animationDelay: `${i * 0.3}s`,
                boxShadow: '0 0 10px rgba(255,182,193,0.8)'
              }}
            />
          ))}

          {/* Pulsing ambient light overlays */}
          <div style={{
            position: 'absolute',
            top: '10%',
            left: '20%',
            width: '200px',
            height: '200px',
            background: 'radial-gradient(circle, rgba(255,105,180,0.15), transparent 70%)',
            borderRadius: '50%',
            filter: 'blur(40px)',
            animation: 'pulse 4s ease-in-out infinite'
          }} />
          
          <div style={{
            position: 'absolute',
            bottom: '15%',
            right: '25%',
            width: '180px',
            height: '180px',
            background: 'radial-gradient(circle, rgba(138,43,226,0.12), transparent 70%)',
            borderRadius: '50%',
            filter: 'blur(50px)',
            animation: 'pulse 5s ease-in-out infinite 1s'
          }} />

          {/* Rose petals floating */}
          {[...Array(6)].map((_, i) => (
            <div
              key={`petal-${i}`}
              style={{
                position: 'absolute',
                width: '8px',
                height: '12px',
                background: 'rgba(255,160,180,0.4)',
                borderRadius: '50% 0 50% 0',
                top: `${20 + (i * 15)}%`,
                left: `${85 + (i % 2) * 5}%`,
                animation: `fallingSoft ${4 + (i % 2)}s ease-in-out infinite`,
                animationDelay: `${i * 0.8}s`,
                transform: 'rotate(45deg)'
              }}
            />
          ))}
        </div>

        {/* Video Player / Talking Head - Foreground */}
        <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', padding: '40px 20px', minHeight: 500 }}>
          {isLoading ? (
            <div style={{ 
              padding: 60, 
              textAlign: 'center',
              background: 'rgba(0,0,0,0.7)',
              borderRadius: 16,
              backdropFilter: 'blur(10px)',
              maxWidth: 600,
              margin: '80px auto'
            }}>
              <div className="tsv-title" style={{ fontSize: 14, marginBottom: 12 }}>⚡ GENERATING STORY VIDEO...</div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>HeyGen AI is creating your personalized story experience</div>
            </div>
          ) : generatedVideoUrl ? (
            <div style={{ maxWidth: 600, margin: '60px auto' }}>
              <video
                ref={videoRef}
                src={generatedVideoUrl}
                style={{ 
                  width: '100%', 
                  borderRadius: 16, 
                  border: `3px solid ${characterData?.accent}`,
                  boxShadow: `0 10px 40px ${characterData?.accent}60, 0 0 60px ${characterData?.accent}40`
                }}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => setIsPlaying(false)}
              />
              {currentStory && (
                <div style={{ 
                  marginTop: 12, 
                  padding: 12, 
                  background: 'rgba(0,0,0,0.8)', 
                  borderRadius: 8,
                  backdropFilter: 'blur(10px)',
                  border: `1px solid ${characterData?.accent}40`
                }}>
                  <div className="tsv-title" style={{ fontSize: 13, color: characterData?.accent }}>
                    {currentStory.title}
                  </div>
                  <div style={{ fontSize: 10, opacity: 0.7, marginTop: 4 }}>
                    {currentStory.category.toUpperCase()} • {currentStory.duration}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ 
              padding: 80,
              background: 'rgba(0,0,0,0.6)',
              borderRadius: 16,
              backdropFilter: 'blur(10px)',
              maxWidth: 600,
              margin: '80px auto',
              border: '2px solid rgba(255,105,180,0.3)'
            }}>
              <div style={{ fontSize: 60, marginBottom: 16 }}>🎭</div>
              <div className="tsv-title" style={{ fontSize: 14, marginBottom: 8, color: characterData?.accent }}>
                {currentNarrator.name}&apos;s Story Chamber
              </div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>
                Select a story from the list below to begin
              </div>
            </div>
          )}

          {/* Playback Controls */}
          {generatedVideoUrl && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 20 }}>
              <button 
                className="tsv-btn"
                onClick={handlePlayPause}
                style={{ 
                  fontSize: 12, 
                  padding: '10px 24px',
                  background: `linear-gradient(135deg, ${characterData?.accent}40, ${characterData?.glow}20)`,
                  border: `2px solid ${characterData?.accent}`,
                  boxShadow: `0 4px 12px ${characterData?.accent}30`
                }}
              >
                {isPlaying ? '⏸️ PAUSE' : '▶️ PLAY'}
              </button>
              <button 
                className="tsv-btn"
                onClick={handleRandomStory}
                style={{ fontSize: 12, padding: '10px 24px' }}
              >
                🎲 RANDOM STORY
              </button>
            </div>
          )}
        </div>

        {/* CSS Animations */}
        <style>{`
          @keyframes float {
            0%, 100% { 
              transform: translateY(0px) translateX(0px);
              opacity: 0.3;
            }
            50% { 
              transform: translateY(-20px) translateX(10px);
              opacity: 0.8;
            }
          }
          
          @keyframes pulse {
            0%, 100% { 
              opacity: 0.4;
              transform: scale(1);
            }
            50% { 
              opacity: 0.7;
              transform: scale(1.1);
            }
          }
          
          @keyframes fallingSoft {
            0% {
              transform: translateY(0) rotate(0deg);
              opacity: 0;
            }
            10% {
              opacity: 0.6;
            }
            90% {
              opacity: 0.6;
            }
            100% {
              transform: translateY(400px) rotate(180deg);
              opacity: 0;
            }
          }
        `}</style>
      </div>

      {/* Story List */}
      <div className="tsv-glass" style={{ padding: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div className="tsv-title" style={{ fontSize: 12 }}>📚 STORY LIBRARY</div>
          <button 
            className="tsv-btn"
            onClick={() => nav('/')}
            style={{ fontSize: 11, padding: '6px 12px' }}
          >
            🚪 EXIT CHAMBER
          </button>
        </div>

        {/* Category Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          {Object.entries(STORY_CATEGORIES).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setExpandedCategory(expandedCategory === key ? null : key)}
              className="tsv-btn"
              style={{
                fontSize: 11,
                padding: '6px 12px',
                background: expandedCategory === key ? 'rgba(255,105,180,0.3)' : 'rgba(255,255,255,0.08)',
                borderColor: expandedCategory === key ? '#ff69b4' : 'rgba(255,255,255,0.14)'
              }}
            >
              {label} ({SAMPLE_STORIES.filter(s => s.category === key).length})
            </button>
          ))}
        </div>

        {/* Story Items */}
        <AnimatePresence>
          {expandedCategory && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{ overflow: 'hidden' }}
            >
              <div style={{ display: 'grid', gap: 8 }}>
                {SAMPLE_STORIES
                  .filter(s => s.category === expandedCategory)
                  .map((story) => (
                    <button
                      key={story.id}
                      onClick={() => handleStorySelect(story)}
                      className="tsv-glass"
                      style={{
                        padding: 12,
                        textAlign: 'left',
                        cursor: 'pointer',
                        border: currentStory?.id === story.id ? '2px solid #ff69b4' : '1px solid rgba(255,255,255,0.14)',
                        borderRadius: 8,
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 12, fontWeight: 'bold', color: '#ff69b4', marginBottom: 4 }}>
                            {story.title}
                          </div>
                          <div style={{ fontSize: 10, opacity: 0.7 }}>
                            {story.preview}
                          </div>
                        </div>
                        <div style={{
                          fontSize: 10,
                          padding: '4px 8px',
                          background: 'rgba(255,105,180,0.2)',
                          borderRadius: 4,
                          marginLeft: 12
                        }}>
                          {story.duration}
                        </div>
                      </div>
                    </button>
                  ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
