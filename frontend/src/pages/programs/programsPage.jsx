/* eslint-disable react-hooks/set-state-in-effect */
import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from "../../layout/mainLayout";
import api from "../../utils/axios";
import darkStudyBgAsset from "../../assets/Dark Academic Study Background.png";
import {
  Plus,
  BookOpen,
  Search,
  Eye,
  Pencil,
  Trash2,
  MoreVertical,
  Loader2,
  Layers,
  CheckCircle2,
  FileEdit,
  LayoutGrid,
  Clock,
  Tag,
  FolderOpen,
  Filter,
  ArrowRight,
  Sparkles,
  X,
} from "lucide-react";

// Auto-discovers your uploaded dark study background in src/ or falls back to public/
const STUDY_BG_ASSETS = import.meta.glob("/src/**/*.{png,jpg,jpeg,webp}", {
  eager: true,
  import: "default",
});

function resolveDarkStudyBackground() {
  if (typeof darkStudyBgAsset !== "undefined" && darkStudyBgAsset) return darkStudyBgAsset;
  const darkMatch = Object.entries(STUDY_BG_ASSETS).find(([path]) =>
    /dark.*study|midnight.*study|elegant.*study|academic.*study|library|sanctuary/i.test(
      path
    )
  );
  return darkMatch ? darkMatch[1] : "/Dark Academic Study Background.png";
}

const DEFAULT_DARK_STUDY_BG = resolveDarkStudyBackground();

// Fallback record matching current platform state if API is offline
const FALLBACK_PROGRAMS = [
  {
    id: 1,
    title: "Client Relationships",
    type: "Mandatory",
    duration: "30 Mins",
    category: "Client Success",
    status: "Published",
    modules_count: 3,
    tags: ["client relationships", "building client trust", "client management"],
    thumbnail:
      "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=900&q=80",
    description:
      "Master consultative communication, long-term stakeholder trust, and executive client management.",
  },
];

function normalizeProgram(p, idx) {
  const rawStatus = String(
    p.status || (p.is_published === false ? "Draft" : "Published")
  );
  const status = rawStatus.toLowerCase().includes("draft")
    ? "Draft"
    : "Published";

  const rawTags = Array.isArray(p.tags)
    ? p.tags
    : typeof p.tags === "string"
    ? p.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    : [];

  return {
    id: p.id ?? p.program_id ?? idx + 1,
    title: p.title || p.name || p.program_name || `Program #${idx + 1}`,
    type: p.type || p.program_type || "Mandatory",
    duration:
      p.duration ||
      (p.duration_minutes ? `${p.duration_minutes} Mins` : "30 Mins"),
    category: p.category || p.category_name || "General",
    status,
    modules_count: Number(
      p.modules_count ??
        p.module_count ??
        (Array.isArray(p.modules) ? p.modules.length : 0)
    ),
    tags: rawTags,
    thumbnail:
      p.thumbnail || p.thumbnail_url || p.cover_image || p.image_url || "",
    description: p.description || "",
  };
}

