/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import {
  Award,
  RefreshCw,
  CheckCircle2,
  Lock,
  Crown,
  ShieldCheck,
  X,
  RotateCcw,
  TrendingUp,
} from "lucide-react";
import MainLayout from "../../layout/mainLayout";
import { API_BASE } from "../../config/api";

const API_BASE_URL =
  import.meta.env?.VITE_API_URL ||
  API_BASE ||
  (import.meta.env?.DEV
    ? "http://127.0.0.1:8000"
    : "https://saarthi-curious-00e8.onrender.com");

// ============================================================================
// 1. AUTO-DISCOVER UPLOADED HERO & MEDAL PNG ASSETS IN src/ (OR public/)
// ============================================================================
const DISCOVERED_IMAGES = import.meta.glob("/src/**/*.{png,jpg,jpeg,webp}", {
  eager: true,
  import: "default",
});

function resolveRewardsHeroImage() {
  const entries = Object.entries(DISCOVERED_IMAGES);
  const exact = entries.find(([path]) =>
    /golden.*trophy.*medal.*collection/i.test(path)
  );
  if (exact) return exact[1];
  const fallbackMatch = entries.find(([path]) =>
    /trophy.*medals|rewards.*hero|vault.*banner/i.test(path)
  );
  return fallbackMatch
    ? fallbackMatch[1]
    : "/Golden Trophy and Medal Collection.png";
}

function resolveMasterEmblemPng() {
  const match = Object.entries(DISCOVERED_IMAGES).find(([path]) =>
    /glossy.*golden.*trophy|trophy.*crown|golden.*emblem|gold.*medal|medal_gold/i.test(
      path
    )
  );
  return match ? match[1] : "/Glossy Golden Trophy Crown Emblem.png";
}

function resolveMedalPngForBadge(badge) {
  const entries = Object.entries(DISCOVERED_IMAGES).filter(
    ([path]) =>
      !/golden.*trophy.*medal.*collection|trophy.*medals|morning.*light|rewards.*hero|vault.*banner/i.test(
        path
      )
  );
  const idClean = badge.id.toLowerCase();
  const catClean = badge.category.toLowerCase();
  const tierClean = badge.tier.toLowerCase();

  // 1. Exact badge ID match (e.g., strk_gold.png, app_silver.png)
  const exactId = entries.find(([path]) =>
    path.toLowerCase().includes(idClean)
  );
  if (exactId) return { src: exactId[1], isDedicatedTierAsset: true };

  // 2. Category + tier match (e.g., "Golden Streak Champion Badge.png" for strk_gold)
  const catTier = entries.find(([path]) => {
    const p = path.toLowerCase();
    const tierHit =
      p.includes(tierClean) ||
      (tierClean === "gold" && p.includes("golden"));
    return p.includes(catClean) && tierHit;
  });
  if (catTier) return { src: catTier[1], isDedicatedTierAsset: true };

  // 3. Tier-specific medal PNG match (e.g., silver_medal.png, bronze_badge.png)
  const tierOnly = entries.find(([path]) => {
    const p = path.toLowerCase();
    const tierHit =
      p.includes(tierClean) ||
      (tierClean === "gold" && p.includes("golden"));
    return tierHit && /medal|badge|trophy|emblem|crown|reward/i.test(p);
  });
  if (tierOnly) return { src: tierOnly[1], isDedicatedTierAsset: true };

  // 4. Category-only match (e.g., Streak badge shared across tiers)
  const catOnly = entries.find(([path]) =>
    path.toLowerCase().includes(catClean)
  );
  if (catOnly) return { src: catOnly[1], isDedicatedTierAsset: false };

  // 5. Master Glossy Golden Trophy Crown Emblem PNG
  return { src: resolveMasterEmblemPng(), isDedicatedTierAsset: false };
}

const DEFAULT_HERO_BG = resolveRewardsHeroImage();

// ============================================================================
// 2. 15 OFFICIAL BADGES — ORDERED: ROW 1 GOLD | ROW 2 SILVER | ROW 3 BRONZE
// ============================================================================
const REWARDS_BADGES = [
  // ROW 1: GOLD TIER (TOP)
  {
    id: "comp_gold",
    name: "Completion Gold",
    curos: 200,
    target: 10,
    metricKey: "completion",
    unit: "Completed Programs",
    tier: "gold",
    category: "Completion",
    ruleText: "Graduate from 10 complete enterprise learning programs.",
  },
  {
    id: "app_gold",
    name: "Application Gold",
    curos: 150,
    target: 10,
    metricKey: "application",
    unit: "Application Checks",
    tier: "gold",
    category: "Application",
    ruleText: "Achieve mastery across 10 practical application evaluations.",
  },
  {
    id: "curos_gold",
    name: "Curos Gold",
    curos: 100,
    target: 1000,
    metricKey: "curos",
    unit: "Curos",
    tier: "gold",
    category: "Curos",
    ruleText: "Accumulate 1,000+ Curos in your learning treasury.",
  },
  {
    id: "ret_gold",
    name: "Retention Gold",
    curos: 150,
    target: 15,
    metricKey: "retention",
    unit: "Retention Checks",
    tier: "gold",
    category: "Retention",
    ruleText: "Demonstrate 90%+ long-term retention across 15 evaluations.",
  },
  {
    id: "strk_gold",
    name: "Streak Gold",
    curos: 150,
    target: 30,
    metricKey: "streak",
    unit: "Streak Days",
    tier: "gold",
    category: "Streak",
    ruleText: "Complete a 30-day consecutive learning inferno streak.",
  },

  // ROW 2: SILVER TIER (SECOND)
  {
    id: "app_silver",
    name: "Application Silver",
    curos: 75,
    target: 5,
    metricKey: "application",
    unit: "Application Checks",
    tier: "silver",
    category: "Application",
    ruleText: "Pass 5 practical application checks with verified accuracy.",
  },
  {
    id: "comp_silver",
    name: "Completion Silver",
    curos: 100,
    target: 5,
    metricKey: "completion",
    unit: "Completed Programs",
    tier: "silver",
    category: "Completion",
    ruleText: "Complete 5 core curriculum programs with certification.",
  },
  {
    id: "curos_silver",
    name: "Curos Silver",
    curos: 50,
    target: 500,
    metricKey: "curos",
    unit: "Curos",
    tier: "silver",
    category: "Curos",
    ruleText: "Accumulate 500 Curos through active learning milestones.",
  },
  {
    id: "ret_silver",
    name: "Retention Silver",
    curos: 75,
    target: 7,
    metricKey: "retention",
    unit: "Retention Checks",
    tier: "silver",
    category: "Retention",
    ruleText: "Maintain an 80%+ retention score across 7 evaluations.",
  },
  {
    id: "strk_silver",
    name: "Streak Silver",
    curos: 50,
    target: 10,
    metricKey: "streak",
    unit: "Streak Days",
    tier: "silver",
    category: "Streak",
    ruleText: "Complete a 10-day consecutive learning streak.",
  },

  // ROW 3: BRONZE TIER (THIRD)
  {
    id: "app_bronze",
    name: "Application Bronze",
    curos: 30,
    target: 1,
    metricKey: "application",
    unit: "Application Check",
    tier: "bronze",
    category: "Application",
    ruleText: "Pass at least 1 practical application check assessment.",
  },
  {
    id: "comp_bronze",
    name: "Completion Bronze",
    curos: 50,
    target: 1,
    metricKey: "completion",
    unit: "Completed Program",
    tier: "bronze",
    category: "Completion",
    ruleText: "Complete 1 full learning program track from start to finish.",
  },
  {
    id: "curos_bronze",
    name: "Curos Bronze",
    curos: 10,
    target: 100,
    metricKey: "curos",
    unit: "Curos",
    tier: "bronze",
    category: "Curos",
    ruleText: "Accumulate 100 Curos in your personal learning treasury.",
  },
  {
    id: "ret_bronze",
    name: "Retention Bronze",
    curos: 30,
    target: 3,
    metricKey: "retention",
    unit: "Retention Checks",
    tier: "bronze",
    category: "Retention",
    ruleText: "Maintain verified retention across 3 module assessments.",
  },
  {
    id: "strk_bronze",
    name: "Streak Bronze",
    curos: 10,
    target: 3,
    metricKey: "streak",
    unit: "Streak Days",
    tier: "bronze",
    category: "Streak",
    ruleText: "Maintain an active learning streak for 3 consecutive days.",
  },
];

