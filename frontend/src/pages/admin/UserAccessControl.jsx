/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import MainLayout from "../../layout/mainLayout";
import {
  UserX,
  Search,
  Mail,
  Users,
  UserCheck,
  Shield,
  X,
  MoreHorizontal,
  KeyRound,
  LogOut,
  Activity,
  Clock,
  AlertTriangle,
  RefreshCw,
  Download,
  Lock,
  Unlock,
  Building2,
  Laptop,
  Smartphone,
  CheckSquare,
  Square,
} from "lucide-react";
import { API_BASE } from "../../config/api";
import localAiAvatarImg from "../../assets/ai_avatar.png";

const API_BASE_URL =
  import.meta.env?.VITE_API_URL ||
  API_BASE ||
  (import.meta.env?.DEV
    ? "http://127.0.0.1:8000"
    : "https://saarthi-curious-00e8.onrender.com");

const STORAGE_KEY_IAM_AUDIT = "saarthi_unified_users_access_v4";
const STORAGE_KEY_IAM_THEME = "saarthi_iam_theme_v1";
const STORAGE_KEY_AI_ROBOT_AVATAR = "saarthi_transparent_ai_model_v5";

const REFERENCE_NOW = new Date("2026-11-11T00:00:00");

const DEACTIVATION_REASONS = [
  { id: "Left Company", label: "Left Company / Offboarded", icon: "🚪" },
  { id: "Inactivity", label: "Extended Inactivity (Dormant 30d+)", icon: "💤" },
  { id: "Policy Violation", label: "Security or Policy Violation", icon: "🛡️" },
  { id: "Contract Ended", label: "Internship / Temp Access Expired", icon: "⏳" },
  { id: "Other", label: "Other Administrative Reason", icon: "📝" },
];

const ROLE_OPTIONS = [
  "Master Admin",
  "Admin",
  "Team Leader",
  "Franchise Partner",
  "Franchise Developer",
  "Franchise Employee",
  "Head Office Staff",
  "Intern",
];

const LOCATION_OPTIONS = [
  "Mumbai HQ Corporate",
  "Mumbai HQ Central",
  "Mumbai HQ L&D",
  "Mumbai HQ Operations",
  "Mumbai HQ Strategy",
  "Mumbai HQ HR",
  "Mumbai HQ Analytics",
  "Mumbai HQ Support",
  "Navi Mumbai West Zone",
  "Navi Mumbai Tech Hub",
  "Navi Mumbai AI Lab",
  "Navi Mumbai Backend",
  "Delhi NCR North",
  "Pune West Zone",
  "Pune Operations",
  "Bengaluru South",
  "Ahmedabad West",
  "Indore Central",
  "Kolkata East Zone",
  "Hyderabad South",
  "Thane West Zone",
  "Nashik West Zone",
];

// ============================================================================
// REALISTIC 23-USER ROSTER
// ============================================================================
const INITIAL_DB_USERS = [
  {
    id: 1,
    name: "Jiya Shinde",
    email: "jiyashinde27052005@gmail.com",
    phone: "+91 98201 44101",
    role: "Admin",
    reporting_manager: "Mousume Barick",
    franchise: "Mumbai HQ Corporate",
    joined_date: "2026-07-15",
    last_login: "2026-09-23T13:39:00",
    login_count_30d: 0,
    is_active: true,
    status_override: "Active",
    access_expiry: null,
    reactivation_requested: false,
    curos: 180,
    streak_days: 0,
    risk_score: 64,
    certificates: 2,
    programs: [
      { name: "Enterprise IAM Governance", progress: 78 },
      { name: "Client Relationships Mastery", progress: 52 },
    ],
  },
  {
    id: 2,
    name: "Shreya Jain",
    email: "shreya.jain@talentcorner.in",
    phone: "+91 98202 33102",
    role: "Admin",
    reporting_manager: "Mousume Barick",
    franchise: "Navi Mumbai West Zone",
    joined_date: "2026-06-10",
    last_login: "2026-10-26T08:56:00",
    login_count_30d: 14,
    is_active: true,
    status_override: "Active",
    access_expiry: null,
    reactivation_requested: false,
    curos: 310,
    streak_days: 5,
    risk_score: 22,
    certificates: 4,
    programs: [
      { name: "Franchise Leadership Track", progress: 92 },
      { name: "Recruitment Analytics Pro", progress: 84 },
    ],
  },
  {
    id: 3,
    name: "Mousume Barick",
    email: "snehabarick2@gmail.com",
    phone: "+91 98203 11203",
    role: "Master Admin",
    reporting_manager: "Board Executive",
    franchise: "Mumbai HQ Central",
    joined_date: "2026-05-01",
    last_login: "2026-10-01T17:55:00",
    login_count_30d: 0,
    is_active: true,
    status_override: "Active",
    access_expiry: null,
    reactivation_requested: false,
    curos: 420,
    streak_days: 2,
    risk_score: 48,
    certificates: 5,
    programs: [
      { name: "Executive Strategy & Compliance", progress: 88 },
      { name: "Client Relationships Mastery", progress: 75 },
    ],
  },
  {
    id: 4,
    name: "Anuj Jadhav",
    email: "anujjadhav3558@gmail.com",
    phone: "+91 98204 55804",
    role: "Admin",
    reporting_manager: "Mousume Barick",
    franchise: "Navi Mumbai Tech Hub",
    joined_date: "2026-06-18",
    last_login: "2026-11-10T14:02:00",
    login_count_30d: 28,
    is_active: true,
    status_override: "Active",
    access_expiry: null,
    reactivation_requested: false,
    curos: 495,
    streak_days: 9,
    risk_score: 12,
    certificates: 6,
    programs: [
      { name: "AI & Data Telemetry Architecture", progress: 100 },
      { name: "Client Relationships Mastery", progress: 94 },
    ],
  },
  {
    id: 5,
    name: "Amy Kaul",
    email: "amy.kaul@talentcorner.in",
    phone: "+91 98111 22005",
    role: "Franchise Partner",
    reporting_manager: "Shreya Jain",
    franchise: "Delhi NCR North",
    joined_date: "2026-07-22",
    last_login: "2026-09-22T19:29:00",
    login_count_30d: 0,
    is_active: true,
    status_override: "Active",
    access_expiry: null,
    reactivation_requested: false,
    curos: 95,
    streak_days: 0,
    risk_score: 76,
    certificates: 1,
    programs: [
      { name: "Franchise Onboarding Playbook", progress: 42 },
      { name: "Client Acquisition Essentials", progress: 28 },
    ],
  },
  {
    id: 6,
    name: "Surbhi Jain",
    email: "surbhi.jain@talentcorner.in",
    phone: "+91 98220 66006",
    role: "Team Leader",
    reporting_manager: "Shreya Jain",
    franchise: "Pune West Zone",
    joined_date: "2026-07-05",
    last_login: "2026-09-19T19:36:00",
    login_count_30d: 0,
    is_active: true,
    status_override: "Active",
    access_expiry: null,
    reactivation_requested: false,
    curos: 140,
    streak_days: 0,
    risk_score: 72,
    certificates: 2,
    programs: [
      { name: "Team Leader Coaching Lab", progress: 55 },
      { name: "Escalation Management", progress: 38 },
    ],
  },
  {
    id: 7,
    name: "Atharva Lohar",
    email: "atharvalohar33@gmail.com",
    phone: "+91 98207 77307",
    role: "Franchise Employee",
    reporting_manager: "Sasuke Uchiha",
    franchise: "Mumbai HQ L&D",
    joined_date: "2026-08-01",
    last_login: "2026-11-09T11:20:00",
    login_count_30d: 24,
    is_active: true,
    status_override: "Active",
    access_expiry: null,
    reactivation_requested: false,
    curos: 365,
    streak_days: 7,
    risk_score: 14,
    certificates: 4,
    programs: [
      { name: "Client Relationships Mastery", progress: 100 },
      { name: "Candidate Pitch Simulation", progress: 92 },
    ],
  },
  {
    id: 8,
    name: "Lav Chokhani",
    email: "bhavana.nimbalkar@talentcorner.in",
    phone: "+91 98450 88008",
    role: "Franchise Employee",
    reporting_manager: "Vedika Tolani",
    franchise: "Bengaluru South",
    joined_date: "2026-08-12",
    last_login: "2026-11-07T16:15:00",
    login_count_30d: 19,
    is_active: true,
    status_override: "Active",
    access_expiry: null,
    reactivation_requested: false,
    curos: 190,
    streak_days: 3,
    risk_score: 36,
    certificates: 2,
    programs: [
      { name: "Client Relationships Mastery", progress: 68 },
      { name: "Franchise Operations 101", progress: 74 },
    ],
  },
  {
    id: 9,
    name: "Mama Singh",
    email: "mama.paltasingh@talentcorner.in",
    phone: "+91 98209 99009",
    role: "Head Office Staff",
    reporting_manager: "Mousume Barick",
    franchise: "Mumbai HQ Operations",
    joined_date: "2026-06-25",
    last_login: "2026-11-04T10:12:00",
    login_count_30d: 11,
    is_active: true,
    status_override: "Active",
    access_expiry: null,
    reactivation_requested: false,
    curos: 225,
    streak_days: 2,
    risk_score: 28,
    certificates: 3,
    programs: [
      { name: "HQ Operations & Compliance", progress: 82 },
      { name: "Cross-Team Communication", progress: 70 },
    ],
  },
  {
    id: 10,
    name: "Vedika Tolani",
    email: "vedika.tolani@talentcorner.in",
    phone: "+91 98250 10010",
    role: "Team Leader",
    reporting_manager: "Mousume Barick",
    franchise: "Ahmedabad West",
    joined_date: "2026-07-11",
    last_login: "2026-11-02T15:40:00",
    login_count_30d: 9,
    is_active: true,
    status_override: "Active",
    access_expiry: null,
    reactivation_requested: false,
    curos: 260,
    streak_days: 4,
    risk_score: 25,
    certificates: 3,
    programs: [
      { name: "Team Leader Coaching Lab", progress: 86 },
      { name: "Regional Growth Playbook", progress: 79 },
    ],
  },
  {
    id: 11,
    name: "Sasuke Uchiha",
    email: "sasuke.uchiha@talentcorner.in",
    phone: "+91 98211 11011",
    role: "Team Leader",
    reporting_manager: "Mousume Barick",
    franchise: "Mumbai HQ Strategy",
    joined_date: "2026-07-01",
    last_login: "2026-11-08T18:05:00",
    login_count_30d: 21,
    is_active: true,
    status_override: "Active",
    access_expiry: null,
    reactivation_requested: false,
    curos: 340,
    streak_days: 6,
    risk_score: 18,
    certificates: 4,
    programs: [
      { name: "Strategic Account Leadership", progress: 95 },
      { name: "High-Velocity Hiring", progress: 88 },
    ],
  },
  {
    id: 12,
    name: "Priyanka Panjwani",
    email: "priyanka.panjwani@talentcorner.in",
    phone: "+91 98260 12012",
    role: "Franchise Developer",
    reporting_manager: "Vedika Tolani",
    franchise: "Indore Central",
    joined_date: "2026-07-19",
    last_login: "2026-08-29T12:10:00",
    login_count_30d: 0,
    is_active: true,
    status_override: "Active",
    access_expiry: null,
    reactivation_requested: false,
    curos: 50,
    streak_days: 0,
    risk_score: 86,
    certificates: 0,
    programs: [
      { name: "Franchise Expansion Blueprint", progress: 24 },
      { name: "Client Pitch Fundamentals", progress: 15 },
    ],
  },
  {
    id: 13,
    name: "Anuj Jadhav 2",
    email: "anujjadhv3551@gmail.com",
    phone: "+91 98213 13013",
    role: "Intern",
    reporting_manager: "Shreya Jain",
    franchise: "Navi Mumbai AI Lab",
    joined_date: "2026-09-15",
    last_login: "2026-11-06T09:45:00",
    login_count_30d: 15,
    is_active: true,
    status_override: "Active",
    access_expiry: "2026-11-22",
    reactivation_requested: false,
    curos: 175,
    streak_days: 3,
    risk_score: 34,
    certificates: 2,
    programs: [
      { name: "AI & Full-Stack Onboarding", progress: 76 },
      { name: "Client Relationships Mastery", progress: 60 },
    ],
  },
  {
    id: 14,
    name: "Sneha Jaiswal",
    email: "sneha.jaiswal@talentcorner.in",
    phone: "+91 98214 14014",
    role: "Head Office Staff",
    reporting_manager: "Mousume Barick",
    franchise: "Mumbai HQ HR",
    joined_date: "2026-11-02",
    last_login: null,
    login_count_30d: 0,
    is_active: true,
    status_override: "Invited",
    access_expiry: null,
    reactivation_requested: false,
    curos: 0,
    streak_days: 0,
    risk_score: 90,
    certificates: 0,
    programs: [{ name: "HR Onboarding Readiness", progress: 0 }],
  },
  {
    id: 15,
    name: "Parna Ghosh",
    email: "parna.ghosh@talentcorner.in",
    phone: "+91 98300 15015",
    role: "Head Office Staff",
    reporting_manager: "Surbhi Jain",
    franchise: "Kolkata East Zone",
    joined_date: "2026-07-08",
    last_login: "2026-08-14T14:22:00",
    login_count_30d: 0,
    is_active: true,
    status_override: "Active",
    access_expiry: null,
    reactivation_requested: false,
    curos: 45,
    streak_days: 0,
    risk_score: 89,
    certificates: 0,
    programs: [
      { name: "Client Relationships Mastery", progress: 32 },
      { name: "Mid-Track Pulse Assessment", progress: 20 },
    ],
  },
  {
    id: 16,
    name: "Preshita Rane",
    email: "preshita.rane@talentcorner.in",
    phone: "+91 98216 16016",
    role: "Intern",
    reporting_manager: "Vedika Tolani",
    franchise: "Mumbai HQ L&D Intern",
    joined_date: "2026-09-01",
    last_login: "2026-10-05T11:05:00",
    login_count_30d: 0,
    is_active: true,
    status_override: "Active",
    access_expiry: "2026-11-20",
    reactivation_requested: false,
    curos: 85,
    streak_days: 0,
    risk_score: 68,
    certificates: 1,
    programs: [{ name: "L&D Content Operations", progress: 48 }],
  },
  {
    id: 17,
    name: "Shlok Verma",
    email: "shlok.verma@talentcorner.in",
    phone: "+91 98490 17017",
    role: "Franchise Developer",
    reporting_manager: "Sasuke Uchiha",
    franchise: "Hyderabad South",
    joined_date: "2026-11-05",
    last_login: null,
    login_count_30d: 0,
    is_active: true,
    status_override: "Invited",
    access_expiry: "2026-12-15",
    reactivation_requested: false,
    curos: 0,
    streak_days: 0,
    risk_score: 85,
    certificates: 0,
    programs: [{ name: "Franchise Developer Starter", progress: 0 }],
  },
  {
    id: 18,
    name: "Rohan Navle",
    email: "rohan.navle@talentcorner.in",
    phone: "+91 98218 18018",
    role: "Intern",
    reporting_manager: "Anuj Jadhav",
    franchise: "Navi Mumbai Backend",
    joined_date: "2026-09-10",
    last_login: "2026-11-09T17:30:00",
    login_count_30d: 18,
    is_active: true,
    status_override: "Active",
    access_expiry: "2026-12-20",
    reactivation_requested: false,
    curos: 280,
    streak_days: 5,
    risk_score: 19,
    certificates: 3,
    programs: [
      { name: "Python & API Telemetry Systems", progress: 90 },
      { name: "Database Security Essentials", progress: 85 },
    ],
  },
  {
    id: 19,
    name: "Vinit Pardule",
    email: "vinit.pardule@talentcorner.in",
    phone: "+91 98219 19019",
    role: "Franchise Developer",
    reporting_manager: "Anuj Jadhav",
    franchise: "Thane West Zone",
    joined_date: "2026-08-20",
    last_login: "2026-11-05T13:15:00",
    login_count_30d: 12,
    is_active: true,
    status_override: "Active",
    access_expiry: null,
    reactivation_requested: false,
    curos: 240,
    streak_days: 3,
    risk_score: 26,
    certificates: 3,
    programs: [
      { name: "Franchise Expansion Blueprint", progress: 84 },
      { name: "Client Pitch Fundamentals", progress: 76 },
    ],
  },
  {
    id: 20,
    name: "Naman Jadhav",
    email: "naman.jadhav@talentcorner.in",
    phone: "+91 98220 20020",
    role: "Franchise Partner",
    reporting_manager: "Shreya Jain",
    franchise: "Nashik West Zone",
    joined_date: "2026-07-28",
    last_login: "2026-09-02T10:00:00",
    login_count_30d: 0,
    is_active: true,
    status_override: "Active",
    access_expiry: null,
    reactivation_requested: false,
    curos: 70,
    streak_days: 0,
    risk_score: 82,
    certificates: 1,
    programs: [{ name: "Franchise Onboarding Playbook", progress: 35 }],
  },
  {
    id: 21,
    name: "Vedanki Jadhav",
    email: "vedanki.jadhav@talentcorner.in",
    phone: "+91 98221 21021",
    role: "Head Office Staff",
    reporting_manager: "Mousume Barick",
    franchise: "Mumbai HQ Analytics",
    joined_date: "2026-08-05",
    last_login: "2026-11-08T12:45:00",
    login_count_30d: 16,
    is_active: true,
    status_override: "Active",
    access_expiry: null,
    reactivation_requested: false,
    curos: 305,
    streak_days: 4,
    risk_score: 20,
    certificates: 4,
    programs: [
      { name: "Quantitative Analytics & Reporting", progress: 91 },
      { name: "HQ Operations & Compliance", progress: 80 },
    ],
  },
  {
    id: 22,
    name: "Sumit Jagdale",
    email: "sumit.jagdale@talentcorner.in",
    phone: "+91 98222 22022",
    role: "Franchise Employee",
    reporting_manager: "Surbhi Jain",
    franchise: "Pune Operations",
    joined_date: "2026-11-08",
    last_login: null,
    login_count_30d: 0,
    is_active: true,
    status_override: "Invited",
    access_expiry: null,
    reactivation_requested: false,
    curos: 0,
    streak_days: 0,
    risk_score: 88,
    certificates: 0,
    programs: [{ name: "Client Relationships Mastery", progress: 0 }],
  },
  {
    id: 23,
    name: "Shruti Kadam",
    email: "shruti.kadam@talentcorner.in",
    phone: "+91 98223 23023",
    role: "Franchise Employee",
    reporting_manager: "Vedika Tolani",
    franchise: "Mumbai HQ Support",
    joined_date: "2026-07-12",
    last_login: "2026-10-02T09:15:00",
    login_count_30d: 0,
    is_active: false,
    status_override: "Deactivated",
    deactivated_by: "L&D Lead Admin",
    deactivated_on: "2026-11-04",
    deactivated_reason: "Inactivity",
    access_expiry: null,
    reactivation_requested: true,
    curos: 115,
    streak_days: 0,
    risk_score: 79,
    certificates: 1,
    programs: [{ name: "Customer Support Excellence", progress: 54 }],
  },
];

