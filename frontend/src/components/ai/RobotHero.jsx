import React from "react";

const ROBOT_SRC = {
  idle: "/assets/robot-idle.png",
  thinking: "/assets/robot-thinking.png",
  happy: "/assets/robot-happy.png",
  listening: "/assets/robot-listening.png",
  error: "/assets/robot-error.png",
};

export default function RobotHero({ mood = "idle", talking = false, size = 220 }) {
  const src = ROBOT_SRC[mood] || ROBOT_SRC.idle;

  return (
    <div className="relative shrink-0 select-none" style={{ width: size, height: size }}>
      {/* Ambient cyan halo behind the robot */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            mood === "error"
              ? "radial-gradient(circle at 50% 45%, rgba(248,113,113,0.45), transparent 62%)"
              : mood === "happy"
              ? "radial-gradient(circle at 50% 45%, rgba(244,114,182,0.35), transparent 62%)"
              : "radial-gradient(circle at 50% 45%, rgba(34,211,238,0.5), transparent 62%)",
          filter: "blur(28px)",
          transform: "scale(1.05)",
          transition: "background 400ms ease",
        }}
      />

      {/* Listening ring */}
      {mood === "listening" && (
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            border: "1.5px solid rgba(34,211,238,0.7)",
            animation: "ringPing 1.8s ease-out infinite",
          }}
        />
      )}

      {/* Robot image — swaps on mood */}
      <img
        key={mood}
        src={src}
        alt="Saarthi AI assistant"
        draggable={false}
        className="relative w-full h-full bot-float"
        style={{ objectFit: "contain", transition: "opacity 200ms ease" }}
      />

      {/* Platform glow beneath */}
      <div
        className="absolute left-1/2 pointer-events-none"
        style={{
          bottom: size * 0.02,
          transform: "translateX(-50%)",
          width: size * 0.55,
          height: size * 0.07,
          background:
            "radial-gradient(ellipse at center, rgba(34,211,238,0.65), rgba(139,92,246,0.25) 45%, transparent 75%)",
          filter: "blur(8px)",
        }}
      />

      {/* Thinking dots */}
      {mood === "thinking" && (
        <div
          className="absolute flex gap-1.5 pointer-events-none"
          style={{ top: size * 0.12, right: size * 0.02 }}
        >
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="bot-dot rounded-full"
              style={{
                width: 8 + i * 2,
                height: 8 + i * 2,
                background: "#22d3ee",
                boxShadow: "0 0 12px rgba(34,211,238,0.9)",
              }}
            />
          ))}
        </div>
      )}

      {/* Talking voice wave */}
      {talking && (
        <div
          className="absolute left-1/2 pointer-events-none voice-wave"
          style={{ bottom: -6, transform: "translateX(-50%)" }}
        />
      )}
    </div>
  );
}
