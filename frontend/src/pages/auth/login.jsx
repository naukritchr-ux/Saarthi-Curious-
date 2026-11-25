import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  ShieldCheck,
  KeyRound,
} from "lucide-react";
import axios from "axios";
import { API_BASE } from "../../config/api";
import saarthiEmblem from "../../assets/saarthi-curious-emblem.png";

const DEFAULT_LOGO_SRC = saarthiEmblem || "/saarthi-curious-emblem.png";

export default function Login({ logoSrc = DEFAULT_LOGO_SRC }) {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("login");
  const [loginOtp, setLoginOtp] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // ============ PRIMARY LOGIN SUBMISSION ============
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("Please enter both your email address and password.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await axios.post(`${API_BASE}/login`, {
        email: email.trim(),
        password,
      });

      if (response.data.otp_required) {
        setMode("login-otp");
        setLoginOtp("");
        setError("");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(
        err.response?.data?.detail ||
          (err.code === "ERR_NETWORK"
            ? "Cannot connect to backend. Check backend URL and server status."
            : "Invalid email or password. Please try again.")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full login-void-backdrop flex items-center justify-center p-4 sm:p-8 font-sans text-slate-100 relative overflow-hidden selection:bg-amber-300 selection:text-slate-950">
      <style>{`
        /* =====================================================================
           1. DEEP VOID BACKDROP + TOP-RIGHT ROYAL PURPLE NEBULA AMBIENCE
        ===================================================================== */
        .login-void-backdrop {
          background-color: #05030B;
          background-image:
            radial-gradient(ellipse 48% 42% at 78% 14%, rgba(126, 34, 206, 0.36) 0%, rgba(88, 28, 135, 0.14) 45%, transparent 74%),
            radial-gradient(ellipse 42% 38% at 22% 85%, rgba(76, 29, 149, 0.2) 0%, transparent 70%),
            linear-gradient(180deg, #070410 0%, #040308 100%);
        }

        /* =====================================================================
           2. MAIN OUTER TAB: RAZOR-THIN LUMINOUS PURPLE-GOLD GLASS RIM
              + PURE OBSIDIAN INTERIOR (ZERO PURPLE BLEED INSIDE TAB)
        ===================================================================== */
        @keyframes topEdgeGlintDrift {
          0%, 100% {
            transform: translateX(-50%) scaleX(1);
            left: 34%;
            opacity: 0.92;
          }
          50% {
            transform: translateX(-50%) scaleX(1.12);
            left: 58%;
            opacity: 1;
          }
        }

        .login-outer-shell {
          position: relative;
          border: 1.5px solid transparent;
          background-clip: padding-box, padding-box, border-box;
          background-origin: padding-box, padding-box, border-box;
          background-image:
            /* Subtle Top-Edge Golden Specular Bleed Only (Zero Purple) */
            radial-gradient(ellipse 42% 24% at 38% 0%, rgba(251, 191, 36, 0.10) 0%, transparent 70%),
            /* Deep Neutral Obsidian-Charcoal Interior (Zero purple tint) */
            linear-gradient(165deg, #111319 0%, #0B0C10 45%, #07080A 100%),
            /* Crisp 1.5px Luminous Purple-to-Gold Rim Around All 4 Corners */
            linear-gradient(
              115deg,
              #D8B4FE 0%,
              #FEF3C7 22%,
              #F59E0B 32%,
              #E9D5FF 48%,
              #A855F7 68%,
              #6B21A8 86%,
              #C084FC 100%
            );
          box-shadow:
            0 32px 90px rgba(0, 0, 0, 0.92),
            0 0 42px -8px rgba(147, 51, 234, 0.45),
            inset 0 1px 0 rgba(255, 255, 255, 0.22);
        }

        /* Concentrated White-Gold Lens Flare Sitting Directly on the Top Border */
        .outer-top-glint-wrap {
          position: absolute;
          top: -1.5px;
          left: 34%;
          transform: translateX(-50%);
          width: 38%;
          height: 2px;
          pointer-events: none;
          z-index: 30;
          animation: topEdgeGlintDrift 14s ease-in-out infinite;
        }

        /* Sharp Pure-White + Gold Core Line */
        .outer-top-glint-line {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(254, 243, 199, 0.6) 18%,
            #FDE68A 38%,
            #FFFFFF 50%,
            #FDE68A 62%,
            rgba(254, 243, 199, 0.6) 82%,
            transparent 100%
          );
          filter: drop-shadow(0 0 4px rgba(255, 255, 255, 0.95));
        }

        /* Soft Warm Golden-Amber Halo Radiating Above & Below the Rim (Zero Purple) */
        .outer-top-glint-bloom {
          position: absolute;
          top: -14px;
          left: 20%;
          right: 20%;
          height: 30px;
          border-radius: 9999px;
          background: radial-gradient(
            ellipse at center,
            rgba(255, 251, 235, 0.85) 0%,
            rgba(251, 191, 36, 0.48) 35%,
            rgba(251, 191, 36, 0.12) 65%,
            transparent 80%
          );
          filter: blur(8px);
        }

        /* Soft Royal Purple Glow Radiating Behind the Top-Right Corner OUTSIDE the Tab */
        .outer-corner-purple-glow {
          position: absolute;
          top: -48px;
          right: -40px;
          width: 320px;
          height: 240px;
          border-radius: 9999px;
          pointer-events: none;
          z-index: 0;
          background: radial-gradient(
            circle,
            rgba(147, 51, 234, 0.55) 0%,
            rgba(107, 33, 168, 0.26) 45%,
            transparent 72%
          );
          filter: blur(36px);
        }

        /* =====================================================================
           2. ORGANIC RANDOM-DRIFT PLATINUM-GOLD BORDER SYSTEM
              3 independent light sources on non-harmonic timings (9.5s / 13.7s / 17.3s)
              so light blooms smoothly & unpredictably with zero "tail-chasing" loop
        ===================================================================== */
        @property --p1x { syntax: "<percentage>"; inherits: false; initial-value: 15%; }
        @property --p1y { syntax: "<percentage>"; inherits: false; initial-value: 10%; }
        @property --p2x { syntax: "<percentage>"; inherits: false; initial-value: 85%; }
        @property --p2y { syntax: "<percentage>"; inherits: false; initial-value: 82%; }
        @property --p3x { syntax: "<percentage>"; inherits: false; initial-value: 52%; }
        @property --p3y { syntax: "<percentage>"; inherits: false; initial-value: 95%; }

        /* Light 1: Brilliant Platinum-White Specular Drift (Irregular Path) */
        @keyframes borderDriftPlatinum {
          0%   { --p1x: 12%; --p1y: 8%;  }
          22%  { --p1x: 78%; --p1y: 92%; }
          48%  { --p1x: 92%; --p1y: 26%; }
          73%  { --p1x: 18%; --p1y: 78%; }
          100% { --p1x: 12%; --p1y: 8%;  }
        }

        /* Light 2: Liquid 24K Gold Drift (Counter-Crossing Path) */
        @keyframes borderDriftGold {
          0%   { --p2x: 88%; --p2y: 86%; }
          27%  { --p2x: 14%; --p2y: 42%; }
          54%  { --p2x: 68%; --p2y: 6%;  }
          81%  { --p2x: 94%; --p2y: 64%; }
          100% { --p2x: 88%; --p2y: 86%; }
        }

        /* Light 3: Soft Champagne Glint (Cross-Diagonal Wandering) */
        @keyframes borderDriftChampagne {
          0%   { --p3x: 48%; --p3y: 96%; }
          31%  { --p3x: 90%; --p3y: 12%; }
          63%  { --p3x: 8%;  --p3y: 88%; }
          86%  { --p3x: 34%; --p3y: 4%;  }
          100% { --p3x: 48%; --p3y: 96%; }
        }

        /* Gentle Outer Rim Aura Pulse for Noticeable Presence */
        @keyframes borderAuraBreathe {
          0%, 100% {
            box-shadow:
              0 22px 52px rgba(0, 0, 0, 0.78),
              0 0 22px -2px rgba(248, 250, 252, 0.28),
              0 0 32px -4px rgba(245, 196, 81, 0.34),
              inset 0 0 0 0.5px rgba(255, 255, 255, 0.32);
          }
          50% {
            box-shadow:
              0 24px 56px rgba(0, 0, 0, 0.82),
              0 0 30px 0px rgba(255, 255, 255, 0.38),
              0 0 42px -2px rgba(253, 224, 71, 0.46),
              inset 0 0 0 0.5px rgba(254, 249, 195, 0.48);
          }
        }

        /* Refined Subtle Up/Down Float for Logo */
        @keyframes logoSmoothFloat {
          0%, 100% { transform: translateY(0px); }
          50%      { transform: translateY(-4px); }
        }
        .logo-subtle-float {
          animation: logoSmoothFloat 6s ease-in-out infinite;
          will-change: transform;
        }

        /* Logo Frame: High-Visibility Organic Platinum-Gold Border */
        .logo-platinum-gold-frame {
          position: relative;
          border: 3px solid transparent;
          background-clip: padding-box, border-box, border-box, border-box, border-box;
          background-origin: padding-box, border-box, border-box, border-box, border-box;
          background-image:
            linear-gradient(145deg, #0D1018 0%, #07080D 100%),
            radial-gradient(ellipse 65% 55% at var(--p1x) var(--p1y), #FFFFFF 0%, rgba(241, 245, 249, 0.88) 26%, transparent 66%),
            radial-gradient(ellipse 70% 60% at var(--p2x) var(--p2y), #FEF08A 0%, #F5C451 32%, transparent 68%),
            radial-gradient(ellipse 60% 60% at var(--p3x) var(--p3y), #FFFBEB 0%, #E2E8F0 30%, transparent 66%),
            linear-gradient(135deg, #CBD5E1 0%, #A89668 32%, #E2E8F0 65%, #D4AF37 100%);
          animation:
            borderDriftPlatinum 10.5s ease-in-out infinite reverse,
            borderDriftGold 14.3s ease-in-out infinite,
            borderDriftChampagne 18.7s ease-in-out infinite,
            borderAuraBreathe 6.5s ease-in-out infinite;
        }

        /* Shining 24K Golden Tagline ("Building Through Learning") */
        @keyframes goldenTextShine {
          0%   { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
        .shining-gold-text {
          background: linear-gradient(
            105deg,
            #D49617 0%,
            #F5C451 24%,
            #FFFBEB 48%,
            #FDE047 64%,
            #D97706 84%,
            #D49617 100%
          );
          background-size: 240% auto;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          animation: goldenTextShine 5.5s linear infinite;
          filter: drop-shadow(0 2px 10px rgba(245, 196, 81, 0.34));
        }

        /* =====================================================================
           3. SIGN-IN TAB: HIGH-VISIBILITY ORGANIC PLATINUM-GOLD BORDER
        ===================================================================== */
        @keyframes signinMistDrift {
          0%, 100% { transform: translate3d(-12%, -10%, 0) scale(0.96); opacity: 0.42; }
          50%      { transform: translate3d(28%, 20%, 0) scale(1.1);   opacity: 0.68; }
        }

        .signin-platinum-gold-panel {
          position: relative;
          isolation: isolate;
          overflow: hidden;
          border: 2.5px solid transparent;
          background-clip: padding-box, border-box, border-box, border-box, border-box;
          background-origin: padding-box, border-box, border-box, border-box, border-box;
          background-image:
            linear-gradient(160deg, #101420 0%, #0B0E17 55%, #090B12 100%),
            radial-gradient(ellipse 62% 52% at var(--p1x) var(--p1y), #FFFFFF 0%, rgba(248, 250, 252, 0.92) 24%, transparent 64%),
            radial-gradient(ellipse 68% 56% at var(--p2x) var(--p2y), #FEF9C3 0%, #F5C451 30%, transparent 66%),
            radial-gradient(ellipse 58% 58% at var(--p3x) var(--p3y), #FFFBEB 0%, #CBD5E1 28%, transparent 64%),
            linear-gradient(135deg, #E2E8F0 0%, #B89B5E 35%, #CBD5E1 68%, #E5C170 100%);
          animation:
            borderDriftPlatinum 9.5s ease-in-out infinite,
            borderDriftGold 13.7s ease-in-out infinite,
            borderDriftChampagne 17.3s ease-in-out infinite,
            borderAuraBreathe 5.8s ease-in-out infinite;
        }

        .signin-ambient-orb-1 {
          position: absolute;
          width: 72%;
          height: 72%;
          top: -20%;
          left: -14%;
          border-radius: 9999px;
          pointer-events: none;
          z-index: 0;
          background: radial-gradient(circle, rgba(245, 196, 81, 0.14) 0%, transparent 72%);
          filter: blur(58px);
          animation: signinMistDrift 15s ease-in-out infinite;
        }
        .signin-ambient-orb-2 {
          position: absolute;
          width: 68%;
          height: 68%;
          bottom: -20%;
          right: -12%;
          border-radius: 9999px;
          pointer-events: none;
          z-index: 0;
          background: radial-gradient(circle, rgba(203, 213, 225, 0.12) 0%, transparent 72%);
          filter: blur(58px);
          animation: signinMistDrift 19s ease-in-out infinite reverse;
        }

        /* =====================================================================
           4. LARGE, CLEAR INPUT FIELDS + AUTOFILL OVERRIDE
        ===================================================================== */
        .login-input-well {
          background: #070910;
          border: 1.5px solid rgba(203, 213, 225, 0.34);
          box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.72);
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .login-input-well:hover {
          border-color: rgba(241, 245, 249, 0.6);
        }
        .login-input-well:focus-within {
          border-color: #FAF6EC;
          box-shadow:
            inset 0 2px 6px rgba(0, 0, 0, 0.65),
            0 0 18px -4px rgba(255, 250, 235, 0.42);
        }

        .login-input-field {
          background-color: transparent !important;
          color: #FFFFFF !important;
          caret-color: #FAF6EC;
        }
        .login-input-field::placeholder {
          color: #8492A6;
        }
        .login-input-field:-webkit-autofill,
        .login-input-field:-webkit-autofill:hover,
        .login-input-field:-webkit-autofill:focus,
        .login-input-field:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 1000px #070910 inset !important;
          -webkit-text-fill-color: #FFFFFF !important;
          transition: background-color 9999s ease-in-out 0s;
        }

        /* =====================================================================
           5. POLISHED IVORY ("ELEPHANT TUSK WHITE") SIGN-IN BUTTON
              Warm pearl-white enamel with a gentle natural satin sheen
        ===================================================================== */
        @keyframes ivorySoftSheen {
          0%        { transform: translateX(-140%) skewX(-22deg); opacity: 0; }
          10%       { opacity: 0.75; }
          36%       { transform: translateX(260%) skewX(-22deg); opacity: 0.75; }
          44%, 100% { transform: translateX(260%) skewX(-22deg); opacity: 0; }
        }

        .login-ivory-cta {
          position: relative;
          overflow: hidden;
          background: linear-gradient(
            180deg,
            #FFFFFF 0%,
            #FDFBF4 28%,
            #F5EFE0 72%,
            #EAE1CC 100%
          );
          border: 1.5px solid #FFFFFF;
          color: #090A0E;
          box-shadow:
            0 10px 26px rgba(0, 0, 0, 0.62),
            0 0 22px -4px rgba(255, 250, 235, 0.42),
            inset 0 2px 3px #FFFFFF,
            inset 0 -2px 4px rgba(138, 122, 92, 0.28);
          transition: transform 0.18s ease, box-shadow 0.18s ease, filter 0.18s ease;
        }

        /* Subtle organic pearl-white enamel glint */
        .login-ivory-cta::after {
          content: "";
          position: absolute;
          top: -20%;
          bottom: -20%;
          left: 0;
          width: 38%;
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.85) 50%,
            transparent 100%
          );
          pointer-events: none;
          animation: ivorySoftSheen 7.5s ease-in-out infinite;
        }

        .login-ivory-cta:hover:not(:disabled) {
          filter: brightness(1.03);
          transform: translateY(-1.5px);
          box-shadow:
            0 14px 32px rgba(0, 0, 0, 0.7),
            0 0 30px -2px rgba(255, 252, 240, 0.62),
            inset 0 2px 3px #FFFFFF,
            inset 0 -2px 4px rgba(138, 122, 92, 0.22);
        }

        .login-ivory-cta:active:not(:disabled) {
          transform: translateY(0px);
          filter: brightness(0.97);
        }
      `}</style>

      {/* =====================================================================
          ENLARGED MAIN SPLIT CONTAINER (CLEARLY VISIBLE & SPACIOUS)
      ===================================================================== */}
      <div className="w-full max-w-[1200px] relative">
        {/* Soft Royal Purple Glow Radiating Behind the Top-Right Corner OUTSIDE the Tab */}
        <div className="outer-corner-purple-glow" />

        <div className="w-full min-h-[630px] rounded-3xl login-outer-shell p-7 sm:p-10 lg:p-12 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10">
          {/* Signature White-Gold Specular Flare Along the Top Rim */}
          <div className="outer-top-glint-wrap">
            <div className="outer-top-glint-bloom" />
            <div className="outer-top-glint-line" />
          </div>

        {/* ===================================================================
            LEFT COLUMN (5 COLS): BRANDING, FLOATING LOGO & SHINING TAGLINE
        =================================================================== */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-8 py-2 my-auto">
          <div className="flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-400/12 border border-amber-300/60 text-[11px] font-extrabold uppercase tracking-[0.16em] text-amber-200">
              <span>✦</span>
              <span>SAARTHI CURIOUS LMS</span>
            </span>

            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-300/80">
              ENTERPRISE RBAC
            </span>
          </div>

          <div className="flex flex-col items-center text-center space-y-6 my-auto py-2">
            {/* Uploaded Saarthi PNG with High-Craft Orbiting Platinum-Gold Border */}
            <div className="logo-subtle-float">
              <div className="w-60 h-60 sm:w-64 sm:h-64 rounded-3xl p-2.5 logo-platinum-gold-frame flex items-center justify-center overflow-hidden">
                <img
                  src={logoSrc}
                  alt="Saarthi Curious Logo"
                  className="w-full h-full object-contain rounded-2xl select-none"
                />
              </div>
            </div>

            <div className="space-y-3 max-w-sm">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight shining-gold-text leading-snug">
                Building Through Learning
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
                The definitive Learning Management System for leadership
                mastery, structured role progression, and certified achievement.
              </p>
            </div>
          </div>
        </div>

        {/* ===================================================================
            RIGHT COLUMN (7 COLS): BIGGER, CLEARER SIGN-IN BOX + IVORY BUTTON
        =================================================================== */}
        <div className="lg:col-span-7">
          <div className="signin-platinum-gold-panel rounded-3xl p-8 sm:p-11 space-y-7">
            <div className="signin-ambient-orb-1" />
            <div className="signin-ambient-orb-2" />

            {/* ================= MODE: LOGIN ================= */}
            {mode === "login" && (
              <>
                {/* Header */}
                <div className="relative z-10 space-y-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.06] border border-slate-300/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FDE047] shadow-[0_0_8px_#FDE047]" />
                    <span className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-slate-200">
                      Authorized Access
                    </span>
                  </div>

                  <h2 className="text-3xl sm:text-[34px] font-black tracking-tight text-white leading-tight">
                    Access Your Account
                  </h2>

                  <p className="text-sm text-slate-300/90 font-medium leading-relaxed">
                    Sign in with your authorized credentials to enter the learning portal.
                  </p>
                </div>

                {/* Error Alert */}
                {error && (
                  <div className="relative z-10 rounded-xl p-3.5 bg-rose-950/85 border border-rose-400/75 text-rose-100 text-xs font-bold flex items-center gap-2.5">
                    <AlertCircle className="w-4 h-4 text-rose-300 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="relative z-10 space-y-4">
                  {/* EMAIL ADDRESS */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="login-email"
                      className="block text-xs font-extrabold uppercase tracking-[0.16em] text-slate-200"
                    >
                      Email Address
                    </label>
                    <div className="group login-input-well relative flex items-center rounded-2xl">
                      <Mail className="w-5 h-5 text-slate-400 group-focus-within:text-[#FDFBF4] ml-4 shrink-0 transition-colors" />
                      <input
                        id="login-email"
                        type="email"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@organization.com"
                        className="login-input-field w-full h-14 px-3.5 rounded-2xl text-[15.5px] font-medium tracking-wide outline-none"
                      />
                    </div>
                  </div>

                  {/* PASSWORD */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <label
                        htmlFor="login-password"
                        className="block text-xs font-extrabold uppercase tracking-[0.16em] text-slate-200"
                      >
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setMode("forgot");
                          setError("");
                        }}
                        className="text-xs font-semibold text-amber-200/90 hover:text-amber-100 transition cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    </div>

                    <div className="group login-input-well relative flex items-center rounded-2xl">
                      <Lock className="w-5 h-5 text-slate-400 group-focus-within:text-[#FDFBF4] ml-4 shrink-0 transition-colors" />
                      <input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        className="login-input-field w-full h-14 px-3.5 rounded-2xl text-[15.5px] font-medium tracking-wide outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        className="px-3.5 text-slate-400 hover:text-white transition cursor-pointer shrink-0"
                      >
                        {showPassword ? (
                          <EyeOff className="w-[18px] h-[18px]" />
                        ) : (
                          <Eye className="w-[18px] h-[18px]" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* CLEAN, BRIGHT, NORMAL-SIZED SIGN IN BUTTON */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="login-ivory-cta group w-full h-12 rounded-xl font-black text-[13.5px] uppercase tracking-[0.18em] flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <>
                          <span className="w-4 h-4 rounded-full border-2 border-slate-950 border-t-transparent animate-spin" />
                          <span>Signing In...</span>
                        </>
                      ) : (
                        <>
                          <span>Sign In</span>
                          <ArrowRight className="w-4 h-4 stroke-[2.5] group-hover:translate-x-0.5 transition-transform" />
                        </>
                      )}
                    </button>
                  </div>
                </form>

                {/* Footer Security Note */}
                <div className="relative z-10 pt-3.5 border-t border-white/10 flex items-center justify-center gap-2 text-[11.5px] font-medium text-slate-300/80">
                  <ShieldCheck className="w-4 h-4 text-[#FDE047]" />
                  <button
                    type="button"
                    onClick={() => navigate("/privacy-policy")}
                    className="hover:text-[#FDE047] transition cursor-pointer"
                  >
                    Privacy Policy &amp; Security Standards
                  </button>
                </div>
              </>
            )}

            {/* ================= MODE: LOGIN-OTP (TWO-FACTOR VERIFICATION) ================= */}
            {mode === "login-otp" && (
              <>
                <div className="relative z-10 space-y-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMode("login");
                      setLoginOtp("");
                      setError("");
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#FDE047] hover:underline mb-0.5 transition cursor-pointer"
                  >
                    ← Back to Sign In
                  </button>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.06] border border-slate-300/30">
                    <ShieldCheck className="w-4 h-4 text-[#FDE047]" />
                    <span className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-slate-200">
                      Two-Factor Verification
                    </span>
                  </div>
                  <h2 className="text-2xl sm:text-[30px] font-black tracking-tight text-white leading-tight">
                    Enter Verification Code
                  </h2>
                  <p className="text-[13px] text-slate-300/85 font-medium leading-relaxed">
                    A 6-digit security code has been sent to{" "}
                    <span className="text-[#FDE047] font-bold">{email}</span>.
                  </p>
                </div>

                {error && (
                  <div className="relative z-10 rounded-xl p-3.5 bg-rose-950/85 border border-rose-400/75 text-rose-100 text-xs font-bold flex items-center gap-2.5">
                    <AlertCircle className="w-4 h-4 text-rose-300 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {successMessage && (
                  <div className="relative z-10 rounded-xl p-3.5 bg-emerald-950/85 border border-emerald-400/75 text-emerald-100 text-xs font-bold flex items-center gap-2.5">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>{successMessage}</span>
                  </div>
                )}

                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (loginOtp.length !== 6) {
                      setError("Please enter a valid 6-digit OTP.");
                      return;
                    }

                    setLoading(true);
                    setError("");

                    try {
                      const response = await axios.post(
                        `${API_BASE}/verify-login-otp`,
                        {
                          email: email.trim(),
                          otp: loginOtp,
                        }
                      );

                      const user = response.data;
                      localStorage.setItem("user", JSON.stringify(user));
                      localStorage.setItem("token", user.access_token);
                      localStorage.setItem("role_id", user.role_id);
                      localStorage.setItem("user_id", user.user_id);
                      localStorage.setItem("user_name", user.name);
                      localStorage.setItem("full_name", user.name || "");
                      localStorage.setItem("email", user.email || email || "");

                      // Clear any old session's calendar cache
                      localStorage.removeItem("saarthi_google_status");
                      localStorage.removeItem("google_calendar_connected");
                      localStorage.removeItem("google_calendar_email");

                      const roleDashboardMap = {
                        1: "/admin",
                        2: "/admin",
                        3: "/team-leader",
                        4: "/franchiseePartner",
                        5: "/learner",
                        6: "/team-leader",
                        7: "/head-office",
                      };

                      const redirectPath = roleDashboardMap[user.role_id];
                      if (redirectPath) {
                        navigate(redirectPath);
                      } else {
                        setError("Invalid Role assigned to user.");
                      }
                    } catch (err) {
                      setError(
                        err.response?.data?.detail || "Invalid or expired OTP code."
                      );
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className="relative z-10 space-y-4"
                >
                  <div className="space-y-1.5">
                    <label
                      htmlFor="login-otp-field"
                      className="block text-xs font-extrabold uppercase tracking-[0.16em] text-slate-200"
                    >
                      6-Digit Security Code
                    </label>
                    <div className="group login-input-well relative flex items-center rounded-2xl">
                      <KeyRound className="w-5 h-5 text-slate-400 group-focus-within:text-[#FDFBF4] ml-4 shrink-0 transition-colors" />
                      <input
                        id="login-otp-field"
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        required
                        value={loginOtp}
                        onChange={(e) =>
                          setLoginOtp(e.target.value.replace(/\D/g, ""))
                        }
                        placeholder="••••••"
                        className="login-input-field w-full h-14 px-3.5 rounded-2xl text-[18px] font-mono tracking-[0.35em] text-center font-bold outline-none"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="login-ivory-cta group w-full h-12 rounded-xl font-black text-[13.5px] uppercase tracking-[0.18em] flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <>
                          <span className="w-4 h-4 rounded-full border-2 border-slate-950 border-t-transparent animate-spin" />
                          <span>Verifying OTP...</span>
                        </>
                      ) : (
                        <>
                          <span>Verify &amp; Enter Portal</span>
                          <ArrowRight className="w-4 h-4 stroke-[2.5] group-hover:translate-x-0.5 transition-transform" />
                        </>
                      )}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <button
                      type="button"
                      disabled={loading}
                      onClick={async () => {
                        setLoading(true);
                        setError("");
                        setSuccessMessage("");
                        try {
                          try {
                            await axios.post(`${API_BASE}/resend-login-otp`, {
                              email: email.trim(),
                            });
                          } catch {
                            await axios.post(`${API_BASE}/login`, {
                              email: email.trim(),
                              password,
                            });
                          }
                          setLoginOtp("");
                          setSuccessMessage("A fresh OTP code has been sent.");
                        } catch (err) {
                          setError(
                            err.response?.data?.detail || "Failed to resend OTP."
                          );
                        } finally {
                          setLoading(false);
                        }
                      }}
                      className="h-10 rounded-xl border border-slate-700/80 bg-slate-900/60 text-slate-300 text-xs font-bold hover:text-white hover:border-[#FDE047] transition cursor-pointer"
                    >
                      Resend Code
                    </button>

                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => {
                        setMode("login");
                        setLoginOtp("");
                        setError("");
                      }}
                      className="h-10 rounded-xl border border-slate-700/80 bg-slate-900/60 text-slate-300 text-xs font-bold hover:text-white hover:border-slate-500 transition cursor-pointer"
                    >
                      Back to Sign In
                    </button>
                  </div>
                </form>
              </>
            )}

            {/* ================= MODE: FORGOT PASSWORD ================= */}
            {mode === "forgot" && (
              <>
                <div className="relative z-10 space-y-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMode("login");
                      setError("");
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#FDE047] hover:underline mb-0.5 transition cursor-pointer"
                  >
                    ← Back to Sign In
                  </button>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.06] border border-slate-300/30">
                    <KeyRound className="w-4 h-4 text-[#FDE047]" />
                    <span className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-slate-200">
                      Recovery Protocol
                    </span>
                  </div>
                  <h2 className="text-2xl sm:text-[30px] font-black tracking-tight text-white leading-tight">
                    Reset Password
                  </h2>
                  <p className="text-[13px] text-slate-300/85 font-medium leading-relaxed">
                    Enter your email to receive a password reset verification code.
                  </p>
                </div>

                {error && (
                  <div className="relative z-10 rounded-xl p-3.5 bg-rose-950/85 border border-rose-400/75 text-rose-100 text-xs font-bold flex items-center gap-2.5">
                    <AlertCircle className="w-4 h-4 text-rose-300 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setLoading(true);
                    setError("");

                    try {
                      await axios.post(`${API_BASE}/send-otp`, {
                        email: email.trim(),
                      });
                      setMode("otp");
                      setError("");
                    } catch (err) {
                      setError(
                        err.response?.data?.detail || "Failed to send reset code."
                      );
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className="relative z-10 space-y-4"
                >
                  <div className="space-y-1.5">
                    <label
                      htmlFor="forgot-email"
                      className="block text-xs font-extrabold uppercase tracking-[0.16em] text-slate-200"
                    >
                      Registered Email
                    </label>
                    <div className="group login-input-well relative flex items-center rounded-2xl">
                      <Mail className="w-5 h-5 text-slate-400 group-focus-within:text-[#FDFBF4] ml-4 shrink-0 transition-colors" />
                      <input
                        id="forgot-email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@organization.com"
                        className="login-input-field w-full h-14 px-3.5 rounded-2xl text-[15.5px] font-medium tracking-wide outline-none"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="login-ivory-cta group w-full h-12 rounded-xl font-black text-[13.5px] uppercase tracking-[0.18em] flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <>
                          <span className="w-4 h-4 rounded-full border-2 border-slate-950 border-t-transparent animate-spin" />
                          <span>Dispatching Code...</span>
                        </>
                      ) : (
                        <>
                          <span>Send Reset Code</span>
                          <ArrowRight className="w-4 h-4 stroke-[2.5] group-hover:translate-x-0.5 transition-transform" />
                        </>
                      )}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setMode("login");
                      setError("");
                    }}
                    className="w-full py-2 text-xs font-bold text-slate-400 hover:text-white transition cursor-pointer text-center"
                  >
                    Cancel and Return to Sign In
                  </button>
                </form>
              </>
            )}

            {/* ================= MODE: VERIFY RESET OTP ================= */}
            {mode === "otp" && (
              <>
                <div className="relative z-10 space-y-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMode("forgot");
                      setError("");
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#FDE047] hover:underline mb-0.5 transition cursor-pointer"
                  >
                    ← Back to Email
                  </button>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.06] border border-slate-300/30">
                    <KeyRound className="w-4 h-4 text-[#FDE047]" />
                    <span className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-slate-200">
                      Step 2: Code Verification
                    </span>
                  </div>
                  <h2 className="text-2xl sm:text-[30px] font-black tracking-tight text-white leading-tight">
                    Verify Reset Code
                  </h2>
                  <p className="text-[13px] text-slate-300/85 font-medium leading-relaxed">
                    Enter the 6-digit code sent to{" "}
                    <span className="text-[#FDE047] font-bold">{email}</span>.
                  </p>
                </div>

                {error && (
                  <div className="relative z-10 rounded-xl p-3.5 bg-rose-950/85 border border-rose-400/75 text-rose-100 text-xs font-bold flex items-center gap-2.5">
                    <AlertCircle className="w-4 h-4 text-rose-300 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setLoading(true);
                    setError("");

                    try {
                      await axios.post(`${API_BASE}/verify-otp`, {
                        email: email.trim(),
                        otp,
                      });
                      setMode("new-password");
                      setError("");
                    } catch (err) {
                      setError(
                        err.response?.data?.detail || "Invalid or expired code."
                      );
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className="relative z-10 space-y-4"
                >
                  <div className="space-y-1.5">
                    <label
                      htmlFor="reset-otp-field"
                      className="block text-xs font-extrabold uppercase tracking-[0.16em] text-slate-200"
                    >
                      6-Digit Reset Code
                    </label>
                    <div className="group login-input-well relative flex items-center rounded-2xl">
                      <Lock className="w-5 h-5 text-slate-400 group-focus-within:text-[#FDFBF4] ml-4 shrink-0 transition-colors" />
                      <input
                        id="reset-otp-field"
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        required
                        value={otp}
                        onChange={(e) =>
                          setOtp(e.target.value.replace(/\D/g, ""))
                        }
                        placeholder="••••••"
                        className="login-input-field w-full h-14 px-3.5 rounded-2xl text-[18px] font-mono tracking-[0.35em] text-center font-bold outline-none"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="login-ivory-cta group w-full h-12 rounded-xl font-black text-[13.5px] uppercase tracking-[0.18em] flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <>
                          <span className="w-4 h-4 rounded-full border-2 border-slate-950 border-t-transparent animate-spin" />
                          <span>Verifying Code...</span>
                        </>
                      ) : (
                        <>
                          <span>Confirm Security Code</span>
                          <ArrowRight className="w-4 h-4 stroke-[2.5] group-hover:translate-x-0.5 transition-transform" />
                        </>
                      )}
                    </button>
                  </div>

                  <button
                    type="button"
                    disabled={loading}
                    onClick={async () => {
                      setLoading(true);
                      setError("");
                      try {
                        await axios.post(`${API_BASE}/send-otp`, {
                          email: email.trim(),
                        });
                        alert("A fresh code has been sent to your email.");
                      } catch (err) {
                        setError(
                          err.response?.data?.detail || "Failed to resend code."
                        );
                      } finally {
                        setLoading(false);
                      }
                    }}
                    className="w-full py-2 text-xs font-bold text-slate-400 hover:text-white transition cursor-pointer text-center"
                  >
                    Resend Code
                  </button>
                </form>
              </>
            )}

            {/* ================= MODE: SET NEW PASSWORD ================= */}
            {mode === "new-password" && (
              <>
                <div className="relative z-10 space-y-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.06] border border-slate-300/30">
                    <Lock className="w-4 h-4 text-[#FDE047]" />
                    <span className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-slate-200">
                      Step 3: New Password
                    </span>
                  </div>
                  <h2 className="text-2xl sm:text-[30px] font-black tracking-tight text-white leading-tight">
                    Set New Password
                  </h2>
                  <p className="text-[13px] text-slate-300/85 font-medium leading-relaxed">
                    Choose a strong password to finish securing your account.
                  </p>
                </div>

                {error && (
                  <div className="relative z-10 rounded-xl p-3.5 bg-rose-950/85 border border-rose-400/75 text-rose-100 text-xs font-bold flex items-center gap-2.5">
                    <AlertCircle className="w-4 h-4 text-rose-300 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (newPassword !== confirmPassword) {
                      setError("Passwords do not match.");
                      return;
                    }

                    setLoading(true);
                    setError("");

                    try {
                      await axios.post(`${API_BASE}/reset-password`, {
                        email: email.trim(),
                        otp,
                        new_password: newPassword,
                      });

                      setEmail("");
                      setPassword("");
                      setOtp("");
                      setNewPassword("");
                      setConfirmPassword("");
                      setMode("login");
                      setError("");
                      alert("Password reset successful. Please sign in with your new password.");
                    } catch (err) {
                      setError(
                        err.response?.data?.detail || "Failed to reset password."
                      );
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className="relative z-10 space-y-4"
                >
                  <div className="space-y-1.5">
                    <label
                      htmlFor="new-password-field"
                      className="block text-xs font-extrabold uppercase tracking-[0.16em] text-slate-200"
                    >
                      New Password
                    </label>
                    <div className="group login-input-well relative flex items-center rounded-2xl">
                      <Lock className="w-5 h-5 text-slate-400 group-focus-within:text-[#FDFBF4] ml-4 shrink-0 transition-colors" />
                      <input
                        id="new-password-field"
                        type={showNewPassword ? "text" : "password"}
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                        className="login-input-field w-full h-14 px-3.5 rounded-2xl text-[15.5px] font-medium tracking-wide outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword((prev) => !prev)}
                        aria-label={showNewPassword ? "Hide password" : "Show password"}
                        className="px-3.5 text-slate-400 hover:text-white transition cursor-pointer shrink-0"
                      >
                        {showNewPassword ? (
                          <EyeOff className="w-[18px] h-[18px]" />
                        ) : (
                          <Eye className="w-[18px] h-[18px]" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="confirm-password-field"
                      className="block text-xs font-extrabold uppercase tracking-[0.16em] text-slate-200"
                    >
                      Confirm New Password
                    </label>
                    <div className="group login-input-well relative flex items-center rounded-2xl">
                      <Lock className="w-5 h-5 text-slate-400 group-focus-within:text-[#FDFBF4] ml-4 shrink-0 transition-colors" />
                      <input
                        id="confirm-password-field"
                        type={showNewPassword ? "text" : "password"}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter new password"
                        className="login-input-field w-full h-14 px-3.5 rounded-2xl text-[15.5px] font-medium tracking-wide outline-none"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="login-ivory-cta group w-full h-12 rounded-xl font-black text-[13.5px] uppercase tracking-[0.18em] flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <>
                          <span className="w-4 h-4 rounded-full border-2 border-slate-950 border-t-transparent animate-spin" />
                          <span>Updating Password...</span>
                        </>
                      ) : (
                        <>
                          <span>Save New Password</span>
                          <ArrowRight className="w-4 h-4 stroke-[2.5] group-hover:translate-x-0.5 transition-transform" />
                        </>
                      )}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setMode("login");
                      setError("");
                    }}
                    className="w-full py-2 text-xs font-bold text-slate-400 hover:text-white transition cursor-pointer text-center"
                  >
                    Cancel
                  </button>
                </form>
              </>
            )}

          </div>
        </div>
      </div>
    </div>
  </div>
);
}