// ============================================================================
// HELPER UTILITIES
// ============================================================================
function computeDaysSince(dateStr) {
  if (!dateStr) return null;
  const parsed = new Date(dateStr);
  if (isNaN(parsed.getTime())) return null;
  const diffMs = Math.max(0, REFERENCE_NOW.getTime() - parsed.getTime());
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

function computeDaysUntilExpiry(dateStr) {
  if (!dateStr) return null;
  const parsed = new Date(dateStr);
  if (isNaN(parsed.getTime())) return null;
  const diffMs = parsed.getTime() - REFERENCE_NOW.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

function formatDateTimeReadable(dateStr) {
  if (!dateStr) return { datePart: "Never logged in", timePart: "Invite Pending" };
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return { datePart: String(dateStr), timePart: "" };
  const datePart = d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const timePart = d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return { datePart, timePart };
}

function formatRelativeAgo(days) {
  if (days === null || days === undefined) return "Never logged in";
  if (days === 0) return "Today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

// ============================================================================
// 1. LIVE-MOVING ANTIGRAVITY AI AVATAR MODEL (`../../assets/ai_avatar.png`)
//    Loads the uploaded Antigravity image automatically & floats continuously!
// ============================================================================
// 1. EDGE-FLOOD-FILL TRANSPARENT 3D AI AVATAR (ZERO BLACK BACKGROUND PATCH)
//    Samples the outer border of `ai_avatar.png` and flood-fills inward to
//    erase 100% of the dark/black background while keeping the robot crisp!
// ============================================================================
function FloatingTransparentAiModel({
  size = 122,
  onClickModel,
  captionText = "",
}) {
  const [rawSrc] = useState(
    () =>
      localStorage.getItem(STORAGE_KEY_AI_ROBOT_AVATAR) ||
      localAiAvatarImg ||
      "/ai_avatar.png"
  );
  const [transparentDataUrl, setTransparentDataUrl] = useState(null);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    if (!rawSrc) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const w = img.naturalWidth || 256;
        const h = img.naturalHeight || 256;
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);

        const imgData = ctx.getImageData(0, 0, w, h);
        const d = imgData.data;

        // Sample corner pixel as reference dark background color
        const bgR = d[0];
        const bgG = d[1];
        const bgB = d[2];

        const isDarkBackgroundPixel = (idx) => {
          const r = d[idx];
          const g = d[idx + 1];
          const b = d[idx + 2];
          const dist = Math.sqrt(
            (r - bgR) * (r - bgR) +
              (g - bgG) * (g - bgG) +
              (b - bgB) * (b - bgB)
          );
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;
          const maxC = Math.max(r, g, b);
          // Match corner background color distance OR dark low-luminance backdrop
          return dist < 78 || (lum < 58 && maxC < 92);
        };

        // Flood-fill from all 4 outer edges so only outer background is stripped
        const visited = new Uint8Array(w * h);
        const queue = new Int32Array(w * h);
        let head = 0;
        let tail = 0;

        const pushSeed = (x, y) => {
          const p = y * w + x;
          if (!visited[p] && isDarkBackgroundPixel(p * 4)) {
            visited[p] = 1;
            queue[tail++] = p;
          }
        };

        for (let x = 0; x < w; x++) {
          pushSeed(x, 0);
          pushSeed(x, h - 1);
        }
        for (let y = 0; y < h; y++) {
          pushSeed(0, y);
          pushSeed(w - 1, y);
        }

        while (head < tail) {
          const p = queue[head++];
          const idx = p * 4;
          d[idx + 3] = 0; // Make background pixel 100% transparent

          const x = p % w;
          const y = (p / w) | 0;

          if (x > 0) pushSeed(x - 1, y);
          if (x < w - 1) pushSeed(x + 1, y);
          if (y > 0) pushSeed(x, y - 1);
          if (y < h - 1) pushSeed(x, y + 1);
        }

        // Softly feather any remaining dark halo pixels touching transparent regions
        for (let y = 1; y < h - 1; y++) {
          for (let x = 1; x < w - 1; x++) {
            const p = y * w + x;
            const idx = p * 4;
            if (d[idx + 3] > 0) {
              const hasTransparentNeighbor =
                visited[p - 1] ||
                visited[p + 1] ||
                visited[p - w] ||
                visited[p + w];
              if (hasTransparentNeighbor) {
                const lum =
                  0.299 * d[idx] + 0.587 * d[idx + 1] + 0.114 * d[idx + 2];
                if (lum < 95) {
                  d[idx + 3] = Math.round(d[idx + 3] * 0.25);
                }
              }
            }
          }
        }

        ctx.putImageData(imgData, 0, 0);
        setTransparentDataUrl(canvas.toDataURL("image/png"));
      } catch {
        setTransparentDataUrl(rawSrc);
      }
    };
    img.onerror = () => setImgError(true);
    img.src = rawSrc;
  }, [rawSrc]);

  return (
    <div
      onClick={onClickModel}
      title="Click Live AI Model to Toggle 50/50 Split Chat"
      className="relative inline-flex flex-col items-center justify-center select-none cursor-pointer group shrink-0"
    >
      {/* Multi-Colour Holographic Aura Behind Transparent AI Model */}
      <div className="pointer-events-none absolute inset-1 rounded-full bg-gradient-to-tr from-fuchsia-500/45 via-cyan-400/40 to-amber-300/40 blur-2xl group-hover:scale-125 transition-transform duration-300 animate-pulse" />

      {/* Live Floating 3D AI Avatar */}
      <div
        style={{ width: size, height: size }}
        className="relative z-10 animate-ai-free-float flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
      >
        {(transparentDataUrl || rawSrc) && !imgError ? (
          <img
            src={transparentDataUrl || rawSrc}
            alt="Saarthi Live AI Model"
            onError={() => setImgError(true)}
            className="w-full h-full object-contain drop-shadow-[0_12px_24px_rgba(192,132,252,0.75)]"
          />
        ) : (
          <svg
            viewBox="0 0 130 130"
            className="w-full h-full overflow-visible drop-shadow-[0_12px_24px_rgba(56,189,248,0.65)]"
          >
            <circle cx="65" cy="15" r="4.5" fill="#67E8F9" />
            <line x1="65" y1="16" x2="65" y2="26" stroke="#38BDF8" strokeWidth="3.2" />
            <rect x="31" y="25" width="68" height="48" rx="22" fill="#E2E8F0" stroke="#FFFFFF" strokeWidth="1.8" />
            <rect x="39" y="35" width="52" height="25" rx="11" fill="#0F172A" stroke="#38BDF8" strokeWidth="1.6" />
            <ellipse cx="53" cy="47.5" rx="5.2" ry="5.8" fill="#38BDF8" />
            <ellipse cx="77" cy="47.5" rx="5.2" ry="5.8" fill="#38BDF8" />
            <path d="M41 77 C41 72, 89 72, 89 77 L81 104 C79 110, 51 110, 49 104 Z" fill="#CBD5E1" stroke="#FFFFFF" strokeWidth="1.4" />
          </svg>
        )}
      </div>

      {/* Neon Pedestal Floor Glow */}
      <div className="w-16 h-2.5 rounded-full bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-amber-300 blur-[3px] animate-ai-shadow" />

      {captionText && (
        <span className="mt-1.5 text-[10px] font-black uppercase tracking-widest text-cyan-200 group-hover:text-amber-300 transition flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>{captionText}</span>
        </span>
      )}
    </div>
  );
}