// ============================================================================
// 3. BRIGHT, LUMINOUS PNG MEDAL RENDERER (ZERO DIMMING — FULL LIGHT PRESERVED)
// ============================================================================
function BrightShiningMedal({ badge, size = 100, delayIdx = 0 }) {
  const resolved = useMemo(() => resolveMedalPngForBadge(badge), [badge]);
  const [imgFailed, setImgFailed] = useState(false);

  const tier = badge.tier || "gold";

  const spotlightGlow =
    tier === "gold"
      ? "radial-gradient(circle, rgba(254, 240, 138, 0.52) 0%, rgba(245, 158, 11, 0.24) 48%, transparent 72%)"
      : tier === "silver"
      ? "radial-gradient(circle, rgba(255, 255, 255, 0.48) 0%, rgba(203, 213, 225, 0.24) 48%, transparent 72%)"
      : "radial-gradient(circle, rgba(254, 215, 170, 0.48) 0%, rgba(234, 88, 12, 0.24) 48%, transparent 72%)";

  // Keep every uploaded medal bright and luminous (NEVER darken or desaturate locked medals)
  const imageFilter = useMemo(() => {
    const rimLightShadow =
      tier === "gold"
        ? "drop-shadow(0 0 10px rgba(254, 240, 138, 0.42)) drop-shadow(0 8px 14px rgba(0, 0, 0, 0.72))"
        : tier === "silver"
        ? "drop-shadow(0 0 10px rgba(241, 245, 249, 0.45)) drop-shadow(0 8px 14px rgba(0, 0, 0, 0.72))"
        : "drop-shadow(0 0 10px rgba(253, 186, 116, 0.42)) drop-shadow(0 8px 14px rgba(0, 0, 0, 0.72))";

    if (resolved.isDedicatedTierAsset) {
      return `${rimLightShadow} brightness(1.12) contrast(1.06) saturate(1.1)`;
    }
    if (tier === "silver") {
      return `${rimLightShadow} saturate(0.12) brightness(1.28) contrast(1.08)`;
    }
    if (tier === "bronze") {
      return `${rimLightShadow} hue-rotate(-20deg) saturate(1.16) brightness(1.06) contrast(1.08)`;
    }
    return `${rimLightShadow} brightness(1.14) contrast(1.06) saturate(1.12)`;
  }, [tier, resolved.isDedicatedTierAsset]);

  const sweepDelay = `${(delayIdx % 5) * -0.95}s`;

  return (
    <div
      className="relative inline-flex items-center justify-center select-none shrink-0"
      style={{ width: size, height: size }}
    >
      {/* Bright Jewelry-Case Spotlight Behind Medal so Light Art Pops */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-2 rounded-full blur-lg opacity-90 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: spotlightGlow }}
      />

      {!imgFailed ? (
        <div className="relative w-full h-full flex items-center justify-center z-10">
          <img
            src={resolved.src}
            alt={badge.name}
            onError={() => setImgFailed(true)}
            style={{ filter: imageFilter }}
            className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-108"
          />

          {/* Silhouette-Masked Live Specular Shine Gliding Across Medal Pixels */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 overflow-hidden z-20"
            style={{
              WebkitMaskImage: `url("${resolved.src}")`,
              maskImage: `url("${resolved.src}")`,
              WebkitMaskSize: "contain",
              maskSize: "contain",
              WebkitMaskRepeat: "no-repeat",
              maskRepeat: "no-repeat",
              WebkitMaskPosition: "center",
              maskPosition: "center",
            }}
          >
            <div
              className="medal-png-sheen-beam"
              style={{ animationDelay: sweepDelay }}
            />
          </div>
        </div>
      ) : (
        <svg
          viewBox="0 0 120 120"
          className="w-full h-full relative z-10 drop-shadow-[0_10px_18px_rgba(0,0,0,0.85)]"
        >
          <defs>
            <linearGradient id={`fb-${badge.id}`} x1="0" y1="0" x2="1" y2="1">
              <stop
                offset="0%"
                stopColor={
                  tier === "gold"
                    ? "#FFFBEB"
                    : tier === "silver"
                    ? "#FFFFFF"
                    : "#FFEDD5"
                }
              />
              <stop
                offset="50%"
                stopColor={
                  tier === "gold"
                    ? "#FACC15"
                    : tier === "silver"
                    ? "#CBD5E1"
                    : "#FB923C"
                }
              />
              <stop
                offset="100%"
                stopColor={
                  tier === "gold"
                    ? "#B45309"
                    : tier === "silver"
                    ? "#64748B"
                    : "#9A3412"
                }
              />
            </linearGradient>
          </defs>
          <circle
            cx="60"
            cy="60"
            r="46"
            fill={`url(#fb-${badge.id})`}
            stroke="#FFFFFF"
            strokeWidth="2.5"
          />
          <circle cx="60" cy="60" r="35" fill="#13101D" stroke="#FEF08A" strokeWidth="1.5" />
          <polygon
            points="60,34 66,50 84,50 70,60 75,77 60,67 45,77 50,60 36,50 54,50"
            fill={`url(#fb-${badge.id})`}
          />
        </svg>
      )}
    </div>
  );
}

