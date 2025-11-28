import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Shell from "./components/Shell.jsx";
import Home from "./pages/Home.jsx";
import Characters from "./pages/Characters.jsx";
import Profile from "./pages/Profile.jsx";
import Room from "./pages/Room.jsx";
import DeviantArt from "./pages/DeviantArt.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <Shell>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/characters" element={<Characters />} />
          <Route path="/characters/:id" element={<Profile />} />
          <Route path="/rooms/:id" element={<Room />} />
          <Route path="/deviantart" element={<DeviantArt />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Shell>
    </BrowserRouter>
  );
}