// ============================================================================
// 2. AI WORKFORCE REPORT TAB (MULTI-COLOUR TRAVELLING BACKGROUND ACROSS
//    ENTIRE TAB EXCEPT THE 3 OPAQUE KPI CARDS + TRANSPARENT AI MODEL)
// ============================================================================
function AiWorkforceAnalystSection({
  isOpen = true,
  summaryStats,
  enrichedUsers,
  onApplySavedView,
  onSendBulkReminder,
  isLight,
}) {
  const [isSplitChatOpen, setIsSplitChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState([]);

  const expiringSoonUsers = useMemo(
    () =>
      enrichedUsers.filter(
        (u) =>
          u.days_until_expiry !== null &&
          u.days_until_expiry >= 0 &&
          u.days_until_expiry <= 14
      ),
    [enrichedUsers]
  );

  useEffect(() => {
    setChatHistory([
      {
        role: "ai",
        text: `**Workforce & Access Telemetry Summary:** Out of **${summaryStats.total} total users**, **${summaryStats.activeAccounts} accounts** can currently log in, **${summaryStats.needsReview} accounts** require immediate review (${summaryStats.dormant30} dormant 30d+ and ${summaryStats.invited} invited/never logged in), and **${summaryStats.reactivationRequests} account** has a pending reactivation request.`,
      },
    ]);
  }, [summaryStats]);

  if (!isOpen) return null;

  const quickPrompts = [
    "Which dormant accounts >60 days should be suspended first?",
    "List all interns with access expiring within 14 days.",
    "What is the recommended prescription for Invited users?",
    "Summarize reactivation requests awaiting approval.",
  ];

  const handleAskAi = (customPrompt) => {
    const q = (customPrompt || chatInput).trim();
    if (!q) return;
    setChatInput("");

    const lower = q.toLowerCase();
    let reply = "";

    if (
      lower.includes("60") ||
      lower.includes("dormant") ||
      lower.includes("suspend")
    ) {
      const list60 = enrichedUsers
        .filter((u) => u.is_dormant_60)
        .map((u) => `${u.name} (${u.days_since_login}d ago)`)
        .join(", ");
      reply = `⚠️ **Dormancy Audit (>60 Days):** ${
        list60 || "No users exceed 60 days"
      }. **Action Needed:** Send a 48-hour final login reminder or suspend with mandatory reason *"Extended Inactivity (Dormant 30d+)"*.`;
    } else if (lower.includes("expir") || lower.includes("intern")) {
      const expNames = expiringSoonUsers
        .map(
          (u) =>
            `${u.name} (Exp: ${u.access_expiry}, ${u.days_until_expiry}d left)`
        )
        .join(", ");
      reply = `⏳ **Expiring Access Audit:** ${
        expNames || "No accounts expire within 14 days"
      }. **Prescription:** Open their Unified Drawer → Access & Security tab to extend or revoke temporary access before expiration.`;
    } else if (lower.includes("invit") || lower.includes("never")) {
      const invNames = enrichedUsers
        .filter((u) => u.account_status === "Invited")
        .map((u) => `${u.name} (${u.franchise})`)
        .join(", ");
      reply = `✉️ **Pending Invitation Report:** **${summaryStats.invited} users** have not accepted their invite yet: ${invNames}. **Prescription:** Trigger a bulk invitation reminder via the Saved View tab.`;
    } else {
      const reactNames = enrichedUsers
        .filter((u) => u.reactivation_requested)
        .map((u) => `${u.name} (${u.role})`)
        .join(", ");
      reply = `🔓 **Reactivation Queue & Prescription:** ${
        reactNames || "0 pending requests"
      }. Verify manager sign-off in the Unified Drawer and click **Reactivate Account** to restore access.`;
    }

    setChatHistory((prev) => [
      ...prev,
      { role: "user", text: q },
      { role: "ai", text: reply },
    ]);
  };

  return (
    <section
      className={`w-full rounded-3xl p-5 sm:p-6 relative overflow-hidden transition-all duration-300 ${
        isLight ? "cream-gloss-surface" : "ai-unified-main-tab-light"
      }`}
    >
      {/* Clean Static Luxury Background */}

      {/* =====================================================================
          STATE A: STRUCTURED 3-ROW LAYOUT
      ===================================================================== */}
      {!isSplitChatOpen ? (
        <div className="space-y-4 relative z-10">
          {/* TOP HEADER: Bold Title */}
          <div>
            <h2
              className={`text-xl sm:text-2xl font-black tracking-tight leading-tight ${
                isLight
                  ? "text-stone-950"
                  : "text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.85)]"
              }`}
            >
              Executive Workforce Access Report &amp; Action Prescription
            </h2>
          </div>

          {/* ROW 1 (100% WIDTH): CURRENT WORKFORCE & DORMANCY TELEMETRY REPORT */}
          <div
            className={`w-full rounded-2xl px-5 py-3.5 space-y-1.5 ${
              isLight ? "cream-inner-pod-cyan" : "ai-inner-glass-strip"
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span
                className={`text-xs font-black uppercase tracking-wider ${
                  isLight ? "text-sky-900" : "text-cyan-300"
                }`}
              >
                📊 CURRENT WORKFORCE &amp; DORMANCY TELEMETRY REPORT
              </span>
              <span
                className={`text-[11px] font-extrabold ${
                  isLight ? "text-stone-700" : "text-white/95"
                }`}
              >
                Synced with {summaryStats.total} Organization Accounts
              </span>
            </div>

            <div
              className={`text-xs sm:text-[13.5px] leading-relaxed font-semibold space-y-0.5 ${
                isLight ? "text-stone-900" : "text-white"
              }`}
            >
              <p>
                • <strong className="font-black">Active Login Velocity:</strong>{" "}
                <span className="text-emerald-300 font-black">
                  {summaryStats.activeRecently} users
                </span>{" "}
                logged in within the last 30 days, generating{" "}
                <span className="text-cyan-200 font-black">
                  {summaryStats.totalLogins30d} verified sessions
                </span>{" "}
                across branches.
              </p>
              <p>
                •{" "}
                <strong className="font-black">
                  Dormancy &amp; Onboarding Risk:
                </strong>{" "}
                <span className="text-amber-300 font-black">
                  {summaryStats.dormant30} active accounts
                </span>{" "}
                have been dormant for 30+ days ({summaryStats.dormant60} exceed
                60 days), while{" "}
                <span className="text-rose-300 font-black">
                  {summaryStats.invited} invited users
                </span>{" "}
                have recorded 0 logins since invitation dispatch.
              </p>
            </div>
          </div>

          {/* ROW 2 (100% WIDTH): 3 OPAQUE MINI KPI CARDS (ISOLATED FROM OUTER TRAVELLING COLOURS) */}
          <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-5">
            {/* Card 1: Amber Live Base */}
            <div
              onClick={() => onApplySavedView("NEEDS_REVIEW")}
              className={`cursor-pointer rounded-2xl px-5 py-4 flex flex-col justify-between space-y-2 select-none ${
                isLight
                  ? "cream-user-tab-amber shadow-md"
                  : "mini-kpi-live-amber"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10.5px] font-black uppercase tracking-wider text-amber-300">
                  ⚠️ ACTION NEEDED #1
                </span>
                <span className="text-xs font-black text-amber-300">
                  Filter →
                </span>
              </div>

              <div className="flex items-baseline gap-2.5">
                <span
                  className={`text-3xl font-black tracking-tight leading-none ${
                    isLight ? "text-stone-950" : "text-white"
                  }`}
                >
                  {summaryStats.needsReview}
                </span>
                <span
                  className={`text-sm font-black ${
                    isLight ? "text-amber-950" : "text-amber-100"
                  }`}
                >
                  Accounts Need Review
                </span>
              </div>

              <span className="text-[11px] font-extrabold text-amber-200/95 pt-1.5 border-t border-white/10 block">
                {summaryStats.dormant60} accounts are 60d+ dormant
              </span>
            </div>

            {/* Card 2: Rose Live Base */}
            <div
              onClick={() => onApplySavedView("INVITED")}
              style={{ animationDelay: "-2s" }}
              className={`cursor-pointer rounded-2xl px-5 py-4 flex flex-col justify-between space-y-2 select-none ${
                isLight ? "cream-user-tab-rose shadow-md" : "mini-kpi-live-rose"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10.5px] font-black uppercase tracking-wider text-rose-300">
                  ✉️ ACTION NEEDED #2
                </span>
                <span className="text-xs font-black text-rose-300">
                  Filter →
                </span>
              </div>

              <div className="flex items-baseline gap-2.5">
                <span
                  className={`text-3xl font-black tracking-tight leading-none ${
                    isLight ? "text-stone-950" : "text-white"
                  }`}
                >
                  {summaryStats.invited}
                </span>
                <span
                  className={`text-sm font-black ${
                    isLight ? "text-rose-950" : "text-rose-100"
                  }`}
                >
                  Unaccepted Invites
                </span>
              </div>

              <span className="text-[11px] font-extrabold text-rose-200/95 pt-1.5 border-t border-white/10 block">
                0 logins recorded since invite dispatch
              </span>
            </div>

            {/* Card 3: Purple Live Base */}
            <div
              onClick={() => onApplySavedView("REACTIVATION")}
              style={{ animationDelay: "-4s" }}
              className={`cursor-pointer rounded-2xl px-5 py-4 flex flex-col justify-between space-y-2 select-none ${
                isLight
                  ? "cream-user-tab-purple shadow-md"
                  : "mini-kpi-live-purple"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10.5px] font-black uppercase tracking-wider text-purple-300">
                  🔓 ACTION NEEDED #3
                </span>
                <span className="text-xs font-black text-purple-300">
                  Filter →
                </span>
              </div>

              <div className="flex items-baseline gap-2.5">
                <span
                  className={`text-3xl font-black tracking-tight leading-none ${
                    isLight ? "text-stone-950" : "text-white"
                  }`}
                >
                  {summaryStats.reactivationRequests}
                </span>
                <span
                  className={`text-sm font-black ${
                    isLight ? "text-purple-950" : "text-purple-100"
                  }`}
                >
                  Reactivation Request
                </span>
              </div>

              <span className="text-[11px] font-extrabold text-purple-200/95 pt-1.5 border-t border-white/10 block">
                Plus {expiringSoonUsers.length} interns expiring &lt;14d
              </span>
            </div>
          </div>

          {/* ROW 3 (100% WIDTH): LEFT PRESCRIPTION (9 COLS) + RIGHT TRANSPARENT AI AVATAR (3 COLS) */}
          <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
            {/* Left 9 Cols: AI Governance Prescription */}
            <div
              className={`lg:col-span-9 rounded-2xl px-5 py-4 flex flex-col justify-between space-y-2 ${
                isLight ? "cream-inner-pod-emerald" : "ai-inner-glass-strip"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span
                  className={`text-xs font-black uppercase tracking-wider ${
                    isLight ? "text-emerald-900" : "text-emerald-300"
                  }`}
                >
                  💊 AI GOVERNANCE PRESCRIPTION &amp; RECOMMENDED INTERVENTION
                </span>
                <button
                  type="button"
                  onClick={onSendBulkReminder}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black cursor-pointer ${
                    isLight ? "cream-dark-btn" : "vibe-btn-emerald"
                  }`}
                >
                  ✉️ Dispatch Nudge to {summaryStats.needsReview} Review Users
                </button>
              </div>

              <div
                className={`text-xs sm:text-[13.5px] leading-relaxed font-semibold space-y-0.5 ${
                  isLight ? "text-stone-900" : "text-white"
                }`}
              >
                <p>
                  1.{" "}
                  <strong className="font-black text-amber-300">
                    Dormant 60d+ Accounts ({summaryStats.dormant60}):
                  </strong>{" "}
                  Send a 48-hour final login reminder; if unverified, suspend
                  via the <code>⋮</code> menu with mandatory reason{" "}
                  <em className="text-cyan-200 font-bold">
                    &ldquo;Extended Inactivity (Dormant 30d+)&rdquo;
                  </em>
                  .
                </p>
                <p>
                  2.{" "}
                  <strong className="font-black text-emerald-300">
                    Expiring Intern Access ({expiringSoonUsers.length}):
                  </strong>{" "}
                  Inspect intern contracts expiring within 14 days in the{" "}
                  <strong className="font-black">
                    Unified Drawer → Access &amp; Security
                  </strong>{" "}
                  tab.
                </p>
              </div>
            </div>

            {/* Right 3 Cols: Borderless Transparent Free-Floating AI Avatar */}
            <div className="lg:col-span-3 flex flex-col items-center justify-center select-none">
              <FloatingTransparentAiModel
                size={122}
                onClickModel={() => setIsSplitChatOpen(true)}
                captionText="Click AI to Split & Chat →"
              />
            </div>
          </div>
        </div>
      ) : (
        /* =====================================================================
           STATE B: 50% / 50% SPLIT VIEW WHEN AI AVATAR IS CLICKED
        ===================================================================== */
        <div className="space-y-4 relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2
              className={`text-xl sm:text-2xl font-black tracking-tight ${
                isLight ? "text-stone-950" : "text-white"
              }`}
            >
              Executive Workforce Access Report &amp; Interactive AI Co-Pilot
            </h2>
            <button
              type="button"
              onClick={() => setIsSplitChatOpen(false)}
              className={`px-4 py-1.5 rounded-xl text-xs font-black cursor-pointer ${
                isLight ? "cream-dark-btn" : "vibe-btn-slate"
              }`}
            >
              ← Return to Full Report
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            {/* LEFT HALF (50%) */}
            <div
              className={`lg:col-span-6 rounded-2xl p-5 flex flex-col justify-between space-y-4 ${
                isLight ? "cream-inner-pod-cyan" : "ai-inner-glass-strip"
              }`}
            >
              <div className="space-y-1.5">
                <span className="text-xs font-black uppercase tracking-wider text-cyan-300 block">
                  📊 CURRENT WORKFORCE &amp; DORMANCY TELEMETRY REPORT
                </span>
                <p className="text-xs sm:text-sm leading-relaxed font-semibold text-white">
                  Out of <strong>{summaryStats.total} users</strong>,{" "}
                  <strong className="text-emerald-300 font-black">
                    {summaryStats.activeAccounts} are Active
                  </strong>{" "}
                  ({summaryStats.activeRecently} logged in &lt;30d),{" "}
                  <strong className="text-amber-300 font-black">
                    {summaryStats.dormant30} are Dormant (30d+)
                  </strong>
                  , and{" "}
                  <strong className="text-rose-300 font-black">
                    {summaryStats.invited} are Pending Invite
                  </strong>
                  .
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div
                  onClick={() => onApplySavedView("NEEDS_REVIEW")}
                  className="cursor-pointer rounded-2xl p-3.5 flex flex-col justify-between space-y-1 mini-kpi-live-amber"
                >
                  <span className="text-[10px] font-black uppercase text-amber-300 block">
                    ⚠️ ACTION #1
                  </span>
                  <div className="text-2xl font-black text-white leading-none">
                    {summaryStats.needsReview}
                  </div>
                  <span className="text-[11px] font-bold text-amber-100 block">
                    Need Review →
                  </span>
                </div>

                <div
                  onClick={() => onApplySavedView("INVITED")}
                  style={{ animationDelay: "-2s" }}
                  className="cursor-pointer rounded-2xl p-3.5 flex flex-col justify-between space-y-1 mini-kpi-live-rose"
                >
                  <span className="text-[10px] font-black uppercase text-rose-300 block">
                    ✉️ ACTION #2
                  </span>
                  <div className="text-2xl font-black text-white leading-none">
                    {summaryStats.invited}
                  </div>
                  <span className="text-[11px] font-bold text-rose-100 block">
                    Invited →
                  </span>
                </div>

                <div
                  onClick={() => onApplySavedView("REACTIVATION")}
                  style={{ animationDelay: "-4s" }}
                  className="cursor-pointer rounded-2xl p-3.5 flex flex-col justify-between space-y-1 mini-kpi-live-purple"
                >
                  <span className="text-[10px] font-black uppercase text-purple-300 block">
                    🔓 ACTION #3
                  </span>
                  <div className="text-2xl font-black text-white leading-none">
                    {summaryStats.reactivationRequests}
                  </div>
                  <span className="text-[11px] font-bold text-purple-100 block">
                    Reactivation →
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-300">
                    💊 AI GOVERNANCE PRESCRIPTION
                  </span>
                  <button
                    type="button"
                    onClick={onSendBulkReminder}
                    className="vibe-btn-emerald px-3 py-1 rounded-xl text-[11px] font-black cursor-pointer"
                  >
                    ✉️ Nudge {summaryStats.needsReview} Users
                  </button>
                </div>
                <p className="text-xs sm:text-sm leading-relaxed font-semibold text-white">
                  1.{" "}
                  <strong className="text-amber-300">
                    Dormant 60d+ ({summaryStats.dormant60}):
                  </strong>{" "}
                  Send 48h login reminder before suspending.
                  <br />
                  2.{" "}
                  <strong className="text-emerald-300">
                    Expiring Interns ({expiringSoonUsers.length}):
                  </strong>{" "}
                  Review access expiry dates in Unified Drawer.
                </p>
              </div>
            </div>

            {/* RIGHT HALF (50%) */}
            <div
              className={`lg:col-span-6 rounded-2xl p-5 flex flex-col justify-between space-y-3.5 ${
                isLight ? "cream-graph-canvas" : "ai-inner-glass-strip"
              }`}
            >
              <div className="flex items-center justify-between gap-4">
                <FloatingTransparentAiModel
                  size={92}
                  onClickModel={() => setIsSplitChatOpen(false)}
                />

                <div className="flex-1 min-w-0 space-y-1">
                  <span className="px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider vibe-btn-purple inline-block">
                    LIVE AI CO-PILOT CHAT
                  </span>
                  <h3 className="text-base sm:text-lg font-black text-white">
                    Ask Saarthi Access AI
                  </h3>
                  <p className="text-xs text-cyan-200 font-semibold">
                    Click the AI model anytime to collapse split view.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {quickPrompts.map((q, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleAskAi(q)}
                    className="text-left px-3 py-2 rounded-xl text-[11px] font-bold flex items-center justify-between gap-2 cursor-pointer bg-[#080C18]/90 hover:bg-[#10182E] border border-white/20 hover:border-amber-300 text-white transition"
                  >
                    <span className="truncate">{q}</span>
                    <span className="text-amber-300 font-black shrink-0">→</span>
                  </button>
                ))}
              </div>

              <div className="rounded-2xl p-3 space-y-2 h-40 overflow-y-auto bg-[#060913]/85 border border-white/20">
                {chatHistory.map((m, i) => (
                  <div
                    key={i}
                    className={`p-2.5 rounded-2xl text-xs leading-relaxed font-medium ${
                      m.role === "user"
                        ? "vibe-btn-purple ml-8"
                        : "bg-[#10182E] text-white border border-cyan-400/50"
                    }`}
                  >
                    {m.text}
                  </div>
                ))}
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAskAi();
                }}
                className="p-2 rounded-2xl flex items-center gap-2 bg-[#060913]/95 border border-white/30"
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="CHAT — Ask AI about dormant users, roles, or access expiry..."
                  className="flex-1 bg-transparent px-3 py-1 text-xs font-bold text-white placeholder-slate-300 outline-none"
                />
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl text-xs font-black cursor-pointer shrink-0 vibe-btn-amber"
                >
                  Ask AI →
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

// ============================================================================
function UnifiedUserDrawer({
  user,
  initialTab = "profile",
  allUsers = [],
  onClose,
  onSaveProfile,
  onOpenDeactivateModal,
  onOpenReactivateModal,
  onUpdateExpiry,
  onForceLogout,
  onResetPassword,
  isLight,
}) {
  const [activeTab, setActiveTab] = useState(initialTab);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [reportingManager, setReportingManager] = useState("");
  const [role, setRole] = useState("");
  const [franchise, setFranchise] = useState("");
  const [joinedDate, setJoinedDate] = useState("");
  const [expiryInput, setExpiryInput] = useState("");

  useEffect(() => {
    setActiveTab(initialTab || "profile");
  }, [initialTab, user?.id]);

  useEffect(() => {
    if (!user) return;
    setFullName(user.name || "");
    setEmail(user.email || "");
    setPhone(user.phone || "+91 98200 00000");
    setReportingManager(user.reporting_manager || "Mousume Barick");
    setRole(user.role || "Franchise Employee");
    setFranchise(user.franchise || "Mumbai HQ Corporate");
    setJoinedDate(user.joined_date || "2026-08-01");
    setExpiryInput(user.access_expiry || "");
  }, [user]);

  const managerChoices = useMemo(() => {
    return Array.from(
      new Set([
        "Board Executive",
        "Mousume Barick",
        "Shreya Jain",
        "Vedika Tolani",
        "Sasuke Uchiha",
        "Surbhi Jain",
        "Anuj Jadhav",
        ...allUsers.map((u) => u.name),
      ])
    );
  }, [allUsers]);

  const activeSessions = useMemo(() => {
    if (!user || user.account_status !== "Active" || user.never_logged_in) {
      return [];
    }
    return [
      {
        id: "sess_1",
        device: "Desktop Web • Chrome 130 (macOS)",
        ip: "103.21.44.112",
        location: user.franchise?.split(" ")[0]?.trim() || "Mumbai, IN",
        started: "Active • Token Expires in 6h",
        type: "laptop",
      },
      {
        id: "sess_2",
        device: "Mobile Web • Saarthi PWA (Android)",
        ip: "49.36.118.204",
        location: user.franchise?.split(" ")[0]?.trim() || "Mumbai, IN",
        started: "Idle • 2h ago",
        type: "mobile",
      },
    ];
  }, [user]);

  const auditHistory = useMemo(() => {
    if (!user) return [];
    const logs = [...(user.status_history || [])];
    if (user.deactivated_on && logs.length === 0) {
      logs.push({
        id: "init_deact",
        action: `Account ${user.account_status}`,
        actor: user.deactivated_by || "L&D Lead Admin",
        date: user.deactivated_on,
        reason: user.deactivated_reason || "Extended Inactivity",
      });
    }
    logs.push(
      {
        id: "role_assign",
        action: `Role verified as "${user.role}"`,
        actor: user.reporting_manager || "Mousume Barick",
        date: "2026-10-15",
        reason: `Reporting to ${user.reporting_manager} • ${user.franchise}`,
      },
      {
        id: "invite_sent",
        action: "Workspace Invitation Dispatched",
        actor: "L&D Lead Admin",
        date: user.joined_date || "2026-08-01",
        reason: `Onboarding invite sent to ${user.email}`,
      },
      {
        id: "acct_created",
        action: "Account Provisioned in Directory",
        actor: "System IAM Provisioner",
        date: user.joined_date || "2026-08-01",
        reason: "Initial workforce record created",
      }
    );
    return logs;
  }, [user]);

  if (!user) return null;

  const accountStatusBadge =
    user.account_status === "Active"
      ? "vibe-btn-emerald"
      : user.account_status === "Suspended"
      ? "vibe-btn-rose"
      : user.account_status === "Invited"
      ? "vibe-btn-cyan"
      : "vibe-btn-slate";

  const activityBadge = user.never_logged_in
    ? "vibe-btn-cyan"
    : user.is_dormant_60
    ? "vibe-btn-rose"
    : user.is_dormant_30
    ? "vibe-btn-amber"
    : "vibe-btn-emerald";

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    onSaveProfile(user.id, {
      name: fullName.trim() || user.name,
      email: email.trim() || user.email,
      phone: phone.trim(),
      reporting_manager: reportingManager,
      role,
      franchise,
      joined_date: joinedDate,
    });
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-xs"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-2xl h-full p-6 overflow-y-auto flex flex-col justify-between space-y-6 border-l-2 shadow-[0_0_90px_rgba(0,0,0,0.95)] ${
          isLight
            ? "bg-[#FAF7F0] border-[#C8B99E] text-stone-900"
            : "bg-[#090E1E] border-cyan-400/60 text-slate-100"
        }`}
      >
        <div className="space-y-5">
          {/* Drawer Header */}
          <div className="flex items-start justify-between gap-4 border-b border-current/15 pb-4">
            <div className="flex items-center gap-4">
              <div
                className={`w-14 h-14 rounded-2xl font-black text-lg flex items-center justify-center shrink-0 ${
                  isLight ? "cream-pill-gold" : "vibe-btn-purple"
                }`}
              >
                {user.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-black">{user.name}</h2>
                <p className="text-xs opacity-80 mt-0.5">{user.email}</p>

                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span
                    className={`px-3 py-0.5 rounded-full text-[10px] font-black uppercase ${accountStatusBadge}`}
                  >
                    ● Status: {user.account_status}
                  </span>
                  <span
                    className={`px-3 py-0.5 rounded-full text-[10px] font-black uppercase ${activityBadge}`}
                  >
                    ⚡ Activity: {user.activity_label}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className={`w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer ${
                isLight ? "cream-dark-btn" : "vibe-btn-slate"
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* 4 Drawer Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 border-b border-current/15 pb-3">
            {[
              { id: "profile", label: "Profile" },
              { id: "security", label: "Access & Security" },
              { id: "learning", label: "Learning" },
              { id: "history", label: "History" },
            ].map((t) => {
              const isActive = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTab(t.id)}
                  className={`py-2 px-3 rounded-xl text-xs font-black cursor-pointer transition ${
                    isLight
                      ? isActive
                        ? "cream-pill-gold"
                        : "cream-dark-btn"
                      : isActive
                      ? "vibe-btn-amber"
                      : "vibe-btn-slate"
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* TAB 1: PROFILE */}
          {activeTab === "profile" && (
            <form onSubmit={handleProfileSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="font-black uppercase tracking-wider opacity-80 block mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className={`w-full rounded-xl border px-3.5 py-2.5 font-bold outline-none ${
                      isLight
                        ? "bg-white border-stone-400 text-stone-900"
                        : "bg-[#0B1120] border-cyan-400/50 text-white focus:border-amber-300"
                    }`}
                  />
                </div>

                <div>
                  <label className="font-black uppercase tracking-wider opacity-80 block mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full rounded-xl border px-3.5 py-2.5 font-bold outline-none ${
                      isLight
                        ? "bg-white border-stone-400 text-stone-900"
                        : "bg-[#0B1120] border-cyan-400/50 text-white focus:border-amber-300"
                    }`}
                  />
                </div>

                <div>
                  <label className="font-black uppercase tracking-wider opacity-80 block mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={`w-full rounded-xl border px-3.5 py-2.5 font-bold outline-none ${
                      isLight
                        ? "bg-white border-stone-400 text-stone-900"
                        : "bg-[#0B1120] border-cyan-400/50 text-white focus:border-amber-300"
                    }`}
                  />
                </div>

                <div>
                  <label className="font-black uppercase tracking-wider opacity-80 block mb-1">
                    Reporting Manager
                  </label>
                  <select
                    value={reportingManager}
                    onChange={(e) => setReportingManager(e.target.value)}
                    className={`w-full rounded-xl border px-3.5 py-2.5 font-bold outline-none ${
                      isLight
                        ? "bg-white border-stone-400 text-stone-900"
                        : "bg-[#0B1120] border-cyan-400/50 text-white focus:border-amber-300"
                    }`}
                  >
                    {managerChoices.map((m) => (
                      <option key={m} value={m} className="bg-[#0B1120] text-white">
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-black uppercase tracking-wider opacity-80 block mb-1">
                    Role
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className={`w-full rounded-xl border px-3.5 py-2.5 font-bold outline-none ${
                      isLight
                        ? "bg-white border-stone-400 text-stone-900"
                        : "bg-[#0B1120] border-cyan-400/50 text-white focus:border-amber-300"
                    }`}
                  >
                    {ROLE_OPTIONS.map((r) => (
                      <option key={r} value={r} className="bg-[#0B1120] text-white">
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-black uppercase tracking-wider opacity-80 block mb-1">
                    Location / Franchise
                  </label>
                  <select
                    value={franchise}
                    onChange={(e) => setFranchise(e.target.value)}
                    className={`w-full rounded-xl border px-3.5 py-2.5 font-bold outline-none ${
                      isLight
                        ? "bg-white border-stone-400 text-stone-900"
                        : "bg-[#0B1120] border-cyan-400/50 text-white focus:border-amber-300"
                    }`}
                  >
                    {LOCATION_OPTIONS.map((loc) => (
                      <option
                        key={loc}
                        value={loc}
                        className="bg-[#0B1120] text-white"
                      >
                        {loc}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="font-black uppercase tracking-wider opacity-80 block mb-1">
                    Date of Joining
                  </label>
                  <input
                    type="date"
                    value={joinedDate}
                    onChange={(e) => setJoinedDate(e.target.value)}
                    className={`w-full rounded-xl border px-3.5 py-2.5 font-bold outline-none ${
                      isLight
                        ? "bg-white border-stone-400 text-stone-900"
                        : "bg-[#0B1120] border-cyan-400/50 text-white focus:border-amber-300"
                    }`}
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-current/15 flex justify-end">
                <button
                  type="submit"
                  className={`px-6 py-2.5 rounded-xl text-xs font-black cursor-pointer ${
                    isLight ? "cream-pill-gold" : "vibe-btn-amber"
                  }`}
                >
                  Save Profile Changes
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: ACCESS & SECURITY */}
          {activeTab === "security" && (
            <div className="space-y-5 text-xs">
              {user.reactivation_requested && (
                <div className="p-4 rounded-2xl modal-tab-border-amber flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 block">
                      🔓 PENDING REACTIVATION REQUEST
                    </span>
                    <p className="text-xs font-semibold mt-0.5">
                      {user.name} requested account reactivation via manager{" "}
                      {user.reporting_manager}.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onOpenReactivateModal(user)}
                    className="vibe-btn-emerald px-3.5 py-2 rounded-xl text-xs font-black shrink-0 cursor-pointer"
                  >
                    Approve &amp; Reactivate
                  </button>
                </div>
              )}

              <div
                className={`p-4 rounded-2xl space-y-3 ${
                  isLight ? "cream-inner-pod-rose" : "modal-tab-border-rose"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-rose-300">
                    🛡️ Account Lifecycle &amp; Danger Zone
                  </span>
                  <span className="text-[10.5px] font-bold opacity-80">
                    Explicit Logged Actions Only
                  </span>
                </div>
                <p className="text-xs opacity-85">
                  Every status change requires confirmation and is permanently
                  logged in the governance audit trail.
                </p>

                <div className="flex flex-wrap items-center gap-2.5 pt-1">
                  {user.account_status === "Active" ||
                  user.account_status === "Invited" ? (
                    <>
                      <button
                        type="button"
                        onClick={() => onOpenDeactivateModal([user], "Suspended")}
                        className="vibe-btn-amber px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer"
                      >
                        <Shield className="w-3.5 h-3.5" />
                        <span>Suspend Account</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onOpenDeactivateModal([user], "Deactivated")
                        }
                        className="vibe-btn-rose px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>Deactivate Account</span>
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onOpenReactivateModal(user)}
                      className="vibe-btn-emerald px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer"
                    >
                      <Unlock className="w-3.5 h-3.5" />
                      <span>Reactivate Account</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => onResetPassword(user)}
                    className="vibe-btn-cyan px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Reset Password</span>
                  </button>
                </div>
              </div>

              <div
                className={`p-4 rounded-2xl space-y-2.5 ${
                  isLight ? "cream-inner-pod-amber" : "modal-tab-border-amber"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Access Expiry (Interns &amp; Contractors)</span>
                  </span>
                  <span className="text-[10.5px] font-bold opacity-85">
                    {user.access_expiry
                      ? `Expires: ${user.access_expiry}`
                      : "Permanent Access"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={expiryInput}
                    onChange={(e) => setExpiryInput(e.target.value)}
                    className={`flex-1 rounded-xl border px-3 py-2 text-xs font-bold outline-none ${
                      isLight
                        ? "bg-white border-stone-400 text-stone-900"
                        : "bg-[#070B16] border-white/20 text-white focus:border-cyan-400"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => onUpdateExpiry(user.id, expiryInput || null)}
                    className="vibe-btn-cyan px-4 py-2 rounded-xl text-xs font-black cursor-pointer"
                  >
                    Save Expiry
                  </button>
                  {user.access_expiry && (
                    <button
                      type="button"
                      onClick={() => {
                        setExpiryInput("");
                        onUpdateExpiry(user.id, null);
                      }}
                      className="vibe-btn-slate px-3 py-2 rounded-xl text-xs font-bold cursor-pointer"
                    >
                      Set Permanent
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-cyan-300">
                    Active Sessions ({activeSessions.length})
                  </span>
                  {activeSessions.length > 0 && (
                    <button
                      type="button"
                      onClick={() => onForceLogout(user)}
                      className="text-[11px] font-black text-rose-400 hover:underline cursor-pointer"
                    >
                      Force Logout All
                    </button>
                  )}
                </div>

                {activeSessions.length === 0 ? (
                  <div className="p-3.5 rounded-2xl bg-black/30 border border-white/10 text-xs opacity-75">
                    No active authenticated sessions for this account.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {activeSessions.map((s) => (
                      <div
                        key={s.id}
                        className={`p-3.5 rounded-2xl flex items-center justify-between gap-3 ${
                          isLight
                            ? "cream-inner-pod-cyan"
                            : "modal-tab-border-cyan"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
                            {s.type === "laptop" ? (
                              <Laptop className="w-4 h-4" />
                            ) : (
                              <Smartphone className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <div className="font-extrabold">{s.device}</div>
                            <div className="text-[10.5px] opacity-75">
                              IP: {s.ip} • {s.location} •{" "}
                              <span className="text-emerald-400 font-bold">
                                {s.started}
                              </span>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => onForceLogout(user)}
                          className="vibe-btn-rose px-3 py-1.5 rounded-lg text-[10.5px] font-black cursor-pointer"
                        >
                          Force Logout
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: LEARNING */}
          {activeTab === "learning" && (
            <div className="space-y-5 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div
                  className={`p-3.5 rounded-2xl ${
                    isLight ? "cream-inner-pod-amber" : "modal-tab-border-amber"
                  }`}
                >
                  <span className="text-[10px] font-black uppercase opacity-75 block">
                    Curos Balance
                  </span>
                  <span className="text-2xl font-black text-amber-400 mt-1 block">
                    🪙 {user.curos ?? 120}
                  </span>
                </div>

                <div
                  className={`p-3.5 rounded-2xl ${
                    isLight ? "cream-inner-pod-rose" : "modal-tab-border-rose"
                  }`}
                >
                  <span className="text-[10px] font-black uppercase opacity-75 block">
                    Current Streak
                  </span>
                  <span className="text-2xl font-black text-rose-400 mt-1 block">
                    🔥 {user.streak_days ?? 0}d
                  </span>
                </div>

                <div
                  className={`p-3.5 rounded-2xl ${
                    isLight ? "cream-inner-pod-cyan" : "modal-tab-border-cyan"
                  }`}
                >
                  <span className="text-[10px] font-black uppercase opacity-75 block">
                    Attrition Risk
                  </span>
                  <span
                    className={`text-2xl font-black mt-1 block ${
                      (user.risk_score ?? 50) >= 70
                        ? "text-rose-400"
                        : (user.risk_score ?? 50) >= 40
                        ? "text-amber-300"
                        : "text-emerald-400"
                    }`}
                  >
                    {user.risk_score ?? 42}%
                  </span>
                </div>

                <div
                  className={`p-3.5 rounded-2xl ${
                    isLight
                      ? "cream-inner-pod-emerald"
                      : "modal-tab-border-emerald"
                  }`}
                >
                  <span className="text-[10px] font-black uppercase opacity-75 block">
                    Certificates
                  </span>
                  <span className="text-2xl font-black text-emerald-400 mt-1 block">
                    🎓 {user.certificates ?? 2}
                  </span>
                </div>
              </div>

              <div
                className={`p-4 rounded-2xl space-y-3.5 ${
                  isLight ? "cream-graph-canvas" : "modal-tab-border-cyan"
                }`}
              >
                <span className="text-[11px] font-black uppercase tracking-wider text-cyan-300 block">
                  📚 Enrolled Learning Programs ({user.programs?.length || 1})
                </span>

                <div className="space-y-3">
                  {(
                    user.programs || [
                      { name: "Client Relationships Mastery", progress: 65 },
                    ]
                  ).map((prog, idx) => (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex items-center justify-between font-bold">
                        <span>{prog.name}</span>
                        <span className="text-cyan-400 font-black">
                          {prog.progress}% Completed
                        </span>
                      </div>
                      <div className="w-full h-2.5 rounded-full bg-black/45 p-0.5 border border-white/15 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-emerald-400 to-amber-300"
                          style={{ width: `${Math.max(6, prog.progress)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: HISTORY */}
          {activeTab === "history" && (
            <div className="space-y-3 text-xs">
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-300 block">
                📜 Complete Account &amp; Role Audit Log ({auditHistory.length} Events)
              </span>
              <div className="relative pl-4 border-l-2 border-purple-400/50 space-y-3">
                {auditHistory.map((ev) => (
                  <div
                    key={ev.id}
                    className={`p-3.5 rounded-2xl space-y-1 ${
                      isLight
                        ? "cream-inner-pod-purple"
                        : "modal-tab-border-purple"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-black text-sm">{ev.action}</span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-400/40">
                        {ev.date}
                      </span>
                    </div>
                    <p className="text-[11px] opacity-85">
                      Actor: <strong>{ev.actor}</strong> • Details:{" "}
                      <strong>{ev.reason}</strong>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 4. ZONE 9 MODALS (INVITE, IMPORT CSV, DEACTIVATE, REACTIVATE)
// ============================================================================
function InviteUserModal({ isOpen, onClose, onInvite, allUsers = [], isLight }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Franchise Employee");
  const [manager, setManager] = useState("Mousume Barick");
  const [location, setLocation] = useState("Mumbai HQ Corporate");
  const [expiry, setExpiry] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    onInvite({
      name: name.trim(),
      email: email.trim(),
      role,
      reporting_manager: manager,
      franchise: location,
      access_expiry: expiry || null,
    });
    setName("");
    setEmail("");
    setExpiry("");
    onClose();
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-lg rounded-3xl p-6 space-y-5 border-2 ${
          isLight
            ? "cream-gloss-surface text-stone-900"
            : "bg-[#0B1020] border-cyan-400/65 text-slate-100 shadow-2xl"
        }`}
      >
        <div className="flex items-center justify-between border-b border-current/15 pb-3.5">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-cyan-300 block">
              WORKFORCE ONBOARDING
            </span>
            <h3 className="text-xl font-black mt-0.5">Invite New User</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="vibe-btn-slate w-8 h-8 rounded-xl flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-black uppercase block mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Riya Deshmukh"
                className="w-full rounded-xl bg-[#090D1A] border border-white/20 px-3.5 py-2.5 font-bold text-white outline-none focus:border-cyan-400"
              />
            </div>
            <div>
              <label className="font-black uppercase block mb-1">Email *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="riya@talentcorner.in"
                className="w-full rounded-xl bg-[#090D1A] border border-white/20 px-3.5 py-2.5 font-bold text-white outline-none focus:border-cyan-400"
              />
            </div>
            <div>
              <label className="font-black uppercase block mb-1">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full rounded-xl bg-[#090D1A] border border-white/20 px-3.5 py-2.5 font-bold text-white outline-none"
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="font-black uppercase block mb-1">
                Reporting Manager
              </label>
              <select
                value={manager}
                onChange={(e) => setManager(e.target.value)}
                className="w-full rounded-xl bg-[#090D1A] border border-white/20 px-3.5 py-2.5 font-bold text-white outline-none"
              >
                {Array.from(
                  new Set([
                    "Mousume Barick",
                    "Shreya Jain",
                    "Vedika Tolani",
                    "Sasuke Uchiha",
                    ...allUsers.map((u) => u.name),
                  ])
                ).map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="font-black uppercase block mb-1">
                Location / Franchise
              </label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full rounded-xl bg-[#090D1A] border border-white/20 px-3.5 py-2.5 font-bold text-white outline-none"
              >
                {LOCATION_OPTIONS.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="font-black uppercase block mb-1">
                Access Expiry (Optional)
              </label>
              <input
                type="date"
                value={expiry}
                onChange={(e) => setExpiry(e.target.value)}
                className="w-full rounded-xl bg-[#090D1A] border border-white/20 px-3.5 py-2.5 font-bold text-white outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/15">
            <button
              type="button"
              onClick={onClose}
              className="vibe-btn-slate px-4 py-2.5 rounded-xl font-black cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="vibe-btn-cyan px-5 py-2.5 rounded-xl font-black cursor-pointer"
            >
              ✉️ Send Invitation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ImportCsvModal({ isOpen, onClose, onImportUsers, isLight }) {
  const [csvText, setCsvText] = useState(
    "Aarav Kulkarni,aarav.k@talentcorner.in,Franchise Partner,Shreya Jain,Pune West Zone\nMeera Nair,meera.nair@talentcorner.in,Intern,Anuj Jadhav,Navi Mumbai AI Lab"
  );

  if (!isOpen) return null;

  const handleImport = (e) => {
    e.preventDefault();
    const rows = csvText
      .split("\n")
      .map((r) => r.trim())
      .filter(Boolean);
    const parsed = rows.map((line, idx) => {
      const [name, email, role, reporting_manager, franchise] = line
        .split(",")
        .map((s) => s?.trim());
      return {
        name: name || `Imported User ${idx + 1}`,
        email: email || `user${Date.now()}_${idx}@talentcorner.in`,
        role: role || "Franchise Employee",
        reporting_manager: reporting_manager || "Mousume Barick",
        franchise: franchise || "Mumbai HQ Corporate",
      };
    });
    onImportUsers(parsed);
    onClose();
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-lg rounded-3xl p-6 space-y-4 border-2 ${
          isLight
            ? "cream-gloss-surface text-stone-900"
            : "bg-[#0B1020] border-purple-400/65 text-slate-100 shadow-2xl"
        }`}
      >
        <div className="flex items-center justify-between border-b border-current/15 pb-3">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-purple-300 block">
              BULK CSV ONBOARDING
            </span>
            <h3 className="text-xl font-black mt-0.5">
              Import Users via CSV
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="vibe-btn-slate w-8 h-8 rounded-xl flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleImport} className="space-y-3 text-xs">
          <p className="opacity-80">
            Format: <code>Full Name, Email, Role, Reporting Manager, Location</code>
          </p>
          <textarea
            rows={5}
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            className="w-full rounded-2xl bg-[#090D1A] border border-white/20 p-3.5 font-mono text-xs text-cyan-200 outline-none focus:border-amber-300"
          />
          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="vibe-btn-slate px-4 py-2 rounded-xl font-black cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="vibe-btn-purple px-5 py-2 rounded-xl font-black cursor-pointer"
            >
              📥 Import &amp; Send Invites
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function MandatoryDeactivationModal({
  isOpen,
  targetUsers = [],
  actionType = "Deactivated",
  onClose,
  onConfirm,
}) {
  const [selectedReason, setSelectedReason] = useState("Inactivity");
  const [customNote, setCustomNote] = useState("");
  const [adminActor, setAdminActor] = useState("L&D Lead Admin");

  useEffect(() => {
    if (isOpen) {
      setSelectedReason("Inactivity");
      setCustomNote("");
    }
  }, [isOpen]);

  if (!isOpen || targetUsers.length === 0) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const finalReason =
      selectedReason === "Other" && customNote.trim()
        ? `Other: ${customNote.trim()}`
        : customNote.trim()
        ? `${selectedReason} (${customNote.trim()})`
        : selectedReason;

    onConfirm({
      users: targetUsers,
      newStatus: actionType,
      reason: finalReason,
      deactivatedBy: adminActor || "L&D Lead Admin",
      deactivatedOn: REFERENCE_NOW.toISOString().split("T")[0],
    });
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg metal-gloss-rose-kpi-live rounded-3xl p-6 text-slate-100 space-y-5 border-2 border-rose-400/65"
      >
        <div className="flex items-start justify-between gap-3 border-b border-white/15 pb-3.5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl vibe-btn-rose flex items-center justify-center shrink-0">
              <UserX className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-rose-300 block">
                MANDATORY GOVERNANCE AUDIT
              </span>
              <h3 className="text-lg font-black text-white">
                {actionType === "Suspended"
                  ? `Suspend ${targetUsers.length} Account(s)`
                  : `Deactivate ${targetUsers.length} Account(s)`}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="vibe-btn-slate w-8 h-8 rounded-xl flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3 rounded-2xl bg-black/40 border border-white/10 text-xs space-y-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
            Target Account(s):
          </span>
          <div className="flex flex-wrap gap-1.5 pt-1 max-h-20 overflow-y-auto">
            {targetUsers.map((u) => (
              <span
                key={u.id}
                className="px-2.5 py-1 rounded-lg bg-white/10 text-white font-bold text-[11px]"
              >
                {u.name} ({u.role})
              </span>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="font-black uppercase tracking-wider text-amber-300 block mb-2">
              1. Select Mandatory Reason *
            </label>
            <div className="grid grid-cols-1 gap-2">
              {DEACTIVATION_REASONS.map((r) => (
                <label
                  key={r.id}
                  onClick={() => setSelectedReason(r.id)}
                  className={`cursor-pointer p-3 rounded-2xl border flex items-center justify-between transition ${
                    selectedReason === r.id
                      ? "bg-rose-500/25 border-rose-300 text-white shadow-[0_0_15px_rgba(244,63,94,0.3)]"
                      : "bg-[#090D1A]/80 border-white/10 text-slate-300 hover:border-white/30"
                  }`}
                >
                  <span className="font-extrabold flex items-center gap-2.5">
                    <span>{r.icon}</span>
                    <span>{r.label}</span>
                  </span>
                  <input
                    type="radio"
                    name="deactReason"
                    checked={selectedReason === r.id}
                    onChange={() => setSelectedReason(r.id)}
                    className="accent-rose-500"
                  />
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-300 block mb-1">
                Authorized By (Admin) *
              </label>
              <input
                type="text"
                required
                value={adminActor}
                onChange={(e) => setAdminActor(e.target.value)}
                className="w-full rounded-xl bg-[#090D1A] border border-white/20 px-3 py-2 font-bold text-white outline-none focus:border-amber-300"
              />
            </div>
            <div>
              <label className="font-bold text-slate-300 block mb-1">
                Audit Ticket / Notes (Optional)
              </label>
              <input
                type="text"
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                placeholder="e.g., HR Offboarding #402..."
                className="w-full rounded-xl bg-[#090D1A] border border-white/20 px-3 py-2 font-semibold text-white placeholder-slate-500 outline-none focus:border-amber-300"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/15">
            <button
              type="button"
              onClick={onClose}
              className="vibe-btn-slate px-4 py-2.5 rounded-xl font-black cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="vibe-btn-rose px-5 py-2.5 rounded-xl font-black flex items-center gap-2 cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              <span>
                Confirm{" "}
                {actionType === "Suspended" ? "Suspension" : "Deactivation"}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ReactivateConfirmationModal({ isOpen, user, onClose, onConfirm }) {
  const [note, setNote] = useState("Verified manager approval & restored access");

  if (!isOpen || !user) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md metal-gloss-cyan-kpi-live rounded-3xl p-6 text-slate-100 space-y-4 border-2 border-emerald-400/65"
      >
        <div className="flex items-center justify-between border-b border-white/15 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl vibe-btn-emerald flex items-center justify-center">
              <Unlock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-300 block">
                ACCOUNT REACTIVATION
              </span>
              <h3 className="text-lg font-black text-white">
                Reactivate {user.name}?
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="vibe-btn-slate w-8 h-8 rounded-xl flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-200 leading-relaxed">
          Are you sure you want to restore <strong>{user.name}</strong> (
          {user.role}) to <strong>Active</strong> status? They will immediately
          regain login access.
        </p>

        <div className="text-xs">
          <label className="font-bold text-emerald-200 block mb-1">
            Audit Note (Optional)
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full rounded-xl bg-[#071412] border border-emerald-300/40 px-3 py-2 text-white font-semibold outline-none"
          />
        </div>

        <div className="flex justify-end gap-2.5 pt-2 border-t border-white/15 text-xs">
          <button
            type="button"
            onClick={onClose}
            className="vibe-btn-slate px-4 py-2 rounded-xl font-black cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm([user], note);
              onClose();
            }}
            className="vibe-btn-emerald px-5 py-2 rounded-xl font-black cursor-pointer"
          >
            ✓ Confirm Reactivation
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 5. MAIN COMPONENT: Users & Access (UserAccessControl.jsx)
// ============================================================================
export default function UserAccessControl() {
  const [themeMode, setThemeMode] = useState(
    () => localStorage.getItem(STORAGE_KEY_IAM_THEME) || "dark"
  );
  const isLight = themeMode === "cream";

  const handleToggleTheme = () => {
    setThemeMode((prev) => {
      const next = prev === "dark" ? "cream" : "dark";
      try {
        localStorage.setItem(STORAGE_KEY_IAM_THEME, next);
      } catch {
        // Ignore quota
      }
      return next;
    });
  };

  const [dbUsers, setDbUsers] = useState(INITIAL_DB_USERS);
  const [syncing, setSyncing] = useState(false);

  const [auditMap, setAuditMap] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_IAM_AUDIT);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_IAM_AUDIT, JSON.stringify(auditMap));
    } catch {
      // Ignore quota
    }
  }, [auditMap]);

  const [alertBannerDismissed, setAlertBannerDismissed] = useState(false);
  const [aiAnalystOpen, setAiAnalystOpen] = useState(true);
  const [headerOverflowOpen, setHeaderOverflowOpen] = useState(false);

  // Search, Filters & Saved Views
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("All Roles");
  const [locationFilter, setLocationFilter] = useState("All Locations");
  const [accountStatusFilter, setAccountStatusFilter] = useState("All");
  const [activityFilter, setActivityFilter] = useState("Any");
  const [savedView, setSavedView] = useState("ALL");

  // Selection, Row Menu, Drawer & Modals
  const [selectedIds, setSelectedIds] = useState([]);
  // Show only first 5 users by default; toggle at top of table to show all
  const [showAllUsers, setShowAllUsers] = useState(false);
  const [openMenuUserId, setOpenMenuUserId] = useState(null);
  const [drawerState, setDrawerState] = useState({
    userId: null,
    tab: "profile",
  });
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [importCsvModalOpen, setImportCsvModalOpen] = useState(false);
  const [deactModalState, setDeactModalState] = useState({
    isOpen: false,
    users: [],
    actionType: "Deactivated",
  });
  const [reactivateModalUser, setReactivateModalUser] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3600);
  };

  const fetchUsersFromDB = useCallback(async () => {
    setSyncing(true);
    const endpoints = [
      `${API_BASE_URL}/admin/inactive-users`,
      `${API_BASE_URL}/admin/users`,
      `${API_BASE_URL}/users`,
      `${API_BASE_URL}/api/users`,
    ];

    for (const url of endpoints) {
      try {
        const res = await axios.get(url, { params: { _t: Date.now() } });
        const list =
          res.data?.users ||
          res.data?.data ||
          (Array.isArray(res.data) ? res.data : null);

        if (Array.isArray(list) && list.length > 0) {
          setDbUsers(
            list.map((u, idx) => {
              const fallback = INITIAL_DB_USERS[idx % INITIAL_DB_USERS.length];
              return {
                ...fallback,
                id: u.id ?? u.user_id ?? idx + 1,
                name: u.name || u.full_name || u.username || fallback.name,
                email: u.email || fallback.email,
                role: u.role || u.role_name || fallback.role,
                reporting_manager:
                  u.reporting_manager ||
                  u.manager_name ||
                  fallback.reporting_manager,
                franchise:
                  u.franchise ||
                  u.location ||
                  u.branch ||
                  fallback.franchise,
                last_login:
                  u.last_login !== undefined ? u.last_login : fallback.last_login,
                login_count_30d:
                  u.login_count_30d !== undefined
                    ? Number(u.login_count_30d)
                    : fallback.login_count_30d,
                is_active:
                  u.is_active !== undefined
                    ? Boolean(u.is_active)
                    : fallback.is_active,
                status_override: u.status || fallback.status_override,
              };
            })
          );
          setSyncing(false);
          return;
        }
      } catch {
        // Try next route
      }
    }
    setSyncing(false);
  }, []);

  useEffect(() => {
    fetchUsersFromDB();
  }, [fetchUsersFromDB]);

  // Enrich Users
  const enrichedUsers = useMemo(() => {
    return dbUsers.map((u) => {
      const ov = auditMap[u.id] || {};
      const name = ov.name ?? u.name;
      const email = ov.email ?? u.email;
      const phone = ov.phone ?? u.phone ?? "+91 98200 11223";
      const role = ov.role ?? u.role;
      const reporting_manager = ov.reporting_manager ?? u.reporting_manager;
      const franchise = ov.franchise ?? u.franchise;
      const joined_date = ov.joined_date ?? u.joined_date ?? "2026-08-01";

      const isActive =
        ov.is_active !== undefined ? ov.is_active : Boolean(u.is_active);
      const lastLogin =
        ov.last_login !== undefined ? ov.last_login : u.last_login;
      const daysSinceLogin = computeDaysSince(lastLogin);
      const neverLoggedIn = !lastLogin;

      let accountStatus = "Active";
      if (!isActive) {
        const rawOverride =
          ov.status_override || u.status_override || "Deactivated";
        accountStatus =
          rawOverride === "Suspended" ? "Suspended" : "Deactivated";
      } else if (
        neverLoggedIn ||
        ov.status_override === "Invited" ||
        u.status_override === "Invited"
      ) {
        accountStatus = "Invited";
      }

      const isDormant30 =
        isActive && daysSinceLogin !== null && daysSinceLogin >= 30;
      const isDormant60 =
        isActive && daysSinceLogin !== null && daysSinceLogin >= 60;
      const isActiveRecently =
        isActive && daysSinceLogin !== null && daysSinceLogin < 30;

      const activityLabel = neverLoggedIn
        ? "Never Logged In"
        : isDormant60
        ? `Dormant (${daysSinceLogin}d)`
        : isDormant30
        ? `Dormant (${daysSinceLogin}d)`
        : `Active (${formatRelativeAgo(daysSinceLogin)})`;

      const accessExpiry =
        ov.access_expiry !== undefined ? ov.access_expiry : u.access_expiry;
      const daysUntilExpiry = computeDaysUntilExpiry(accessExpiry);
      const isExpiringSoon =
        daysUntilExpiry !== null &&
        daysUntilExpiry >= 0 &&
        daysUntilExpiry <= 14;

      const reactivationRequested =
        ov.reactivation_requested !== undefined
          ? ov.reactivation_requested
          : Boolean(u.reactivation_requested);

      const needsReview = isDormant30 || neverLoggedIn;

      return {
        ...u,
        name,
        email,
        phone,
        role,
        reporting_manager,
        franchise,
        joined_date,
        is_active: isActive,
        last_login: lastLogin,
        days_since_login: daysSinceLogin,
        never_logged_in: neverLoggedIn,
        account_status: accountStatus,
        activity_label: activityLabel,
        is_active_recently: isActiveRecently,
        is_dormant_30: isDormant30,
        is_dormant_60: isDormant60,
        needs_review: needsReview,
        deactivated_by: ov.deactivated_by ?? u.deactivated_by ?? null,
        deactivated_on: ov.deactivated_on ?? u.deactivated_on ?? null,
        deactivated_reason:
          ov.deactivated_reason ?? u.deactivated_reason ?? null,
        access_expiry: accessExpiry,
        days_until_expiry: daysUntilExpiry,
        is_expiring_soon: isExpiringSoon,
        reactivation_requested: reactivationRequested,
        status_history: ov.status_history || [],
      };
    });
  }, [dbUsers, auditMap]);

  const summaryStats = useMemo(() => {
    const total = enrichedUsers.length;
    const activeAccounts = enrichedUsers.filter(
      (u) => u.account_status === "Active"
    ).length;
    const needsReview = enrichedUsers.filter((u) => u.needs_review).length;
    const invited = enrichedUsers.filter(
      (u) => u.account_status === "Invited"
    ).length;
    const dormant30 = enrichedUsers.filter((u) => u.is_dormant_30).length;
    const dormant60 = enrichedUsers.filter((u) => u.is_dormant_60).length;
    const suspended = enrichedUsers.filter(
      (u) => u.account_status === "Suspended"
    ).length;
    const deactivated = enrichedUsers.filter(
      (u) => u.account_status === "Deactivated"
    ).length;
    const reactivationRequests = enrichedUsers.filter(
      (u) => u.reactivation_requested
    ).length;
    const activeRecently = enrichedUsers.filter(
      (u) => u.is_active_recently
    ).length;
    const totalLogins30d = enrichedUsers.reduce(
      (acc, u) => acc + (u.login_count_30d || 0),
      0
    );

    return {
      total,
      activeAccounts,
      needsReview,
      invited,
      dormant30,
      dormant60,
      suspended,
      deactivated,
      reactivationRequests,
      activeRecently,
      totalLogins30d,
    };
  }, [enrichedUsers]);

  const distinctRoles = useMemo(
    () => Array.from(new Set(enrichedUsers.map((u) => u.role))),
    [enrichedUsers]
  );

  const distinctLocations = useMemo(
    () =>
      Array.from(
        new Set(
          enrichedUsers.map((u) => u.franchise?.split(" ")[0]?.trim() || "Mumbai")
        )
      ),
    [enrichedUsers]
  );

  const handleApplySavedView = (viewKey) => {
    setSavedView(viewKey);
    setRoleFilter("All Roles");
    setLocationFilter("All Locations");
    setAccountStatusFilter("All");
    setActivityFilter("Any");
  };

  const handleClearAllFilters = () => {
    setSearchQuery("");
    setRoleFilter("All Roles");
    setLocationFilter("All Locations");
    setAccountStatusFilter("All");
    setActivityFilter("Any");
    setSavedView("ALL");
  };

  const filteredUsers = useMemo(() => {
    return enrichedUsers.filter((u) => {
      if (savedView === "ACTIVE_ACCOUNTS" && u.account_status !== "Active")
        return false;
      if (savedView === "NEEDS_REVIEW" && !u.needs_review) return false;
      if (savedView === "DORMANT_30" && !u.is_dormant_30) return false;
      if (savedView === "INVITED" && u.account_status !== "Invited")
        return false;
      if (savedView === "SUSPENDED" && u.account_status !== "Suspended")
        return false;
      if (savedView === "REACTIVATION" && !u.reactivation_requested)
        return false;

      if (roleFilter !== "All Roles" && u.role !== roleFilter) return false;
      if (
        locationFilter !== "All Locations" &&
        !String(u.franchise || "").startsWith(locationFilter)
      )
        return false;
      if (
        accountStatusFilter !== "All" &&
        u.account_status !== accountStatusFilter
      )
        return false;

      if (activityFilter === "Active Recently" && !u.is_active_recently)
        return false;
      if (activityFilter === "Dormant 30d+" && !u.is_dormant_30) return false;
      if (activityFilter === "Never Logged In" && !u.never_logged_in)
        return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.role.toLowerCase().includes(q) ||
          String(u.reporting_manager || "")
            .toLowerCase()
            .includes(q) ||
          String(u.franchise || "")
            .toLowerCase()
            .includes(q)
        );
      }

      return true;
    });
  }, [
    enrichedUsers,
    savedView,
    roleFilter,
    locationFilter,
    accountStatusFilter,
    activityFilter,
    searchQuery,
  ]);

  const handleSaveProfile = (userId, updatedFields) => {
    const todayStr = REFERENCE_NOW.toISOString().split("T")[0];
    setAuditMap((prev) => {
      const prevEntry = prev[userId] || {};
      return {
        ...prev,
        [userId]: {
          ...prevEntry,
          ...updatedFields,
          status_history: [
            {
              id: `prof_${Date.now()}`,
              action: "Profile & Role Updated",
              actor: "L&D Lead Admin",
              date: todayStr,
              reason: `Role: ${updatedFields.role} • Location: ${updatedFields.franchise} • Mgr: ${updatedFields.reporting_manager}`,
            },
            ...(prevEntry.status_history || []),
          ],
        },
      };
    });
    showToast(`✓ Saved profile changes for ${updatedFields.name}!`);
  };

  const handleInviteNewUser = (newUserPayload) => {
    const newId = Math.max(0, ...dbUsers.map((u) => u.id)) + 1;
    const todayStr = REFERENCE_NOW.toISOString().split("T")[0];
    const created = {
      id: newId,
      name: newUserPayload.name,
      email: newUserPayload.email,
      phone: "+91 98200 00000",
      role: newUserPayload.role,
      reporting_manager: newUserPayload.reporting_manager,
      franchise: newUserPayload.franchise,
      joined_date: todayStr,
      last_login: null,
      login_count_30d: 0,
      is_active: true,
      status_override: "Invited",
      access_expiry: newUserPayload.access_expiry,
      reactivation_requested: false,
      curos: 0,
      streak_days: 0,
      risk_score: 50,
      certificates: 0,
      programs: [{ name: "Onboarding Readiness Track", progress: 0 }],
    };
    setDbUsers((prev) => [created, ...prev]);
    showToast(`✉️ Invitation dispatched to ${created.name} (${created.email})!`);
  };

  const handleImportCsvUsers = (importedArray) => {
    const todayStr = REFERENCE_NOW.toISOString().split("T")[0];
    setDbUsers((prev) => {
      const maxId = Math.max(0, ...prev.map((u) => u.id));
      const newEntries = importedArray.map((item, i) => ({
        id: maxId + i + 1,
        name: item.name,
        email: item.email,
        phone: "+91 98200 00000",
        role: item.role,
        reporting_manager: item.reporting_manager,
        franchise: item.franchise,
        joined_date: todayStr,
        last_login: null,
        login_count_30d: 0,
        is_active: true,
        status_override: "Invited",
        access_expiry: null,
        reactivation_requested: false,
        curos: 0,
        streak_days: 0,
        risk_score: 50,
        certificates: 0,
        programs: [{ name: "Onboarding Readiness Track", progress: 0 }],
      }));
      return [...newEntries, ...prev];
    });
    showToast(`📥 Imported ${importedArray.length} users and sent invitations!`);
  };

  const handleActivateUsers = async (
    targetList,
    customReason = "Admin Reactivation"
  ) => {
    const ids = targetList.map((u) => u.id);
    const todayStr = REFERENCE_NOW.toISOString().split("T")[0];

    setAuditMap((prev) => {
      const next = { ...prev };
      targetList.forEach((u) => {
        const prevEntry = next[u.id] || {};
        next[u.id] = {
          ...prevEntry,
          is_active: true,
          status_override: "Active",
          deactivated_by: null,
          deactivated_on: null,
          deactivated_reason: null,
          reactivation_requested: false,
          status_history: [
            {
              id: `act_${Date.now()}_${u.id}`,
              action: "Reactivated Account",
              actor: "L&D Lead Admin",
              date: todayStr,
              reason: customReason,
            },
            ...(prevEntry.status_history || []),
          ],
        };
      });
      return next;
    });

    setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));
    showToast(`✓ Reactivated ${targetList.length} account(s)!`);
  };

  const handleConfirmDeactivation = async ({
    users,
    newStatus,
    reason,
    deactivatedBy,
    deactivatedOn,
  }) => {
    const ids = users.map((u) => u.id);

    setAuditMap((prev) => {
      const next = { ...prev };
      users.forEach((u) => {
        const prevEntry = next[u.id] || {};
        next[u.id] = {
          ...prevEntry,
          is_active: false,
          status_override: newStatus,
          deactivated_by: deactivatedBy,
          deactivated_on: deactivatedOn,
          deactivated_reason: reason,
          status_history: [
            {
              id: `deact_${Date.now()}_${u.id}`,
              action:
                newStatus === "Suspended"
                  ? "Suspended Account"
                  : "Deactivated Account",
              actor: deactivatedBy,
              date: deactivatedOn,
              reason,
            },
            ...(prevEntry.status_history || []),
          ],
        };
      });
      return next;
    });

    setDeactModalState({
      isOpen: false,
      users: [],
      actionType: "Deactivated",
    });
    setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));
    showToast(
      `🛡️ ${newStatus} ${users.length} account(s) • Reason: "${reason}"`
    );
  };

  const handleUpdateExpiry = (userId, newExpiryDate) => {
    const todayStr = REFERENCE_NOW.toISOString().split("T")[0];
    setAuditMap((prev) => {
      const prevEntry = prev[userId] || {};
      return {
        ...prev,
        [userId]: {
          ...prevEntry,
          access_expiry: newExpiryDate,
          status_history: [
            {
              id: `exp_${Date.now()}`,
              action: newExpiryDate
                ? `Access Expiry Set to ${newExpiryDate}`
                : "Set to Permanent Access",
              actor: "L&D Lead Admin",
              date: todayStr,
              reason: "Temporary/Intern lifecycle governance update",
            },
            ...(prevEntry.status_history || []),
          ],
        },
      };
    });
    showToast(
      newExpiryDate
        ? `⏳ Set access expiry to ${newExpiryDate}`
        : "✓ Set account to Permanent Access"
    );
  };

  const handleExportAuditCSV = (targetArray = enrichedUsers) => {
    const headers = [
      "ID,Name,Email,Phone,Role,Reporting Manager,Location,Account Status,Activity,Last Login,30d Logins,Access Expiry,Deactivated By,Deactivated On,Reason,Curos,Risk Score",
    ];
    const rows = targetArray.map(
      (u) =>
        `${u.id},"${u.name}","${u.email}","${u.phone}","${u.role}","${
          u.reporting_manager
        }","${u.franchise}","${u.account_status}","${u.activity_label}","${
          u.last_login || "Never"
        }",${u.login_count_30d},"${u.access_expiry || "Permanent"}","${
          u.deactivated_by || "-"
        }","${u.deactivated_on || "-"}","${u.deactivated_reason || "-"}",${
          u.curos ?? 0
        },${u.risk_score ?? 0}%`
    );
    const blob = new Blob(["\uFEFF" + [...headers, ...rows].join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Saarthi_Users_And_Access_Audit_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`📊 Exported ${targetArray.length} user records to CSV!`);
  };

  const inspectedDrawerUser = useMemo(
    () => enrichedUsers.find((u) => u.id === drawerState.userId) || null,
    [enrichedUsers, drawerState.userId]
  );

  const allVisibleSelected =
    filteredUsers.length > 0 &&
    filteredUsers.every((u) => selectedIds.includes(u.id));

  const toggleSelectAllVisible = () => {
    if (allVisibleSelected) {
      const visibleSet = new Set(filteredUsers.map((u) => u.id));
      setSelectedIds((prev) => prev.filter((id) => !visibleSet.has(id)));
    } else {
      const merged = new Set([
        ...selectedIds,
        ...filteredUsers.map((u) => u.id),
      ]);
      setSelectedIds(Array.from(merged));
    }
  };

  return (
    <MainLayout>
      <div
        onClick={() => {
          setOpenMenuUserId(null);
          setHeaderOverflowOpen(false);
        }}
        className={`-m-4 sm:-m-6 p-5 sm:p-7 min-h-screen font-sans space-y-6 overflow-x-hidden transition-colors duration-300 ${
          isLight
            ? "bg-[#F5F0E6] text-stone-900 selection:bg-amber-400 selection:text-stone-950"
            : "bg-[#060913] text-slate-100 selection:bg-cyan-400 selection:text-slate-950"
        }`}
      >
        {/* ===================================================================
            CSS ARCHITECTURE:
            1. KPI Metallic Shine (`.metal-gloss-*-kpi-live`)
            2. Normal Static Dark Directory Container (`.normal-dark-directory-section`)
            3. Horizontal Stacked User Tabs with Dark Background + 5 Accent Borders
            4. Vibe-Matched Dark-Glass Neon-Edge Buttons (`.vibe-btn-*`)
        =================================================================== */}
        <style>{`
          /* ===================================================================
             1. FREE-FLOATING 3D AI AVATAR ANIMATION (NO BOX / NO SPECIAL TAB)
          =================================================================== */
          @keyframes aiFreeFloat3D {
            0%, 100% {
              transform: translate3d(0px, 0px, 0) rotate(-1.5deg) scale(1);
            }
            50% {
              transform: translate3d(0px, -12px, 0) rotate(2deg) scale(1.04);
            }
          }
          @keyframes aiFloorShadowPulse {
            0%, 100% { transform: scaleX(1); opacity: 0.55; }
            50% { transform: scaleX(0.65); opacity: 0.22; }
          }
          .animate-ai-free-float {
            animation: aiFreeFloat3D 2.8s ease-in-out infinite;
            will-change: transform;
          }
          .animate-ai-shadow {
            animation: aiFloorShadowPulse 2.8s ease-in-out infinite;
          }

          /* ===================================================================
             MAIN TAB: CLEAN OBSIDIAN CHASSIS (STATIC, NO MULTI-COLOUR MOVEMENT)
          =================================================================== */
          @keyframes miniKpiBaseFlow {
            0%   { background-position: 0% 50%, 0% 0%; }
            50%  { background-position: 100% 50%, 100% 100%; }
            100% { background-position: 0% 50%, 0% 0%; }
          }

          /* 1. Outer Main Tab: Deep Obsidian Luxury Background with High-Definition Gold Border */
          .ai-unified-main-tab-light,
          .ai-main-tab-dark-border {
            position: relative;
            isolation: isolate;
            overflow: hidden;
            background: linear-gradient(
              135deg,
              #0E0D1F 0%,
              #0A0B17 55%,
              #06060E 100%
            ) !important;
            border: 2.5px solid rgba(245, 196, 81, 0.85) !important;
            box-shadow:
              0 24px 54px rgba(0, 0, 0, 0.94),
              0 0 30px -2px rgba(245, 196, 81, 0.38),
              inset 0 1px 2.5px rgba(254, 240, 138, 0.38) !important;
          }

          /* 2. Inner Sub-Tabs: Clean Dark Glass Pods with Crisp Defined Gold Borders */
          .ai-inner-glass-strip,
          .ai-middle-tab-light-border {
            position: relative;
            z-index: 10;
            background: rgba(14, 16, 32, 0.6) !important;
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            border: 2px solid rgba(245, 196, 81, 0.65) !important;
            box-shadow:
              0 8px 24px rgba(0, 0, 0, 0.5),
              0 0 18px -2px rgba(245, 196, 81, 0.28),
              inset 0 1px 2px rgba(255, 255, 255, 0.16) !important;
          }

          /* 3. Small KPI Cards: 100% Opaque Solid Base with Defined Jewel Borders */
          .mini-kpi-live-amber,
          .mini-kpi-live-rose,
          .mini-kpi-live-purple {
            position: relative;
            z-index: 20;
            isolation: isolate;
            background-size: 240% 240%, 100% 100% !important;
            animation: miniKpiBaseFlow 5.5s ease-in-out infinite !important;
            transition: transform 0.22s cubic-bezier(0.22, 1, 0.36, 1),
              box-shadow 0.22s ease, border-color 0.22s ease !important;
          }

          .mini-kpi-live-amber {
            background-color: #1A1107 !important;
            background-image:
              radial-gradient(circle at 80% 25%, rgba(251, 191, 36, 0.42) 0%, rgba(217, 119, 6, 0.22) 48%, transparent 74%),
              linear-gradient(135deg, #2D1D0C 0%, #523312 42%, #1A1107 100%) !important;
            border: 2px solid rgba(251, 191, 36, 0.95) !important;
            box-shadow:
              0 12px 26px rgba(0, 0, 0, 0.9),
              0 0 20px -2px rgba(245, 158, 11, 0.45),
              inset 0 1.5px 2px rgba(255, 255, 255, 0.42) !important;
          }
          .mini-kpi-live-amber:hover {
            transform: translateY(-3px);
            border-color: #FEF08A !important;
            box-shadow: 0 16px 32px rgba(0, 0, 0, 0.95), 0 0 26px rgba(245, 158, 11, 0.65), inset 0 1.5px 2px rgba(255, 255, 255, 0.5) !important;
          }

          .mini-kpi-live-rose {
            background-color: #1D0A13 !important;
            background-image:
              radial-gradient(circle at 25% 25%, rgba(251, 113, 133, 0.42) 0%, rgba(225, 29, 72, 0.22) 48%, transparent 74%),
              linear-gradient(135deg, #331021 0%, #591B37 42%, #1D0A13 100%) !important;
            border: 2px solid rgba(251, 113, 133, 0.95) !important;
            box-shadow:
              0 12px 26px rgba(0, 0, 0, 0.9),
              0 0 20px -2px rgba(244, 63, 94, 0.45),
              inset 0 1.5px 2px rgba(255, 255, 255, 0.42) !important;
          }
          .mini-kpi-live-rose:hover {
            transform: translateY(-3px);
            border-color: #FECDD3 !important;
            box-shadow: 0 16px 32px rgba(0, 0, 0, 0.95), 0 0 26px rgba(244, 63, 94, 0.65), inset 0 1.5px 2px rgba(255, 255, 255, 0.5) !important;
          }

          .mini-kpi-live-purple {
            background-color: #150C28 !important;
            background-image:
              radial-gradient(circle at 75% 75%, rgba(192, 132, 252, 0.44) 0%, rgba(126, 34, 206, 0.24) 48%, transparent 74%),
              linear-gradient(135deg, #241445 0%, #442375 42%, #150C28 100%) !important;
            border: 2px solid rgba(192, 132, 252, 0.95) !important;
            box-shadow:
              0 12px 26px rgba(0, 0, 0, 0.9),
              0 0 20px -2px rgba(168, 85, 247, 0.45),
              inset 0 1.5px 2px rgba(255, 255, 255, 0.42) !important;
          }
          .mini-kpi-live-purple:hover {
            transform: translateY(-3px);
            border-color: #F3E8FF !important;
            box-shadow: 0 16px 32px rgba(0, 0, 0, 0.95), 0 0 26px rgba(168, 85, 247, 0.65), inset 0 1.5px 2px rgba(255, 255, 255, 0.5) !important;
          }

          /* ===================================================================
             3. NORMAL STATIC DARK TABLE CONTAINER & DIRECTORY CONTAINERS
          =================================================================== */
          .normal-dark-table-shell {
            background: #070B14;
            border: 2.5px solid rgba(56, 189, 248, 0.7);
            box-shadow:
              0 24px 54px rgba(0, 0, 0, 0.94),
              0 0 32px -4px rgba(56, 189, 248, 0.3),
              inset 0 1px 2.5px rgba(255, 255, 255, 0.2);
          }

          .normal-dark-directory-section {
            background: #080D1A;
            border: 2px solid rgba(56, 189, 248, 0.52);
            box-shadow:
              0 20px 48px rgba(0, 0, 0, 0.92),
              0 0 24px -4px rgba(56, 189, 248, 0.22),
              inset 0 1px 2px rgba(255, 255, 255, 0.16);
          }

          /* ===================================================================
             4. USER TABS INSIDE THE DARK TABLE:
                LIVE BASE COLOUR CHANGE + ACCENT COLOUR BACKGROUND + 4-SIDED GLOW
          =================================================================== */
          @keyframes liveUserTabBaseFlow {
            0% {
              background-position: 0% 50%, 0% 0%;
            }
            50% {
              background-position: 100% 50%, 100% 100%;
            }
            100% {
              background-position: 0% 50%, 0% 0%;
            }
          }

          .live-user-tab-cyan,
          .live-user-tab-amber,
          .live-user-tab-purple,
          .live-user-tab-emerald,
          .live-user-tab-rose {
            position: relative;
            background-size: 260% 260%, 220% 220% !important;
            animation: liveUserTabBaseFlow 6.5s ease-in-out infinite !important;
            transition: transform 0.22s cubic-bezier(0.22, 1, 0.36, 1),
              box-shadow 0.22s ease, border-color 0.22s ease !important;
          }

          /* 1. CYAN LIVE BASE COLOUR USER TAB */
          .live-user-tab-cyan {
            background-image:
              radial-gradient(circle at 20% 50%, rgba(34, 211, 238, 0.32) 0%, rgba(2, 132, 199, 0.16) 45%, transparent 72%),
              linear-gradient(135deg, #0C253D 0%, #16446B 35%, #091B2E 70%, #123656 100%) !important;
            border: 2px solid rgba(56, 189, 248, 0.95) !important;
            box-shadow:
              0 0 22px -1px rgba(34, 211, 238, 0.42),
              0 8px 20px rgba(0, 0, 0, 0.8),
              inset 0 0 18px rgba(34, 211, 238, 0.2),
              inset 0 1px 1.5px rgba(255, 255, 255, 0.4) !important;
          }
          .live-user-tab-cyan:hover {
            transform: translateY(-2px);
            border-color: #A5F3FC !important;
            box-shadow: 0 0 30px 2px rgba(34, 211, 238, 0.65), inset 0 0 22px rgba(34, 211, 238, 0.28) !important;
          }

          /* 2. AMBER / GOLD LIVE BASE COLOUR USER TAB */
          .live-user-tab-amber {
            background-image:
              radial-gradient(circle at 80% 50%, rgba(251, 191, 36, 0.32) 0%, rgba(180, 83, 9, 0.18) 45%, transparent 72%),
              linear-gradient(135deg, #2E1F10 0%, #4E3316 35%, #1C130B 70%, #3D2712 100%) !important;
            border: 2px solid rgba(251, 191, 36, 0.95) !important;
            box-shadow:
              0 0 22px -1px rgba(245, 158, 11, 0.42),
              0 8px 20px rgba(0, 0, 0, 0.8),
              inset 0 0 18px rgba(245, 158, 11, 0.2),
              inset 0 1px 1.5px rgba(255, 255, 255, 0.4) !important;
          }
          .live-user-tab-amber:hover {
            transform: translateY(-2px);
            border-color: #FEF08A !important;
            box-shadow: 0 0 30px 2px rgba(245, 158, 11, 0.65), inset 0 0 22px rgba(245, 158, 11, 0.28) !important;
          }

          /* 3. PURPLE / AMETHYST LIVE BASE COLOUR USER TAB */
          .live-user-tab-purple {
            background-image:
              radial-gradient(circle at 30% 50%, rgba(192, 132, 252, 0.34) 0%, rgba(126, 34, 206, 0.18) 45%, transparent 72%),
              linear-gradient(135deg, #24163E 0%, #3F256D 35%, #150D28 70%, #311C54 100%) !important;
            border: 2px solid rgba(192, 132, 252, 0.95) !important;
            box-shadow:
              0 0 22px -1px rgba(168, 85, 247, 0.44),
              0 8px 20px rgba(0, 0, 0, 0.8),
              inset 0 0 18px rgba(168, 85, 247, 0.2),
              inset 0 1px 1.5px rgba(255, 255, 255, 0.4) !important;
          }
          .live-user-tab-purple:hover {
            transform: translateY(-2px);
            border-color: #E9D5FF !important;
            box-shadow: 0 0 30px 2px rgba(168, 85, 247, 0.65), inset 0 0 22px rgba(168, 85, 247, 0.28) !important;
          }

          /* 4. EMERALD / TEAL LIVE BASE COLOUR USER TAB */
          .live-user-tab-emerald {
            background-image:
              radial-gradient(circle at 70% 50%, rgba(52, 211, 153, 0.32) 0%, rgba(5, 150, 105, 0.18) 45%, transparent 72%),
              linear-gradient(135deg, #0D2B25 0%, #174E43 35%, #081C18 70%, #133D35 100%) !important;
            border: 2px solid rgba(52, 211, 153, 0.95) !important;
            box-shadow:
              0 0 22px -1px rgba(16, 185, 129, 0.42),
              0 8px 20px rgba(0, 0, 0, 0.8),
              inset 0 0 18px rgba(16, 185, 129, 0.2),
              inset 0 1px 1.5px rgba(255, 255, 255, 0.4) !important;
          }
          .live-user-tab-emerald:hover {
            transform: translateY(-2px);
            border-color: #A7F3D0 !important;
            box-shadow: 0 0 30px 2px rgba(16, 185, 129, 0.65), inset 0 0 22px rgba(16, 185, 129, 0.28) !important;
          }

          /* 5. ROSE / CRIMSON LIVE BASE COLOUR USER TAB */
          .live-user-tab-rose {
            background-image:
              radial-gradient(circle at 35% 50%, rgba(251, 113, 133, 0.32) 0%, rgba(190, 18, 60, 0.18) 45%, transparent 72%),
              linear-gradient(135deg, #311324 0%, #541F3C 35%, #1D0B16 70%, #42172E 100%) !important;
            border: 2px solid rgba(251, 113, 133, 0.95) !important;
            box-shadow:
              0 0 22px -1px rgba(244, 63, 94, 0.42),
              0 8px 20px rgba(0, 0, 0, 0.8),
              inset 0 0 18px rgba(244, 63, 94, 0.2),
              inset 0 1px 1.5px rgba(255, 255, 255, 0.4) !important;
          }
          .live-user-tab-rose:hover {
            transform: translateY(-2px);
            border-color: #FECDD3 !important;
            box-shadow: 0 0 30px 2px rgba(244, 63, 94, 0.65), inset 0 0 22px rgba(244, 63, 94, 0.28) !important;
          }

          /* ============================================================================
             1. SCOPED COMMON BASE-COLOUR STAGE (KPI CARDS AREA ONLY)
          ============================================================================ */
          @keyframes kpiStageCommonA {
            0%, 100% { transform: translate3d(-16%, -10%, 0) scale(1);    opacity: 0.58; }
            50%      { transform: translate3d(44%, 12%, 0)   scale(1.15); opacity: 0.88; }
          }

          @keyframes kpiStageCommonB {
            0%, 100% { transform: translate3d(36%, 14%, 0)  scale(1.1);  opacity: 0.52; }
            50%      { transform: translate3d(-22%, -8%, 0) scale(0.95); opacity: 0.82; }
          }

          .kpi-ambient-stage {
            position: relative;
            isolation: isolate;
            overflow: hidden;
            border-radius: 1.75rem;
            padding: 14px;
            background: linear-gradient(180deg, #090814 0%, #06060E 100%);
            border: 1.5px solid rgba(212, 175, 55, 0.45);
            box-shadow:
              inset 0 2px 18px rgba(0, 0, 0, 0.88),
              0 0 20px -4px rgba(212, 175, 55, 0.2),
              0 18px 42px rgba(0, 0, 0, 0.72);
          }

          /* Unified slow-moving base-colour clouds drifting behind all 4 KPI cards */
          .kpi-stage-glow-a,
          .kpi-stage-glow-b {
            position: absolute;
            border-radius: 9999px;
            pointer-events: none;
            z-index: 0;
            will-change: transform, opacity;
          }

          .kpi-stage-glow-a {
            width: 56%;
            height: 165%;
            top: -32%;
            left: -8%;
            background: radial-gradient(
              ellipse at center,
              rgba(147, 51, 234, 0.36) 0%,
              rgba(217, 119, 6, 0.22) 48%,
              transparent 74%
            );
            filter: blur(56px);
            animation: kpiStageCommonA 16s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite;
          }

          .kpi-stage-glow-b {
            width: 54%;
            height: 165%;
            bottom: -35%;
            right: -8%;
            background: radial-gradient(
              ellipse at center,
              rgba(245, 196, 81, 0.3) 0%,
              rgba(126, 34, 206, 0.26) 50%,
              transparent 74%
            );
            filter: blur(60px);
            animation: kpiStageCommonB 21s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite;
          }

          /* ============================================================================
             2. DENSE 3PX 24K GOLDEN BORDER + SYNCHRONIZED INTERIOR CORNER FADE
             Driven by non-circular random corner trajectories (no conic rotation).
             Both border & interior glow share the exact same --gl1x/y and --gl2x/y.
          ============================================================================ */
          @property --gl1x { syntax: "<percentage>"; inherits: false; initial-value: 12%; }
          @property --gl1y { syntax: "<percentage>"; inherits: false; initial-value: 10%; }
          @property --gl2x { syntax: "<percentage>"; inherits: false; initial-value: 88%; }
          @property --gl2y { syntax: "<percentage>"; inherits: false; initial-value: 90%; }

          /* Card 1: Diagonal Top-Left <-> Bottom-Right Criss-Cross with Edge Pauses */
          @keyframes goldRandom1A {
            0%   { --gl1x: 10%; --gl1y: 8%;  }  /* Top-left corner */
            18%  { --gl1x: 48%; --gl1y: 6%;  }  /* Top center */
            38%  { --gl1x: 92%; --gl1y: 24%; }  /* Upper right edge */
            58%  { --gl1x: 88%; --gl1y: 88%; }  /* Bottom-right corner */
            78%  { --gl1x: 22%; --gl1y: 92%; }  /* Bottom edge */
            100% { --gl1x: 10%; --gl1y: 8%;  }  /* Back to top-left */
          }
          @keyframes goldRandom1B {
            0%   { --gl2x: 90%; --gl2y: 92%; }  /* Bottom-right corner */
            22%  { --gl2x: 16%; --gl2y: 84%; }  /* Bottom-left corner */
            46%  { --gl2x: 12%; --gl2y: 38%; }  /* Left vertical edge */
            72%  { --gl2x: 64%; --gl2y: 8%;  }  /* Top-right bevel */
            100% { --gl2x: 90%; --gl2y: 92%; }  /* Back to bottom-right */
          }

          /* Card 2: Figure-8 Inverted Loop */
          @keyframes goldRandom2A {
            0%   { --gl1x: 92%; --gl1y: 12%; }  /* Top-right corner */
            24%  { --gl1x: 14%; --gl1y: 86%; }  /* Cross to bottom-left */
            48%  { --gl1x: 88%; --gl1y: 88%; }  /* Slide to bottom-right */
            74%  { --gl1x: 10%; --gl1y: 14%; }  /* Cross to top-left */
            100% { --gl1x: 92%; --gl1y: 12%; }  /* Return */
          }
          @keyframes goldRandom2B {
            0%   { --gl2x: 12%; --gl2y: 48%; }  /* Mid-left */
            28%  { --gl2x: 86%; --gl2y: 6%;  }  /* Top-right */
            54%  { --gl2x: 48%; --gl2y: 92%; }  /* Mid-bottom */
            82%  { --gl2x: 92%; --gl2y: 46%; }  /* Mid-right */
            100% { --gl2x: 12%; --gl2y: 48%; }  /* Return */
          }

          /* Card 3: Counter-Clockwise Erratic Perimeter Jump */
          @keyframes goldRandom3A {
            0%   { --gl1x: 12%; --gl1y: 90%; }  /* Bottom-left */
            22%  { --gl1x: 90%; --gl1y: 84%; }  /* Bottom-right */
            44%  { --gl1x: 94%; --gl1y: 12%; }  /* Top-right */
            70%  { --gl1x: 10%; --gl1y: 10%; }  /* Top-left */
            88%  { --gl1x: 8%;  --gl1y: 52%; }  /* Left waist */
            100% { --gl1x: 12%; --gl1y: 90%; }  /* Return */
          }
          @keyframes goldRandom3B {
            0%   { --gl2x: 52%; --gl2y: 8%;  }  /* Top-center */
            26%  { --gl2x: 14%; --gl2y: 72%; }  /* Lower-left */
            56%  { --gl2x: 86%; --gl2y: 90%; }  /* Bottom-right */
            80%  { --gl2x: 92%; --gl2y: 28%; }  /* Upper-right */
            100% { --gl2x: 52%; --gl2y: 8%;  }  /* Return */
          }

          /* Card 4: Diamond Corner Ricochet */
          @keyframes goldRandom4A {
            0%   { --gl1x: 50%; --gl1y: 6%;  }  /* Top center */
            25%  { --gl1x: 94%; --gl1y: 50%; }  /* Right center */
            50%  { --gl1x: 50%; --gl1y: 94%; }  /* Bottom center */
            75%  { --gl1x: 6%;  --gl1y: 50%; }  /* Left center */
            100% { --gl1x: 50%; --gl1y: 6%;  }  /* Return */
          }
          @keyframes goldRandom4B {
            0%   { --gl2x: 12%; --gl2y: 12%; }  /* Top-left */
            30%  { --gl2x: 88%; --gl2y: 88%; }  /* Bottom-right */
            60%  { --gl2x: 88%; --gl2y: 12%; }  /* Top-right */
            85%  { --gl2x: 12%; --gl2y: 88%; }  /* Bottom-left */
            100% { --gl2x: 12%; --gl2y: 12%; }  /* Return */
          }

          /* ============================================================================
             2. INACTIVE TAB METALLIC SATIN INTERIORS + LIVE 24K GOLD BEZEL BORDERS
             Combines the rich specular metallic backgrounds from the inactive tab
             with 3.5px dense 24K machined gold borders & live roving specular flares.
          ============================================================================ */
          .dense-gold-kpi {
            position: relative;
            z-index: 10;
            isolation: isolate;
            overflow: hidden;
            border-radius: 1.25rem;
            border: 3.5px solid transparent;
            background-clip: padding-box, padding-box, border-box, border-box, border-box;
            background-origin: padding-box, padding-box, border-box, border-box, border-box;
            box-shadow:
              0 14px 34px rgba(0, 0, 0, 0.78),
              0 0 24px -4px rgba(234, 179, 8, 0.45),
              inset 0 1.5px 2px rgba(255, 255, 255, 0.45);
            transition: transform 0.25s cubic-bezier(0.22, 1, 0.36, 1),
              box-shadow 0.25s ease;
          }

          /* Card 1: TOTAL USERS — Inactive Tab Metal Gloss Purple + Live 24K Gold Border */
          .dense-gold-kpi-purple {
            background-image:
              /* Interior Layer 1: Specular circle highlight from inactive tab */
              radial-gradient(circle at 88% 14%, rgba(255, 255, 255, 0.36) 0%, rgba(192, 132, 252, 0.18) 28%, transparent 62%),
              /* Interior Layer 2: Deep rich Purple satin base from inactive tab */
              linear-gradient(135deg, #352F5B 0%, #211F3D 52%, #14142B 100%),
              /* Border Layer 1: Roving white-hot 24K gold flare */
              radial-gradient(ellipse 48% 54% at var(--gl1x) var(--gl1y), #FFFFFF 0%, #FFFBEB 18%, #FDE047 38%, rgba(217, 119, 6, 0.85) 56%, transparent 72%),
              /* Border Layer 2: Secondary roving molten amber highlight */
              radial-gradient(ellipse 54% 60% at var(--gl2x) var(--gl2y), #FEF9C3 0%, #FACC15 26%, rgba(180, 83, 9, 0.78) 50%, transparent 72%),
              /* Border Layer 3: Dense solid 24K brushed gold foundation */
              linear-gradient(135deg, #8A5D12 0%, #E5B442 25%, #734B0B 50%, #F5CE67 75%, #875B10 100%);
          }

          /* Card 2: ACTIVE ACCOUNTS — Inactive Tab Metal Gloss Cyan + Live 24K Gold Border */
          .dense-gold-kpi-cyan {
            background-image:
              /* Interior Layer 1: Specular circle highlight from inactive tab */
              radial-gradient(circle at 88% 14%, rgba(255, 255, 255, 0.38) 0%, rgba(56, 189, 248, 0.22) 28%, transparent 62%),
              /* Interior Layer 2: Deep rich Cyan satin base from inactive tab */
              linear-gradient(135deg, #243B55 0%, #17263C 52%, #0F1829 100%),
              /* Border Layer 1: Roving white-hot 24K gold flare */
              radial-gradient(ellipse 48% 54% at var(--gl1x) var(--gl1y), #FFFFFF 0%, #FFFBEB 18%, #FDE047 38%, rgba(217, 119, 6, 0.85) 56%, transparent 72%),
              /* Border Layer 2: Secondary roving molten amber highlight */
              radial-gradient(ellipse 54% 60% at var(--gl2x) var(--gl2y), #FEF9C3 0%, #FACC15 26%, rgba(180, 83, 9, 0.78) 50%, transparent 72%),
              /* Border Layer 3: Dense solid 24K brushed gold foundation */
              linear-gradient(135deg, #8A5D12 0%, #E5B442 25%, #734B0B 50%, #F5CE67 75%, #875B10 100%);
          }

          /* Card 3: NEEDS REVIEW — Inactive Tab Metal Gloss Amber + Live 24K Gold Border */
          .dense-gold-kpi-amber {
            background-image:
              /* Interior Layer 1: Specular circle highlight from inactive tab */
              radial-gradient(circle at 88% 14%, rgba(255, 255, 255, 0.38) 0%, rgba(251, 191, 36, 0.20) 28%, transparent 62%),
              /* Interior Layer 2: Deep rich Amber satin base from inactive tab */
              linear-gradient(135deg, #463730 0%, #292228 52%, #181622 100%),
              /* Border Layer 1: Roving white-hot 24K gold flare */
              radial-gradient(ellipse 48% 54% at var(--gl1x) var(--gl1y), #FFFFFF 0%, #FFFBEB 18%, #FDE047 38%, rgba(217, 119, 6, 0.85) 56%, transparent 72%),
              /* Border Layer 2: Secondary roving molten amber highlight */
              radial-gradient(ellipse 54% 60% at var(--gl2x) var(--gl2y), #FEF9C3 0%, #FACC15 26%, rgba(180, 83, 9, 0.78) 50%, transparent 72%),
              /* Border Layer 3: Dense solid 24K brushed gold foundation */
              linear-gradient(135deg, #8A5D12 0%, #E5B442 25%, #734B0B 50%, #F5CE67 75%, #875B10 100%);
          }

          /* Card 4: PENDING / INVITED — Inactive Tab Metal Gloss Rose + Live 24K Gold Border */
          .dense-gold-kpi-rose {
            background-image:
              /* Interior Layer 1: Specular circle highlight from inactive tab */
              radial-gradient(circle at 88% 14%, rgba(255, 255, 255, 0.36) 0%, rgba(251, 113, 133, 0.22) 28%, transparent 62%),
              /* Interior Layer 2: Deep rich Rose satin base from inactive tab */
              linear-gradient(135deg, #49263B 0%, #2B192C 52%, #181120 100%),
              /* Border Layer 1: Roving white-hot 24K gold flare */
              radial-gradient(ellipse 48% 54% at var(--gl1x) var(--gl1y), #FFFFFF 0%, #FFFBEB 18%, #FDE047 38%, rgba(217, 119, 6, 0.85) 56%, transparent 72%),
              /* Border Layer 2: Secondary roving molten amber highlight */
              radial-gradient(ellipse 54% 60% at var(--gl2x) var(--gl2y), #FEF9C3 0%, #FACC15 26%, rgba(180, 83, 9, 0.78) 50%, transparent 72%),
              /* Border Layer 3: Dense solid 24K brushed gold foundation */
              linear-gradient(135deg, #8A5D12 0%, #E5B442 25%, #734B0B 50%, #F5CE67 75%, #875B10 100%);
          }

          .dense-gold-kpi:hover {
            transform: translateY(-3px);
            box-shadow:
              0 22px 44px -6px rgba(0, 0, 0, 0.94),
              0 0 34px -2px rgba(245, 208, 97, 0.65),
              inset 0 1.5px 2px rgba(255, 255, 255, 0.6);
          }

          .dense-gold-kpi.is-active {
            box-shadow:
              0 20px 42px -6px rgba(0, 0, 0, 0.95),
              0 0 36px 0px rgba(250, 204, 21, 0.75),
              inset 0 1.5px 2px rgba(255, 255, 255, 0.65);
          }

          /* 4 Unique Non-Harmonic Motion Profiles (Prime-Ratio Timings) */
          .gold-random-1 {
            animation:
              goldRandom1A 12.7s cubic-bezier(0.42, 0, 0.58, 1) infinite,
              goldRandom1B 17.9s cubic-bezier(0.42, 0, 0.58, 1) infinite;
          }

          .gold-random-2 {
            animation:
              goldRandom2A 14.3s cubic-bezier(0.42, 0, 0.58, 1) infinite,
              goldRandom2B 19.7s cubic-bezier(0.42, 0, 0.58, 1) infinite;
          }

          .gold-random-3 {
            animation:
              goldRandom3A 11.9s cubic-bezier(0.42, 0, 0.58, 1) infinite,
              goldRandom3B 16.3s cubic-bezier(0.42, 0, 0.58, 1) infinite;
          }

          .gold-random-4 {
            animation:
              goldRandom4A 13.5s cubic-bezier(0.42, 0, 0.58, 1) infinite,
              goldRandom4B 18.9s cubic-bezier(0.42, 0, 0.58, 1) infinite;
          }
          .metal-gloss-amber-kpi-live {
            position: relative;
            isolation: isolate;
            overflow: hidden;
            background:
              radial-gradient(circle at 88% 14%, rgba(255, 255, 255, 0.36) 0%, rgba(251, 191, 36, 0.2) 28%, transparent 62%),
              linear-gradient(135deg, #463730 0%, #292228 52%, #181622 100%);
            border: 1.5px solid rgba(253, 224, 71, 0.62);
            box-shadow: 0 14px 34px rgba(0, 0, 0, 0.75), inset 0 1.5px 2px rgba(255, 255, 255, 0.45);
          }
          .metal-gloss-rose-kpi-live {
            position: relative;
            isolation: isolate;
            overflow: hidden;
            background:
              radial-gradient(circle at 88% 14%, rgba(255, 255, 255, 0.34) 0%, rgba(251, 113, 133, 0.22) 28%, transparent 62%),
              linear-gradient(135deg, #49263B 0%, #2B192C 52%, #181120 100%);
            border: 1.5px solid rgba(253, 164, 175, 0.62);
            box-shadow: 0 14px 34px rgba(0, 0, 0, 0.75), inset 0 1.5px 2px rgba(255, 255, 255, 0.45);
          }

          /* Vibe-Matched Luminous Edge Buttons */
          .vibe-btn-cyan {
            background: linear-gradient(180deg, rgba(14, 116, 144, 0.48) 0%, rgba(9, 25, 45, 0.94) 100%);
            border: 1.5px solid rgba(56, 189, 248, 0.88);
            color: #E0F2FE;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.55), 0 0 12px rgba(34, 211, 238, 0.22), inset 0 1px 1px rgba(255, 255, 255, 0.28);
            transition: all 0.2s ease;
          }
          .vibe-btn-cyan:hover {
            background: linear-gradient(180deg, rgba(6, 182, 212, 0.65) 0%, rgba(12, 38, 64, 0.98) 100%);
            border-color: #A5F3FC;
            color: #FFFFFF;
            transform: translateY(-1px);
          }

          .vibe-btn-amber {
            background: linear-gradient(180deg, rgba(180, 83, 9, 0.52) 0%, rgba(28, 18, 10, 0.94) 100%);
            border: 2px solid rgba(251, 191, 36, 0.95);
            color: #FEF08A;
            box-shadow: 0 4px 14px rgba(0, 0, 0, 0.55), 0 0 16px rgba(245, 158, 11, 0.35), inset 0 1px 1.5px rgba(255, 255, 255, 0.35);
            transition: all 0.2s ease;
          }
          .vibe-btn-amber:hover {
            background: linear-gradient(180deg, rgba(217, 119, 6, 0.7) 0%, rgba(42, 26, 12, 0.98) 100%);
            border-color: #FEF9C3;
            color: #FFFFFF;
            transform: translateY(-1px);
          }

          .vibe-btn-purple {
            background: linear-gradient(180deg, rgba(109, 40, 217, 0.52) 0%, rgba(22, 14, 42, 0.94) 100%);
            border: 1.8px solid rgba(192, 132, 252, 0.92);
            color: #F3E8FF;
            box-shadow: 0 4px 14px rgba(0, 0, 0, 0.55), 0 0 14px rgba(168, 85, 247, 0.3), inset 0 1px 1px rgba(255, 255, 255, 0.32);
            transition: all 0.2s ease;
          }
          .vibe-btn-purple:hover {
            background: linear-gradient(180deg, rgba(126, 34, 206, 0.68) 0%, rgba(34, 20, 64, 0.98) 100%);
            border-color: #E9D5FF;
            color: #FFFFFF;
            transform: translateY(-1px);
          }

          .vibe-btn-emerald {
            background: linear-gradient(180deg, rgba(5, 150, 105, 0.5) 0%, rgba(8, 28, 24, 0.94) 100%);
            border: 1.8px solid rgba(52, 211, 153, 0.92);
            color: #D1FAE5;
            box-shadow: 0 4px 14px rgba(0, 0, 0, 0.55), 0 0 14px rgba(16, 185, 129, 0.3), inset 0 1px 1px rgba(255, 255, 255, 0.32);
            transition: all 0.2s ease;
          }
          .vibe-btn-emerald:hover {
            background: linear-gradient(180deg, rgba(16, 185, 129, 0.68) 0%, rgba(10, 42, 35, 0.98) 100%);
            border-color: #A7F3D0;
            color: #FFFFFF;
            transform: translateY(-1px);
          }

          .vibe-btn-rose {
            background: linear-gradient(180deg, rgba(190, 18, 60, 0.52) 0%, rgba(32, 10, 20, 0.94) 100%);
            border: 1.8px solid rgba(251, 113, 133, 0.92);
            color: #FFE4E6;
            box-shadow: 0 4px 14px rgba(0, 0, 0, 0.55), 0 0 14px rgba(244, 63, 94, 0.3), inset 0 1px 1px rgba(255, 255, 255, 0.32);
            transition: all 0.2s ease;
          }
          .vibe-btn-rose:hover {
            background: linear-gradient(180deg, rgba(225, 29, 72, 0.68) 0%, rgba(48, 12, 28, 0.98) 100%);
            border-color: #FECDD3;
            color: #FFFFFF;
            transform: translateY(-1px);
          }

          .vibe-btn-slate {
            background: linear-gradient(180deg, rgba(30, 41, 59, 0.88) 0%, rgba(11, 16, 30, 0.96) 100%);
            border: 1.8px solid rgba(148, 163, 184, 0.7);
            color: #E2E8F0;
            box-shadow: 0 4px 14px rgba(0, 0, 0, 0.55), inset 0 1px 1.5px rgba(255, 255, 255, 0.22);
            transition: all 0.2s ease;
          }
          .vibe-btn-slate:hover {
            border-color: rgba(251, 191, 36, 0.85);
            color: #FEF08A;
            transform: translateY(-1px);
          }

          /* Modal Sub-Tab Borders */
          .modal-tab-border-cyan { background: #0B1120; border: 1.8px solid rgba(34, 211, 238, 0.85); box-shadow: 0 0 18px -4px rgba(34, 211, 238, 0.3); }
          .modal-tab-border-amber { background: #0B1120; border: 1.8px solid rgba(251, 191, 36, 0.85); box-shadow: 0 0 18px -4px rgba(245, 158, 11, 0.3); }
          .modal-tab-border-purple { background: #0B1120; border: 1.8px solid rgba(192, 132, 252, 0.85); box-shadow: 0 0 18px -4px rgba(168, 85, 247, 0.3); }
          .modal-tab-border-emerald { background: #0B1120; border: 1.8px solid rgba(52, 211, 153, 0.85); box-shadow: 0 0 18px -4px rgba(16, 185, 129, 0.3); }
          .modal-tab-border-rose { background: #0B1120; border: 1.8px solid rgba(251, 113, 133, 0.85); box-shadow: 0 0 18px -4px rgba(244, 63, 94, 0.3); }

          /* Cream Theme Fallbacks */
          .cream-gloss-surface { background: linear-gradient(135deg, #FFFDF9 0%, #F6EFE2 100%); border: 2px solid #D5C7B0; color: #1C1917; }
          .cream-dark-btn { background: #1C1917; border: 1.5px solid #3F3B36; color: #FAF7F0; }
          .cream-pill-gold { background: #1C1917; border: 1.5px solid #D97706; color: #FDE047; }
          .cream-pill-emerald { background: #1C1917; border: 1.5px solid #10B981; color: #6EE7B7; }
          .cream-graph-canvas { background: #EFE7D6; border: 1.8px solid #C8B99E; }
          .cream-inner-pod-emerald { background: #EBFBF3; border: 1.8px solid #34D399; color: #064E3B; }
          .cream-inner-pod-amber { background: #FEF7E0; border: 1.8px solid #F59E0B; color: #451A03; }
          .cream-inner-pod-cyan { background: #EBF6FD; border: 1.8px solid #38BDF8; color: #0C4A6E; }
          .cream-inner-pod-purple { background: #F5F0FF; border: 1.8px solid #A855F7; color: #3B0764; }
          .cream-inner-pod-rose { background: #FFF0F2; border: 1.8px solid #FB7185; color: #4C0519; }
          .cream-user-tab-purple { background: #FFFFFF; border: 2px solid #C4B5FD; border-left: 5px solid #7C3AED; }
          .cream-user-tab-cyan   { background: #FFFFFF; border: 2px solid #7DD3FC; border-left: 5px solid #0284C7; }
          .cream-user-tab-amber  { background: #FFFFFF; border: 2px solid #FCD34D; border-left: 5px solid #D97706; }
          .cream-user-tab-emerald{ background: #FFFFFF; border: 2px solid #6EE7B7; border-left: 5px solid #059669; }
          .cream-user-tab-rose   { background: #FFFFFF; border: 2px solid #FDA4AF; border-left: 5px solid #E11D48; }
        `}</style>

        {toast && (
          <div className="fixed bottom-6 right-6 z-50 metal-gloss-purple-kpi-live text-amber-300 px-5 py-3.5 rounded-2xl flex items-center gap-3 text-xs font-extrabold">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span>{toast}</span>
          </div>
        )}

        {/* ===================================================================
            ZONE 1: SIMPLE PAGE HEADER
        =================================================================== */}
        <header
          className={`rounded-3xl p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4 relative overflow-visible ${
            isLight ? "cream-gloss-surface" : "normal-dark-directory-section"
          }`}
        >
          <div className="flex items-center gap-4 relative z-10">
            <div
              className={`w-13 h-13 rounded-2xl flex items-center justify-center shrink-0 ${
                isLight ? "cream-pill-gold" : "vibe-btn-cyan"
              }`}
            >
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                Users &amp; Access
              </h1>
              <p className="text-xs sm:text-sm opacity-80 font-semibold mt-0.5">
                Manage user profiles, roles, account status, and access lifecycles.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 ml-auto relative z-20">
            <button
              type="button"
              onClick={() => setAiAnalystOpen((prev) => !prev)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-1.5 cursor-pointer ${
                isLight
                  ? "cream-dark-btn"
                  : aiAnalystOpen
                  ? "vibe-btn-purple"
                  : "vibe-btn-slate"
              }`}
            >
              <span>🤖</span>
              <span>{aiAnalystOpen ? "Hide AI Report" : "AI Report Box"}</span>
            </button>

            <button
              type="button"
              onClick={() => setImportCsvModalOpen(true)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-1.5 cursor-pointer ${
                isLight ? "cream-dark-btn" : "vibe-btn-slate"
              }`}
            >
              <span>📥</span>
              <span>Import CSV</span>
            </button>

            <button
              type="button"
              onClick={() => setInviteModalOpen(true)}
              className={`px-5 py-2.5 rounded-2xl text-xs font-black flex items-center gap-1.5 cursor-pointer ${
                isLight ? "cream-pill-gold" : "vibe-btn-amber"
              }`}
            >
              <span>+ Invite User</span>
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setHeaderOverflowOpen((prev) => !prev);
                }}
                className={`px-3.5 py-2.5 rounded-2xl text-xs font-black flex items-center gap-1 cursor-pointer ${
                  isLight ? "cream-dark-btn" : "vibe-btn-slate"
                }`}
              >
                <MoreHorizontal className="w-4 h-4" />
                <span>More</span>
              </button>

              {headerOverflowOpen && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute right-0 mt-2 w-56 rounded-2xl bg-[#0B1120] border-2 border-cyan-400/60 shadow-2xl py-2 z-50 text-xs text-white"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setHeaderOverflowOpen(false);
                      handleExportAuditCSV(enrichedUsers);
                    }}
                    className="w-full px-4 py-2.5 hover:bg-white/10 flex items-center gap-2.5 font-bold cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-amber-300" />
                    <span>Export Audit CSV</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setHeaderOverflowOpen(false);
                      fetchUsersFromDB();
                      showToast("↻ Synced live workforce directory with DB!");
                    }}
                    className="w-full px-4 py-2.5 hover:bg-white/10 flex items-center gap-2.5 font-bold cursor-pointer"
                  >
                    <RefreshCw
                      className={`w-4 h-4 text-cyan-300 ${
                        syncing ? "animate-spin" : ""
                      }`}
                    />
                    <span>Sync DB</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setHeaderOverflowOpen(false);
                      handleToggleTheme();
                    }}
                    className="w-full px-4 py-2.5 hover:bg-white/10 flex items-center gap-2.5 font-bold cursor-pointer border-t border-white/10 mt-1 pt-2"
                  >
                    <span>{isLight ? "🌙" : "☀️"}</span>
                    <span>
                      Switch to {isLight ? "Dark Metallic" : "Cream Luxe"}
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ===================================================================
            ZONE 2: 4 KPI CARDS (SCOPED COMMON BASE-COLOUR STAGE + DENSE 3PX 24K GOLD)
        =================================================================== */}
        <section className={isLight ? "" : "kpi-ambient-stage"}>
          {/* Unified Smooth Moving Base-Colour Layer Behind All 4 KPI Cards */}
          {!isLight && (
            <>
              <div className="kpi-stage-glow-a" aria-hidden="true" />
              <div className="kpi-stage-glow-b" aria-hidden="true" />
            </>
          )}

          <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                id: "ALL",
                label: "TOTAL USERS",
                value: summaryStats.total ?? 23,
                subtitle: "Everyone in the system",
                themeCls: "dense-gold-kpi-purple",
                labelCls: "text-purple-200/90",
                numCls: isLight ? "text-stone-950" : "text-white",
                iconBox:
                  "bg-white/10 border border-white/20 text-purple-200 shadow-inner",
                barCls: "from-purple-400 via-fuchsia-300 to-indigo-300",
                barWidth: "100%",
                motionCls: "gold-random-1",
                icon: <Users className="w-5 h-5 stroke-[2.1]" />,
              },
              {
                id: "ACTIVE_ACCOUNTS",
                label: "ACTIVE ACCOUNTS",
                value: summaryStats.activeAccounts ?? 20,
                subtitle: "Can currently log in",
                themeCls: "dense-gold-kpi-cyan",
                labelCls: "text-cyan-200/90",
                numCls: isLight ? "text-sky-900" : "text-cyan-300",
                iconBox:
                  "bg-white/10 border border-white/20 text-cyan-200 shadow-inner",
                barCls: "from-cyan-400 via-teal-300 to-emerald-400",
                barWidth: "87%",
                motionCls: "gold-random-2",
                icon: <UserCheck className="w-5 h-5 stroke-[2.1]" />,
              },
              {
                id: "NEEDS_REVIEW",
                label: "NEEDS REVIEW",
                value: summaryStats.needsReview ?? 14,
                subtitle: "Dormant 30d+ OR Never Logged In",
                themeCls: "dense-gold-kpi-amber",
                labelCls: "text-amber-200/90",
                numCls: isLight ? "text-amber-900" : "text-amber-300",
                iconBox:
                  "bg-white/10 border border-white/20 text-amber-200 shadow-inner",
                barCls: "from-amber-400 via-yellow-300 to-amber-100",
                barWidth: "61%",
                motionCls: "gold-random-3",
                icon: <AlertTriangle className="w-5 h-5 stroke-[2.1]" />,
              },
              {
                id: "INVITED",
                label: "PENDING / INVITED",
                value: summaryStats.invited ?? 2,
                subtitle: "Invitation sent, not yet accepted",
                themeCls: "dense-gold-kpi-rose",
                labelCls: "text-rose-200/90",
                numCls: isLight ? "text-rose-900" : "text-rose-300",
                iconBox:
                  "bg-white/10 border border-white/20 text-rose-200 shadow-inner",
                barCls: "from-rose-500 via-pink-400 to-rose-200",
                barWidth: "16%",
                motionCls: "gold-random-4",
                icon: <Mail className="w-5 h-5 stroke-[2.1]" />,
              },
            ].map((card) => {
              const isActive = savedView === card.id;
              return (
                <div
                  key={card.id}
                  onClick={() => handleApplySavedView(card.id)}
                  className={`${
                    isLight
                      ? "cream-gloss-surface"
                      : `dense-gold-kpi ${card.themeCls} ${card.motionCls}`
                  } ${
                    isActive ? "is-active" : ""
                  } cursor-pointer group p-5 flex flex-col justify-between space-y-4 select-none`}
                >
                  {/* Top Row: Label, Big Number & Dark Accent Icon Capsule */}
                  <div className="flex items-start justify-between gap-3 relative z-10">
                    <div>
                      <span
                        className={`text-[10.5px] font-black uppercase tracking-[0.16em] block ${
                          isLight ? "text-amber-900/80" : card.labelCls
                        }`}
                      >
                        {card.label}
                      </span>
                      <span
                        className={`text-4xl font-black font-mono leading-none mt-2 block drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)] ${card.numCls}`}
                      >
                        {card.value}
                      </span>
                    </div>

                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105 ${card.iconBox}`}
                    >
                      {card.icon}
                    </div>
                  </div>

                  {/* Bottom Row: Description, Active Indicator & Accent Progress Bar */}
                  <div className="space-y-3 relative z-10">
                    <div className="flex items-end justify-between gap-2 min-h-[28px]">
                      <span className="text-xs font-semibold text-slate-300 leading-snug">
                        {card.subtitle}
                      </span>
                      {isActive && (
                        <span className="text-[10.5px] font-black text-amber-300 whitespace-nowrap shrink-0">
                          • Active View
                        </span>
                      )}
                    </div>

                    <div className="w-full h-2 rounded-full bg-black/40 p-0.5 border border-white/15 overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${card.barCls} transition-all duration-500`}
                        style={{ width: card.barWidth }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ===================================================================
            AI REPORT BOX WITH BOTTOM-RIGHT AVATAR & 50/50 SPLIT CHAT ON CLICK
            (Matches Sketch 1 `Screenshot 105` & Sketch 2 `Screenshot 106`)
        =================================================================== */}
        <AiWorkforceAnalystSection
          isOpen={aiAnalystOpen}
          onClose={() => setAiAnalystOpen(false)}
          summaryStats={summaryStats}
          enrichedUsers={enrichedUsers}
          onApplySavedView={(viewKey) => handleApplySavedView(viewKey)}
          onSendBulkReminder={() =>
            showToast(
              `✉️ Dispatched login reminder nudge to all ${summaryStats.needsReview} accounts needing review!`
            )
          }
          isLight={isLight}
        />

        {/* ===================================================================
            ZONE 3: CONDITIONAL ALERT BANNER
        =================================================================== */}
        {summaryStats.needsReview > 0 && !alertBannerDismissed && (
          <section className="rounded-3xl px-5 py-3.5 metal-gloss-amber-kpi-live flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 relative z-10">
              <div className="w-9 h-9 rounded-xl vibe-btn-amber flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <p className="text-xs sm:text-sm font-bold text-white">
                ⚠️{" "}
                <strong>
                  {summaryStats.needsReview} active/invited accounts
                </strong>{" "}
                have not logged in for 30+ days ({summaryStats.dormant30}{" "}
                dormant, {summaryStats.invited} never logged in). Review them
                before changing access.
              </p>
            </div>

            <div className="flex items-center gap-2 relative z-10">
              <button
                type="button"
                onClick={() => handleApplySavedView("NEEDS_REVIEW")}
                className="vibe-btn-amber px-4 py-2 rounded-xl text-xs font-black cursor-pointer"
              >
                Review Accounts
              </button>
              <button
                type="button"
                onClick={() => setAlertBannerDismissed(true)}
                className="vibe-btn-slate w-8 h-8 rounded-xl flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </section>
        )}

        {/* ===================================================================
            ZONE 4: SEARCH, FILTERS & SAVED VIEWS (3 STACKED ROWS)
        =================================================================== */}
        <section
          className={`rounded-3xl p-5 space-y-4 relative overflow-hidden ${
            isLight ? "cream-gloss-surface" : "normal-dark-directory-section"
          }`}
        >
          {/* Row A — Search Bar */}
          <div className="relative z-10">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, manager, or location…"
              className={`w-full rounded-2xl border pl-11 pr-4 py-3 text-xs font-bold outline-none transition ${
                isLight
                  ? "bg-white border-stone-400 text-stone-900 placeholder-stone-400"
                  : "bg-[#0D1326] border-slate-400/35 text-white placeholder-slate-400 focus:border-cyan-400"
              }`}
            />
          </div>

          {/* Row B — Dropdown Filters */}
          <div className="flex flex-wrap items-center gap-2.5 relative z-10">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className={`rounded-2xl px-3.5 py-2.5 text-xs font-black outline-none cursor-pointer ${
                isLight ? "cream-dark-btn" : "vibe-btn-slate"
              }`}
            >
              <option value="All Roles" className="bg-[#0B1120] text-white">
                Role: All Roles ({enrichedUsers.length})
              </option>
              {distinctRoles.map((r) => (
                <option key={r} value={r} className="bg-[#0B1120] text-white">
                  Role: {r}
                </option>
              ))}
            </select>

            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className={`rounded-2xl px-3.5 py-2.5 text-xs font-black outline-none cursor-pointer ${
                isLight ? "cream-dark-btn" : "vibe-btn-slate"
              }`}
            >
              <option value="All Locations" className="bg-[#0B1120] text-white">
                Location: All Franchises
              </option>
              {distinctLocations.map((loc) => (
                <option
                  key={loc}
                  value={loc}
                  className="bg-[#0B1120] text-white"
                >
                  Location: {loc}
                </option>
              ))}
            </select>

            <select
              value={accountStatusFilter}
              onChange={(e) => setAccountStatusFilter(e.target.value)}
              className={`rounded-2xl px-3.5 py-2.5 text-xs font-black outline-none cursor-pointer ${
                isLight ? "cream-dark-btn" : "vibe-btn-slate"
              }`}
            >
              <option value="All" className="bg-[#0B1120] text-white">
                Account Status: All
              </option>
              <option value="Active" className="bg-[#0B1120] text-white">
                🟢 Active
              </option>
              <option value="Suspended" className="bg-[#0B1120] text-white">
                🔴 Suspended
              </option>
              <option value="Deactivated" className="bg-[#0B1120] text-white">
                ⚫ Deactivated
              </option>
              <option value="Invited" className="bg-[#0B1120] text-white">
                🔵 Invited
              </option>
            </select>

            <select
              value={activityFilter}
              onChange={(e) => setActivityFilter(e.target.value)}
              className={`rounded-2xl px-3.5 py-2.5 text-xs font-black outline-none cursor-pointer ${
                isLight ? "cream-dark-btn" : "vibe-btn-slate"
              }`}
            >
              <option value="Any" className="bg-[#0B1120] text-white">
                Activity: Any
              </option>
              <option
                value="Active Recently"
                className="bg-[#0B1120] text-white"
              >
                Active Recently (&lt;30d)
              </option>
              <option value="Dormant 30d+" className="bg-[#0B1120] text-white">
                Dormant 30d+
              </option>
              <option
                value="Never Logged In"
                className="bg-[#0B1120] text-white"
              >
                Never Logged In
              </option>
            </select>

            <button
              type="button"
              onClick={handleClearAllFilters}
              className={`ml-auto px-4 py-2.5 rounded-2xl text-xs font-black cursor-pointer ${
                isLight ? "cream-dark-btn" : "vibe-btn-rose"
              }`}
            >
              Clear Filters
            </button>
          </div>

          {/* Row C — Saved View Smart Filter Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-cyan-400/25 relative z-10">
            <div className="flex flex-wrap items-center gap-2">
              {[
                { id: "ALL", label: `All Users (${summaryStats.total})` },
                {
                  id: "NEEDS_REVIEW",
                  label: `Needs Review (${summaryStats.needsReview})`,
                },
                {
                  id: "DORMANT_30",
                  label: `Dormant 30d+ (${summaryStats.dormant30})`,
                },
                { id: "INVITED", label: `Invited (${summaryStats.invited})` },
                {
                  id: "SUSPENDED",
                  label: `Suspended (${summaryStats.suspended})`,
                },
                {
                  id: "REACTIVATION",
                  label: `Reactivation Requests (${summaryStats.reactivationRequests})`,
                },
              ].map((tab) => {
                const isActive = savedView === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => handleApplySavedView(tab.id)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-black cursor-pointer transition ${
                      isLight
                        ? isActive
                          ? "cream-pill-gold"
                          : "cream-dark-btn"
                        : isActive
                        ? "vibe-btn-amber"
                        : "vibe-btn-slate"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <span className="text-xs font-bold opacity-80">
              Showing {filteredUsers.length} of {enrichedUsers.length} users
            </span>
          </div>
        </section>

        {/* ===================================================================
            ZONE 5: CONDITIONAL BULK ACTION BAR
        =================================================================== */}
        {selectedIds.length > 0 && (
          <section className="rounded-3xl px-5 py-3.5 normal-dark-directory-section border-2 border-amber-400/75 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-xl vibe-btn-amber text-xs font-black">
                {selectedIds.length} user(s) selected
              </span>
              <span className="text-xs opacity-85 hidden sm:inline">
                Bulk lifecycle actions require mandatory confirmation and audit logging.
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  showToast(
                    `✉️ Dispatched reminder email to ${selectedIds.length} selected user(s)!`
                  )
                }
                className="vibe-btn-cyan px-3.5 py-2 rounded-xl text-xs font-black cursor-pointer"
              >
                Send Reminder
              </button>

              <button
                type="button"
                onClick={() => {
                  const targets = enrichedUsers.filter((u) =>
                    selectedIds.includes(u.id)
                  );
                  setDeactModalState({
                    isOpen: true,
                    users: targets,
                    actionType: "Suspended",
                  });
                }}
                className="vibe-btn-amber px-3.5 py-2 rounded-xl text-xs font-black cursor-pointer"
              >
                Suspend
              </button>

              <button
                type="button"
                onClick={() => {
                  const targets = enrichedUsers.filter((u) =>
                    selectedIds.includes(u.id)
                  );
                  setDeactModalState({
                    isOpen: true,
                    users: targets,
                    actionType: "Deactivated",
                  });
                }}
                className="vibe-btn-rose px-3.5 py-2 rounded-xl text-xs font-black cursor-pointer"
              >
                Deactivate
              </button>

              <button
                type="button"
                onClick={() => {
                  const targets = enrichedUsers.filter((u) =>
                    selectedIds.includes(u.id)
                  );
                  handleExportAuditCSV(targets);
                }}
                className="vibe-btn-emerald px-3.5 py-2 rounded-xl text-xs font-black cursor-pointer"
              >
                Export Selected
              </button>

              <button
                type="button"
                onClick={() => setSelectedIds([])}
                className="vibe-btn-slate px-3 py-2 rounded-xl text-xs font-black cursor-pointer"
              >
                × Clear Selection
              </button>
            </div>
          </section>
        )}

        {/* ===================================================================
            ZONES 6 & 7: NORMAL DARK TABLE BACKGROUND + LIVE COLOUR-CHANGING
            USER TAB ROWS (SHOWS FIRST 5 BY DEFAULT + "SHOW ALL" AT TOP)
        =================================================================== */}
        <section
          className={`rounded-3xl p-5 sm:p-6 space-y-4 relative overflow-visible ${
            isLight ? "cream-gloss-surface" : "normal-dark-table-shell"
          }`}
        >
          {/* TABLE TOP BAR: Title + [ Show All (23) / Show First 5 ] at Top + Select All */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cyan-400/25 pb-4">
            <div>
              <span
                className={`text-[10px] font-black uppercase tracking-wider block ${
                  isLight ? "text-amber-800" : "text-cyan-300"
                }`}
              >
                👥 WORKFORCE DIRECTORY &amp; ACCESS LIFECYCLE TABLE
              </span>
              <h2 className="text-xl font-black mt-0.5">
                User Access Table (Showing{" "}
                {showAllUsers
                  ? filteredUsers.length
                  : Math.min(5, filteredUsers.length)}{" "}
                of {filteredUsers.length})
              </h2>
            </div>

            {/* Top-Right Table Controls: [ Show All / Show First 5 ] + [ Select All ] */}
            <div className="flex flex-wrap items-center gap-2.5">
              {filteredUsers.length > 5 && (
                <button
                  type="button"
                  onClick={() => setShowAllUsers((prev) => !prev)}
                  className={`px-4 py-2 rounded-2xl text-xs font-black flex items-center gap-1.5 cursor-pointer transition ${
                    isLight
                      ? "cream-pill-gold"
                      : showAllUsers
                      ? "vibe-btn-purple"
                      : "vibe-btn-amber"
                  }`}
                >
                  <span>
                    {showAllUsers
                      ? "Show First 5 Only ▴"
                      : `Show All (${filteredUsers.length} Users) ▾`}
                  </span>
                </button>
              )}

              <button
                type="button"
                onClick={toggleSelectAllVisible}
                className={`px-4 py-2 rounded-2xl text-xs font-black flex items-center gap-2 cursor-pointer transition ${
                  isLight
                    ? "cream-dark-btn"
                    : allVisibleSelected
                    ? "vibe-btn-cyan"
                    : "vibe-btn-slate"
                }`}
              >
                {allVisibleSelected ? (
                  <CheckSquare className="w-4 h-4 text-amber-300" />
                ) : (
                  <Square className="w-4 h-4 opacity-70" />
                )}
                <span>
                  {allVisibleSelected ? "Selected All" : "Select All"}
                </span>
              </button>
            </div>
          </div>

          {/* TABLE WRAPPER ON NORMAL DARK BACKGROUND */}
          <div className="overflow-x-auto">
            <div className="min-w-[980px] space-y-2.5">
              {/* ALIGNED TABLE COLUMN HEADERS (SHORT, CLEAR, ZERO EMPTY GAPS) */}
              <div className="grid grid-cols-12 items-center gap-3 px-4 py-2.5 rounded-xl bg-[#0D1426] border border-white/10 text-[10.5px] font-black uppercase tracking-wider text-slate-300">
                <div className="col-span-3 flex items-center gap-2.5">
                  <span className="w-4 text-center">✓</span>
                  <span>User &amp; Email</span>
                </div>
                <div className="col-span-2">Role &amp; Branch</div>
                <div className="col-span-2">Reporting Mgr</div>
                <div className="col-span-1 text-center">Activity</div>
                <div className="col-span-1 text-center">Expiry</div>
                <div className="col-span-1 text-center">Last Login</div>
                <div className="col-span-1 text-center">Status</div>
                <div className="col-span-1 text-right">Actions</div>
              </div>

              {/* USER TAB ROWS WITH LIVE BASE COLOUR CHANGE & ACCENT BORDER */}
              {(showAllUsers ? filteredUsers : filteredUsers.slice(0, 5)).map(
                (u, idx) => {
                  const isChecked = selectedIds.includes(u.id);
                  const { datePart } = formatDateTimeReadable(u.last_login);
                  const shortRelative =
                    u.days_since_login === null
                      ? "Never"
                      : u.days_since_login === 0
                      ? "Today"
                      : `${u.days_since_login}d ago`;
                  const shortBranch =
                    u.franchise?.split(" ").slice(0, 2).join(" ") || "HQ";

                  const accentIdx = idx % 5;
                  const darkLiveTabVariants = [
                    "live-user-tab-cyan",
                    "live-user-tab-amber",
                    "live-user-tab-purple",
                    "live-user-tab-emerald",
                    "live-user-tab-rose",
                  ];
                  const creamTabVariants = [
                    "cream-user-tab-cyan",
                    "cream-user-tab-amber",
                    "cream-user-tab-purple",
                    "cream-user-tab-emerald",
                    "cream-user-tab-rose",
                  ];
                  const rowTabCls = isLight
                    ? creamTabVariants[accentIdx]
                    : darkLiveTabVariants[accentIdx];

                  const vibeAccentBtns = [
                    "vibe-btn-cyan",
                    "vibe-btn-amber",
                    "vibe-btn-purple",
                    "vibe-btn-emerald",
                    "vibe-btn-rose",
                  ];
                  const rowVibeBtn = isLight
                    ? "cream-dark-btn"
                    : vibeAccentBtns[accentIdx];

                  const statusBadgeCls = isLight
                    ? "cream-pill-emerald"
                    : u.account_status === "Active"
                    ? "vibe-btn-emerald"
                    : u.account_status === "Suspended"
                    ? "vibe-btn-rose"
                    : u.account_status === "Invited"
                    ? "vibe-btn-cyan"
                    : "vibe-btn-slate";

                  const roleBtnCls = isLight
                    ? "cream-dark-btn"
                    : u.role.includes("Admin")
                    ? "vibe-btn-cyan"
                    : u.role.includes("Partner")
                    ? "vibe-btn-amber"
                    : u.role.includes("Leader")
                    ? "vibe-btn-purple"
                    : "vibe-btn-slate";

                  return (
                    <div
                      key={u.id}
                      onClick={() =>
                        setDrawerState({ userId: u.id, tab: "profile" })
                      }
                      style={{ animationDelay: `${(idx % 5) * -1.3}s` }}
                      className={`cursor-pointer group rounded-2xl px-4 py-3 grid grid-cols-12 items-center gap-3 text-xs select-none ${rowTabCls} ${
                        isChecked ? "ring-2 ring-amber-300" : ""
                      }`}
                    >
                      {/* COL 1 (col-span-3): Checkbox + Avatar + Name + Short Email */}
                      <div className="col-span-3 flex items-center gap-2.5 min-w-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedIds((prev) =>
                              prev.includes(u.id)
                                ? prev.filter((id) => id !== u.id)
                                : [...prev, u.id]
                            );
                          }}
                          className="cursor-pointer shrink-0"
                        >
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-amber-300" />
                          ) : (
                            <Square className="w-4 h-4 opacity-60 group-hover:opacity-100" />
                          )}
                        </button>

                        <div
                          className={`w-9 h-9 rounded-xl font-black text-[11px] flex items-center justify-center shrink-0 ${
                            isLight ? "cream-pill-gold" : rowVibeBtn
                          }`}
                        >
                          {u.name.slice(0, 2).toUpperCase()}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-black text-sm truncate group-hover:text-amber-300 transition">
                              {u.name}
                            </span>
                            {u.reactivation_requested && (
                              <span className="px-1.5 py-0.2 rounded text-[8.5px] font-black bg-amber-400 text-slate-950 shrink-0">
                                Req
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] opacity-80 block truncate">
                            {u.email}
                          </span>
                        </div>
                      </div>

                      {/* COL 2 (col-span-2): Role Pill + Short Branch */}
                      <div className="col-span-2 min-w-0">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black truncate max-w-full ${roleBtnCls}`}
                        >
                          {u.role}
                        </span>
                        <div className="text-[11px] font-bold text-cyan-300 flex items-center gap-1 mt-1 truncate">
                          <Building2 className="w-3 h-3 shrink-0" />
                          <span className="truncate">{shortBranch}</span>
                        </div>
                      </div>

                      {/* COL 3 (col-span-2): Reporting Manager */}
                      <div className="col-span-2 min-w-0">
                        <span className="text-[10px] uppercase font-bold opacity-70 block">
                          Reports To
                        </span>
                        <span className="font-extrabold text-xs block truncate">
                          {u.reporting_manager}
                        </span>
                      </div>

                      {/* COL 4 (col-span-1): Activity (Short Relative + 30d Logins) */}
                      <div className="col-span-1 text-center">
                        <span
                          className={`font-black text-xs block ${
                            u.is_dormant_60
                              ? "text-rose-300"
                              : u.is_dormant_30
                              ? "text-amber-300"
                              : "text-emerald-300"
                          }`}
                        >
                          {shortRelative}
                        </span>
                        <span className="text-[10px] opacity-80 font-bold block">
                          {u.login_count_30d} (30d)
                        </span>
                      </div>

                      {/* COL 5 (col-span-1): Access Expiry */}
                      <div className="col-span-1 text-center">
                        <span
                          className={`font-black text-[11px] block ${
                            u.is_expiring_soon
                              ? "text-amber-300"
                              : "text-slate-100"
                          }`}
                        >
                          {u.access_expiry ? u.access_expiry : "Permanent"}
                        </span>
                        <span className="text-[9.5px] opacity-75 block">
                          {u.is_expiring_soon
                            ? `⚠️ ${u.days_until_expiry}d left`
                            : "Verified"}
                        </span>
                      </div>

                      {/* COL 6 (col-span-1): Last Login Date */}
                      <div className="col-span-1 text-center">
                        <span className="font-extrabold text-[11px] text-cyan-200 block">
                          {u.never_logged_in ? "Never" : datePart}
                        </span>
                        <span className="text-[9.5px] opacity-75 block">
                          {u.never_logged_in ? "Pending" : "SSO"}
                        </span>
                      </div>

                      {/* COL 7 (col-span-1): Status Pill */}
                      <div className="col-span-1 flex justify-center">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-black inline-flex items-center gap-1 ${statusBadgeCls}`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          <span>{u.account_status}</span>
                        </span>
                      </div>

                      {/* COL 8 (col-span-1): Actions (Inspect + ⋮ Menu) */}
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="col-span-1 flex items-center justify-end gap-1.5 relative"
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setDrawerState({ userId: u.id, tab: "profile" })
                          }
                          className={`px-2.5 py-1.5 rounded-xl text-[10.5px] font-black cursor-pointer ${rowVibeBtn}`}
                        >
                          Inspect
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuUserId(
                              openMenuUserId === u.id ? null : u.id
                            );
                          }}
                          className={`w-8 h-8 rounded-xl inline-flex items-center justify-center cursor-pointer shrink-0 ${
                            isLight ? "cream-dark-btn" : "vibe-btn-slate"
                          }`}
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>

                        {openMenuUserId === u.id && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="absolute right-0 top-10 w-52 rounded-2xl bg-[#0B1120] border-2 border-cyan-400/65 shadow-2xl py-1.5 z-50 text-left text-xs text-white"
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setOpenMenuUserId(null);
                                setDrawerState({
                                  userId: u.id,
                                  tab: "profile",
                                });
                              }}
                              className="w-full px-3.5 py-2 hover:bg-white/10 flex items-center gap-2 font-bold cursor-pointer"
                            >
                              <span>👤</span>
                              <span>View Profile</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setOpenMenuUserId(null);
                                setDrawerState({
                                  userId: u.id,
                                  tab: "profile",
                                });
                              }}
                              className="w-full px-3.5 py-2 hover:bg-white/10 flex items-center gap-2 font-bold cursor-pointer"
                            >
                              <span>✏️</span>
                              <span>Edit User</span>
                            </button>

                            {(u.account_status === "Invited" ||
                              u.is_dormant_30) && (
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenMenuUserId(null);
                                  showToast(
                                    `✉️ Sent activity reminder nudge to ${u.name}!`
                                  );
                                }}
                                className="w-full px-3.5 py-2 hover:bg-white/10 flex items-center gap-2 font-bold cursor-pointer text-amber-300"
                              >
                                <span>🔔</span>
                                <span>Send Reminder</span>
                              </button>
                            )}

                            {u.account_status === "Active" && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenMenuUserId(null);
                                    showToast(
                                      `🔑 Password reset link dispatched to ${u.email}!`
                                    );
                                  }}
                                  className="w-full px-3.5 py-2 hover:bg-white/10 flex items-center gap-2 font-bold cursor-pointer"
                                >
                                  <KeyRound className="w-3.5 h-3.5 text-amber-300" />
                                  <span>Reset Password</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenMenuUserId(null);
                                    showToast(
                                      `⚡ Forced logout of all active sessions for ${u.name}!`
                                    );
                                  }}
                                  className="w-full px-3.5 py-2 hover:bg-white/10 flex items-center gap-2 font-bold cursor-pointer"
                                >
                                  <LogOut className="w-3.5 h-3.5 text-purple-300" />
                                  <span>Force Logout</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenMenuUserId(null);
                                    setDeactModalState({
                                      isOpen: true,
                                      users: [u],
                                      actionType: "Suspended",
                                    });
                                  }}
                                  className="w-full px-3.5 py-2 hover:bg-amber-500/20 text-amber-300 flex items-center gap-2 font-bold cursor-pointer border-t border-white/10 mt-1 pt-2"
                                >
                                  <Shield className="w-3.5 h-3.5" />
                                  <span>Suspend Account</span>
                                </button>
                              </>
                            )}

                            {(u.account_status === "Suspended" ||
                              u.account_status === "Deactivated") && (
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenMenuUserId(null);
                                  setReactivateModalUser(u);
                                }}
                                className="w-full px-3.5 py-2 hover:bg-emerald-500/20 text-emerald-300 flex items-center gap-2 font-bold cursor-pointer border-t border-white/10 mt-1 pt-2"
                              >
                                <Unlock className="w-3.5 h-3.5" />
                                <span>Reactivate Account</span>
                              </button>
                            )}

                            {(u.account_status === "Active" ||
                              u.account_status === "Suspended") && (
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenMenuUserId(null);
                                  setDeactModalState({
                                    isOpen: true,
                                    users: [u],
                                    actionType: "Deactivated",
                                  });
                                }}
                                className="w-full px-3.5 py-2 hover:bg-rose-500/20 text-rose-300 flex items-center gap-2 font-bold cursor-pointer"
                              >
                                <Lock className="w-3.5 h-3.5" />
                                <span>Deactivate Account</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                setOpenMenuUserId(null);
                                setDrawerState({
                                  userId: u.id,
                                  tab: "history",
                                });
                              }}
                              className="w-full px-3.5 py-2 hover:bg-white/10 flex items-center gap-2 font-bold cursor-pointer border-t border-white/10 mt-1 pt-2 text-cyan-300"
                            >
                              <Activity className="w-3.5 h-3.5" />
                              <span>View Audit Log</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </div>
        </section>

        {/* ===================================================================
            ZONE 8: THE UNIFIED SLIDE-OVER DRAWER
        =================================================================== */}
        <UnifiedUserDrawer
          user={inspectedDrawerUser}
          initialTab={drawerState.tab}
          allUsers={enrichedUsers}
          onClose={() => setDrawerState({ userId: null, tab: "profile" })}
          onSaveProfile={handleSaveProfile}
          onOpenDeactivateModal={(users, actionType) =>
            setDeactModalState({ isOpen: true, users, actionType })
          }
          onOpenReactivateModal={(u) => setReactivateModalUser(u)}
          onUpdateExpiry={handleUpdateExpiry}
          onForceLogout={(u) =>
            showToast(`⚡ Forced logout of all active sessions for ${u.name}!`)
          }
          onResetPassword={(u) =>
            showToast(`🔑 Password reset link dispatched to ${u.email}!`)
          }
          isLight={isLight}
        />

        {/* ===================================================================
            ZONE 9: MODALS
        =================================================================== */}
        <InviteUserModal
          isOpen={inviteModalOpen}
          onClose={() => setInviteModalOpen(false)}
          onInvite={handleInviteNewUser}
          allUsers={enrichedUsers}
          isLight={isLight}
        />

        <ImportCsvModal
          isOpen={importCsvModalOpen}
          onClose={() => setImportCsvModalOpen(false)}
          onImportUsers={handleImportCsvUsers}
          isLight={isLight}
        />

        <MandatoryDeactivationModal
          isOpen={deactModalState.isOpen}
          targetUsers={deactModalState.users}
          actionType={deactModalState.actionType}
          onClose={() =>
            setDeactModalState({
              isOpen: false,
              users: [],
              actionType: "Deactivated",
            })
          }
          onConfirm={handleConfirmDeactivation}
        />

        <ReactivateConfirmationModal
          isOpen={Boolean(reactivateModalUser)}
          user={reactivateModalUser}
          onClose={() => setReactivateModalUser(null)}
          onConfirm={handleActivateUsers}
        />
      </div>
    </MainLayout>
  );
}