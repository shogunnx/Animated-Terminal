import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

export default function PageTransition({ children }) {
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [transitionStage, setTransitionStage] = useState("fadeIn");

  useEffect(() => {
    if (location !== displayLocation) {
      setTransitionStage("fadeOut");
    }
  }, [location, displayLocation]);

  const handleTransitionEnd = () => {
    if (transitionStage === "fadeOut") {
      setDisplayLocation(location);
      setTransitionStage("fadeIn");
    }
  };

  // Determine transition type based on route
  const isEnteringRoom = location.pathname.startsWith("/rooms/");
  const wasInRoom = displayLocation.pathname.startsWith("/rooms/");
  const transitionType = isEnteringRoom && !wasInRoom ? "door" : "corridor";

  return (
    <div style={{ position: "relative", width: "100%", minHeight: "100vh" }}>
      {/* SUPER METROID DOOR TRANSITION */}
      {transitionStage === "fadeOut" && transitionType === "door" && (
        <div className="metroid-door-transition">
          <div className="door-left" />
          <div className="door-right" />
          <div className="door-glow" />
        </div>
      )}

      {/* DOOM CORRIDOR ZOOM TRANSITION */}
      {transitionStage === "fadeOut" && transitionType === "corridor" && (
        <div className="doom-corridor-transition">
          <div className="corridor-zoom" />
        </div>
      )}

      {/* CONTENT */}
      <div
        className={`page-transition-${transitionStage}`}
        onAnimationEnd={handleTransitionEnd}
        style={{ width: "100%" }}
      >
        {children}
      </div>
    </div>
  );
}