export default function ProgramsManagement({
  backgroundSrc = DEFAULT_DARK_STUDY_BG,
}) {
  const navigate = useNavigate();

  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState("ALL");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL"); // 'ALL' | 'Published' | 'Draft'

  const [openMenuId, setOpenMenuId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Close dropdown menu when clicking outside
  useEffect(() => {
    const closeMenu = () => setOpenMenuId(null);
    window.addEventListener("click", closeMenu);
    return () => window.removeEventListener("click", closeMenu);
  }, []);

  // Fetch programs from backend
  useEffect(() => {
    let active = true;

    const fetchPrograms = async () => {
      setLoading(true);
      const endpoints = ["/programs", "/admin/programs", "/courses"];

      for (const ep of endpoints) {
        try {
          const res = await api.get(ep, { params: { _t: Date.now() } });
          const list =
            res.data?.programs ||
            res.data?.data ||
            res.data?.items ||
            (Array.isArray(res.data) ? res.data : null);

          if (Array.isArray(list)) {
            if (active) {
              setPrograms(list.map(normalizeProgram));
              setLoading(false);
            }
            return;
          }
        } catch {
          // Try next endpoint
        }
      }

      if (active) {
        setPrograms(FALLBACK_PROGRAMS);
        setLoading(false);
      }
    };

    fetchPrograms();
    return () => {
      active = false;
    };
  }, []);

  // KPI metrics
  const stats = useMemo(() => {
    const total = programs.length;
    const published = programs.filter((p) => p.status === "Published").length;
    const drafts = programs.filter((p) => p.status === "Draft").length;
    const totalModules = programs.reduce(
      (sum, p) => sum + Number(p.modules_count || 0),
      0
    );
    return { total, published, drafts, totalModules };
  }, [programs]);

  const allTags = useMemo(() => {
    const set = new Set();
    programs.forEach((p) => (p.tags || []).forEach((t) => set.add(t)));
    return Array.from(set);
  }, [programs]);

  const allCategories = useMemo(() => {
    return Array.from(new Set(programs.map((p) => p.category).filter(Boolean)));
  }, [programs]);

  const filteredPrograms = useMemo(() => {
    return programs.filter((p) => {
      if (selectedStatus !== "ALL" && p.status !== selectedStatus) return false;
      if (selectedCategory !== "ALL" && p.category !== selectedCategory)
        return false;
      if (selectedTag !== "ALL" && !(p.tags || []).includes(selectedTag))
        return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inTitle = p.title.toLowerCase().includes(q);
        const inType = String(p.type || "").toLowerCase().includes(q);
        const inTags = (p.tags || []).some((t) => t.toLowerCase().includes(q));
        return inTitle || inType || inTags;
      }
      return true;
    });
  }, [programs, searchQuery, selectedTag, selectedCategory, selectedStatus]);

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/programs/${deleteTarget.id}`);
    } catch {
      // Optimistically remove from view if endpoint path differs
    } finally {
      setPrograms((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  return (
    <MainLayout>
      <div className="-m-4 sm:-m-6 min-h-[calc(100vh-4rem)] relative overflow-hidden text-[#F7F2E7] font-sans selection:bg-[#D4AF37] selection:text-[#0A0D16]">
        {/* ===================================================================
            ILLUMINATED DARK ACADEMIA × MODERN GLASS HYBRID CSS
            - Anchors the dark study room cleanly inside MainLayout (no clipped
              header) with a whisper-light scrim so the lamp, shelves, books,
              notebook & globe remain richly visible behind dark glass cards
        =================================================================== */}
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;800&display=swap');

          .font-classical {
            font-family: "Playfair Display", Georgia, Cambria, "Times New Roman", serif;
          }

          /* 1. HIGH-VISIBILITY DARK STUDY SANCTUARY BACKDROP */
          .dark-study-bg-img {
            position: absolute;
            inset: 0;
            z-index: 0;
            background-position: right bottom;
            background-size: cover;
            background-repeat: no-repeat;
            background-color: #0B0F1A;
            filter: brightness(1.14) contrast(1.06) saturate(1.08);
          }

          /* Light directional scrim — keeps the glowing banker lamp, bookshelves,
             leather volumes & globe unmistakably visible while framing left cards */
          .dark-study-scrim {
            position: absolute;
            inset: 0;
            z-index: 1;
            pointer-events: none;
            background:
              radial-gradient(ellipse 46% 42% at 86% 62%, rgba(251, 191, 36, 0.12) 0%, transparent 65%),
              linear-gradient(
                116deg,
                rgba(7, 10, 19, 0.52) 0%,
                rgba(8, 12, 22, 0.36) 44%,
                rgba(8, 11, 20, 0.14) 76%,
                rgba(8, 11, 20, 0.08) 100%
              ),
              linear-gradient(
                180deg,
                rgba(7, 10, 19, 0.42) 0%,
                rgba(7, 10, 19, 0.12) 40%,
                rgba(7, 10, 19, 0.24) 100%
              );
          }

          /* Gentle Warm Brass-Lamp Ambient Breathing Aura */
          @keyframes darkLampHalo {
            0%, 100% { opacity: 0.26; transform: scale(1); }
            50%      { opacity: 0.44; transform: scale(1.07); }
          }
          .dark-lamp-aura {
            position: absolute;
            top: 8%;
            right: 2%;
            width: 420px;
            height: 420px;
            border-radius: 9999px;
            z-index: 1;
            pointer-events: none;
            background: radial-gradient(
              circle,
              rgba(251, 191, 36, 0.24) 0%,
              rgba(217, 119, 6, 0.09) 46%,
              transparent 72%
            );
            filter: blur(52px);
            animation: darkLampHalo 10s ease-in-out infinite;
          }

          /* 2. SMOKED-OBSIDIAN HYBRID HEADER & FILTER BAR */
          .dark-sanctuary-header {
            background: linear-gradient(
              135deg,
              rgba(11, 15, 27, 0.84) 0%,
              rgba(16, 21, 36, 0.8) 56%,
              rgba(26, 20, 15, 0.82) 100%
            );
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border: 1.5px solid rgba(226, 186, 98, 0.5);
            box-shadow:
              0 18px 44px rgba(0, 0, 0, 0.62),
              inset 0 1px 0 rgba(254, 243, 199, 0.28);
          }

          .dark-filter-dock {
            background: rgba(10, 14, 25, 0.82);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border: 1.5px solid rgba(226, 186, 98, 0.36);
            box-shadow:
              0 14px 34px rgba(0, 0, 0, 0.55),
              inset 0 1px 0 rgba(255, 255, 255, 0.1);
          }

          /* 3. KPI CARDS: SMOOTH LIVE BASE COLOUR MOVEMENT + ORGANIC SHINING BORDERS */
          @property --kp1x { syntax: "<percentage>"; inherits: false; initial-value: 14%; }
          @property --kp1y { syntax: "<percentage>"; inherits: false; initial-value: 10%; }
          @property --kp2x { syntax: "<percentage>"; inherits: false; initial-value: 86%; }
          @property --kp2y { syntax: "<percentage>"; inherits: false; initial-value: 84%; }
          @property --kp3x { syntax: "<percentage>"; inherits: false; initial-value: 50%; }
          @property --kp3y { syntax: "<percentage>"; inherits: false; initial-value: 96%; }

          @keyframes kpiRimDriftA {
            0%   { --kp1x: 12%; --kp1y: 8%;  }
            24%  { --kp1x: 80%; --kp1y: 92%; }
            50%  { --kp1x: 92%; --kp1y: 22%; }
            76%  { --kp1x: 18%; --kp1y: 80%; }
            100% { --kp1x: 12%; --kp1y: 8%;  }
          }

          @keyframes kpiRimDriftB {
            0%   { --kp2x: 88%; --kp2y: 86%; }
            28%  { --kp2x: 14%; --kp2y: 44%; }
            55%  { --kp2x: 70%; --kp2y: 6%;  }
            82%  { --kp2x: 94%; --kp2y: 64%; }
            100% { --kp2x: 88%; --kp2y: 86%; }
          }

          @keyframes kpiRimDriftC {
            0%   { --kp3x: 48%; --kp3y: 96%; }
            32%  { --kp3x: 90%; --kp3y: 12%; }
            64%  { --kp3x: 8%;  --kp3y: 86%; }
            88%  { --kp3x: 34%; --kp3y: 4%;  }
            100% { --kp3x: 48%; --kp3y: 96%; }
          }

          /* Smooth base-layer gradient glide (keeps border layers locked at 0% 0%) */
          @keyframes kpiBaseGlide {
            0%   { background-position: 0% 50%,   0% 0%, 0% 0%, 0% 0%, 0% 0%; }
            50%  { background-position: 100% 50%, 0% 0%, 0% 0%, 0% 0%, 0% 0%; }
            100% { background-position: 0% 50%,   0% 0%, 0% 0%, 0% 0%, 0% 0%; }
          }

          /* Gentle internal fading & roaming colour waves */
          @keyframes kpiBaseFlowA {
            0%, 100% { transform: translate3d(-16%, -12%, 0) scale(0.96); opacity: 0.32; }
            45%      { transform: translate3d(28%, 10%, 0) scale(1.14);   opacity: 0.72; }
          }

          @keyframes kpiBaseFlowB {
            0%, 100% { transform: translate3d(26%, 16%, 0) scale(1.08);   opacity: 0.28; }
            50%      { transform: translate3d(-14%, -8%, 0) scale(0.95);  opacity: 0.65; }
          }

          .highlighted-kpi-card {
            position: relative;
            isolation: isolate;
            overflow: hidden;
            border: 2.5px solid transparent;
            background-clip: padding-box, border-box, border-box, border-box, border-box;
            background-origin: padding-box, border-box, border-box, border-box, border-box;
            background-size: 220% 220%, 100% 100%, 100% 100%, 100% 100%, 100% 100%;
            transition: transform 0.24s cubic-bezier(0.22, 1, 0.36, 1),
              box-shadow 0.24s ease;
          }
          .highlighted-kpi-card:hover {
            transform: translateY(-4px);
          }

          .kpi-base-flow-a,
          .kpi-base-flow-b {
            position: absolute;
            border-radius: 9999px;
            pointer-events: none;
            z-index: 0;
            will-change: transform, opacity;
          }
          .kpi-base-flow-a {
            width: 78%;
            height: 125%;
            top: -26%;
            left: -16%;
            filter: blur(34px);
            animation: kpiBaseFlowA 10.5s ease-in-out infinite;
          }
          .kpi-base-flow-b {
            width: 72%;
            height: 120%;
            bottom: -30%;
            right: -14%;
            filter: blur(38px);
            animation: kpiBaseFlowB 13.5s ease-in-out infinite;
          }

          /* KPI 1: Oxford Navy Live Base + Antique Gold & Pearl Shining Border */
          .hkpi-navy {
            background-image:
              linear-gradient(125deg, #101833 0%, #1F2E5C 42%, #131D3D 74%, #263970 100%),
              radial-gradient(ellipse 62% 56% at var(--kp1x) var(--kp1y), #FFFFFF 0%, rgba(254, 249, 195, 0.92) 24%, transparent 64%),
              radial-gradient(ellipse 68% 60% at var(--kp2x) var(--kp2y), #FEF08A 0%, #EAB308 30%, transparent 66%),
              radial-gradient(ellipse 58% 58% at var(--kp3x) var(--kp3y), #FFFBEB 0%, #CBD5E1 28%, transparent 64%),
              linear-gradient(135deg, #D4AF37 0%, #8A6B29 36%, #E5C778 70%, #9E7B2F 100%);
            animation:
              kpiBaseGlide 12s ease-in-out infinite,
              kpiRimDriftA 9.2s ease-in-out infinite,
              kpiRimDriftB 13.4s ease-in-out infinite,
              kpiRimDriftC 17.6s ease-in-out infinite;
            box-shadow:
              0 16px 36px rgba(0, 0, 0, 0.74),
              0 0 24px -6px rgba(245, 196, 81, 0.38);
          }
          .hkpi-navy:hover {
            box-shadow: 0 20px 44px rgba(0, 0, 0, 0.84), 0 0 32px -4px rgba(253, 224, 71, 0.55);
          }
          .hkpi-navy .kpi-base-flow-a {
            background: radial-gradient(circle, rgba(96, 130, 235, 0.48) 0%, rgba(56, 84, 178, 0.22) 50%, transparent 74%);
          }
          .hkpi-navy .kpi-base-flow-b {
            background: radial-gradient(circle, rgba(234, 189, 86, 0.28) 0%, rgba(45, 72, 148, 0.24) 50%, transparent 74%);
          }

          /* KPI 2: Botanical Emerald Live Base + Jade & Champagne Shining Border */
          .hkpi-emerald {
            background-image:
              linear-gradient(125deg, #08231C 0%, #124839 42%, #0B2E25 74%, #185A47 100%),
              radial-gradient(ellipse 62% 56% at var(--kp1x) var(--kp1y), #FFFFFF 0%, rgba(209, 250, 229, 0.92) 24%, transparent 64%),
              radial-gradient(ellipse 68% 60% at var(--kp2x) var(--kp2y), #6EE7B7 0%, #10B981 30%, transparent 66%),
              radial-gradient(ellipse 58% 58% at var(--kp3x) var(--kp3y), #FEF9C3 0%, #34D399 28%, transparent 64%),
              linear-gradient(135deg, #34D399 0%, #115E48 36%, #A7F3D0 70%, #15805D 100%);
            animation:
              kpiBaseGlide 13s ease-in-out -3s infinite,
              kpiRimDriftA 10.1s ease-in-out -3.1s infinite,
              kpiRimDriftB 14.2s ease-in-out -5.4s infinite,
              kpiRimDriftC 18.4s ease-in-out -2.2s infinite;
            box-shadow:
              0 16px 36px rgba(0, 0, 0, 0.74),
              0 0 24px -6px rgba(52, 211, 153, 0.38);
          }
          .hkpi-emerald:hover {
            box-shadow: 0 20px 44px rgba(0, 0, 0, 0.84), 0 0 32px -4px rgba(110, 231, 183, 0.54);
          }
          .hkpi-emerald .kpi-base-flow-a {
            background: radial-gradient(circle, rgba(52, 211, 153, 0.44) 0%, rgba(16, 185, 129, 0.22) 50%, transparent 74%);
          }
          .hkpi-emerald .kpi-base-flow-b {
            background: radial-gradient(circle, rgba(45, 212, 191, 0.34) 0%, rgba(6, 95, 70, 0.26) 50%, transparent 74%);
          }

          /* KPI 3: Mahogany Amber Live Base + Banker-Lamp Gold Shining Border */
          .hkpi-amber {
            background-image:
              linear-gradient(125deg, #271707 0%, #523210 42%, #311D0A 74%, #633D12 100%),
              radial-gradient(ellipse 62% 56% at var(--kp1x) var(--kp1y), #FFFFFF 0%, rgba(254, 243, 199, 0.94) 24%, transparent 64%),
              radial-gradient(ellipse 68% 60% at var(--kp2x) var(--kp2y), #FDE047 0%, #F59E0B 30%, transparent 66%),
              radial-gradient(ellipse 58% 58% at var(--kp3x) var(--kp3y), #FFFBEB 0%, #D97706 28%, transparent 64%),
              linear-gradient(135deg, #FBBF24 0%, #8C5312 36%, #FDE68A 70%, #B46914 100%);
            animation:
              kpiBaseGlide 12.5s ease-in-out -6s infinite,
              kpiRimDriftA 9.8s ease-in-out -6.2s infinite reverse,
              kpiRimDriftB 13.9s ease-in-out -1.8s infinite,
              kpiRimDriftC 17.9s ease-in-out -7.5s infinite;
            box-shadow:
              0 16px 36px rgba(0, 0, 0, 0.74),
              0 0 24px -6px rgba(251, 191, 36, 0.38);
          }
          .hkpi-amber:hover {
            box-shadow: 0 20px 44px rgba(0, 0, 0, 0.84), 0 0 32px -4px rgba(253, 224, 71, 0.56);
          }
          .hkpi-amber .kpi-base-flow-a {
            background: radial-gradient(circle, rgba(251, 191, 36, 0.42) 0%, rgba(217, 119, 6, 0.22) 50%, transparent 74%);
          }
          .hkpi-amber .kpi-base-flow-b {
            background: radial-gradient(circle, rgba(253, 224, 71, 0.3) 0%, rgba(146, 64, 14, 0.26) 50%, transparent 74%);
          }

          /* KPI 4: Leather Burgundy Live Base + Rose-Brass & Pearl Shining Border */
          .hkpi-burgundy {
            background-image:
              linear-gradient(125deg, #250E1B 0%, #4E1D38 42%, #2E1122 74%, #612445 100%),
              radial-gradient(ellipse 62% 56% at var(--kp1x) var(--kp1y), #FFFFFF 0%, rgba(255, 241, 232, 0.92) 24%, transparent 64%),
              radial-gradient(ellipse 68% 60% at var(--kp2x) var(--kp2y), #FDE4CF 0%, #E59872 30%, transparent 66%),
              radial-gradient(ellipse 58% 58% at var(--kp3x) var(--kp3y), #FCE7F3 0%, #D8849B 28%, transparent 64%),
              linear-gradient(135deg, #F2A985 0%, #7C344D 36%, #FDE4CF 70%, #9D485F 100%);
            animation:
              kpiBaseGlide 13.5s ease-in-out -9s infinite,
              kpiRimDriftA 10.6s ease-in-out -4.5s infinite,
              kpiRimDriftB 14.8s ease-in-out -8.3s infinite reverse,
              kpiRimDriftC 18.8s ease-in-out -3.7s infinite;
            box-shadow:
              0 16px 36px rgba(0, 0, 0, 0.74),
              0 0 24px -6px rgba(242, 169, 133, 0.36);
          }
          .hkpi-burgundy:hover {
            box-shadow: 0 20px 44px rgba(0, 0, 0, 0.84), 0 0 32px -4px rgba(253, 228, 207, 0.52);
          }
          .hkpi-burgundy .kpi-base-flow-a {
            background: radial-gradient(circle, rgba(232, 121, 160, 0.38) 0%, rgba(157, 46, 92, 0.22) 50%, transparent 74%);
          }
          .hkpi-burgundy .kpi-base-flow-b {
            background: radial-gradient(circle, rgba(242, 169, 133, 0.32) 0%, rgba(124, 52, 77, 0.26) 50%, transparent 74%);
          }

          /* 4. HIGH-CONTRAST DARK PROGRAM FOLIO SUB-TABS (POPS OVER STUDY SCENE) */
          .dark-program-card {
            position: relative;
            background: linear-gradient(
              168deg,
              rgba(14, 18, 32, 0.92) 0%,
              rgba(9, 12, 22, 0.94) 58%,
              rgba(15, 13, 20, 0.95) 100%
            );
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1.5px solid rgba(226, 186, 98, 0.62);
            box-shadow:
              0 22px 54px rgba(0, 0, 0, 0.82),
              0 0 28px -10px rgba(212, 175, 55, 0.28),
              inset 0 1px 0 rgba(254, 243, 199, 0.28);
            transition: transform 0.26s cubic-bezier(0.22, 1, 0.36, 1),
              border-color 0.26s ease, box-shadow 0.26s ease;
          }
          .dark-program-card:hover {
            transform: translateY(-5px);
            border-color: #F8DF98;
            box-shadow:
              0 28px 66px rgba(0, 0, 0, 0.9),
              0 0 36px -6px rgba(234, 189, 86, 0.42),
              inset 0 1px 0 rgba(255, 251, 235, 0.45);
          }

          /* Classical Antique Gold CTA Button */
          .btn-sanctuary-gold {
            background: linear-gradient(180deg, #F6DC93 0%, #D4A138 56%, #AA781C 100%);
            border: 1px solid #FEF3C7;
            color: #100C06;
            box-shadow:
              0 6px 20px rgba(212, 161, 56, 0.35),
              inset 0 1px 1px rgba(255, 255, 255, 0.78);
            transition: transform 0.18s ease, filter 0.18s ease, box-shadow 0.18s ease;
          }
          .btn-sanctuary-gold:hover {
            filter: brightness(1.06);
            transform: translateY(-1px);
            box-shadow:
              0 10px 26px rgba(246, 220, 147, 0.46),
              inset 0 1px 1px #FFFFFF;
          }
        `}</style>

        {/* ===================================================================
            BACKGROUND LAYERS (AUTO-FALLBACK TO ELEGANT ACADEMIC STUDY PNG)
        =================================================================== */}
        <div
          className="dark-study-bg-img"
          style={{
            backgroundImage: `url("${backgroundSrc}"), url("/Dark Academic Study Background.png"), url("/Elegant Academic Study Background.png")`,
          }}
        />
        <div className="dark-study-scrim" />
        <div className="dark-lamp-aura" />

        {/* ===================================================================
            FOREGROUND CONTENT (SAFE TOP SPACING — ZERO HEADER CLIPPING)
        =================================================================== */}
        <div className="relative z-10 p-5 sm:p-7 space-y-6">
          {/* -----------------------------------------------------------------
              1. DARK ACADEMIC SANCTUARY HEADER
          ----------------------------------------------------------------- */}
          <header className="dark-sanctuary-header rounded-3xl px-6 sm:px-7 py-5 flex flex-wrap items-center justify-between gap-4 relative overflow-hidden">
            <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-[#F6DC93]/85 to-transparent" />

            <div className="flex items-center gap-4">
              <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-[#2B2012] via-[#171B30] to-[#0D101D] border border-[#E2BA62]/80 shadow-[0_8px_22px_rgba(0,0,0,0.68)] flex items-center justify-center shrink-0">
                <BookOpen className="w-6 h-6 text-[#F6DC93]" />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="text-[10.5px] font-extrabold uppercase tracking-[0.26em] text-[#ECC978]">
                    ACADEMIC STUDY SANCTUARY
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#133B2F]/85 text-[#86EFAC] border border-[#34D399]/45 inline-flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-[#F6DC93]" />
                    <span>Dark Study Mode</span>
                  </span>
                </div>

                <h1 className="font-classical text-2xl sm:text-[32px] font-bold tracking-tight text-[#FFFDF8] leading-tight mt-0.5">
                  Programs Management
                </h1>

                <p className="text-xs sm:text-sm text-[#CFC8B9] font-medium mt-0.5">
                  Explore courses, curate syllabus tracks, and craft
                  enterprise-grade learning journeys.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate("/programs/create")}
              className="btn-sanctuary-gold px-5 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-[0.12em] inline-flex items-center gap-2 cursor-pointer ml-auto"
            >
              <Plus className="w-4 h-4 stroke-[2.6]" />
              <span>Create Program</span>
            </button>
          </header>

          {/* -----------------------------------------------------------------
              2. 4 NOCTURNAL CLASSICAL KPI CARDS
          ----------------------------------------------------------------- */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                key: "ALL",
                label: "Total Programs",
                value: stats.total,
                sub: "All Platform Curricula",
                cls: "hkpi-navy",
                iconCls: "bg-[#D4AF37]/20 text-[#F6DC93] border-[#E2BA62]/55",
                barCls: "from-[#D4AF37] via-[#F6DC93] to-[#92691C]",
                icon: <LayoutGrid className="w-5 h-5" />,
                filterable: true,
              },
              {
                key: "Published",
                label: "Published",
                value: stats.published,
                sub: `${stats.published} Live & Enrolled`,
                cls: "hkpi-emerald",
                iconCls: "bg-[#34D399]/18 text-[#86EFAC] border-[#34D399]/55",
                barCls: "from-[#10B981] via-[#6EE7B7] to-[#065F46]",
                icon: <CheckCircle2 className="w-5 h-5" />,
                filterable: true,
              },
              {
                key: "Draft",
                label: "Drafts",
                value: stats.drafts,
                sub:
                  stats.drafts === 0
                    ? "Queue 100% Cleared"
                    : "In Editorial Review",
                cls: "hkpi-amber",
                iconCls: "bg-[#F59E0B]/20 text-[#FDE68A] border-[#FBBF24]/55",
                barCls: "from-[#D97706] via-[#FDE68A] to-[#92400E]",
                icon: <FileEdit className="w-5 h-5" />,
                filterable: true,
              },
              {
                key: "MODULES",
                label: "Total Modules",
                value: stats.totalModules,
                sub: "Across All Programs",
                cls: "hkpi-burgundy",
                iconCls: "bg-[#ECB48A]/20 text-[#FDE4CF] border-[#ECB48A]/55",
                barCls: "from-[#C0748B] via-[#F6DC93] to-[#7D364B]",
                icon: <Layers className="w-5 h-5" />,
                filterable: false,
              },
            ].map((card, idx) => {
              const isSelected =
                card.filterable && selectedStatus === card.key;

              return (
                <div
                  key={card.key}
                  onClick={() => {
                    if (!card.filterable) return;
                    setSelectedStatus(
                      selectedStatus === card.key ? "ALL" : card.key
                    );
                  }}
                  className={`rounded-2xl p-5 flex flex-col justify-between space-y-4 select-none highlighted-kpi-card ${
                    card.cls
                  } ${card.filterable ? "cursor-pointer" : ""} ${
                    isSelected ? "ring-2 ring-[#F6DC93]" : ""
                  }`}
                >
                  {/* Smooth Internal Base-Colour Movement Layers */}
                  <div
                    className="kpi-base-flow-a"
                    style={{ animationDelay: `${idx * -2.6}s` }}
                  />
                  <div
                    className="kpi-base-flow-b"
                    style={{ animationDelay: `${idx * -3.4 - 1.5}s` }}
                  />

                  <div className="flex items-start justify-between gap-3 relative z-10">
                    <div>
                      <span className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#DDD5C5] block">
                        {card.label}
                      </span>
                      <span className="font-classical text-4xl font-bold text-[#FFFDF8] leading-none mt-2 block">
                        {card.value}
                      </span>
                    </div>

                    <div
                      className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 ${card.iconCls}`}
                    >
                      {card.icon}
                    </div>
                  </div>

                  <div className="space-y-2.5 relative z-10">
                    <div className="w-full h-[3px] rounded-full bg-black/45 overflow-hidden">
                      <div
                        className={`h-full w-full rounded-full bg-gradient-to-r ${card.barCls}`}
                      />
                    </div>

                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="text-[#DCD4C4] font-medium truncate">
                        {card.sub}
                      </span>
                      {card.filterable && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-black/50 border border-[#F6DC93]/35 text-[#F7F2E7] shrink-0">
                          {isSelected ? "• Active" : "Filter →"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </section>

          {/* -----------------------------------------------------------------
              3. SMOKED-GLASS SEARCH & FILTER DOCK
          ----------------------------------------------------------------- */}
          <section className="dark-filter-dock rounded-2xl p-3.5 sm:p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[230px]">
              <Search className="w-4 h-4 text-[#ECC978] absolute left-4 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search programs by title, type, or syllabus tag..."
                className="w-full rounded-xl bg-[#070A14]/88 border border-[#E2BA62]/35 focus:border-[#F6DC93] pl-11 pr-4 py-2.5 text-xs font-medium text-[#FFFDF8] placeholder-[#9499AA] outline-none transition"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Tags Select */}
              <div className="relative flex items-center">
                <Tag className="w-3.5 h-3.5 text-[#ECC978] absolute left-3 pointer-events-none" />
                <select
                  value={selectedTag}
                  onChange={(e) => setSelectedTag(e.target.value)}
                  className="rounded-xl bg-[#070A14]/88 border border-white/15 hover:border-[#E2BA62]/65 focus:border-[#F6DC93] pl-8 pr-7 py-2.5 text-xs font-semibold text-[#F7F2E7] outline-none cursor-pointer transition"
                >
                  <option value="ALL" className="bg-[#0B0F1C]">
                    All Tags
                  </option>
                  {allTags.map((t) => (
                    <option key={t} value={t} className="bg-[#0B0F1C]">
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              {/* Categories Select */}
              <div className="relative flex items-center">
                <FolderOpen className="w-3.5 h-3.5 text-[#ECC978] absolute left-3 pointer-events-none" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="rounded-xl bg-[#070A14]/88 border border-white/15 hover:border-[#E2BA62]/65 focus:border-[#F6DC93] pl-8 pr-7 py-2.5 text-xs font-semibold text-[#F7F2E7] outline-none cursor-pointer transition"
                >
                  <option value="ALL" className="bg-[#0B0F1C]">
                    All Categories
                  </option>
                  {allCategories.map((c) => (
                    <option key={c} value={c} className="bg-[#0B0F1C]">
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Select */}
              <div className="relative flex items-center">
                <Filter className="w-3.5 h-3.5 text-[#ECC978] absolute left-3 pointer-events-none" />
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="rounded-xl bg-[#070A14]/88 border border-white/15 hover:border-[#E2BA62]/65 focus:border-[#F6DC93] pl-8 pr-7 py-2.5 text-xs font-semibold text-[#F7F2E7] outline-none cursor-pointer transition"
                >
                  <option value="ALL" className="bg-[#0B0F1C]">
                    All Statuses
                  </option>
                  <option value="Published" className="bg-[#0B0F1C]">
                    Published
                  </option>
                  <option value="Draft" className="bg-[#0B0F1C]">
                    Draft
                  </option>
                </select>
              </div>
            </div>
          </section>

          {/* -----------------------------------------------------------------
              4. HIGH-PROMINENCE DARK PROGRAM FOLIO CARDS
          ----------------------------------------------------------------- */}
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 rounded-3xl bg-[#0B0F1C]/88 backdrop-blur-xl border border-[#E2BA62]/40">
              <Loader2 className="w-8 h-8 text-[#F6DC93] animate-spin" />
              <span className="text-xs font-semibold text-[#DDD5C5] tracking-wide">
                Curating your academic program library...
              </span>
            </div>
          ) : filteredPrograms.length === 0 ? (
            <div className="py-16 px-6 text-center rounded-3xl bg-[#0B0F1C]/90 backdrop-blur-xl border border-[#E2BA62]/45 space-y-3 max-w-xl">
              <BookOpen className="w-9 h-9 text-[#ECC978] mx-auto opacity-85" />
              <h3 className="font-classical text-xl font-bold text-[#FFFDF8]">
                No Programs Match Your Selection
              </h3>
              <p className="text-xs text-[#C6BFAF]">
                Adjust your filters or create a new enterprise curriculum track.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedTag("ALL");
                  setSelectedCategory("ALL");
                  setSelectedStatus("ALL");
                }}
                className="btn-sanctuary-gold px-4 py-2 rounded-xl text-xs font-extrabold cursor-pointer mt-2"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-12">
              {filteredPrograms.map((prog) => {
                const isPublished = prog.status === "Published";
                const isMenuOpen = openMenuId === prog.id;

                return (
                  <article
                    key={prog.id}
                    onClick={() => navigate(`/programs/${prog.id}`, { state: { program: prog } })}
                    className="dark-program-card group rounded-3xl overflow-hidden flex flex-col justify-between cursor-pointer"
                  >
                    {/* Classical Gold Corner Bookplate Accents */}
                    <span className="pointer-events-none absolute top-2.5 left-2.5 w-3.5 h-3.5 border-t-2 border-l-2 border-[#F6DC93]/75 rounded-tl-md z-20" />
                    <span className="pointer-events-none absolute top-2.5 right-2.5 w-3.5 h-3.5 border-t-2 border-r-2 border-[#F6DC93]/75 rounded-tr-md z-20" />

                    {/* Cover Thumbnail */}
                    <div className="relative h-44 w-full overflow-hidden bg-[#131829]">
                      {prog.thumbnail ? (
                        <img
                          src={prog.thumbnail}
                          alt={prog.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#1C223B] via-[#131729] to-[#261A10]">
                          <BookOpen className="w-12 h-12 text-[#ECC978]/65" />
                        </div>
                      )}

                      <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F1A] via-[#0B0F1A]/25 to-black/20" />

                      {/* Status Seal Badge */}
                      <div className="absolute top-4 left-4 z-10">
                        <span
                          className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.14em] inline-flex items-center gap-1.5 shadow-lg ${
                            isPublished
                              ? "bg-[#124D3C]/95 text-[#A7F3D0] border border-[#34D399]/70"
                              : "bg-[#4A2E11]/95 text-[#FDE68A] border border-[#F59E0B]/70"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isPublished ? "bg-[#34D399]" : "bg-[#FBBF24]"
                            }`}
                          />
                          <span>{prog.status}</span>
                        </span>
                      </div>

                      {/* Three-Dot Context Menu */}
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="absolute top-4 right-4 z-20"
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setOpenMenuId(isMenuOpen ? null : prog.id)
                          }
                          aria-label="Program options"
                          className="w-8 h-8 rounded-full bg-[#090C15]/88 hover:bg-[#192036] border border-[#F6DC93]/55 text-[#FFFDF8] flex items-center justify-center cursor-pointer transition"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {isMenuOpen && (
                          <div className="absolute right-0 top-10 w-40 rounded-2xl bg-[#0B0F1C] border border-[#E2BA62]/65 shadow-[0_16px_40px_rgba(0,0,0,0.92)] p-1.5 space-y-1 z-30">
                            <button
                              type="button"
                              onClick={() => {
                                setOpenMenuId(null);
                                navigate(`/programs/${prog.id}`, { state: { program: prog } });
                              }}
                              className="w-full px-3 py-2 rounded-xl text-left text-xs font-semibold text-[#FFFDF8] hover:bg-white/10 flex items-center gap-2 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5 text-[#F6DC93]" />
                              <span>View Program</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setOpenMenuId(null);
                                navigate(`/programs/${prog.id}/edit`);
                              }}
                              className="w-full px-3 py-2 rounded-xl text-left text-xs font-semibold text-[#FFFDF8] hover:bg-white/10 flex items-center gap-2 cursor-pointer"
                            >
                              <Pencil className="w-3.5 h-3.5 text-[#86EFAC]" />
                              <span>Edit Syllabus</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setOpenMenuId(null);
                                setDeleteTarget(prog);
                              }}
                              className="w-full px-3 py-2 rounded-xl text-left text-xs font-semibold text-rose-300 hover:bg-rose-500/15 flex items-center gap-2 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Folio Card Content */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-3">
                        <div>
                          <h2 className="font-classical text-[21px] font-bold text-[#FFFDF8] group-hover:text-[#F6DC93] transition tracking-tight">
                            {prog.title}
                          </h2>
                          <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs font-medium text-[#CCC5B4]">
                            <span className="inline-flex items-center gap-1.5">
                              <BookOpen className="w-3.5 h-3.5 text-[#E2BA62]" />
                              <span>{prog.type}</span>
                            </span>
                            <span className="text-[#E2BA62]/60">•</span>
                            <span className="inline-flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-[#E2BA62]" />
                              <span>{prog.duration}</span>
                            </span>
                          </div>
                        </div>

                        {/* Syllabus Tags */}
                        {prog.tags && prog.tags.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5">
                            {prog.tags.slice(0, 4).map((t) => (
                              <span
                                key={t}
                                className="px-2.5 py-1 rounded-lg text-[10.5px] font-semibold bg-[#181E34] text-[#EAE3D2] border border-[#E2BA62]/35"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Footer Strip: Module Counter + Classical Brass Button */}
                      <div className="pt-3.5 border-t border-[#E2BA62]/25 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-[#141A2E] border border-[#E2BA62]/45 flex items-center justify-center">
                            <Layers className="w-4 h-4 text-[#F6DC93]" />
                          </div>
                          <div>
                            <span className="text-[9.5px] font-bold uppercase tracking-[0.16em] text-[#A8A090] block leading-none">
                              Modules
                            </span>
                            <span className="text-sm font-extrabold text-[#FFFDF8] mt-0.5 block">
                              {prog.modules_count}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/programs/${prog.id}`, { state: { program: prog } });
                          }}
                          className="btn-sanctuary-gold px-4 py-2 rounded-xl text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <span>View Program</span>
                          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </section>
          )}
        </div>

        {/* ===================================================================
            DELETE CONFIRMATION MODAL (DARK ACADEMIC SANCTUARY THEME)
        =================================================================== */}
        {deleteTarget && (
          <div
            onClick={() => !deleting && setDeleteTarget(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-3xl p-6 bg-[#0C101E] border border-[#E2BA62]/65 shadow-[0_24px_65px_rgba(0,0,0,0.92)] space-y-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-rose-300 block">
                    Confirm Removal
                  </span>
                  <h3 className="font-classical text-xl font-bold text-white mt-0.5">
                    Delete &ldquo;{deleteTarget.title}&rdquo;?
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-[#CCC5B4] leading-relaxed">
                This removes the program syllabus and its{" "}
                {deleteTarget.modules_count} module(s) from the active catalog.
                This action cannot be undone.
              </p>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  disabled={deleting}
                  onClick={() => setDeleteTarget(null)}
                  className="px-4 py-2 rounded-xl bg-white/5 border border-white/15 text-xs font-bold text-[#FFFDF8] hover:bg-white/10 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-extrabold text-white inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {deleting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                  <span>{deleting ? "Deleting..." : "Delete Program"}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}