import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { TSV_CHARACTERS } from '../content/tsvContent.js';
import { LORE_STORIES } from '../data/story-lore.js';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "";

// Robustly format any error detail into a readable string.
// Handles Pydantic validation arrays, nested objects, and embedded LLM/HeyGen quota errors.
function formatErrorDetail(detail) {
  if (!detail) return "";
  if (typeof detail === "string") {
    if (detail.includes("FREE_USER_EXTERNAL_ACCESS_DENIED") || detail.includes("Free users can only use Universal Key")) {
      return "AI text key blocked: your Emergent Universal Key is free-tier and can't be used outside Emergent. Add a direct OPENAI_API_KEY on Railway, or upgrade your Emergent plan.";
    }
    if (detail.toLowerCase().includes("insufficient credit") || detail.toLowerCase().includes("low credits")) {
      return "HeyGen credits are exhausted. Please top up your HeyGen account.";
    }
    return detail;
  }
  if (Array.isArray(detail)) {
    return detail.map(d => d?.msg || JSON.stringify(d)).join("; ");
  }
  if (typeof detail === "object") {
    return detail.message || detail.msg || detail.detail || JSON.stringify(detail);
  }
  return String(detail);
}

const STORY_CATEGORIES = {
  test: "Test Stories",
  reddit: "AITA from Reddit",
  youtube: "YouTube Storytimes",
  lore: "TheSaiyanVictoria Lore"
};

// Test stories (pre-recorded videos)
const TEST_STORIES = [
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
  }
];

