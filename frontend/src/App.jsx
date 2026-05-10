import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence } from "./components/AnimatePresence.jsx";
import Shell from "./components/Shell.jsx";
import Home from "./pages/Home.jsx";
import Map from "./pages/Map.jsx";
import StoryTime from "./pages/StoryTime.jsx";
import TeachMode from "./pages/TeachMode.jsx";
import Characters from "./pages/Characters.jsx";
import Profile from "./pages/Profile.jsx";
import Room from "./pages/Room.jsx";
import DeviantArt from "./pages/DeviantArt.jsx";
import GameRoom from "./pages/GameRoom.jsx";
import GamePlayer from "./pages/GamePlayer.jsx";
import DressingRoom from "./pages/DressingRoom.jsx";
import DressingRoomAnalytics from "./pages/DressingRoomAnalytics.jsx";
import TerminalAnalytics from "./pages/TerminalAnalytics.jsx";
import VoiceAdmin from "./pages/VoiceAdmin.jsx";
import TerminalPolish from "./components/TerminalPolish.jsx";
import CursorBlink from "./components/CursorBlink.jsx";
import { useTerminalAnalytics } from "./hooks/useTerminalAnalytics.js";

// Wrapper component to enable analytics tracking
function AnalyticsWrapper({ children }) {
  useTerminalAnalytics();
  return children;
}

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnalyticsWrapper>
      <AnimatePresence location={location}>
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Home />} />
          <Route path="/map" element={<Map />} />
          <Route path="/storytime" element={<StoryTime />} />
          <Route path="/teach-mode" element={<TeachMode />} />
          <Route path="/characters" element={<Characters />} />
          <Route path="/characters/:id" element={<Profile />} />
          <Route path="/rooms/:id" element={<Room />} />
          <Route path="/gameroom" element={<GameRoom />} />
          <Route path="/game/:gameId" element={<GamePlayer />} />
          <Route path="/dressing-room" element={<DressingRoom />} />
          <Route path="/dressing-room/:id" element={<DressingRoom />} />
          <Route path="/dressing-room-analytics" element={<DressingRoomAnalytics />} />
          <Route path="/terminal-analytics" element={<TerminalAnalytics />} />
          <Route path="/admin/voices" element={<VoiceAdmin />} />
          <Route path="/deviantart" element={<DeviantArt />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
    </AnalyticsWrapper>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <TerminalPolish />
      <CursorBlink />
      <Shell>
        <AnimatedRoutes />
      </Shell>
    </BrowserRouter>
  );
}// Build timestamp: 1766227425
