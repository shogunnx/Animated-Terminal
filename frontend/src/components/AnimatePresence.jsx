import { useEffect, useState } from "react";

export function AnimatePresence({ children, location }) {
  const [displayLocation, setDisplayLocation] = useState(location);
  const [transitionStage, setTransitionStage] = useState("enter");
  const [prevPath, setPrevPath] = useState(location.pathname);

  useEffect(() => {
    if (location.pathname !== displayLocation.pathname) {
      setPrevPath(displayLocation.pathname);
      setTransitionStage("exit");
      
      // Wait for exit animation to complete
      const timer = setTimeout(() => {
        setDisplayLocation(location);
        setTransitionStage("enter");
      }, 800); // Match the longest animation duration

      return () => clearTimeout(timer);
    }
  }, [location, displayLocation]);

  // Determine transition type
  const isEnteringRoom = location.pathname.startsWith("/rooms/");
  const wasInRoom = prevPath.startsWith("/rooms/");
  const isLeavingRoom = !isEnteringRoom && wasInRoom;
  
  let transitionType = "corridor"; // Default
  if (isEnteringRoom && !wasInRoom) {
    transitionType = "door"; // Opening door to enter room
  } else if (isLeavingRoom) {
    transitionType = "corridor"; // Zoom back through corridor
  }

  return (
    <div style={{ position: "relative", width: "100%", minHeight: "calc(100vh - 200px)" }}>
      {/* TRANSITION OVERLAY */}
      {transitionStage === "exit" && (
        <>
          {transitionType === "door" && <MetroidDoorTransition />}
          {transitionType === "corridor" && <DoomCorridorTransition />}
        </>
      )}

      {/* CONTENT */}
      <div
        className={`page-transition-${transitionStage}`}
        style={{ width: "100%" }}
      >
        {children}
      </div>
    </div>
  );
}

function MetroidDoorTransition() {
  return (
    <>
      {/* Screen flash when door opens */}
      <div className="screen-flash" />
      
      {/* Warp lines effect */}
      <div className="warp-lines">
        <div className="warp-line" />
        <div className="warp-line" />
        <div className="warp-line" />
        <div className="warp-line" />
        <div className="warp-line" />
      </div>
      
      <div className="metroid-door-transition">
        <div className="door-left" />
        <div className="door-right" />
        <div className="door-glow" />
        
        {/* Door frame details */}
        <svg 
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            zIndex: 10
          }}
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          {/* Top frame */}
          <rect x="48" y="0" width="4" height="10" fill="var(--glow-cyan)" opacity="0.6">
            <animate attributeName="opacity" values="0.6;1;0.6" dur="0.8s" />
          </rect>
          {/* Bottom frame */}
          <rect x="48" y="90" width="4" height="10" fill="var(--glow-cyan)" opacity="0.6">
            <animate attributeName="opacity" values="0.6;1;0.6" dur="0.8s" />
          </rect>
          
          {/* Door lock indicators */}
          <circle cx="30" cy="50" r="2" fill="var(--glow-cyan)">
            <animate attributeName="r" values="2;4;2" dur="0.8s" />
          </circle>
          <circle cx="70" cy="50" r="2" fill="var(--glow-cyan)">
            <animate attributeName="r" values="2;4;2" dur="0.8s" />
          </circle>
        </svg>
      </div>
    </>
  );
}

function DoomCorridorTransition() {
  return (
    <div className="doom-corridor-transition">
      <div className="corridor-zoom" />
    </div>
  );
}
