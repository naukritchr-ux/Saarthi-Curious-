import React, { useEffect, useState, useRef } from "react";

export const ROBOT_ASSETS = {
  idle: "/assets/robot-idle.png",
  thinking: "/assets/robot-thinking.png",
  happy: "/assets/robot-happy.png",
  listening: "/assets/robot-listening.png",
  error: "/assets/robot-error.png",
  excited: "/assets/robot-hero-excited.png",
  talking1: "/assets/robot-hero-talking1.png",
  talking2: "/assets/robot-hero-talking2.png",
  wink: "/assets/robot-hero-wink.png",
  blank: "/assets/robot-hero-blank.png",
  hero: "/assets/robot-hero.png",
};

export default function RobotHero({
  mood = "idle",
  gesture = null,
  talking = false,
  size = 220,
  onClick = null,
  interactive = true,
}) {
  const [currentPose, setCurrentPose] = useState(mood);
  const [talkingFrame, setTalkingFrame] = useState(0);
  const blinkTimerRef = useRef(null);

  // Preload all 11 variants once
  useEffect(() => {
    Object.values(ROBOT_ASSETS).forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  // Update current pose based on mood / gesture / talking
  useEffect(() => {
    if (gesture && ROBOT_ASSETS[gesture]) {
      setCurrentPose(gesture);
    } else if (talking) {
      setCurrentPose(talkingFrame === 0 ? "talking1" : "talking2");
    } else if (ROBOT_ASSETS[mood]) {
      setCurrentPose(mood);
    } else {
      setCurrentPose("idle");
    }
  }, [mood, gesture, talking, talkingFrame]);

  // Animated talking gestures (alternate talking1 & talking2 while speaking)
  useEffect(() => {
    if (!talking) return;
    const interval = setInterval(() => {
      setTalkingFrame((f) => (f === 0 ? 1 : 0));
    }, 380);
    return () => clearInterval(interval);
  }, [talking]);

  // Natural idle blinking micro-animation (swaps to blank for 160ms every 5s)
  useEffect(() => {
    if (talking || mood !== "idle" || gesture) return;

    const scheduleBlink = () => {
      const delay = 4000 + Math.random() * 3000;
      blinkTimerRef.current = setTimeout(() => {
        setCurrentPose("blank");
        setTimeout(() => {
          setCurrentPose("idle");
          scheduleBlink();
        }, 160);
      }, delay);
    };

    scheduleBlink();
    return () => {
      if (blinkTimerRef.current) clearTimeout(blinkTimerRef.current);
    };
  }, [mood, talking, gesture]);

  const activeSrc = ROBOT_ASSETS[currentPose] || ROBOT_ASSETS.idle;

  // Aura colors mapped to mood
  const getGlowColor = () => {
    switch (currentPose) {
      case "error":
        return "radial-gradient(circle at 50% 45%, rgba(248,113,113,0.5), transparent 62%)";
      case "happy":
      case "excited":
      case "wink":
        return "radial-gradient(circle at 50% 45%, rgba(244,114,182,0.4), rgba(56,189,248,0.25) 45%, transparent 65%)";
      case "thinking":
        return "radial-gradient(circle at 50% 45%, rgba(168,85,247,0.45), transparent 62%)";
      case "talking1":
      case "talking2":
        return "radial-gradient(circle at 50% 45%, rgba(34,211,238,0.55), rgba(139,92,246,0.25) 50%, transparent 65%)";
      default:
        return "radial-gradient(circle at 50% 45%, rgba(34,211,238,0.48), transparent 62%)";
    }
  };

  const handleRobotClick = () => {
    if (!interactive) return;
    // Playful spontaneous reaction on click
    const reactions = ["excited", "wink", "happy"];
    const pick = reactions[Math.floor(Math.random() * reactions.length)];
    setCurrentPose(pick);
    setTimeout(() => {
      setCurrentPose(mood || "idle");
    }, 1200);
    onClick?.();
  };

  return (
    <div
      onClick={handleRobotClick}
      className={`relative shrink-0 select-none group ${interactive ? "cursor-pointer" : ""}`}
      style={{ width: size, height: size }}
      title={interactive ? "Click me for a friendly hello!" : "Saarthi AI"}
    >
      {/* Dynamic ambient halo behind the robot */}
      <div
        className="absolute inset-0 pointer-events-none transition-all duration-500 ease-out"
        style={{
          background: getGlowColor(),
          filter: "blur(26px)",
          transform: talking ? "scale(1.14)" : "scale(1.05)",
        }}
      />

      {/* Listening ring ping */}
      {mood === "listening" && (
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            border: "1.5px solid rgba(34,211,238,0.7)",
            animation: "ringPing 1.8s ease-out infinite",
          }}
        />
      )}

      {/* Robot image with smooth floating animation */}
      <img
        src={activeSrc}
        alt={`Saarthi AI Robot - ${currentPose}`}
        draggable={false}
        className="relative w-full h-full object-contain bot-float transition-transform duration-300 group-hover:scale-105"
        style={{
          filter: talking
            ? "drop-shadow(0 0 14px rgba(34,211,238,0.55))"
            : "drop-shadow(0 0 8px rgba(34,211,238,0.25))",
        }}
      />

      {/* Floating platform glow underneath */}
      <div
        className="absolute left-1/2 pointer-events-none transition-all duration-300"
        style={{
          bottom: size * 0.02,
          transform: "translateX(-50%)",
          width: size * 0.58,
          height: size * 0.08,
          background:
            "radial-gradient(ellipse at center, rgba(34,211,238,0.7), rgba(139,92,246,0.3) 45%, transparent 75%)",
          filter: "blur(7px)",
        }}
      />

      {/* Thinking sparkle dots */}
      {mood === "thinking" && (
        <div
          className="absolute flex gap-1.5 pointer-events-none"
          style={{ top: size * 0.1, right: size * 0.02 }}
        >
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="bot-dot rounded-full animate-bounce"
              style={{
                animationDelay: `${i * 180}ms`,
                width: 7 + i * 2,
                height: 7 + i * 2,
                background: "#22d3ee",
                boxShadow: "0 0 12px rgba(34,211,238,0.9)",
              }}
            />
          ))}
        </div>
      )}

      {/* Talking sound wave indicator */}
      {talking && (
        <div
          className="absolute left-1/2 pointer-events-none voice-wave"
          style={{ bottom: -6, transform: "translateX(-50%)" }}
        />
      )}
    </div>
  );
}