// ============================================================================
// 4. MAIN REWARDS COMPONENT
// ============================================================================
export default function Rewards({ heroImageSrc = DEFAULT_HERO_BG }) {
  const [checking, setChecking] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState(null);
  const [tierFilter, setTierFilter] = useState("all"); // 'all' | 'gold' | 'silver' | 'bronze'
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [lastSynced, setLastSynced] = useState(null);
  const [heroImgErr, setHeroImgErr] = useState(false);

  const [userMetrics, setUserMetrics] = useState({
    curos: 0,
    completion: 0,
    application: 0,
    retention: 0,
    streak: 0,
  });

  const [apiEarnedIds, setApiEarnedIds] = useState([]);

  const checkLiveUserBadges = useCallback(async () => {
    setChecking(true);
    let storedUserName = "";
    let storedUserEmail = "";
    let storedUserId = null;

    try {
      const rawUser =
        localStorage.getItem("user") ||
        localStorage.getItem("currentUser") ||
        localStorage.getItem("saarthi_user") ||
        localStorage.getItem("user_details");

      if (rawUser) {
        const parsed = JSON.parse(rawUser);
        storedUserName = String(
          parsed?.name || parsed?.full_name || parsed?.username || ""
        )
          .toLowerCase()
          .trim();
        storedUserEmail = String(parsed?.email || "").toLowerCase().trim();
        storedUserId = parsed?.id ?? parsed?.user_id ?? parsed?.userId ?? null;
      }
      if (!storedUserId) {
        storedUserId =
          localStorage.getItem("user_id") ||
          localStorage.getItem("user_Id") ||
          null;
      }
      if (!storedUserName) {
        storedUserName = String(
          localStorage.getItem("user_name") ||
            localStorage.getItem("full_name") ||
            ""
        )
          .toLowerCase()
          .trim();
      }
      if (!storedUserEmail) {
        storedUserEmail = String(localStorage.getItem("email") || "")
          .toLowerCase()
          .trim();
      }
    } catch {
      // Ignore parse error
    }

    try {
      if (storedUserId) {
        try {
          await axios.post(`${API_BASE_URL}/badges/check/${storedUserId}`);
        } catch {
          // Optional endpoint
        }
      }

      const badgeEndpoints = [
        `${API_BASE_URL}/rewards`,
        `${API_BASE_URL}/api/rewards`,
        `${API_BASE_URL}/badges`,
      ];
      for (const url of badgeEndpoints) {
        try {
          const r = await axios.get(url, {
            params: { _t: Date.now(), user_id: storedUserId },
          });
          if (Array.isArray(r.data?.earned_badge_ids)) {
            setApiEarnedIds(r.data.earned_badge_ids);
            break;
          }
        } catch {
          // Try next endpoint
        }
      }

      const res = await axios.get(`${API_BASE_URL}/analytics/leaderboards`, {
        params: { _t: Date.now() },
      });
      const list = res.data?.competitors || [];
      const matchedUser =
        list.find(
          (u) =>
            (storedUserId !== null && Number(u.id) === Number(storedUserId)) ||
            (storedUserEmail &&
              String(u.email || "").toLowerCase().trim() === storedUserEmail) ||
            (storedUserName &&
              String(u.name || "").toLowerCase().trim() === storedUserName)
        ) || null;

      if (matchedUser) {
        setUserMetrics({
          curos: Number(matchedUser.curos || 0),
          completion: Number(matchedUser.programs_completed || 0),
          application:
            Number(matchedUser.application_pct || 0) >= 80
              ? 2
              : Number(matchedUser.application_pct || 0) > 0
              ? 1
              : 0,
          retention:
            Number(matchedUser.retention_pct || 0) >= 80
              ? 3
              : Number(matchedUser.retention_pct || 0) > 0
              ? 1
              : 0,
          streak: Number(matchedUser.streak_days || 0),
        });
      }
      setLastSynced(new Date().toLocaleTimeString());
    } catch {
      // Keep current state
    } finally {
      setTimeout(() => setChecking(false), 420);
    }
  }, []);

  useEffect(() => {
    checkLiveUserBadges();
  }, [checkLiveUserBadges]);

  const enrichedBadges = useMemo(() => {
    return REWARDS_BADGES.map((b) => {
      const liveValue = Number(userMetrics[b.metricKey] || 0);
      const slugName = b.name.toLowerCase().replace(/\s+/g, "_");
      const isEarned =
        apiEarnedIds.includes(b.id) ||
        apiEarnedIds.includes(slugName) ||
        liveValue >= b.target;
      const currentProgress = isEarned
        ? b.target
        : Math.min(b.target, liveValue);
      const progressPct = Math.min(
        100,
        Math.round((currentProgress / Math.max(1, b.target)) * 100)
      );
      const remaining = Math.max(0, b.target - currentProgress);

      return {
        ...b,
        isEarned,
        currentProgress,
        progressPct,
        remaining,
      };
    });
  }, [userMetrics, apiEarnedIds]);

  const earnedMedals = useMemo(
    () => enrichedBadges.filter((b) => b.isEarned),
    [enrichedBadges]
  );

  const kpiStats = useMemo(() => {
    const avgProgress = Math.round(
      enrichedBadges.reduce((sum, b) => sum + b.progressPct, 0) /
        Math.max(1, enrichedBadges.length)
    );
    return {
      total: earnedMedals.length,
      gold: earnedMedals.filter((b) => b.tier === "gold").length,
      silver: earnedMedals.filter((b) => b.tier === "silver").length,
      bronze: earnedMedals.filter((b) => b.tier === "bronze").length,
      earnedCurosBonus: earnedMedals.reduce((s, b) => s + b.curos, 0),
      avgProgress,
    };
  }, [earnedMedals, enrichedBadges]);

  const filteredBadges = useMemo(() => {
    return enrichedBadges.filter((b) => {
      if (tierFilter !== "all" && b.tier !== tierFilter) return false;
      if (categoryFilter !== "All" && b.category !== categoryFilter) return false;
      return true;
    });
  }, [enrichedBadges, tierFilter, categoryFilter]);

  const featuredBadge = earnedMedals[0] || null;
  const mostPopularBadge =
    enrichedBadges.find((b) => b.id === "curos_bronze") || enrichedBadges[12];
  const nearestMilestone = useMemo(() => {
    return (
      [...enrichedBadges]
        .filter((b) => !b.isEarned)
        .sort((a, b) => b.progressPct - a.progressPct || a.curos - b.curos)[0] ||
      mostPopularBadge
    );
  }, [enrichedBadges, mostPopularBadge]);

  return (
    <MainLayout>
      <div className="-m-4 sm:-m-6 p-5 sm:p-7 min-h-screen bg-[#06060D] text-white font-sans space-y-6 overflow-x-hidden selection:bg-amber-400 selection:text-slate-950">
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800;900&display=swap');

          .font-vault-serif {
            font-family: "Playfair Display", Georgia, Cambria, "Times New Roman", serif;
          }

          /* ===================================================================
             SHARED LIVE RANDOM NON-CIRCULAR COORDINATES (INHERITABLE)
          =================================================================== */
          @property --rx1 { syntax: "<percentage>"; inherits: true; initial-value: 8%;  }
          @property --ry1 { syntax: "<percentage>"; inherits: true; initial-value: 8%;  }
          @property --rx2 { syntax: "<percentage>"; inherits: true; initial-value: 92%; }
          @property --ry2 { syntax: "<percentage>"; inherits: true; initial-value: 92%; }

          @keyframes rwRandA1 {
            0%   { --rx1: 5%;  --ry1: 6%;  }
            22%  { --rx1: 95%; --ry1: 92%; }
            41%  { --rx1: 8%;  --ry1: 95%; }
            62%  { --rx1: 4%;  --ry1: 20%; }
            80%  { --rx1: 96%; --ry1: 8%;  }
            100% { --rx1: 5%;  --ry1: 6%;  }
          }
          @keyframes rwRandB1 {
            0%   { --rx2: 92%; --ry2: 90%; }
            28%  { --rx2: 18%; --ry2: 4%;  }
            56%  { --rx2: 96%; --ry2: 34%; }
            82%  { --rx2: 6%;  --ry2: 86%; }
            100% { --rx2: 92%; --ry2: 90%; }
          }

          @keyframes rwRandA2 {
            0%   { --rx1: 94%; --ry1: 94%; }
            25%  { --rx1: 68%; --ry1: 4%;  }
            47%  { --rx1: 97%; --ry1: 64%; }
            68%  { --rx1: 5%;  --ry1: 8%;  }
            87%  { --rx1: 8%;  --ry1: 94%; }
            100% { --rx1: 94%; --ry1: 94%; }
          }
          @keyframes rwRandB2 {
            0%   { --rx2: 6%;  --ry2: 84%; }
            31%  { --rx2: 92%; --ry2: 6%;  }
            61%  { --rx2: 40%; --ry2: 97%; }
            85%  { --rx2: 4%;  --ry2: 18%; }
            100% { --rx2: 6%;  --ry2: 84%; }
          }

          @keyframes rwRandA3 {
            0%   { --rx1: 95%; --ry1: 6%;  }
            23%  { --rx1: 6%;  --ry1: 94%; }
            45%  { --rx1: 58%; --ry1: 97%; }
            66%  { --rx1: 4%;  --ry1: 6%;  }
            84%  { --rx1: 92%; --ry1: 86%; }
            100% { --rx1: 95%; --ry1: 6%;  }
          }
          @keyframes rwRandB3 {
            0%   { --rx2: 12%; --ry2: 4%;  }
            29%  { --rx2: 95%; --ry2: 78%; }
            57%  { --rx2: 8%;  --ry2: 95%; }
            83%  { --rx2: 84%; --ry2: 4%;  }
            100% { --rx2: 12%; --ry2: 4%;  }
          }

          @keyframes rwRandA4 {
            0%   { --rx1: 6%;  --ry1: 94%; }
            26%  { --rx1: 4%;  --ry1: 8%;  }
            49%  { --rx1: 96%; --ry1: 92%; }
            71%  { --rx1: 94%; --ry1: 6%;  }
            89%  { --rx1: 34%; --ry1: 97%; }
            100% { --rx1: 6%;  --ry1: 94%; }
          }
          @keyframes rwRandB4 {
            0%   { --rx2: 88%; --ry2: 8%;  }
            33%  { --rx2: 6%;  --ry2: 62%; }
            64%  { --rx2: 96%; --ry2: 94%; }
            86%  { --rx2: 22%; --ry2: 4%;  }
            100% { --rx2: 88%; --ry2: 8%;  }
          }

          /* ============================================================================
             HERO BANNER: WARM STUDIO BRONZE & WALNUT BLEND + LIVE LIQUID-GOLD TITLE
          ============================================================================ */
          @keyframes heroTitleLiquidGold {
            0%   { background-position: 0% 50%; }
            50%  { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }

          @keyframes heroWarmAmbientDrift {
            0%, 100% { transform: translate3d(-6%, -4%, 0) scale(1);    opacity: 0.72; }
            50%      { transform: translate3d(10%, 6%, 0)  scale(1.12); opacity: 1; }
          }

          @keyframes heroGoldPathA {
            0%   { --rx1: 5%;  --ry1: 6%;  }
            28%  { --rx1: 50%; --ry1: 10%; }
            55%  { --rx1: 40%; --ry1: 94%; }
            80%  { --rx1: 4%;  --ry1: 72%; }
            100% { --rx1: 5%;  --ry1: 6%;  }
          }
          @keyframes heroGoldPathB {
            0%   { --rx2: 46%; --ry2: 92%; }
            34%  { --rx2: 8%;  --ry2: 44%; }
            68%  { --rx2: 36%; --ry2: 4%;  }
            100% { --rx2: 46%; --ry2: 92%; }
          }

          /* Smooth Base Gradient Flow for Gold / Silver / Bronze KPI Cards */
          @keyframes kpiBaseFluid {
            0%   { background-position: 0% 50%,   0% 0%, 0% 0%, 0% 0%; }
            50%  { background-position: 100% 50%, 0% 0%, 0% 0%, 0% 0%; }
            100% { background-position: 0% 50%,   0% 0%, 0% 0%, 0% 0%; }
          }

          @keyframes medalPngSheenGlide {
            0%   { transform: translateX(-145%) skewX(-24deg); opacity: 0; }
            20%  { opacity: 0.78; }
            50%  { transform: translateX(220%) skewX(-24deg); opacity: 0; }
            100% { transform: translateX(220%) skewX(-24deg); opacity: 0; }
          }
          .medal-png-sheen-beam {
            position: absolute;
            top: -15%;
            bottom: -15%;
            left: 0;
            width: 44%;
            background: linear-gradient(
              90deg,
              transparent 0%,
              rgba(255, 250, 224, 0.25) 32%,
              rgba(255, 255, 255, 0.85) 50%,
              rgba(254, 240, 138, 0.28) 68%,
              transparent 100%
            );
            animation: medalPngSheenGlide 4.6s cubic-bezier(0.4, 0, 0.2, 1) infinite;
          }

          /* Color-matched to the warm taupe-bronze wall & walnut desk of the uploaded image */
          .rw-hero-shell {
            position: relative;
            overflow: hidden;
            border-radius: 1.5rem;
            background:
              /* Smooth dark-espresso left vignette so headline & balance pod stay crisp */
              linear-gradient(
                90deg,
                rgba(24, 12, 6, 0.96) 0%,
                rgba(34, 18, 9, 0.88) 42%,
                rgba(48, 26, 14, 0.42) 64%,
                transparent 82%
              ),
              /* Studio wall (upper 45%) + varnished walnut desk horizon (lower 55%) matching the photo */
              linear-gradient(
                180deg,
                #6E462D 0%,
                #784E35 38%,
                #684029 45%,
                #8C5536 52%,
                #7C4628 74%,
                #5E3018 100%
              );
            box-shadow:
              0 18px 46px rgba(0, 0, 0, 0.84),
              0 0 34px -10px rgba(245, 196, 81, 0.34),
              inset 0 1px 1px rgba(254, 240, 138, 0.25);
          }

          /* Soft studio sun-glow breathing gently behind the headline */
          .rw-hero-studio-glow {
            position: absolute;
            top: -28%;
            left: 6%;
            width: 48%;
            height: 155%;
            border-radius: 9999px;
            pointer-events: none;
            z-index: 1;
            background: radial-gradient(
              ellipse at center,
              rgba(251, 191, 36, 0.24) 0%,
              rgba(194, 108, 42, 0.16) 45%,
              transparent 74%
            );
            filter: blur(48px);
            animation: heroWarmAmbientDrift 11s ease-in-out infinite;
          }

          /* Masked Live Golden Border — Travels Randomly Around Left Side Only */
          .rw-hero-border-mask {
            position: absolute;
            inset: 0;
            border-radius: inherit;
            pointer-events: none;
            z-index: 25;
            -webkit-mask-image: linear-gradient(
              90deg,
              #000 0%,
              #000 54%,
              rgba(0, 0, 0, 0.25) 64%,
              transparent 72%
            );
            mask-image: linear-gradient(
              90deg,
              #000 0%,
              #000 54%,
              rgba(0, 0, 0, 0.25) 64%,
              transparent 72%
            );
          }

          .rw-hero-live-gold-rim {
            position: absolute;
            inset: 0;
            border-radius: inherit;
            padding: 2.8px;
            background:
              radial-gradient(ellipse 36% 58% at var(--rx1) var(--ry1), #FFFFFF 0%, #FEF08A 24%, transparent 66%),
              radial-gradient(ellipse 42% 60% at var(--rx2) var(--ry2), #FDE047 0%, #D97706 34%, transparent 68%),
              linear-gradient(135deg, #F5CE67 0%, #8A5A14 45%, #FEF08A 80%, #B46914 100%);
            -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
            -webkit-mask-composite: xor;
            mask-composite: exclude;
            animation:
              heroGoldPathA 10.4s ease-in-out infinite,
              heroGoldPathB 15.2s ease-in-out infinite;
          }

          /* Feathered Mask on the Right Photo so its Background Melts Into the Banner */
          .rw-hero-photo-blend {
            -webkit-mask-image: linear-gradient(
              90deg,
              transparent 0%,
              rgba(0, 0, 0, 0.45) 14%,
              #000 32%,
              #000 100%
            );
            mask-image: linear-gradient(
              90deg,
              transparent 0%,
              rgba(0, 0, 0, 0.45) 14%,
              #000 32%,
              #000 100%
            );
          }

          /* LIVE LIQUID-GOLD FLOWING COLOUR INSIDE THE HERO TITLE */
          .rw-hero-live-title {
            background-image: linear-gradient(
              105deg,
              #FFFBEB 0%,
              #FDE047 16%,
              #EA9A1C 32%,
              #FFFFFF 48%,
              #F59E0B 64%,
              #FDBA74 80%,
              #FFFBEB 100%
            );
            background-size: 280% 100%;
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
            animation: heroTitleLiquidGold 6.2s ease-in-out infinite;
            filter:
              drop-shadow(0 3px 10px rgba(18, 8, 2, 0.85))
              drop-shadow(0 0 18px rgba(250, 204, 21, 0.34));
          }

          /* ===================================================================
             2. 4 DENSE LIVE-BORDER KPI CARDS
                - Total: Normal Dark Base + Dense White/Platinum Live Border
                - Gold: Smooth Live Random Gold Base + Dense Gold Live Border
                - Silver: Smooth Live Random Silver Base + Dense Silver Live Border
                - Bronze: Smooth Live Random Bronze Base + Dense Bronze Live Border
          =================================================================== */
          .rw-kpi-card {
            position: relative;
            isolation: isolate;
            overflow: hidden;
            border-radius: 1.25rem;
            border: 3.2px solid transparent;
            background-clip: padding-box, border-box, border-box, border-box;
            background-origin: border-box, border-box, border-box, border-box;
            background-size: 240% 240%, 100% 100%, 100% 100%, 100% 100%;
            transition: transform 0.24s cubic-bezier(0.22, 1, 0.36, 1),
              box-shadow 0.24s ease;
          }
          .rw-kpi-card:hover {
            transform: translateY(-4px);
          }

          /* KPI 1: TOTAL — Normal Dark Interior + Dense Live White/Platinum Border */
          .rw-kpi-total {
            background-image:
              linear-gradient(155deg, #10121F 0%, #090A13 56%, #05060C 100%),
              radial-gradient(ellipse 50% 56% at var(--rx1) var(--ry1), #FFFFFF 0%, rgba(255, 255, 255, 0.85) 28%, transparent 66%),
              radial-gradient(ellipse 56% 60% at var(--rx2) var(--ry2), #F8FAFC 0%, rgba(203, 213, 225, 0.72) 34%, transparent 68%),
              linear-gradient(135deg, #E2E8F0 0%, #64748B 36%, #FFFFFF 68%, #94A3B8 100%);
            animation:
              rwRandA1 11.4s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite,
              rwRandB1 16.2s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite;
            box-shadow:
              0 16px 36px rgba(0, 0, 0, 0.85),
              0 0 24px -6px rgba(255, 255, 255, 0.38),
              inset 0 1px 1.5px rgba(255, 255, 255, 0.25);
          }
          .rw-kpi-total:hover {
            box-shadow: 0 22px 44px rgba(0, 0, 0, 0.92), 0 0 34px -4px rgba(255, 255, 255, 0.58);
          }

          /* KPI 2: GOLD — Smooth Random Live Gold Base + Dense Live 24K Gold Border */
          .rw-kpi-gold {
            background-image:
              linear-gradient(125deg, #4A3006 0%, #2B1B04 42%, #1C1203 72%, #593A08 100%),
              radial-gradient(ellipse 50% 56% at var(--rx1) var(--ry1), #FFFFFF 0%, #FEF08A 26%, transparent 66%),
              radial-gradient(ellipse 56% 60% at var(--rx2) var(--ry2), #FDE047 0%, #D97706 34%, transparent 68%),
              linear-gradient(135deg, #FEF08A 0%, #92400E 36%, #FACC15 70%, #B45309 100%);
            animation:
              kpiBaseFluid 11s ease-in-out infinite,
              rwRandA2 12.6s cubic-bezier(0.45, 0.05, 0.55, 0.95) -2.4s infinite,
              rwRandB2 17.8s cubic-bezier(0.45, 0.05, 0.55, 0.95) -5.2s infinite;
            box-shadow:
              0 16px 36px rgba(0, 0, 0, 0.85),
              0 0 28px -6px rgba(250, 204, 21, 0.5),
              inset 0 1px 1.5px rgba(254, 249, 195, 0.34);
          }
          .rw-kpi-gold::before {
            content: "";
            position: absolute;
            inset: 0;
            pointer-events: none;
            z-index: 0;
            mix-blend-mode: screen;
            background-image:
              radial-gradient(ellipse 84% 96% at var(--rx1) var(--ry1), rgba(254, 240, 138, 0.36) 0%, rgba(234, 179, 8, 0.18) 38%, transparent 72%),
              radial-gradient(ellipse 76% 86% at var(--rx2) var(--ry2), rgba(245, 158, 11, 0.28) 0%, transparent 68%);
          }
          .rw-kpi-gold:hover {
            box-shadow: 0 22px 44px rgba(0, 0, 0, 0.92), 0 0 38px -4px rgba(253, 224, 71, 0.68);
          }

          /* KPI 3: SILVER — Smooth Random Live Silver Base + Dense Live Silver Border */
          .rw-kpi-silver {
            background-image:
              linear-gradient(125deg, #2D384B 0%, #1B2332 42%, #121824 72%, #39465C 100%),
              radial-gradient(ellipse 50% 56% at var(--rx1) var(--ry1), #FFFFFF 0%, #E2E8F0 28%, transparent 66%),
              radial-gradient(ellipse 56% 60% at var(--rx2) var(--ry2), #CBD5E1 0%, #64748B 36%, transparent 68%),
              linear-gradient(135deg, #F8FAFC 0%, #475569 36%, #CBD5E1 70%, #94A3B8 100%);
            animation:
              kpiBaseFluid 12.2s ease-in-out -3.8s infinite,
              rwRandA3 11.8s cubic-bezier(0.45, 0.05, 0.55, 0.95) -4.6s infinite,
              rwRandB3 16.9s cubic-bezier(0.45, 0.05, 0.55, 0.95) -2.1s infinite;
            box-shadow:
              0 16px 36px rgba(0, 0, 0, 0.85),
              0 0 26px -6px rgba(203, 213, 225, 0.45),
              inset 0 1px 1.5px rgba(248, 250, 252, 0.34);
          }
          .rw-kpi-silver::before {
            content: "";
            position: absolute;
            inset: 0;
            pointer-events: none;
            z-index: 0;
            mix-blend-mode: screen;
            background-image:
              radial-gradient(ellipse 84% 96% at var(--rx1) var(--ry1), rgba(241, 245, 249, 0.34) 0%, rgba(148, 163, 184, 0.18) 38%, transparent 72%),
              radial-gradient(ellipse 76% 86% at var(--rx2) var(--ry2), rgba(203, 213, 225, 0.26) 0%, transparent 68%);
          }
          .rw-kpi-silver:hover {
            box-shadow: 0 22px 44px rgba(0, 0, 0, 0.92), 0 0 36px -4px rgba(226, 232, 240, 0.65);
          }

          /* KPI 4: BRONZE — Smooth Random Live Bronze Base + Dense Live Bronze Border */
          .rw-kpi-bronze {
            background-image:
              linear-gradient(125deg, #4F230D 0%, #321508 42%, #220E05 72%, #632C11 100%),
              radial-gradient(ellipse 50% 56% at var(--rx1) var(--ry1), #FFF7ED 0%, #FDBA74 28%, transparent 66%),
              radial-gradient(ellipse 56% 60% at var(--rx2) var(--ry2), #FB923C 0%, #C2410C 36%, transparent 68%),
              linear-gradient(135deg, #FED7AA 0%, #7C2D12 36%, #FB923C 70%, #9A3412 100%);
            animation:
              kpiBaseFluid 11.6s ease-in-out -6.5s infinite,
              rwRandA4 13.1s cubic-bezier(0.45, 0.05, 0.55, 0.95) -7.1s infinite,
              rwRandB4 18.4s cubic-bezier(0.45, 0.05, 0.55, 0.95) -8.5s infinite;
            box-shadow:
              0 16px 36px rgba(0, 0, 0, 0.85),
              0 0 26px -6px rgba(234, 88, 12, 0.48),
              inset 0 1px 1.5px rgba(255, 237, 213, 0.34);
          }
          .rw-kpi-bronze::before {
            content: "";
            position: absolute;
            inset: 0;
            pointer-events: none;
            z-index: 0;
            mix-blend-mode: screen;
            background-image:
              radial-gradient(ellipse 84% 96% at var(--rx1) var(--ry1), rgba(254, 215, 170, 0.36) 0%, rgba(234, 88, 12, 0.2) 38%, transparent 72%),
              radial-gradient(ellipse 76% 86% at var(--rx2) var(--ry2), rgba(251, 146, 60, 0.28) 0%, transparent 68%);
          }
          .rw-kpi-bronze:hover {
            box-shadow: 0 22px 44px rgba(0, 0, 0, 0.92), 0 0 36px -4px rgba(251, 146, 60, 0.68);
          }

          /* ===================================================================
             3. 15 MEDAL TABS — NOTICEABLE LIVE TIER-MATCHED BORDERS
          =================================================================== */
          .medal-tier-tab {
            position: relative;
            isolation: isolate;
            overflow: hidden;
            border-radius: 1.25rem;
            border: 2px solid transparent;
            background-clip: padding-box, border-box, border-box, border-box;
            background-origin: border-box, border-box, border-box, border-box;
            transition: transform 0.24s cubic-bezier(0.22, 1, 0.36, 1),
              box-shadow 0.24s ease;
          }
          .medal-tier-tab:hover {
            transform: translateY(-4px);
          }

          .medal-tab-gold {
            background-image:
              linear-gradient(170deg, #17120A 0%, #0C0A12 56%, #07060C 100%),
              radial-gradient(ellipse 52% 56% at var(--rx1) var(--ry1), #FFFFFF 0%, #FEF08A 26%, transparent 66%),
              radial-gradient(ellipse 58% 60% at var(--rx2) var(--ry2), #FACC15 0%, #B45309 34%, transparent 68%),
              linear-gradient(135deg, rgba(250, 204, 21, 0.65) 0%, rgba(120, 74, 14, 0.42) 50%, rgba(254, 240, 138, 0.65) 100%);
            animation:
              rwRandA2 13.5s ease-in-out infinite,
              rwRandB2 18.8s ease-in-out infinite;
            box-shadow: 0 12px 30px rgba(0, 0, 0, 0.8), 0 0 20px -6px rgba(245, 196, 81, 0.34);
          }
          .medal-tab-gold:hover {
            box-shadow: 0 18px 38px rgba(0, 0, 0, 0.9), 0 0 28px -4px rgba(250, 204, 21, 0.56);
          }

          .medal-tab-silver {
            background-image:
              linear-gradient(170deg, #121722 0%, #0B0D16 56%, #07080E 100%),
              radial-gradient(ellipse 52% 56% at var(--rx1) var(--ry1), #FFFFFF 0%, #E2E8F0 26%, transparent 66%),
              radial-gradient(ellipse 58% 60% at var(--rx2) var(--ry2), #CBD5E1 0%, #64748B 36%, transparent 68%),
              linear-gradient(135deg, rgba(226, 232, 240, 0.62) 0%, rgba(71, 85, 105, 0.42) 50%, rgba(248, 250, 252, 0.62) 100%);
            animation:
              rwRandA3 14.2s ease-in-out -3.4s infinite,
              rwRandB3 19.4s ease-in-out -6.2s infinite;
            box-shadow: 0 12px 30px rgba(0, 0, 0, 0.8), 0 0 20px -6px rgba(203, 213, 225, 0.3);
          }
          .medal-tab-silver:hover {
            box-shadow: 0 18px 38px rgba(0, 0, 0, 0.9), 0 0 28px -4px rgba(226, 232, 240, 0.52);
          }

          .medal-tab-bronze {
            background-image:
              linear-gradient(170deg, #1A100B 0%, #0D0910 56%, #07060B 100%),
              radial-gradient(ellipse 52% 56% at var(--rx1) var(--ry1), #FFF7ED 0%, #FDBA74 28%, transparent 66%),
              radial-gradient(ellipse 58% 60% at var(--rx2) var(--ry2), #FB923C 0%, #9A3412 36%, transparent 68%),
              linear-gradient(135deg, rgba(251, 146, 60, 0.62) 0%, rgba(124, 45, 18, 0.42) 50%, rgba(253, 186, 116, 0.62) 100%);
            animation:
              rwRandA4 13.8s ease-in-out -5.8s infinite,
              rwRandB4 18.9s ease-in-out -2.9s infinite;
            box-shadow: 0 12px 30px rgba(0, 0, 0, 0.8), 0 0 20px -6px rgba(234, 88, 12, 0.32);
          }
          .medal-tab-bronze:hover {
            box-shadow: 0 18px 38px rgba(0, 0, 0, 0.9), 0 0 28px -4px rgba(251, 146, 60, 0.54);
          }

          /* ===================================================================
             4. GLASSY HORIZONTAL BOTTOM CARDS (FEATURED & AVERAGE / POPULAR)
          =================================================================== */
          .glassy-vault-card {
            position: relative;
            overflow: hidden;
            background: linear-gradient(
              140deg,
              rgba(255, 255, 255, 0.085) 0%,
              rgba(24, 21, 38, 0.62) 42%,
              rgba(10, 9, 18, 0.84) 100%
            );
            backdrop-filter: blur(22px);
            -webkit-backdrop-filter: blur(22px);
            border: 1.6px solid rgba(254, 240, 138, 0.42);
            box-shadow:
              0 18px 42px rgba(0, 0, 0, 0.78),
              inset 0 1.5px 1px rgba(255, 255, 255, 0.28),
              inset 0 -1px 2px rgba(250, 204, 21, 0.14);
            transition: transform 0.24s cubic-bezier(0.22, 1, 0.36, 1),
              border-color 0.24s ease, box-shadow 0.24s ease;
          }
          .glassy-vault-card::before {
            content: "";
            position: absolute;
            top: 0;
            left: -20%;
            width: 65%;
            height: 100%;
            pointer-events: none;
            background: linear-gradient(
              115deg,
              rgba(255, 255, 255, 0.12) 0%,
              rgba(255, 255, 255, 0.03) 45%,
              transparent 65%
            );
          }
          .glassy-vault-card:hover {
            transform: translateY(-3px);
            border-color: rgba(254, 240, 138, 0.82);
            box-shadow:
              0 22px 48px rgba(0, 0, 0, 0.88),
              0 0 30px -6px rgba(245, 196, 81, 0.36),
              inset 0 1.5px 2px rgba(255, 255, 255, 0.42);
          }

          .btn-vault-gold {
            background: linear-gradient(180deg, #FEF08A 0%, #EAB308 55%, #B45309 100%);
            border: 1.5px solid #FFFBEB;
            color: #120B03;
            box-shadow: 0 6px 18px rgba(234, 179, 8, 0.42), inset 0 1px 1px #FFFFFF;
            transition: transform 0.16s ease, filter 0.16s ease;
          }
          .btn-vault-gold:hover {
            filter: brightness(1.06);
            transform: translateY(-1px);
          }
        `}</style>

        {/* ===================================================================
            1. PREMIUM HERO BANNER (COLOR-MATCHED STUDIO BACKGROUND + LIVE
               LIQUID-GOLD TITLE + SEAMLESS RIGHT TROPHY & MEDALS SHOWCASE)
        =================================================================== */}
        <header className="rw-hero-shell grid grid-cols-1 lg:grid-cols-12 items-stretch min-h-[164px] lg:h-[178px]">
          {/* Soft Warm Studio Lighting Behind Left Text */}
          <div className="rw-hero-studio-glow" aria-hidden="true" />

          {/* Live Golden Shining Border — Strictly Masked Off the Right Photo */}
          <div className="rw-hero-border-mask" aria-hidden="true">
            <div className="rw-hero-live-gold-rim" />
          </div>

          {/* LEFT 7 COLS: LIVE-COLOUR EDITORIAL TITLE + WARM GLASSY BALANCE POD */}
          <div className="lg:col-span-7 px-5 py-3.5 sm:px-6 sm:py-4 flex flex-col justify-between space-y-2.5 relative z-20">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[9.5px] font-black uppercase tracking-[0.22em] bg-[#6B1222]/85 text-[#FEF08A] border border-amber-300/55 shadow-[0_4px_14px_rgba(0,0,0,0.45)]">
                  OFFICIAL ACHIEVEMENT VAULT
                </span>
                <span className="px-2 py-0.5 rounded-full text-[9.5px] font-extrabold bg-[#1E1109]/80 text-amber-100 border border-amber-300/35 inline-flex items-center gap-1.5 backdrop-blur-md">
                  <span
                    className={`w-1.5 h-1.5 rounded-full bg-emerald-400 ${
                      checking ? "animate-ping" : ""
                    }`}
                  />
                  <span>
                    {lastSynced ? `Verified ${lastSynced}` : "Rule Engine Active"}
                  </span>
                </span>
              </div>

              {/* Title with Live Flowing Metallic Gold & Bronze Colour Inside */}
              <h1 className="font-vault-serif rw-hero-live-title text-2xl sm:text-3xl lg:text-[36px] font-black tracking-tight leading-[1.08]">
                Rewards
              </h1>

              <p className="text-[11.5px] sm:text-xs text-[#F7ECE0] font-medium max-w-md leading-snug drop-shadow-[0_1px_4px_rgba(0,0,0,0.75)]">
                Unlock luminous Gold, Silver, and Bronze medals automatically as
                you master modules, sustain streaks, and grow your Curo treasury.
              </p>
            </div>

            {/* Warm Mahogany-Glass Curo Balance Pod + Gold Sync Button */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="bg-[#1A0E07]/75 backdrop-blur-xl border border-amber-300/45 rounded-xl px-3.5 py-1.5 flex items-center gap-3.5 shadow-[0_8px_20px_rgba(0,0,0,0.5)]">
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-amber-200/80 block">
                    Curo Balance
                  </span>
                  <span className="text-sm font-black font-mono text-[#FEF08A]">
                    {userMetrics.curos} Curos
                  </span>
                </div>
                <div className="h-5 w-px bg-amber-300/25" />
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-amber-200/80 block">
                    Unlocked
                  </span>
                  <span className="text-sm font-black font-mono text-white">
                    {kpiStats.total} / {REWARDS_BADGES.length}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={checkLiveUserBadges}
                className="btn-vault-gold px-3.5 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider inline-flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${checking ? "animate-spin" : ""}`}
                />
                <span>{checking ? "Verifying..." : "Check for New"}</span>
              </button>
            </div>
          </div>

          {/* RIGHT 5 COLS: FULL UNCROPPED GOLDEN TROPHY & MEDALS STUDIO SCENE */}
          <div className="lg:col-span-5 relative z-10 flex items-center justify-end overflow-hidden h-[168px] lg:h-full">
            {!heroImgErr ? (
              <img
                src={heroImageSrc}
                alt="Golden Trophy and Medal Collection"
                onError={() => setHeroImgErr(true)}
                className="rw-hero-photo-blend h-full w-auto max-w-full object-contain object-right ml-auto block select-none brightness-105 contrast-105"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center p-3">
                <BrightShiningMedal
                  badge={REWARDS_BADGES[0]}
                  size={110}
                  delayIdx={0}
                />
              </div>
            )}
          </div>
        </header>

        {/* ===================================================================
            2. 4 DENSE LIVE-BORDER KPI CARDS (WHITE / GOLD / SILVER / BRONZE)
        =================================================================== */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              id: "all",
              label: "TOTAL MEDALS",
              value: kpiStats.total,
              sub: `${kpiStats.total} of 15 Medals Unlocked`,
              cardCls: "rw-kpi-total",
              labelCls: "text-white",
              valCls: "text-white",
              barCls: "from-slate-300 via-white to-slate-200",
              barWidth: `${Math.max(8, Math.round((kpiStats.total / 15) * 100))}%`,
              sampleBadge: REWARDS_BADGES[0],
            },
            {
              id: "gold",
              label: "GOLD TIER",
              value: kpiStats.gold,
              sub: `${kpiStats.gold} of 5 Sovereign Gold`,
              cardCls: "rw-kpi-gold",
              labelCls: "text-amber-100",
              valCls: "text-[#FEF08A]",
              barCls: "from-amber-400 via-yellow-200 to-white",
              barWidth: `${Math.max(8, Math.round((kpiStats.gold / 5) * 100))}%`,
              sampleBadge: REWARDS_BADGES[4],
            },
            {
              id: "silver",
              label: "SILVER TIER",
              value: kpiStats.silver,
              sub: `${kpiStats.silver} of 5 Sterling Silver`,
              cardCls: "rw-kpi-silver",
              labelCls: "text-slate-100",
              valCls: "text-white",
              barCls: "from-slate-300 via-slate-100 to-white",
              barWidth: `${Math.max(8, Math.round((kpiStats.silver / 5) * 100))}%`,
              sampleBadge: REWARDS_BADGES[5],
            },
            {
              id: "bronze",
              label: "BRONZE TIER",
              value: kpiStats.bronze,
              sub: `${kpiStats.bronze} of 5 Burnished Bronze`,
              cardCls: "rw-kpi-bronze",
              labelCls: "text-orange-100",
              valCls: "text-orange-200",
              barCls: "from-orange-500 via-amber-300 to-orange-100",
              barWidth: `${Math.max(8, Math.round((kpiStats.bronze / 5) * 100))}%`,
              sampleBadge: REWARDS_BADGES[10],
            },
          ].map((card, idx) => {
            const isSelected = tierFilter === card.id && card.id !== "all";
            return (
              <div
                key={card.id}
                onClick={() =>
                  setTierFilter(tierFilter === card.id ? "all" : card.id)
                }
                className={`rw-kpi-card ${card.cardCls} ${
                  isSelected ? "ring-2 ring-white" : ""
                } cursor-pointer group p-4 sm:p-5 flex flex-col justify-between space-y-3.5 select-none`}
              >
                <div className="relative z-10 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <span
                      className={`text-[11px] font-black uppercase tracking-[0.16em] block drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] ${card.labelCls}`}
                    >
                      {card.label}
                    </span>
                    <span
                      className={`text-4xl font-black font-mono mt-1.5 block leading-none drop-shadow-[0_3px_10px_rgba(0,0,0,0.9)] ${card.valCls}`}
                    >
                      {card.value}
                    </span>
                    <span className="text-xs font-semibold text-slate-100/90 mt-1.5 block truncate drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]">
                      {card.sub}
                    </span>
                  </div>

                  <div className="shrink-0">
                    <BrightShiningMedal
                      badge={card.sampleBadge}
                      size={66}
                      delayIdx={idx}
                    />
                  </div>
                </div>

                <div className="relative z-10 w-full h-1.5 rounded-full bg-black/60 border border-white/15 overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${card.barCls} transition-all duration-500`}
                    style={{ width: card.barWidth }}
                  />
                </div>
              </div>
            );
          })}
        </section>

        {/* ===================================================================
            3. EARNED BADGES STRIP (VISIBLE WHEN USER HAS UNLOCKED MEDALS)
        =================================================================== */}
        {earnedMedals.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center gap-2.5">
              <Crown className="w-4 h-4 text-amber-300" />
              <h2 className="text-base font-black text-white tracking-wide">
                Earned Badges
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-500/20 text-emerald-200 border border-emerald-400/50">
                {earnedMedals.length} Unlocked
              </span>
            </div>

            <div className="flex items-center gap-3.5 overflow-x-auto pb-2 pt-1">
              {earnedMedals.map((b, idx) => (
                <div
                  key={b.id}
                  onClick={() => setSelectedBadge(b)}
                  className={`medal-tier-tab ${
                    b.tier === "gold"
                      ? "medal-tab-gold"
                      : b.tier === "silver"
                      ? "medal-tab-silver"
                      : "medal-tab-bronze"
                  } group cursor-pointer shrink-0 flex items-center gap-3.5 px-4 py-3`}
                >
                  <BrightShiningMedal badge={b} size={58} delayIdx={idx} />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black text-white">
                        {b.name}
                      </span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <span className="text-xs font-black text-amber-200 font-mono block mt-0.5">
                      +{b.curos} Curos • Verified
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ===================================================================
            4. 5x3 MEDAL MATRIX — GOLD (TOP) -> SILVER (2ND) -> BRONZE (3RD)
        =================================================================== */}
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-300" />
              <h2 className="text-lg font-black text-white tracking-wide">
                Available to Earn
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {[
                "All",
                "Application",
                "Completion",
                "Curos",
                "Retention",
                "Streak",
              ].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                    categoryFilter === cat
                      ? "bg-amber-400 text-slate-950 shadow-[0_0_16px_rgba(245,158,11,0.45)]"
                      : "bg-[#11101C] text-slate-100 hover:text-amber-200 border border-white/20"
                  }`}
                >
                  {cat}
                </button>
              ))}

              {tierFilter !== "all" && (
                <button
                  type="button"
                  onClick={() => setTierFilter("all")}
                  className="px-3 py-1.5 rounded-xl text-xs font-extrabold bg-rose-500/25 text-rose-100 border border-rose-400/60 inline-flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Show All Tiers</span>
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {filteredBadges.map((badge, idx) => {
              const tabTierCls =
                badge.tier === "gold"
                  ? "medal-tab-gold"
                  : badge.tier === "silver"
                  ? "medal-tab-silver"
                  : "medal-tab-bronze";

              const tierLabelCls =
                badge.tier === "gold"
                  ? "text-amber-200"
                  : badge.tier === "silver"
                  ? "text-slate-100"
                  : "text-orange-200";

              const curosPillCls =
                badge.tier === "gold"
                  ? "bg-amber-400/20 text-amber-100 border-amber-300/60"
                  : badge.tier === "silver"
                  ? "bg-slate-200/20 text-white border-slate-300/55"
                  : "bg-orange-500/20 text-orange-100 border-orange-300/60";

              return (
                <div
                  key={badge.id}
                  onClick={() => setSelectedBadge(badge)}
                  className={`medal-tier-tab ${tabTierCls} group cursor-pointer p-4 flex flex-col items-center justify-between text-center min-h-[240px] select-none`}
                >
                  {/* Top Row: Clear Category & Tier / Unlocked Badge */}
                  <div className="w-full flex items-center justify-between text-[10.5px] font-black uppercase tracking-wider relative z-10">
                    <span className="text-slate-200">{badge.category}</span>
                    {badge.isEarned ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/25 text-emerald-200 border border-emerald-400/60 inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Unlocked</span>
                      </span>
                    ) : (
                      <span className={tierLabelCls}>{badge.tier}</span>
                    )}
                  </div>

                  {/* Bright, Luminous Medal Showcase */}
                  <div className="my-auto py-2 relative z-10">
                    <BrightShiningMedal
                      badge={badge}
                      size={104}
                      delayIdx={idx}
                    />
                  </div>

                  {/* Bottom Details: Crisp White Title, Progress Track & Curos Reward */}
                  <div className="w-full mt-1 space-y-2.5 relative z-10">
                    <h3 className="text-sm font-black text-white group-hover:text-amber-200 transition truncate">
                      {badge.name}
                    </h3>

                    <div className="w-full h-1.5 rounded-full bg-black/70 overflow-hidden border border-white/15">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          badge.isEarned
                            ? "bg-gradient-to-r from-emerald-400 to-teal-200"
                            : badge.tier === "gold"
                            ? "bg-gradient-to-r from-amber-500 via-yellow-300 to-white"
                            : badge.tier === "silver"
                            ? "bg-gradient-to-r from-slate-300 via-slate-100 to-white"
                            : "bg-gradient-to-r from-orange-600 via-amber-400 to-orange-100"
                        }`}
                        style={{
                          width: `${Math.max(8, badge.progressPct)}%`,
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-md text-[10.5px] font-black font-mono border ${curosPillCls}`}
                      >
                        +{badge.curos} Curos
                      </span>
                      <span className="text-[11px] font-extrabold text-slate-100 font-mono">
                        {badge.currentProgress} / {badge.target}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ===================================================================
            5. BOTTOM HORIZONTAL GLASSY ROW (BADGE GALLERY REMOVED)
               LEFT: FEATURED BADGE | RIGHT: AVERAGE PROGRESS & MOST POPULAR
        =================================================================== */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch pb-4">
          {/* LEFT GLASSY CARD: FEATURED BADGE */}
          <div
            onClick={() => setSelectedBadge(featuredBadge || enrichedBadges[0])}
            className="glassy-vault-card cursor-pointer rounded-3xl p-6 flex items-center justify-between gap-4 group"
          >
            <div className="relative z-10 space-y-2 min-w-0">
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-200 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-300" />
                <span>Featured Badge</span>
              </span>

              {featuredBadge ? (
                <>
                  <h3 className="text-xl font-black text-white truncate">
                    {featuredBadge.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-emerald-200 font-bold">
                    Unlocked &amp; Verified in Your Profile
                  </p>
                  <span className="inline-block px-3.5 py-1 rounded-full text-xs font-black font-mono bg-amber-400/20 text-amber-100 border border-amber-300/60">
                    +{featuredBadge.curos} Curos Reward
                  </span>
                </>
              ) : (
                <>
                  <h3 className="text-xl font-black text-white truncate">
                    {nearestMilestone.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-100 font-medium">
                    Next Featured Unlock • Need{" "}
                    <strong className="text-amber-200">
                      {nearestMilestone.remaining} {nearestMilestone.unit}
                    </strong>
                  </p>
                  <span className="inline-block px-3.5 py-1 rounded-full text-xs font-black font-mono bg-amber-400/20 text-amber-100 border border-amber-300/60">
                    +{nearestMilestone.curos} Curos Reward
                  </span>
                </>
              )}
            </div>

            <div className="relative z-10 shrink-0">
              <BrightShiningMedal
                badge={featuredBadge || nearestMilestone}
                size={100}
                delayIdx={1}
              />
            </div>
          </div>

          {/* RIGHT GLASSY CARD: AVERAGE PROGRESS & MOST POPULAR */}
          <div
            onClick={() => setSelectedBadge(mostPopularBadge)}
            className="glassy-vault-card cursor-pointer rounded-3xl p-6 flex items-center justify-between gap-4 group"
          >
            <div className="relative z-10 space-y-2.5 flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-cyan-200 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-cyan-300" />
                  <span>Vault Average &amp; Most Popular</span>
                </span>
              </div>

              <h3 className="text-xl font-black text-white truncate">
                {mostPopularBadge.name}
              </h3>

              <div className="space-y-1.5 max-w-xs">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-200">Average Medal Progress</span>
                  <span className="text-amber-200 font-mono font-black">
                    {kpiStats.avgProgress}%
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-black/65 border border-white/15 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-amber-300 to-yellow-200 transition-all duration-500"
                    style={{ width: `${Math.max(8, kpiStats.avgProgress)}%` }}
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-0.5">
                <span className="px-3 py-1 rounded-full text-xs font-black font-mono bg-amber-400/20 text-amber-100 border border-amber-300/60">
                  +{mostPopularBadge.curos} Curos
                </span>
                <span className="text-xs font-bold text-slate-200">
                  Target: {mostPopularBadge.target} {mostPopularBadge.unit}
                </span>
              </div>
            </div>

            <div className="relative z-10 shrink-0">
              <BrightShiningMedal
                badge={mostPopularBadge}
                size={100}
                delayIdx={3}
              />
            </div>
          </div>
        </section>

        {/* ===================================================================
            6. UP-CLOSE MEDAL INSPECTION MODAL
        =================================================================== */}
        {selectedBadge && (
          <div
            onClick={() => setSelectedBadge(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md bg-[#0C0A15] border-2 border-amber-300/75 rounded-3xl p-6 text-center shadow-[0_0_85px_rgba(245,158,11,0.35)] overflow-hidden"
            >
              <button
                type="button"
                onClick={() => setSelectedBadge(null)}
                className="absolute top-4 right-4 w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="my-4 flex justify-center">
                <BrightShiningMedal
                  badge={selectedBadge}
                  size={170}
                  delayIdx={0}
                />
              </div>

              <h2 className="font-vault-serif text-2xl font-black text-white tracking-tight">
                {selectedBadge.name}
              </h2>
              <span className="inline-block mt-1.5 px-3.5 py-0.5 rounded-full text-xs font-black font-mono bg-amber-400/20 text-amber-100 border border-amber-300/60">
                +{selectedBadge.curos} Curos Reward
              </span>

              <p className="text-xs sm:text-sm text-slate-100 mt-3 leading-relaxed font-medium">
                {selectedBadge.ruleText}
              </p>

              <div className="grid grid-cols-3 gap-2 my-4 text-xs">
                <div className="p-2.5 rounded-xl bg-[#07060C] border border-white/20">
                  <span className="text-[10px] text-slate-300 block">
                    Category
                  </span>
                  <span className="font-extrabold text-white">
                    {selectedBadge.category}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#07060C] border border-white/20">
                  <span className="text-[10px] text-slate-300 block">Tier</span>
                  <span className="font-extrabold text-amber-200 uppercase">
                    {selectedBadge.tier}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#07060C] border border-white/20">
                  <span className="text-[10px] text-slate-300 block">
                    Progress
                  </span>
                  <span className="font-extrabold text-cyan-200 font-mono">
                    {selectedBadge.currentProgress} / {selectedBadge.target}
                  </span>
                </div>
              </div>

              <div
                className={`p-3 rounded-2xl border text-xs font-bold mb-5 flex items-center justify-center gap-2 ${
                  selectedBadge.isEarned
                    ? "bg-emerald-500/18 border-emerald-400/55 text-emerald-100"
                    : "bg-amber-500/15 border-amber-300/50 text-amber-100"
                }`}
              >
                {selectedBadge.isEarned ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
                    <span>Milestone Completed! Medal Unlocked.</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 text-amber-300 shrink-0" />
                    <span>
                      Complete {selectedBadge.remaining} more{" "}
                      {selectedBadge.unit} to unlock automatically.
                    </span>
                  </>
                )}
              </div>

              <button
                type="button"
                onClick={() => setSelectedBadge(null)}
                className="btn-vault-gold w-full py-2.5 rounded-xl font-black text-xs uppercase tracking-wider cursor-pointer"
              >
                Close View
              </button>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