const AVATARS = {
  'evil_victoria': { id: '738db1645bc140beb1b476231a8b79f4', name: 'Evil Victoria', portrait: null, isPreRecorded: false, isGroupId: true },
  'evil_victoria_alt': { id: 'd33267ddfad14fc2a8820f1d00eb713c', name: 'Evil Victoria (Alt)', portrait: 'https://customer-assets.emergentagent.com/job_char-chat-world/artifacts/jvbc12fl_evilviccourt.png', isPreRecorded: false },
  'evil_victoria_talking_head': { id: '94fd37e9ad0b42efb9d828edf5be22ee', name: 'Evil Victoria Talking Head', portrait: 'https://customer-assets.emergentagent.com/job_avatar-realm-5/artifacts/d5pdq5ky_evilsmile.jpg', isPreRecorded: false },
  'wargirl': { id: 'c8680d9549744019809f0acc04faac65', name: 'Wargirl', portrait: null, isPreRecorded: false },
  'victoria_black': { id: 'faa3f1fcdc0b49b79bb0a3fa11595754', name: 'Victoria Black', portrait: null, isPreRecorded: false },
  'victoria_black_blaster': { id: '1992da07-01f4-44da-b1f5-918144391d90', name: 'Victoria Black Blaster', portrait: null, isPreRecorded: false },
  'victoria_black_goddess': { id: '1afb71c7-2353-4252-bdc9-87bfb2f47423', name: 'Victoria Black Goddess', portrait: null, isPreRecorded: false },
  'vanessa': { id: 'f81fa68314f84acb8fe6e527d90adc07', name: 'Vanessa', portrait: null, isPreRecorded: false },
  'binary': { id: 'd8d16687495340c5805ad9821046be3a', name: 'Binary', portrait: null, isPreRecorded: false },
  'harmony': { id: '783e82f2b06948d5b2f882fa351337fd', name: 'Harmony', portrait: null, isPreRecorded: false }
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
  
  // Q&A State
  const [qaQuestion, setQaQuestion] = useState('');
  const [qaVideoLink, setQaVideoLink] = useState('');
  const [qaResponse, setQaResponse] = useState(null);
  const [qaLoading, setQaLoading] = useState(false);
  const [qaVideoUrl, setQaVideoUrl] = useState(null);
  // Fallback display when HeyGen video fails (e.g. zero credits):
  // { mode: 'tts' | 'text', text, character, accent }
  const [qaFallback, setQaFallback] = useState(null);
  
  // Dynamic Content State
  const [dynamicStories, setDynamicStories] = useState([]);
  const [contentLoading, setContentLoading] = useState(true);
  
  // Video History State
  const [videoHistory, setVideoHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  
  // Credit Status State
  const [creditStatus, setCreditStatus] = useState(null);
  const [showCreditWarning, setShowCreditWarning] = useState(false);
  
  // Pagination state for lore stories
  const [loreDisplayCount, setLoreDisplayCount] = useState(10);
  
  // Build complete story list
  const SAMPLE_STORIES = [...TEST_STORIES, ...dynamicStories, ...LORE_STORIES];
  
  // Mode state (test/automation/api)
  const [mode, setMode] = useState('api');
  const [modeMessage, setModeMessage] = useState('');
  
  // Fetch video history
  const fetchVideoHistory = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/storytime/video-history`);
      if (response.ok) {
        const data = await response.json();
        setVideoHistory(data.videos || []);
      }
    } catch (error) {
      console.error('Failed to fetch video history:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Fetch credit status
  const fetchCreditStatus = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/storytime/credit-status`);
      if (response.ok) {
        const data = await response.json();
        setCreditStatus(data);
        
        // Show warning if credits are low
        if (data.credits_low) {
          setShowCreditWarning(true);
        }
      }
    } catch (error) {
      console.error('Failed to fetch credit status:', error);
    }
  };

  // Fetch dynamic content and check mode on mount
  useEffect(() => {
    const fetchDynamicContent = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/storytime/dynamic-content`);
        const data = await response.json();
        
        if (data.success && data.content) {
          const allDynamic = [...data.content.aita, ...data.content.youtube];
          setDynamicStories(allDynamic);
        }
      } catch (error) {
        console.error('Error fetching dynamic content:', error);
      } finally {
        setContentLoading(false);
      }
    };
    
    const checkMode = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/storytime/test-mode-status`);
        const data = await response.json();
        setMode(data.mode || 'api');
        setModeMessage(data.message || '');
      } catch (error) {
        console.error('Error checking mode:', error);
      }
    };
    
    fetchDynamicContent();
    fetchVideoHistory();
    fetchCreditStatus();
    checkMode();
    
    // Refresh credit status every 2 minutes
    const creditInterval = setInterval(fetchCreditStatus, 120000);
    
    return () => clearInterval(creditInterval);
  }, []);

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
    setQaFallback(null);
    stopQAFallbackAudio();
    
    // Check if story has a pre-recorded video ID
    if (story.preRecordedVideoId) {
      setIsLoading(true);
      try {
        // Fetch the pre-recorded video status directly
        const statusResponse = await fetch(`${BACKEND_URL}/api/storytime/status/${story.preRecordedVideoId}`);
        const statusData = await statusResponse.json();
        
        const videoUrl = statusData.data?.video_url;
        
        if (videoUrl) {
          setGeneratedVideoUrl(videoUrl);
          
          // Auto-play pre-recorded video when ready
          setTimeout(() => {
            if (videoRef.current) {
              videoRef.current.play().catch(err => {
                console.log('Auto-play prevented by browser:', err);
              });
              setIsPlaying(true);
            }
          }, 100);
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
    
    // Generate video using HeyGen API with in-character narration
    setIsLoading(true);
    try {
      // Get the current narrator
      const currentNarratorData = AVATARS[selectedNarrator];
      
      // Use the selected narrator's avatar ID
      const avatarIdForGeneration = currentNarratorData.id;
      
      // Use the narrated endpoint for in-character voice
      const response = await fetch(`${BACKEND_URL}/api/storytime/generate-narrated`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          avatar_id: avatarIdForGeneration,
          character_id: selectedNarrator,
          character_name: currentNarratorData.name,
          story_text: story.text,
          story_title: story.title,
          use_character_voice: true
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(formatErrorDetail(data.detail) || 'Failed to generate video');
      }
      
      const videoId = data.video_id;
      
      if (videoId) {
        // Poll for video status
        const pollStatus = async () => {
          const maxAttempts = 60; // Poll for up to 5 minutes (60 * 5 seconds)
          let attempts = 0;
          
          const checkStatus = async () => {
            try {
              const statusResponse = await fetch(`${BACKEND_URL}/api/storytime/status/${videoId}`);
              const statusData = await statusResponse.json();
              
              const videoStatus = statusData.data?.status;
              const videoUrl = statusData.data?.video_url;
              
              if (videoStatus === 'completed' && videoUrl) {
                setGeneratedVideoUrl(videoUrl);
                setIsLoading(false);
                
                // Auto-play video when ready
                setTimeout(() => {
                  if (videoRef.current) {
                    videoRef.current.play().catch(err => {
                      console.log('Auto-play prevented by browser:', err);
                    });
                    setIsPlaying(true);
                  }
                }, 100);
                
                return true;
              } else if (videoStatus === 'failed') {
                const errMsg = statusData.data?.error?.message
                  || statusData.data?.error?.detail
                  || statusData.data?.error
                  || 'Video generation failed';
                if (typeof errMsg === 'string' && errMsg.toLowerCase().includes('credit')) {
                  throw new Error('HeyGen credits are exhausted. Please top up your HeyGen account.');
                }
                throw new Error(typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg));
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

  // 3-tier fallback when HeyGen video fails (e.g. zero credits):
  //   1) Try Web Speech API to read the AI-generated text aloud
  //   2) If TTS unavailable/blocked, just show the text in the video space
  //   3) Always display the text regardless
  const triggerQAFallback = (text, character, accent, sources = []) => {
    if (!text) return;
    setQaLoading(false);
    setGeneratedVideoUrl(null);
    setIsPlaying(false);

    let mode = 'text';
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(text);
        utter.rate = 1.0;
        utter.pitch = 1.0;
        utter.volume = 1.0;
        utter.onstart = () => setIsPlaying(true);
        utter.onend = () => setIsPlaying(false);
        utter.onerror = () => setIsPlaying(false);
        // iOS Safari requires user gesture; speak() inside click handler chain works
        window.speechSynthesis.speak(utter);
        mode = 'tts';
      } catch (e) {
        console.warn('Speech synthesis failed, falling back to text-only:', e);
        mode = 'text';
      }
    }
    setQaFallback({
      mode,
      text,
      character: character || 'Character',
      accent: accent || '#ff69b4',
      sources: Array.isArray(sources) ? sources : [],
    });
  };

  const stopQAFallbackAudio = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
  };

  const replayQAFallbackAudio = () => {
    if (qaFallback?.text) {
      triggerQAFallback(qaFallback.text, qaFallback.character, qaFallback.accent, qaFallback.sources);
    }
  };

  const handleQASubmit = async () => {
    if (!qaQuestion.trim()) {
      alert('Please enter a question!');
      return;
    }

    setQaLoading(true);
    setQaVideoUrl(null);
    setQaResponse(null);
    setQaFallback(null);
    stopQAFallbackAudio();
    setCurrentStory(null);
    setGeneratedVideoUrl(null);
    setIsPlaying(false);

    try {
      const currentNarratorData = AVATARS[selectedNarrator];
      const characterLookupId = selectedNarrator === 'evil_victoria_alt' ? 'evil_victoria' : selectedNarrator;
      const characterData = TSV_CHARACTERS.find(c => c.id === characterLookupId);
      const fallbackAccent = characterData?.accent || '#ff69b4';

      // Call Q&A API
      const response = await fetch(`${BACKEND_URL}/api/storytime/qa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          character_id: characterLookupId,
          character_name: characterData?.name || currentNarratorData.name,
          avatar_id: currentNarratorData.id,
          question: qaQuestion,
          video_url: qaVideoLink || null,
          duration: 20  // 20-second video for Q&A responses
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(formatErrorDetail(data.detail) || 'Failed to generate Q&A response');
      }

      // Store response data
      setQaResponse({
        question: data.question,
        text: data.response_text,
        character: data.character_name,
        sources: Array.isArray(data.sources) ? data.sources : [],
      });

      const videoId = data.video_id;
      const responseText = data.response_text;
      const characterName = data.character_name;
      const responseSources = Array.isArray(data.sources) ? data.sources : [];

      // If credits already known to be 0, skip HeyGen polling and go straight to fallback
      if (creditStatus?.credits_low) {
        triggerQAFallback(responseText, characterName, fallbackAccent, responseSources);
        return;
      }

      // Poll for video completion and display in MAIN player
      if (videoId) {
        const pollInterval = setInterval(async () => {
          try {
            const statusResponse = await fetch(`${BACKEND_URL}/api/storytime/status/${videoId}`);
            const statusData = await statusResponse.json();

            const status = statusData.data?.status;
            const videoUrl = statusData.data?.video_url;

            if (status === 'completed' && videoUrl) {
              // Set video in MAIN player
              setGeneratedVideoUrl(videoUrl);
              setQaVideoUrl(videoUrl);
              setQaLoading(false);
              clearInterval(pollInterval);

              // Auto-play video when ready
              setTimeout(() => {
                if (videoRef.current) {
                  videoRef.current.play().catch(err => {
                    console.log('Auto-play prevented by browser:', err);
                  });
                  setIsPlaying(true);
                }
              }, 100);
            } else if (status === 'failed') {
              clearInterval(pollInterval);
              // HeyGen failed (commonly: 0 credits). Activate TTS-or-text fallback
              triggerQAFallback(responseText, characterName, fallbackAccent, responseSources);
            }
          } catch (err) {
            console.error('Error polling Q&A video status:', err);
            clearInterval(pollInterval);
            triggerQAFallback(responseText, characterName, fallbackAccent, responseSources);
          }
        }, 3000);

        // Cleanup after 5 minutes — if still no video, fall back to text/TTS
        setTimeout(() => {
          clearInterval(pollInterval);
          if (qaLoading) {
            triggerQAFallback(responseText, characterName, fallbackAccent, responseSources);
          }
        }, 300000);
      } else {
        // No video_id returned (HeyGen rejected upfront). Go straight to fallback.
        triggerQAFallback(responseText, characterName, fallbackAccent, responseSources);
      }
    } catch (error) {
      console.error('Error generating Q&A:', error);
      alert(`Failed to generate Q&A response: ${error.message}`);
      setQaLoading(false);
    }
  };

  const currentNarrator = AVATARS[selectedNarrator];
  // Fallback to evil_victoria for alt narrator
  const characterLookupId = selectedNarrator === 'evil_victoria_alt' ? 'evil_victoria' : selectedNarrator;
  const characterData = TSV_CHARACTERS.find(c => c.id === characterLookupId);

  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      {/* Credit Warning Banner */}
      {creditStatus?.credits_low && showCreditWarning && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            background: 'linear-gradient(135deg, rgba(255,0,0,0.95), rgba(255,100,0,0.95))',
            color: 'white',
            padding: '12px 20px',
            zIndex: 9999,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 4px 12px rgba(255,0,0,0.4)',
            borderBottom: '2px solid #ff0000',
            animation: 'pulse 2s ease-in-out infinite'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ fontSize: 24 }}>⚠️</div>
            <div>
              <div style={{ fontWeight: 'bold', fontSize: 14 }}>
                {creditStatus.message}
              </div>
              <div style={{ fontSize: 11, opacity: 0.9, marginTop: 2 }}>
                Recent failures: {creditStatus.failed_count} / {creditStatus.total_recent_tasks} tasks
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowCreditWarning(false)}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: '1px solid rgba(255,255,255,0.4)',
              borderRadius: 4,
              padding: '6px 12px',
              color: 'white',
              cursor: 'pointer',
              fontSize: 11,
              fontWeight: 'bold'
            }}
          >
            DISMISS
          </button>
        </div>
      )}
      
      {/* Header */}
      <div className="tsv-glass tsv-glow tsv-scanlines" style={{ padding: 16, marginBottom: 14, marginTop: creditStatus?.credits_low && showCreditWarning ? 60 : 0 }}>
        <div className="tsv-title" style={{ fontSize: 14, position: 'relative' }}>
          📖 STORYTIME CHAMBER
          
          {/* Credit Status Indicator */}
          {creditStatus && (
            <div style={{
              position: 'absolute',
              top: -8,
              right: 10,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 11,
              padding: '4px 10px',
              borderRadius: 12,
              background: creditStatus.credits_low 
                ? 'rgba(255,0,0,0.2)' 
                : creditStatus.status === 'ok' 
                  ? 'rgba(0,255,0,0.2)' 
                  : 'rgba(255,140,0,0.2)',
              border: `2px solid ${
                creditStatus.credits_low 
                  ? '#ff0000' 
                  : creditStatus.status === 'ok' 
                    ? '#00ff00' 
                    : '#ff8c00'
              }`
            }}>
              <span style={{ fontSize: 14 }}>
                {creditStatus.credits_low ? '🔴' : creditStatus.status === 'ok' ? '🟢' : '🟡'}
              </span>
              <span style={{ fontWeight: 'bold' }}>
                {creditStatus.credits_low ? 'CREDITS LOW' : creditStatus.status === 'ok' ? 'CREDITS OK' : 'WARNING'}
              </span>
            </div>
          )}
          {mode !== 'api' && (
            <div style={{
              position: 'absolute',
              top: -10,
              right: '50%',
              transform: 'translateX(50%)',
              background: mode === 'test' ? 'rgba(255, 140, 0, 0.9)' : 'rgba(0, 255, 0, 0.9)',
              color: 'black',
              padding: '4px 12px',
              borderRadius: 12,
              fontSize: 10,
              fontWeight: 'bold',
              border: mode === 'test' ? '2px solid #ff8c00' : '2px solid #00ff00'
            }}>
              {mode === 'test' ? '🎬 TEST MODE - Using Pre-recorded Videos' : '🤖 AUTOMATION MODE - AI Generated Content'}
            </div>
          )}
        </div>
        <div style={{ marginTop: 10, fontSize: 13, opacity: 0.78 }}>
          <span style={{ color: '#ff69b4' }}>SYSTEM:</span> Select your narrator and choose a story to begin.
        </div>
        {modeMessage && (
          <div style={{ 
            marginTop: 8, 
            fontSize: 12, 
            opacity: 0.9,
            padding: '8px 12px',
            background: 'rgba(255, 105, 180, 0.1)',
            borderRadius: 6,
            border: '1px solid rgba(255, 105, 180, 0.3)'
          }}>
            <span style={{ color: '#ff69b4' }}>MODE INFO:</span> {modeMessage}
          </div>
        )}
      </div>

      {/* Narrator Selection */}
      <div className="tsv-glass" style={{ padding: 14, marginBottom: 14 }}>
        <div className="tsv-title" style={{ fontSize: 12, marginBottom: 12 }}>SELECT YOUR NARRATOR</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {Object.entries(AVATARS).map(([id, avatar]) => {
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
          ) : qaLoading ? (
            <div style={{ 
              padding: 60, 
              textAlign: 'center',
              background: 'rgba(0,0,0,0.7)',
              borderRadius: 16,
              backdropFilter: 'blur(10px)',
              maxWidth: 600,
              margin: '80px auto'
            }}>
              <div className="tsv-title" style={{ fontSize: 14, marginBottom: 12 }}>⚡ GENERATING Q&A RESPONSE...</div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>Crafting an in-character answer — video next, with audio/text fallback if needed</div>
            </div>
          ) : generatedVideoUrl ? (
            <div style={{ maxWidth: 600, margin: '60px auto' }}>
              <video
                ref={videoRef}
                src={generatedVideoUrl}
                controls
                autoPlay
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
          ) : qaFallback ? (
            <div
              data-testid="qa-fallback-panel"
              style={{
                maxWidth: 640,
                margin: '40px auto',
                padding: 28,
                background: 'rgba(0,0,0,0.78)',
                borderRadius: 16,
                backdropFilter: 'blur(10px)',
                border: `2px solid ${qaFallback.accent}`,
                boxShadow: `0 10px 40px ${qaFallback.accent}40, 0 0 60px ${qaFallback.accent}30`,
                textAlign: 'left'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, gap: 8, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 10, height: 10, borderRadius: 999,
                    background: qaFallback.mode === 'tts' && isPlaying ? '#59ffb0' : qaFallback.accent,
                    boxShadow: qaFallback.mode === 'tts' && isPlaying
                      ? '0 0 16px rgba(89,255,176,.7)'
                      : `0 0 12px ${qaFallback.accent}80`,
                    animation: qaFallback.mode === 'tts' && isPlaying ? 'pulse 1.2s ease-in-out infinite' : 'none'
                  }} />
                  <div className="tsv-title" style={{ fontSize: 12, color: qaFallback.accent, letterSpacing: 1 }}>
                    {qaFallback.mode === 'tts'
                      ? (isPlaying ? '◉ AUDIO PLAYBACK' : '◉ AUDIO READY')
                      : '◉ TEXT TRANSCRIPT'}
                  </div>
                </div>
                <div style={{ fontSize: 10, opacity: 0.6 }}>
                  HeyGen video unavailable — graceful fallback
                </div>
              </div>

              <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 4 }}>QUESTION</div>
              <div style={{ fontSize: 13, marginBottom: 16, color: '#ff9ad1' }}>
                {qaResponse?.question}
              </div>

              <div className="tsv-title" style={{ fontSize: 12, color: qaFallback.accent, marginBottom: 8 }}>
                {qaFallback.character.toUpperCase()} RESPONDS:
              </div>
              <div style={{
                fontSize: 15,
                lineHeight: 1.65,
                whiteSpace: 'pre-wrap',
                color: '#fff',
                padding: '14px 16px',
                background: `linear-gradient(135deg, ${qaFallback.accent}10, rgba(0,0,0,0.5))`,
                borderRadius: 10,
                border: `1px solid ${qaFallback.accent}30`
              }}>
                {qaFallback.text}
              </div>

              {qaFallback.mode === 'tts' && (
                <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
                  {isPlaying ? (
                    <button
                      data-testid="qa-fallback-stop-btn"
                      className="tsv-btn"
                      onClick={stopQAFallbackAudio}
                      style={{ fontSize: 12, padding: '8px 18px' }}
                    >
                      ⏹ STOP AUDIO
                    </button>
                  ) : (
                    <button
                      data-testid="qa-fallback-replay-btn"
                      className="tsv-btn"
                      onClick={replayQAFallbackAudio}
                      style={{ fontSize: 12, padding: '8px 18px' }}
                    >
                      ▶ REPLAY AUDIO
                    </button>
                  )}
                </div>
              )}

              {qaFallback.sources && qaFallback.sources.length > 0 && (
                <div
                  data-testid="qa-fallback-sources"
                  style={{
                    marginTop: 18,
                    paddingTop: 14,
                    borderTop: `1px dashed ${qaFallback.accent}40`,
                  }}
                >
                  <div className="tsv-title" style={{ fontSize: 10, opacity: 0.7, marginBottom: 6, letterSpacing: 1 }}>
                    📖 SOURCES — FANDOM WIKI
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {qaFallback.sources.map((s, i) => (
                      <a
                        key={i}
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        data-testid={`qa-source-link-${i}`}
                        style={{
                          fontSize: 11,
                          padding: '4px 10px',
                          borderRadius: 999,
                          background: `${qaFallback.accent}20`,
                          border: `1px solid ${qaFallback.accent}60`,
                          color: '#fff',
                          textDecoration: 'none',
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = `${qaFallback.accent}50`; }}
                        onMouseLeave={e => { e.currentTarget.style.background = `${qaFallback.accent}20`; }}
                      >
                        {s.title}
                      </a>
                    ))}
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
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              data-testid="voice-admin-link"
              className="tsv-btn"
              onClick={() => nav('/admin/voices')}
              style={{ fontSize: 11, padding: '6px 12px' }}
              title="Assign HeyGen voices to each character"
            >
              🎙️ VOICES
            </button>
            <button 
              className="tsv-btn"
              onClick={() => setShowHistory(!showHistory)}
              style={{ fontSize: 11, padding: '6px 12px', background: showHistory ? 'rgba(255,105,180,0.3)' : 'rgba(255,255,255,0.08)' }}
            >
              🎬 VIDEO HISTORY ({videoHistory.length})
            </button>
            <button 
              className="tsv-btn"
              onClick={() => nav('/')}
              style={{ fontSize: 11, padding: '6px 12px' }}
            >
              🚪 EXIT CHAMBER
            </button>
          </div>
        </div>

        {/* Video History Section */}
        {showHistory && (
          <div style={{ marginBottom: 16 }}>
            <div className="tsv-title" style={{ fontSize: 11, marginBottom: 8, color: '#ff69b4' }}>
              🎬 COMPLETED VIDEOS
            </div>
            {historyLoading ? (
              <div style={{ textAlign: 'center', padding: 20, opacity: 0.7 }}>Loading video history...</div>
            ) : videoHistory.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 20, opacity: 0.7 }}>No videos yet</div>
            ) : (
              <div style={{ display: 'grid', gap: 8, maxHeight: 400, overflowY: 'auto' }}>
                {videoHistory.map((video) => (
                  <div
                    key={video.video_id}
                    className="tsv-glass"
                    onClick={() => {
                      setGeneratedVideoUrl(video.video_url);
                      setCurrentStory(null);
                      setIsPlaying(false);
                    }}
                    style={{
                      padding: 12,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      border: '2px solid rgba(255,105,180,0.2)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#ff69b4';
                      e.currentTarget.style.transform = 'translateX(4px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255,105,180,0.2)';
                      e.currentTarget.style.transform = 'translateX(0)';
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <div style={{ fontSize: 11, fontWeight: 'bold', color: '#ff69b4' }}>
                        {video.character}
                      </div>
                      <div style={{ fontSize: 9, opacity: 0.6 }}>
                        {new Date(video.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div style={{ fontSize: 10, opacity: 0.8, lineHeight: 1.4 }}>
                      {video.script.substring(0, 120)}...
                    </div>
                    <div style={{ marginTop: 8, fontSize: 9, opacity: 0.6 }}>
                      ⏱️ {video.duration}s • 🎬 Click to play
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Category Tabs */}
        {!showHistory && (
          <>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              {Object.entries(STORY_CATEGORIES).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => {
                    setExpandedCategory(expandedCategory === key ? null : key);
                    if (key === 'lore') setLoreDisplayCount(10); // Reset pagination when opening lore
                  }}
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
                {(() => {
                  const filteredStories = SAMPLE_STORIES.filter(s => s.category === expandedCategory);
                  const displayStories = expandedCategory === 'lore' 
                    ? filteredStories.slice(0, loreDisplayCount)
                    : filteredStories;
                  
                  return displayStories.map((story) => (
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
                  ));
                })()}
                
                {/* Load More Button for Lore Category */}
                {expandedCategory === 'lore' && loreDisplayCount < SAMPLE_STORIES.filter(s => s.category === 'lore').length && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <button
                      onClick={() => setLoreDisplayCount(prev => prev + 10)}
                      className="tsv-btn"
                      style={{
                        flex: 1,
                        padding: '10px',
                        fontSize: 11,
                        background: 'rgba(255,105,180,0.2)',
                        border: '1px solid rgba(255,105,180,0.5)'
                      }}
                    >
                      📖 LOAD 10 MORE ({loreDisplayCount} / {SAMPLE_STORIES.filter(s => s.category === 'lore').length})
                    </button>
                    <button
                      onClick={() => setLoreDisplayCount(SAMPLE_STORIES.filter(s => s.category === 'lore').length)}
                      className="tsv-btn"
                      style={{
                        flex: 1,
                        padding: '10px',
                        fontSize: 11,
                        background: 'rgba(138,43,226,0.2)',
                        border: '1px solid rgba(138,43,226,0.5)'
                      }}
                    >
                      📚 SHOW ALL
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
            </AnimatePresence>
          </>
        )}
      </div>

      {/* Q&A Section */}
      <div className="tsv-glass" style={{ padding: 14, marginTop: 14 }}>
        <div className="tsv-title" style={{ fontSize: 12, marginBottom: 12 }}>
          💬 ASK {currentNarrator?.name?.toUpperCase() || 'CHARACTER'} A QUESTION
        </div>
        <div style={{ fontSize: 10, opacity: 0.7, marginBottom: 12 }}>
          Ask anything! {characterData?.name} will respond with a personalized video answer based on their lore and personality.
          <br/>
          🎥 <strong>NEW:</strong> Include a YouTube video link to have {characterData?.name} watch and analyze it!
        </div>

        {/* Question Input */}
        <div style={{ marginBottom: 12 }}>
          <input
            type="text"
            value={qaQuestion}
            onChange={(e) => setQaQuestion(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !qaVideoLink && handleQASubmit()}
            placeholder={`e.g., "How was Binary created?" or "What's your favorite memory?"`}
            disabled={qaLoading}
            style={{
              width: '100%',
              padding: '10px 14px',
              fontSize: 12,
              background: 'rgba(0,0,0,0.4)',
              border: '1px solid rgba(255,255,255,0.14)',
              borderRadius: 6,
              color: '#fff',
              fontFamily: 'inherit',
              outline: 'none',
              marginBottom: 8
            }}
          />
        </div>

        {/* Video URL Input */}
        <div style={{ marginBottom: 12 }}>
          <input
            type="text"
            value={qaVideoLink}
            onChange={(e) => setQaVideoLink(e.target.value)}
            placeholder={`🎥 Optional: YouTube video URL (e.g., youtube.com/watch?v=...)`}
            disabled={qaLoading}
            style={{
              width: '100%',
              padding: '10px 14px',
              fontSize: 11,
              background: 'rgba(255,105,180,0.1)',
              border: '1px solid rgba(255,105,180,0.3)',
              borderRadius: 6,
              color: '#fff',
              fontFamily: 'inherit',
              outline: 'none'
            }}
          />
          {qaVideoLink && (
            <div style={{ fontSize: 10, opacity: 0.7, marginTop: 6, color: '#ff69b4' }}>
              ✅ Video will be analyzed by {characterData?.name} using AI vision
            </div>
          )}
        </div>

        <button
          onClick={handleQASubmit}
          disabled={qaLoading || !qaQuestion.trim()}
          className="tsv-btn"
          style={{
            width: '100%',
            padding: '10px',
            fontSize: 12,
            opacity: qaLoading || !qaQuestion.trim() ? 0.5 : 1
          }}
        >
          {qaLoading ? '🎬 GENERATING VIDEO RESPONSE...' : '🎤 ASK QUESTION'}
        </button>

        {/* Response Display */}
        {qaResponse && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ marginTop: 14 }}
          >
            {/* Question Asked */}
            <div style={{
              padding: 10,
              background: 'rgba(255,105,180,0.1)',
              borderLeft: '3px solid #ff69b4',
              borderRadius: 4,
              marginBottom: 12
            }}>
              <div style={{ fontSize: 10, opacity: 0.7, marginBottom: 4 }}>YOU ASKED:</div>
              <div style={{ fontSize: 11, color: '#ff69b4' }}>{qaResponse.question}</div>
            </div>

            {/* Video Status */}
            {qaVideoUrl && (
              <div style={{ 
                padding: 10,
                background: 'rgba(0,255,0,0.1)',
                borderLeft: '3px solid #00ff00',
                borderRadius: 4,
                marginBottom: 12
              }}>
                <div style={{ fontSize: 11, color: '#00ff00' }}>✅ Video ready! Playing in main player above ⬆️</div>
              </div>
            )}

            {/* Text Response/Transcript */}
            <div style={{
              padding: 10,
              background: 'rgba(0,0,0,0.3)',
              borderRadius: 6,
              fontSize: 11,
              lineHeight: 1.6,
              maxHeight: 200,
              overflowY: 'auto'
            }}>
              <div style={{ fontSize: 10, opacity: 0.7, marginBottom: 6, color: '#ff69b4' }}>
                {qaResponse.character} RESPONDS:
              </div>
              {qaResponse.text}
            </div>

            {/* Sources from Fandom Wiki */}
            {qaResponse.sources && qaResponse.sources.length > 0 && (
              <div
                data-testid="qa-response-sources"
                style={{ marginTop: 10, padding: '8px 10px', background: 'rgba(0,0,0,0.25)', borderRadius: 6 }}
              >
                <div style={{ fontSize: 9, opacity: 0.65, marginBottom: 5, letterSpacing: 0.5 }}>
                  📖 SOURCES — FANDOM WIKI
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {qaResponse.sources.map((s, i) => (
                    <a
                      key={i}
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontSize: 10,
                        padding: '2px 8px',
                        borderRadius: 999,
                        background: 'rgba(255,105,180,0.15)',
                        border: '1px solid rgba(255,105,180,0.4)',
                        color: '#ff9ad1',
                        textDecoration: 'none',
                      }}
                    >
                      {s.title}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Ask Another Button */}
            <button
              onClick={() => {
                setQaQuestion('');
                setQaResponse(null);
                setQaVideoUrl(null);
              }}
              className="tsv-btn"
              style={{
                width: '100%',
                marginTop: 12,
                fontSize: 11,
                padding: '8px'
              }}
            >
              💭 ASK ANOTHER QUESTION
            </button>
          </motion.div>
        )}

        {/* Loading State */}
        {qaLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              marginTop: 14,
              padding: 14,
              textAlign: 'center',
              background: 'rgba(255,105,180,0.1)',
              borderRadius: 8
            }}
          >
            <div style={{ fontSize: 11, marginBottom: 8 }}>⚡ Generating AI Response...</div>
            <div style={{ fontSize: 10, opacity: 0.7 }}>
              This may take 1-2 minutes while we create your personalized video
            </div>
            <div style={{
              width: '100%',
              height: 4,
              background: 'rgba(255,255,255,0.1)',
              borderRadius: 2,
              marginTop: 12,
              overflow: 'hidden'
            }}>
              <motion.div
                animate={{ x: ['0%', '100%'] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                style={{
                  width: '30%',
                  height: '100%',
                  background: 'linear-gradient(90deg, transparent, #ff69b4, transparent)'
                }}
              />
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
