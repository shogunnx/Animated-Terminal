import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence } from "./components/AnimatePresence.jsx";
import Shell from "./components/Shell.jsx";
import Home from "./pages/Home.jsx";
import Characters from "./pages/Characters.jsx";
import Profile from "./pages/Profile.jsx";
import Room from "./pages/Room.jsx";
import DeviantArt from "./pages/DeviantArt.jsx";
import GameRoom from "./pages/GameRoom.jsx";
import GamePlayer from "./pages/GamePlayer.jsx";
import DressingRoom from "./pages/DressingRoom.jsx";
import TerminalPolish from "./components/TerminalPolish.jsx";
import CursorBlink from "./components/CursorBlink.jsx";

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence location={location}>
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Home />} />
        <Route path="/characters" element={<Characters />} />
        <Route path="/characters/:id" element={<Profile />} />
        <Route path="/rooms/:id" element={<Room />} />
        <Route path="/gameroom" element={<GameRoom />} />
        <Route path="/game/:gameId" element={<GamePlayer />} />
        <Route path="/dressing-room" element={<DressingRoom />} />
        <Route path="/dressing-room/:id" element={<DressingRoom />} />
        <Route path="/deviantart" element={<DeviantArt />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
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
}