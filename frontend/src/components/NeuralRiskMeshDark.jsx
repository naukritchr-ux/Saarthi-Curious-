import React, { useEffect, useRef } from "react";

export default function NeuralRiskMeshDark({ onSelectHotspot }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let frameId;
    let t = 0;

    const cols = 18;
    const rows = 13;

    // Coordinates of glowing orange attrition/drop-off peaks (matching DP.JPG)
    const peaks = [
      { gx: 5, gz: 6, height: 74, name: "Module 3: Client Relationships", risk: 86 },
      { gx: 12, gz: 5, height: 58, name: "Franchise West: Quiz #2 Bottleneck", risk: 71 },
    ];

    const render = () => {
      t += 0.03;
      const width = (canvas.width = canvas.parentElement.clientWidth);
      const height = (canvas.height = 290);

      // Obsidian-violet radial gradient background
      const grad = ctx.createRadialGradient(width * 0.4, height * 0.5, 20, width * 0.5, height * 0.5, width * 0.7);
      grad.addColorStop(0, "#1A1033");
      grad.addColorStop(1, "#090712");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      const grid = [];
      const spacingX = width / (cols + 2);
      const spacingZ = 17;

      for (let z = 0; z < rows; z++) {
        grid[z] = [];
        for (let x = 0; x < cols; x++) {
          // Continuous wave motion for live telemetry feel
          let yElev = Math.sin(x * 0.45 + t) * 7 + Math.cos(z * 0.5 + t) * 7;

          // Add sharp 3D amber peaks (DP.JPG style)
          peaks.forEach((p) => {
            const d = Math.hypot(x - p.gx, z - p.gz);
            if (d < 3.4) {
              yElev += p.height * Math.exp(-(d * d) / 2.1) * (0.92 + 0.08 * Math.sin(t * 2.5));
            }
          });

          const px = width * 0.1 + x * spacingX * 0.88 + (z - rows / 2) * 14;
          const py = height * 0.48 + z * spacingZ - yElev;
          grid[z][x] = { x: px, y: py, elev: yElev };
        }
      }

      // Render triangulated wireframe mesh with neon glow
      for (let z = 0; z < rows - 1; z++) {
        for (let x = 0; x < cols - 1; x++) {
          const p1 = grid[z][x];
          const p2 = grid[z][x + 1];
          const p3 = grid[z + 1][x];
          const p4 = grid[z + 1][x + 1];
          const avgElev = (p1.elev + p2.elev + p3.elev) / 3;
          const isPeak = avgElev > 22;

          ctx.strokeStyle = isPeak
            ? `rgba(245, 158, 11, ${Math.min(0.95, avgElev / 52)})` // Glowing Amber/Orange
            : "rgba(139, 92, 246, 0.38)"; // Deep Neon Violet
          ctx.lineWidth = isPeak ? 1.5 : 0.85;

          // Upper Triangle
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.lineTo(p3.x, p3.y);
          ctx.closePath();
          ctx.stroke();

          // Diagonal cross-link for true triangulated topology (like DP.JPG)
          ctx.beginPath();
          ctx.moveTo(p2.x, p2.y);
          ctx.lineTo(p4.x, p4.y);
          ctx.lineTo(p3.x, p3.y);
          ctx.stroke();

          // Glowing vertex nodes
          ctx.fillStyle = isPeak ? "#FDE68A" : "#A78BFA";
          ctx.beginPath();
          ctx.arc(p1.x, p1.y, isPeak ? 2.4 : 1.4, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      frameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(frameId);
  }, []);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-purple-500/25 shadow-[0_0_30px_-5px_rgba(139,92,246,0.2)]">
      <canvas
        ref={canvasRef}
        onClick={() =>
          onSelectHotspot?.({
            name: "Marcus Vance",
            cohort: "Module 3: Client Relationships",
            baseRisk: 86,
          })
        }
        className="w-full h-[290px] block cursor-pointer"
      />

      {/* Top HUD Overlay */}
      <div className="absolute top-3 left-4 flex items-center gap-2 bg-[#090712]/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-amber-500/30">
        <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
        <span className="text-[11px] font-semibold text-amber-200 tracking-wide">
          LIVE 3D NEURAL RISK TOPOLOGY • CLICK AMBER PEAK TO INSPECT
        </span>
      </div>

      {/* Bottom Legend */}
      <div className="absolute bottom-3 right-4 flex items-center gap-4 bg-[#090712]/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-[11px]">
        <span className="flex items-center gap-1.5 text-amber-300 font-medium">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_#F59E0B]" />
          High Drop-Off Peak (71%–86%)
        </span>
        <span className="flex items-center gap-1.5 text-purple-300 font-medium">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-[0_0_8px_#8B5CF6]" />
          Stable Learning Valley
        </span>
      </div>
    </div>
  );
}
