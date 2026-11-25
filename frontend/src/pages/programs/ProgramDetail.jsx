/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect, useMemo, useRef } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import MainLayout from "../../layout/mainLayout";
import api from "../../utils/axios";
import ModuleAiGeneratorBar from "../../components/ModuleAiGeneratorBar";
import {
  ArrowLeft,
  Play,
  PlayCircle,
  HelpCircle,
  Pencil,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  Layers,
  Upload,
  HardDrive,
  FileText,
  Image as ImageIcon,
  Video,
  Link2,
  Save,
  X,
  Sparkles,
  BookOpen,
  Award,
  RotateCcw,
  ExternalLink,
  ChevronRight,
  Eye,
  Check,
  AlertCircle,
  Cpu,
  Radio,
  FileCheck,
} from "lucide-react";

// ============================================================================
// INLINE CUSTOM YOUTUBE ICON (Guarantees zero import collision or missing icon)
// ============================================================================
function YoutubeIcon({ className = "w-4 h-4", ...props }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      {...props}
    >
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

// ============================================================================
// 1. MEDIA URL PARSERS (YOUTUBE & GOOGLE DRIVE AUTO-EMBED CONVERSION)
// ============================================================================
function extractYouTubeId(url) {
  if (!url) return null;
  const trimmed = String(url).trim();
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([A-Za-z0-9_-]{11})/,
    /^([A-Za-z0-9_-]{11})$/,
  ];
  for (const regex of patterns) {
    const match = trimmed.match(regex);
    if (match && match[1]) return match[1];
  }
  return null;
}

function getYouTubeEmbedUrl(url) {
  const vid = extractYouTubeId(url);
  return vid ? `https://www.youtube.com/embed/${vid}?rel=0&modestbranding=1` : null;
}

function getYouTubeThumb(url) {
  const vid = extractYouTubeId(url);
  return vid ? `https://img.youtube.com/vi/${vid}/hqdefault.jpg` : null;
}

function extractDriveFileId(url) {
  if (!url) return null;
  const trimmed = String(url).trim();
  const patterns = [
    /drive\.google\.com\/file\/d\/([A-Za-z0-9_-]+)/,
    /drive\.google\.com\/open\?id=([A-Za-z0-9_-]+)/,
    /docs\.google\.com\/(?:document|presentation|spreadsheets)\/d\/([A-Za-z0-9_-]+)/,
  ];
  for (const regex of patterns) {
    const match = trimmed.match(regex);
    if (match && match[1]) return match[1];
  }
  return null;
}

function getDrivePreviewUrl(url) {
  const fid = extractDriveFileId(url);
  return fid ? `https://drive.google.com/file/d/${fid}/preview` : url;
}

// ============================================================================
// 2. AUTHENTIC CURRICULUM DATA: "CLIENT RELATIONSHIPS" (PROGRAM ID 66)
//    Contains authentic Talent Corner training videos, real lesson descriptions,
//    exact 5-question M1 MCQ Quiz with detailed explanations, and the official
//    Client Relationships Cheat Sheet PDF document. Zero fake references.
// ============================================================================
const DEFAULT_PROGRAM_DATA = {
  id: 66,
  title: "Client Relationships",
  type: "Core Curriculum",
  duration: "32 Mins",
  category: "Client Success & Recruitment",
  status: "Published",
  description:
    "Strengthen every client connection, from first call to long-term trust through empathy, consistency, and thoughtful actions.",
  modules: [
    {
      id: "112",
      number: "01",
      title: "Module 1: Lay the Foundation for Lasting Client Relationships",
      description:
        "In this lesson, you'll gain a clear understanding of how to build strong client relationships from the very first interaction — a skill that forms the foundation of long-term success in recruitment. We'll explore:\n\n1. How to create a powerful first impression with new clients\n2. Practical ways to maintain consistent, meaningful communication\n3. Techniques to re-engage unresponsive clients effectively\n4. How to build rapport through shared interests and aligned values\n\nBy the end of this lesson, you'll be equipped with practical tools and conversational strategies to earn client trust early, strengthen collaboration, and set the stage for lasting partnerships.",
      duration: "10 Mins",
      status: "Published",
      accent: "cyan",
      curos: 10,
      video: {
        sourceType: "youtube",
        title: "Building Client Relationships: Lesson 1",
        url: "https://www.youtube.com/watch?v=ZzIDp4VCg5w",
        fileName: "",
        duration: "10:15",
        explanation:
          "This video teaches you how to create powerful first impressions, maintain consistent communication, celebrate wins, and nurture genuine trust — transforming clients into lifelong partners.\n\nWhat You Will Master:\n• First Impressions That Last: Set the tone for strong partnerships right from the first client interaction.\n• Sustaining Connection: Discover structured rituals, communication habits, and gratitude-driven practices.\n• Emotional Intelligence in Action: Match client tone, handle frustration gracefully, and build comfort through empathy.\n• The Art of Thoughtful Gifting: Learn when and how to send small, timely gestures that make clients feel valued.\n• Long-Term Nurturing: Turn every placement into a partnership by staying relevant, curious, and consultative.",
      },
      resources: [],
      quiz: {
        title: "M1- Quiz: Foundation & First Impressions",
        passingScore: 50,
        timeLimitMins: 5,
        questions: [
          {
            id: "q-270",
            question:
              "1. What is the main goal of maintaining frequent, low-pressure communication with clients?",
            options: [
              "A. To constantly remind them of pending tasks",
              "B. To keep yourself at the top of their mind through dependable contact",
              "C. To make the client respond faster to every message",
              "D. To push for quicker closures",
            ],
            correctIndex: 1,
            explanation:
              "Low-pressure, consistent communication helps build familiarity and trust. It reminds the client of your reliability without being intrusive. The goal is to maintain visibility, so when a hiring need arises, you're the first partner they think of — not to chase or pressure them constantly.",
          },
          {
            id: "q-271",
            question:
              "2. A client has not replied for over a week. Which message is most likely to get their attention without sounding pushy?",
            options: [
              "A. “Following up on the last CVs sent.”",
              "B. “Need your feedback today to close the role.”",
              "C. “A competing firm just announced a similar opening — would you like to fast-track your shortlist?”",
              "D. “Please confirm if you’d like to continue the search.”",
            ],
            correctIndex: 2,
            explanation:
              "This message adds value and urgency without being demanding. It frames the update as market insight, not pressure — making the client feel informed and in control. Pushy reminders (“Need feedback today”) create resistance, while subtle nudges tied to context spark action.",
          },
          {
            id: "q-272",
            question:
              "3. A client values innovation and teamwork in their company. How can the recruiter reflect this understanding in communication?",
            options: [
              "A. Emphasize that the candidates shortlisted are creative and team-oriented.",
              "B. Focus only on candidates who can join immediately.",
              "C. Keep emails short and formal.",
              "D. Mention that all profiles are from large companies.",
            ],
            correctIndex: 0,
            explanation:
              "Good recruiters tailor their tone and content to match the client's values. By highlighting qualities the client cares about, you show alignment with their culture and priorities — this builds emotional resonance and strengthens trust. It's a signal that you truly understand their world.",
          },
          {
            id: "q-273",
            question:
              "4. A recruiter receives feedback from a client within a few hours. What’s the best next step?",
            options: [
              "A. Note it in the CRM and move on.",
              "B. Send a quick thank-you message appreciating their responsiveness.",
              "C. Wait to mention it in the next call.",
              "D. Reply with the next set of resumes immediately.",
            ],
            correctIndex: 1,
            explanation:
              "Acknowledging quick feedback reinforces positive behavior. A simple thank-you message strengthens rapport and subtly encourages the same responsiveness in the future. It’s a relationship-building micro gesture.",
          },
          {
            id: "q-274",
            question:
              "5. During the first few weeks of working with a new client, what’s the best way to show reliability?",
            options: [
              "A. Give frequent updates even when there’s no news.",
              "B. Keep messages strictly formal and short.",
              "C. Send detailed reports every day.",
              "D. Communicate regularly and follow through exactly as promised.",
            ],
            correctIndex: 3,
            explanation:
              "Early interactions set the tone for trust. Clients judge dependability based on whether you do what you say you will — even in small matters.",
          },
        ],
      },
    },
    {
      id: "113",
      number: "02",
      title:
        "Module 2: Sustain Client Momentum Through Rituals and Recognition",
      description:
        "In this lesson, you'll learn how to sustain the momentum you've built with your clients and transform early rapport into a lasting, trusted partnership. We'll explore:\n\n1. How to co-create simple rituals that add familiarity, warmth, and rhythm to your client interactions\n2. Ways to celebrate small and big wins together to reinforce collaboration and emotional connection\n3. Methods to invite client ownership by involving them in refining your working process\n4. How to humanize communication through small gestures like story-sharing and milestone check-ins\n5. Approaches to re-engage clients respectfully after periods of silence while focusing on their goals\n\nBy the end of this lesson, you'll be equipped with practical tools to maintain energy and trust beyond the first deal — turning consistent communication, shared wins, and mutual ownership into the pillars of long-term client success.",
      duration: "12 Mins",
      status: "Published",
      accent: "indigo",
      curos: 10,
      video: {
        sourceType: "youtube",
        title: "Building Client Relationships: Video 2",
        url: "https://www.youtube.com/watch?v=E92qvpjQ4kA",
        fileName: "",
        duration: "12:30",
        explanation:
          "In this video on Client Relationship Building, Talent Corner HR Services Pvt. Ltd. explores how recruiters can sustain momentum with clients and strengthen long-term partnerships through strategic, human-centered practices.\n\nThis video focuses on three high-impact areas:\n1. Structured Rituals: Build simple yet powerful rituals — such as customized greetings, structured weekly check-ins, and candidate storytelling — that create familiarity, predictability, and comfort.\n2. Celebrating Progress: Maintain positive energy by sharing wins, celebrating milestones, and reinforcing progress in ways that deepen collaboration.\n3. Cultivating Process Ownership: Invite clients to shape the working rhythm, offer insights based on hiring patterns, and re-engage inactive clients through need-based, supportive communication.",
      },
      resources: [],
      quiz: {
        title: "Module 2 Assessment: Rituals & Momentum",
        passingScore: 70,
        timeLimitMins: 5,
        questions: [
          {
            id: "q-m2-1",
            question:
              "What is the primary benefit of co-creating structured weekly rituals with clients?",
            options: [
              "A. It reduces the need for any email communication",
              "B. It creates familiarity, predictability, and comfort in every interaction",
              "C. It allows recruiters to skip progress updates",
              "D. It guarantees immediate contract renewals",
            ],
            correctIndex: 1,
            explanation:
              "Structured rituals establish rhythm and mutual comfort, transforming transactional updates into an authentic advisory relationship.",
          },
          {
            id: "q-m2-2",
            question:
              "How should a recruiter celebrate milestones and candidate placements with a client?",
            options: [
              "A. Send an invoice without any congratulatory remarks",
              "B. Acknowledge shared effort, celebrate progress, and reinforce collaboration",
              "C. Ask for immediate referrals before the candidate starts",
              "D. Discontinue check-ins once the role is closed",
            ],
            correctIndex: 1,
            explanation:
              "Celebrating shared milestones reinforces partnership energy and builds long-term loyalty beyond a single placement.",
          },
        ],
      },
    },
    {
      id: "116",
      number: "03",
      title: "Module 3: Deepen Client Trust Through Emotional Intelligence",
      description:
        "In this final lesson, you'll discover emotionally intelligent, time-tested strategies that elevate your role from a recruitment partner to a trusted ally — someone clients feel genuinely connected to and confident relying on. We'll explore:\n\n1. How to listen with intent and recall personal details that make clients feel seen and valued\n2. Ways to match emotional tone and respond empathetically to enthusiasm, frustration, or silence\n3. Techniques to build comfort and diffuse tension through proactive communication and validation\n4. How to nurture long-term partnerships post-placement through curiosity, advisory insights, and consistent human connection\n5. Smart follow-up questions that spark engaging, value-driven conversations without sounding sales-oriented\n\nBy the end of this lesson, you'll be equipped to use emotional intelligence, strategic listening, and genuine appreciation to create deeper, more enduring client relationships — the kind that turn short-term projects into long-term trust.",
      duration: "10 Mins",
      status: "Published",
      accent: "emerald",
      curos: 10,
      video: {
        sourceType: "youtube",
        title: "Building Client Relationships: Video 3",
        url: "https://www.youtube.com/watch?v=Q393mxU2TTE",
        fileName: "",
        duration: "10:45",
        explanation:
          "In this video of the Building Client Relationship series, Talent Corner HR Services Pvt. Ltd. shares the advanced, emotionally intelligent strategies that elevate a recruiter from a service provider to a trusted, long-term partner.\n\nKey Pillars Mastered:\n1. Strategic Listening: Recalling small personal details, asking contextual questions, and blending professional updates with light personal conversation to make clients feel genuinely valued.\n2. Emotional Tone Matching: Adapting communication to match client emotional states (enthusiastic, frustrated, overwhelmed, or silent), validating feelings, and proactively removing friction.\n3. Long-Term Nurturing: Relaxed check-ins, celebrating business achievements, and sharing timely micro-insights to stay relevant as a trusted advisor.",
      },
      resources: [
        {
          id: "wl-57",
          title: "Client Relationships Cheat Sheet",
          type: "pdf",
          source: "url",
          url: "https://uwncapxjclbvokpwtkdo.supabase.co/storage/v1/object/public/learning-assets/documents/f86f2c36-30e4-4b13-860a-9c2220feae77_Client%20relationships%20cheat%20sheet.pdf",
          size: "Course PDF Summary",
          description:
            "A comprehensive PDF summary of the entire course content, conversational frameworks, and key relationship rituals.",
        },
      ],
      quiz: {
        title:
          "Module 3 Assessment: Emotional Intelligence & Post-Placement Nurturing",
        passingScore: 70,
        timeLimitMins: 5,
        questions: [
          {
            id: "q-m3-1",
            question:
              "When a client is overwhelmed or frustrated, what is the most emotionally intelligent response?",
            options: [
              "A. Match their frustration and defend your delivery",
              "B. Validate their emotion, simplify next steps, and proactively reduce friction",
              "C. Disappear and wait until they calm down",
              "D. Forward generic FAQs to their inbox",
            ],
            correctIndex: 1,
            explanation:
              "Adapting your communication to validate emotions and reduce friction creates alignment, reassurance, and enduring trust.",
          },
          {
            id: "q-m3-2",
            question:
              "What distinguishes post-placement nurturing from transactional sales follow-up?",
            options: [
              "A. Sending constant promotional emails",
              "B. Checking in with curiosity, acknowledging business milestones, and sharing timely micro-insights",
              "C. Only calling when new positions need filling",
              "D. Demanding customer satisfaction surveys repeatedly",
            ],
            correctIndex: 1,
            explanation:
              "Thoughtful, consultative check-ins and shared market insights show you care about the client's long-term business success, not just deal commissions.",
          },
        ],
      },
    },
  ],
};

// ============================================================================
// BACKEND TO DIGITAL FORMAT MAPPER
// Maps live database payload into the digital 3-stage format while preserving
// curated educational fallbacks for empty API fields.
// ============================================================================
function mapBackendToDigitalProgram(apiData, fallback) {
  if (!apiData) return fallback;
  const programTitle = apiData.name || apiData.title || fallback.title;
  const programDesc = apiData.description || fallback.description;
  const rawModules = apiData.modules || [];

  if (rawModules.length === 0) {
    return {
      ...fallback,
      id: apiData.id || fallback.id,
      title: programTitle,
      description: programDesc,
      status: apiData.status || fallback.status,
    };
  }

  const accents = ["cyan", "indigo", "emerald"];

  const modules = rawModules.map((m, idx) => {
    const fallbackMod =
      fallback.modules?.find((fm) => String(fm.id) === String(m.id)) ||
      fallback.modules?.[idx] ||
      {};

    // 1. Primary Video
    const primaryVideo = m.videos?.[0] || null;
    const videoData = primaryVideo
      ? {
          id: primaryVideo.id,
          sourceType: primaryVideo.youtube_url ? "youtube" : "local",
          title: primaryVideo.title || fallbackMod.video?.title || `Lesson ${idx + 1}`,
          url: primaryVideo.youtube_url || fallbackMod.video?.url || "",
          fileName: "",
          duration: fallbackMod.video?.duration || "10:00",
          explanation:
            primaryVideo.explanation_text ||
            primaryVideo.description ||
            fallbackMod.video?.explanation ||
            "",
        }
      : fallbackMod.video || {
          sourceType: "youtube",
          title: "Lesson Video",
          url: "",
          fileName: "",
          duration: "10:00",
          explanation: "",
        };

    // 2. Resources (written lessons + video documents)
    const resources = [];
    (m.written_lessons || []).forEach((wl) => {
      resources.push({
        id: `wl-${wl.id}`,
        title: wl.title || "Lesson Study Guide",
        type: wl.pdf_url ? "pdf" : "doc",
        source: "url",
        url: wl.pdf_url || "",
        size: "PDF Guide",
        description: wl.content || "",
      });
    });
    (m.videos || []).forEach((v) => {
      (v.documents || []).forEach((doc) => {
        resources.push({
          id: `doc-${doc.id}`,
          title: doc.title || doc.filename || "Lesson Attachment",
          type: "pdf",
          source: "url",
          url: doc.url || doc.file_url || "",
          size: "Document",
        });
      });
    });
    if (resources.length === 0 && fallbackMod.resources?.length > 0) {
      resources.push(...fallbackMod.resources);
    }

    // 3. Quiz
    const primaryQuiz = m.quizzes?.[0] || null;
    let quizData;
    if (primaryQuiz && primaryQuiz.questions && primaryQuiz.questions.length > 0) {
      quizData = {
        id: primaryQuiz.id,
        title: primaryQuiz.title || fallbackMod.quiz?.title || `Module ${idx + 1} Assessment`,
        passingScore: primaryQuiz.passing_percentage || fallbackMod.quiz?.passingScore || 50,
        timeLimitMins: 5,
        questions: primaryQuiz.questions.map((q, qIndex) => {
          const opts = Array.isArray(q.options)
            ? q.options.map((o) => (typeof o === "string" ? o : o.text || ""))
            : ["Option A", "Option B", "Option C", "Option D"];
          let cIdx = Array.isArray(q.options)
            ? q.options.findIndex((o) => typeof o === "object" && o.isCorrect)
            : 0;
          if (cIdx === -1) cIdx = 0;
          return {
            id: q.id || `q-${qIndex}`,
            question: q.question || q.question_text || `Question ${qIndex + 1}`,
            options: opts,
            correctIndex: cIdx,
            explanation: q.explanation || "",
          };
        }),
      };
    } else {
      quizData = fallbackMod.quiz || {
        title: `Module ${idx + 1} Assessment`,
        passingScore: 70,
        timeLimitMins: 5,
        questions: [],
      };
    }

    return {
      id: String(m.id || `mod-${idx + 1}`),
      number: String(idx + 1).padStart(2, "0"),
      title: m.title || fallbackMod.title || `Module ${idx + 1}`,
      description: m.description || fallbackMod.description || "",
      duration: fallbackMod.duration || `${10 + idx * 2} Mins`,
      status: m.status || "Published",
      accent: accents[idx % accents.length],
      curos: m.curos || 10,
      video: videoData,
      resources,
      quiz: quizData,
    };
  });

  return {
    ...fallback,
    id: apiData.id || fallback.id,
    title: programTitle,
    description: programDesc,
    status: apiData.status || fallback.status,
    modules,
  };
}

// ============================================================================
// 3. INTERACTIVE QUIZ RUNNER COMPONENT
// ============================================================================
function InteractiveQuizPlayer({ quiz, moduleTitle, onComplete, onClose }) {
  const questions = quiz?.questions || [];
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const currentQ = questions[currentIdx];

  const results = useMemo(() => {
    if (!submitted) return null;
    let correct = 0;
    questions.forEach((q, idx) => {
      if (answers[idx] === q.correctIndex) correct += 1;
    });
    const pct =
      questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0;
    const passed = pct >= Number(quiz?.passingScore || 50);
    return { correct, total: questions.length, pct, passed };
  }, [submitted, questions, answers, quiz]);

  const handleSelect = (optIdx) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [currentIdx]: optIdx }));
  };

  const handleSubmit = () => {
    setSubmitted(true);
    let correct = 0;
    questions.forEach((q, idx) => {
      if (answers[idx] === q.correctIndex) correct += 1;
    });
    const pct =
      questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0;
    if (pct >= Number(quiz?.passingScore || 50) && onComplete) {
      onComplete(pct);
    }
  };

  const handleRetry = () => {
    setAnswers({});
    setCurrentIdx(0);
    setSubmitted(false);
  };

  if (questions.length === 0) {
    return (
      <div className="digi-panel-static rounded-3xl p-8 text-center space-y-4">
        <HelpCircle className="w-10 h-10 text-cyan-400 mx-auto" />
        <h3 className="text-lg font-black text-white">No Questions Configured Yet</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Click <strong className="text-cyan-300">Edit Module</strong> at the top
          right to build assessment questions for this module.
        </p>
        <button
          type="button"
          onClick={onClose}
          className="digi-btn-outline px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
        >
          Back to Module Overview
        </button>
      </div>
    );
  }

  return (
    <div className="digi-live-border-indigo rounded-3xl p-6 sm:p-7 space-y-6">
      {/* Quiz Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cyan-500/20 pb-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-[0.24em] text-indigo-300 block">
            INTERACTIVE ASSESSMENT • {moduleTitle}
          </span>
          <h3 className="text-xl font-black text-white mt-0.5">
            {quiz.title || "Module Quiz"}
          </h3>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="px-3 py-1 rounded-xl bg-[#070E22] border border-indigo-400/45 text-xs font-bold text-indigo-200 font-mono">
            Pass ≥ {quiz.passingScore || 50}%
          </span>
          <button
            type="button"
            onClick={onClose}
            className="digi-btn-outline px-3.5 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>Close Quiz</span>
          </button>
        </div>
      </div>

      {!submitted ? (
        <>
          {/* Progress Track */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-cyan-300 font-mono">
                QUESTION {currentIdx + 1} / {questions.length}
              </span>
              <span className="text-slate-400">
                {Object.keys(answers).length} of {questions.length} answered
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-[#050A18] border border-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-400 transition-all duration-300"
                style={{
                  width: `${Math.round(
                    ((currentIdx + 1) / questions.length) * 100
                  )}%`,
                }}
              />
            </div>
          </div>

          {/* Question Stem */}
          <div className="p-5 rounded-2xl bg-[#060C1E] border border-cyan-500/25 space-y-4">
            <p className="text-base sm:text-lg font-bold text-white leading-relaxed">
              {currentQ.question}
            </p>

            <div className="space-y-2.5">
              {(currentQ.options || []).map((opt, idx) => {
                const selected = answers[currentIdx] === idx;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelect(idx)}
                    className={`w-full text-left px-4 py-3.5 rounded-xl border-2 flex items-center gap-3.5 transition cursor-pointer ${
                      selected
                        ? "bg-cyan-500/18 border-cyan-400 text-white shadow-[0_0_20px_rgba(34,211,238,0.28)]"
                        : "bg-[#091128] border-white/10 hover:border-cyan-400/50 text-slate-200"
                    }`}
                  >
                    <span
                      className={`w-7 h-7 rounded-lg font-mono text-xs font-black flex items-center justify-center shrink-0 ${
                        selected
                          ? "bg-cyan-400 text-slate-950"
                          : "bg-[#111B38] text-slate-300 border border-white/15"
                      }`}
                    >
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="text-sm font-semibold">{opt}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quiz Footer Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <button
              type="button"
              disabled={currentIdx === 0}
              onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
              className="digi-btn-outline px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer disabled:opacity-40"
            >
              Previous
            </button>

            <div className="flex items-center gap-2">
              {currentIdx < questions.length - 1 ? (
                <button
                  type="button"
                  onClick={() =>
                    setCurrentIdx((i) => Math.min(questions.length - 1, i + 1))
                  }
                  className="digi-btn-cyan px-5 py-2.5 rounded-xl text-xs font-black inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Next Question</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={Object.keys(answers).length < questions.length}
                  onClick={handleSubmit}
                  className="digi-btn-emerald px-6 py-2.5 rounded-xl text-xs font-black inline-flex items-center gap-2 cursor-pointer disabled:opacity-45"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Submit Assessment</span>
                </button>
              )}
            </div>
          </div>
        </>
      ) : (
        /* Results Breakdown */
        <div className="space-y-5">
          <div
            className={`p-5 rounded-2xl border-2 flex flex-wrap items-center justify-between gap-4 ${
              results.passed
                ? "bg-emerald-500/12 border-emerald-400/70"
                : "bg-rose-500/12 border-rose-400/70"
            }`}
          >
            <div className="flex items-center gap-3.5">
              {results.passed ? (
                <Award className="w-10 h-10 text-emerald-300 shrink-0" />
              ) : (
                <AlertCircle className="w-10 h-10 text-rose-300 shrink-0" />
              )}
              <div>
                <h4 className="text-xl font-black text-white">
                  {results.passed
                    ? "Assessment Passed!"
                    : "Keep Practicing — Try Again"}
                </h4>
                <p className="text-xs text-slate-200 font-semibold mt-0.5">
                  You scored {results.correct} out of {results.total} correct (
                  {results.pct}%). Required threshold: {quiz.passingScore || 50}%.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <span className="text-3xl font-black font-mono text-white">
                {results.pct}%
              </span>
              <button
                type="button"
                onClick={handleRetry}
                className="digi-btn-cyan px-4 py-2 rounded-xl text-xs font-black inline-flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retake</span>
              </button>
            </div>
          </div>

          <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
            {questions.map((q, idx) => {
              const userAns = answers[idx];
              const isRight = userAns === q.correctIndex;
              return (
                <div
                  key={q.id || idx}
                  className={`p-4 rounded-2xl border ${
                    isRight
                      ? "bg-[#06181A] border-emerald-400/40"
                      : "bg-[#1A0B14] border-rose-400/40"
                  } space-y-1.5`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-bold text-white">
                      {q.question}
                    </p>
                    {isRight ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    )}
                  </div>
                  <p className="text-xs text-slate-300">
                    Your Answer:{" "}
                    <strong className={isRight ? "text-emerald-300" : "text-rose-300"}>
                      {q.options[userAns] ?? "Skipped"}
                    </strong>
                  </p>
                  {!isRight && (
                    <p className="text-xs text-emerald-300">
                      Correct Answer: <strong>{q.options[q.correctIndex]}</strong>
                    </p>
                  )}
                  {q.explanation && (
                    <p className="text-[11px] text-slate-400 pt-1 border-t border-white/10 leading-relaxed">
                      {q.explanation}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 4. STAGE 3: COMPREHENSIVE MODULE EDITOR STUDIO
//    - Section 1: Module Name, Description, Duration, Status
//    - Section 2: Video Source Hub (YouTube Link, Personal Video Upload, Drive)
//    - Section 3: Study Content Hub (Images, PDFs, Google Drive Docs)
//    - Section 4: Full Quiz Question Builder
// ============================================================================
function ModuleEditorStudio({ moduleData, onSave, onCancel }) {
  const [draft, setDraft] = useState(() =>
    JSON.parse(JSON.stringify(moduleData))
  );

  const [videoTab, setVideoTab] = useState(
    moduleData.video?.sourceType || "youtube"
  );
  const videoFileInputRef = useRef(null);

  const [driveAssetTitle, setDriveAssetTitle] = useState("");
  const [driveAssetUrl, setDriveAssetUrl] = useState("");
  const [driveAssetType, setDriveAssetType] = useState("pdf");
  const pdfFileInputRef = useRef(null);
  const imgFileInputRef = useRef(null);

  const handleLocalVideoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    setDraft((prev) => ({
      ...prev,
      video: {
        ...prev.video,
        sourceType: "local",
        url: objectUrl,
        fileName: file.name,
        title: prev.video?.title || file.name.replace(/\.[^/.]+$/, ""),
      },
    }));
  };

  const handleLocalAssetUpload = (e, assetType) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl =
        typeof ev.target?.result === "string"
          ? ev.target.result
          : URL.createObjectURL(file);
      const sizeKb = Math.max(1, Math.round(file.size / 1024));
      const sizeLabel =
        sizeKb >= 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${sizeKb} KB`;

      setDraft((prev) => ({
        ...prev,
        resources: [
          ...(prev.resources || []),
          {
            id: `res-${Date.now()}`,
            title: file.name,
            type: assetType,
            source: "local",
            url: dataUrl,
            size: sizeLabel,
          },
        ],
      }));
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleAddDriveOrUrlAsset = () => {
    if (!driveAssetUrl.trim()) return;
    const isDrive = /drive\.google\.com|docs\.google\.com/i.test(driveAssetUrl);
    const title =
      driveAssetTitle.trim() ||
      (isDrive ? "Google Drive Study Material" : "External Study Resource");

    setDraft((prev) => ({
      ...prev,
      resources: [
        ...(prev.resources || []),
        {
          id: `res-${Date.now()}`,
          title,
          type: driveAssetType,
          source: isDrive ? "drive" : "url",
          url: driveAssetUrl.trim(),
          size: isDrive ? "Google Drive" : "Cloud Link",
        },
      ],
    }));
    setDriveAssetTitle("");
    setDriveAssetUrl("");
  };

  const handleRemoveResource = (resId) => {
    setDraft((prev) => ({
      ...prev,
      resources: (prev.resources || []).filter((r) => r.id !== resId),
    }));
  };

  const handleAddQuestion = () => {
    setDraft((prev) => ({
      ...prev,
      quiz: {
        ...prev.quiz,
        questions: [
          ...(prev.quiz?.questions || []),
          {
            id: `q-${Date.now()}`,
            question: "Enter your assessment question here...",
            options: [
              "A. First answer option",
              "B. Second answer option",
              "C. Third answer option",
              "D. Fourth answer option",
            ],
            correctIndex: 0,
            explanation: "Explain why this answer is correct.",
          },
        ],
      },
    }));
  };

  const handleUpdateQuestion = (qIndex, patch) => {
    setDraft((prev) => {
      const nextQs = [...(prev.quiz?.questions || [])];
      nextQs[qIndex] = { ...nextQs[qIndex], ...patch };
      return { ...prev, quiz: { ...prev.quiz, questions: nextQs } };
    });
  };

  const handleUpdateOption = (qIndex, optIndex, value) => {
    setDraft((prev) => {
      const nextQs = [...(prev.quiz?.questions || [])];
      const nextOpts = [...(nextQs[qIndex].options || [])];
      nextOpts[optIndex] = value;
      nextQs[qIndex] = { ...nextQs[qIndex], options: nextOpts };
      return { ...prev, quiz: { ...prev.quiz, questions: nextQs } };
    });
  };

  const handleDeleteQuestion = (qIndex) => {
    setDraft((prev) => ({
      ...prev,
      quiz: {
        ...prev.quiz,
        questions: (prev.quiz?.questions || []).filter((_, i) => i !== qIndex),
      },
    }));
  };

  const previewYouTubeEmbed =
    draft.video?.sourceType === "youtube"
      ? getYouTubeEmbedUrl(draft.video?.url)
      : null;

  return (
    <div className="space-y-5">
      {/* Studio Action Bar */}
      <div className="digi-panel-static rounded-2xl px-5 py-4 flex flex-wrap items-center justify-between gap-3 border-2 border-cyan-400/75 shadow-[0_0_28px_rgba(34,211,238,0.22)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-400/60 flex items-center justify-center text-cyan-300">
            <Pencil className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-300 block">
              MODULE CONTENT STUDIO • MODULE {draft.number}
            </span>
            <h2 className="text-lg font-black text-white">
              Edit Module, Media &amp; Quiz
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2.5 ml-auto">
          <button
            type="button"
            onClick={onCancel}
            className="digi-btn-outline px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSave(draft)}
            className="digi-btn-emerald px-5 py-2 rounded-xl text-xs font-black inline-flex items-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Module Changes</span>
          </button>
        </div>
      </div>

      {/* =====================================================================
          GENERATIVE MODULE STUDIO (AI + DETERMINISTIC BACKUP)
      ===================================================================== */}
      <ModuleAiGeneratorBar
        moduleTitle={draft.title}
        youtubeUrl={draft.video?.url}
        onApplyKit={(kit) =>
          setDraft((prev) => ({
            ...prev,
            description: kit.description || prev.description,
            duration: kit.estimated_duration || prev.duration,
            quiz: {
              ...prev.quiz,
              passingScore: kit.passing_score || prev.quiz?.passingScore || 70,
              questions:
                Array.isArray(kit.questions) && kit.questions.length > 0
                  ? kit.questions
                  : prev.quiz?.questions || [],
            },
          }))
        }
      />

      {/* =====================================================================
          STACK PANEL 1: MODULE IDENTITY (NAME, DESCRIPTION, METADATA)
      ===================================================================== */}
      <section className="digi-live-border-cyan rounded-3xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-1 rounded-lg bg-cyan-500/20 border border-cyan-400/50 text-[10px] font-black font-mono text-cyan-200">
              01
            </span>
            <h3 className="text-base font-black text-white">
              Module Details &amp; Description
            </h3>
          </div>
          <span className="text-[11px] font-semibold text-slate-400">
            Core identity visible to students
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-6 space-y-1.5">
            <label className="text-[11px] font-extrabold uppercase tracking-wider text-cyan-200 block">
              Module Title
            </label>
            <input
              type="text"
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              placeholder="e.g., Module 1: Lay the Foundation..."
              className="digi-input w-full rounded-xl px-4 py-3 text-sm font-bold"
            />
          </div>

          <div className="md:col-span-3 space-y-1.5">
            <label className="text-[11px] font-extrabold uppercase tracking-wider text-cyan-200 block">
              Estimated Duration
            </label>
            <input
              type="text"
              value={draft.duration}
              onChange={(e) => setDraft({ ...draft, duration: e.target.value })}
              placeholder="e.g., 10 Mins"
              className="digi-input w-full rounded-xl px-4 py-3 text-sm font-bold"
            />
          </div>

          <div className="md:col-span-3 space-y-1.5">
            <label className="text-[11px] font-extrabold uppercase tracking-wider text-cyan-200 block">
              Status
            </label>
            <select
              value={draft.status}
              onChange={(e) => setDraft({ ...draft, status: e.target.value })}
              className="digi-input w-full rounded-xl px-4 py-3 text-sm font-bold cursor-pointer"
            >
              <option value="Published" className="bg-[#070D1F]">
                Published
              </option>
              <option value="Draft" className="bg-[#070D1F]">
                Draft
              </option>
            </select>
          </div>

          <div className="md:col-span-12 space-y-1.5">
            <label className="text-[11px] font-extrabold uppercase tracking-wider text-cyan-200 block">
              Module Description &amp; Study Brief
            </label>
            <textarea
              rows={4}
              value={draft.description}
              onChange={(e) =>
                setDraft({ ...draft, description: e.target.value })
              }
              placeholder="Describe key concepts students will learn in this module..."
              className="digi-input w-full rounded-xl px-4 py-3 text-sm font-medium leading-relaxed resize-none"
            />
          </div>
        </div>
      </section>

      {/* =====================================================================
          STACK PANEL 2: VIDEO STUDIO (YOUTUBE / PERSONAL UPLOAD / GOOGLE DRIVE)
      ===================================================================== */}
      <section className="digi-live-border-indigo rounded-3xl p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-1 rounded-lg bg-indigo-500/20 border border-indigo-400/50 text-[10px] font-black font-mono text-indigo-200">
              02
            </span>
            <h3 className="text-base font-black text-white">
              Primary Video Lesson Source
            </h3>
          </div>

          {/* Video Source Switcher */}
          <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-xl bg-[#09152E] border-2 border-indigo-400/50 shadow-[0_0_20px_rgba(99,102,241,0.2)]">
            {[
              {
                id: "youtube",
                label: "YouTube Link",
                icon: <YoutubeIcon className="w-3.5 h-3.5 text-rose-400" />,
              },
              {
                id: "local",
                label: "Upload Personal Video",
                icon: <Upload className="w-3.5 h-3.5 text-cyan-300" />,
              },
              {
                id: "drive",
                label: "Google Drive Video",
                icon: <HardDrive className="w-3.5 h-3.5 text-emerald-300" />,
              },
            ].map((src) => (
              <button
                key={src.id}
                type="button"
                onClick={() => {
                  setVideoTab(src.id);
                  setDraft((prev) => ({
                    ...prev,
                    video: { ...prev.video, sourceType: src.id },
                  }));
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer transition ${
                  videoTab === src.id
                    ? "bg-gradient-to-r from-indigo-500/45 to-cyan-500/30 text-white border-2 border-indigo-300 shadow-[0_0_16px_rgba(129,140,248,0.45)]"
                    : "bg-[#0D1C3A]/85 text-slate-300 border border-white/15 hover:border-indigo-300/70 hover:text-white"
                }`}
              >
                {src.icon}
                <span>{src.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Inputs */}
          <div className="lg:col-span-7 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-200 block">
                  Video Lesson Title
                </label>
                <input
                  type="text"
                  value={draft.video?.title || ""}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      video: { ...prev.video, title: e.target.value },
                    }))
                  }
                  placeholder="Enter video lecture title..."
                  className="digi-input w-full rounded-xl px-4 py-2.5 text-sm font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-200 block">
                  Video Length
                </label>
                <input
                  type="text"
                  value={draft.video?.duration || ""}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      video: { ...prev.video, duration: e.target.value },
                    }))
                  }
                  placeholder="10:00"
                  className="digi-input w-full rounded-xl px-4 py-2.5 text-sm font-bold font-mono"
                />
              </div>
            </div>

            {videoTab === "youtube" && (
              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-rose-300 block">
                  YouTube Video URL (Watch, Share, or Shorts Link)
                </label>
                <div className="relative">
                  <YoutubeIcon className="w-4 h-4 text-rose-400 absolute left-3.5 top-3.5" />
                  <input
                    type="url"
                    value={draft.video?.url || ""}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        video: {
                          ...prev.video,
                          sourceType: "youtube",
                          url: e.target.value,
                        },
                      }))
                    }
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="digi-input w-full rounded-xl pl-10 pr-4 py-2.5 text-xs font-mono font-bold"
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  Automatically converts any YouTube URL into an embedded player &amp; HD thumbnail.
                </p>
              </div>
            )}

            {videoTab === "local" && (
              <div className="space-y-2">
                <input
                  ref={videoFileInputRef}
                  type="file"
                  accept="video/mp4,video/webm,video/ogg,video/*"
                  onChange={handleLocalVideoUpload}
                  className="hidden"
                />
                <div
                  onClick={() => videoFileInputRef.current?.click()}
                  className="cursor-pointer rounded-2xl border-2 border-dashed border-cyan-400/50 hover:border-cyan-300 bg-[#050A18] p-6 text-center space-y-2 transition"
                >
                  <Upload className="w-7 h-7 text-cyan-300 mx-auto" />
                  <p className="text-sm font-black text-white">
                    Click to Upload Personal Video (MP4, WebM, MOV)
                  </p>
                  <p className="text-xs text-slate-400">
                    {draft.video?.fileName
                      ? `Loaded: ${draft.video.fileName}`
                      : "Select a recorded lecture directly from your computer"}
                  </p>
                </div>
              </div>
            )}

            {videoTab === "drive" && (
              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-300 block">
                  Google Drive Video Share Link
                </label>
                <div className="relative">
                  <HardDrive className="w-4 h-4 text-emerald-300 absolute left-3.5 top-3.5" />
                  <input
                    type="url"
                    value={draft.video?.url || ""}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        video: {
                          ...prev.video,
                          sourceType: "drive",
                          url: e.target.value,
                        },
                      }))
                    }
                    placeholder="https://drive.google.com/file/d/FILE_ID/view?usp=sharing"
                    className="digi-input w-full rounded-xl pl-10 pr-4 py-2.5 text-xs font-mono font-bold"
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  Ensure Drive sharing is set to &ldquo;Anyone with the link can view&rdquo; for instant playback.
                </p>
              </div>
            )}

            {/* Video Lesson Key Objectives / Summary Notes */}
            <div className="space-y-1.5 pt-1">
              <label className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-200 block">
                Video Lesson Guide &amp; Key Concepts
              </label>
              <textarea
                rows={3}
                value={draft.video?.explanation || ""}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    video: { ...prev.video, explanation: e.target.value },
                  }))
                }
                placeholder="Key concepts covered in this video lecture..."
                className="digi-input w-full rounded-xl px-4 py-2.5 text-xs font-medium leading-relaxed resize-none"
              />
            </div>
          </div>

          {/* Right Live Video Preview Box */}
          <div className="lg:col-span-5">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2">
              Live Player Preview
            </span>
            <div className="aspect-video w-full rounded-2xl overflow-hidden bg-[#040814] border border-cyan-400/35 flex items-center justify-center">
              {videoTab === "youtube" && previewYouTubeEmbed ? (
                <iframe
                  src={previewYouTubeEmbed}
                  title="YouTube Preview"
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : videoTab === "local" && draft.video?.url ? (
                <video
                  src={draft.video.url}
                  controls
                  className="w-full h-full object-contain bg-black"
                />
              ) : videoTab === "drive" && extractDriveFileId(draft.video?.url) ? (
                <iframe
                  src={getDrivePreviewUrl(draft.video.url)}
                  title="Google Drive Preview"
                  className="w-full h-full"
                  allow="autoplay"
                />
              ) : (
                <div className="text-center p-4 space-y-1.5">
                  <Video className="w-8 h-8 text-slate-600 mx-auto" />
                  <span className="text-xs font-bold text-slate-500 block">
                    Paste a link or upload a video to preview
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          STACK PANEL 3: STUDY CONTENT & ATTACHMENTS (IMAGES, PDFs, DRIVE)
      ===================================================================== */}
      <section className="digi-live-border-emerald rounded-3xl p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-400/50 text-[10px] font-black font-mono text-emerald-200">
              03
            </span>
            <h3 className="text-base font-black text-white">
              Study Content, Images, PDFs &amp; Cloud Files
            </h3>
          </div>
          <span className="text-xs font-bold text-emerald-300 font-mono">
            {(draft.resources || []).length} Attached Asset(s)
          </span>
        </div>

        {/* Hidden Device Pickers */}
        <input
          ref={imgFileInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => handleLocalAssetUpload(e, "image")}
          className="hidden"
        />
        <input
          ref={pdfFileInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.ppt,.pptx"
          onChange={(e) => handleLocalAssetUpload(e, "pdf")}
          className="hidden"
        />

        {/* Quick Local Device Uploaders + Google Drive Link Importer */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-5 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => imgFileInputRef.current?.click()}
              className="rounded-2xl p-4 bg-gradient-to-br from-[#0F284E] to-[#091834] border-2 border-cyan-400/65 hover:border-cyan-300 hover:shadow-[0_0_24px_rgba(34,211,238,0.3)] text-left space-y-2 transition cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-cyan-300">
                <ImageIcon className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-black text-white block">
                  Upload Image
                </span>
                <span className="text-[10.5px] text-slate-400 block">
                  PNG, JPG, Diagrams
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => pdfFileInputRef.current?.click()}
              className="rounded-2xl p-4 bg-gradient-to-br from-[#0A2F30] to-[#061D22] border-2 border-emerald-400/65 hover:border-emerald-300 hover:shadow-[0_0_24px_rgba(52,211,153,0.3)] text-left space-y-2 transition cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-300">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-black text-white block">
                  Upload PDF / Notes
                </span>
                <span className="text-[10.5px] text-slate-400 block">
                  PDF, Slides, Cheat Sheets
                </span>
              </div>
            </button>
          </div>

          {/* Import from Google Drive / Cloud URL */}
          <div className="lg:col-span-7 rounded-2xl p-4 bg-gradient-to-br from-[#0C253D] to-[#08172B] border-2 border-teal-400/55 shadow-[0_10px_28px_rgba(16,185,129,0.12)] space-y-3">
            <div className="flex items-center gap-2 text-xs font-black text-emerald-300">
              <HardDrive className="w-4 h-4" />
              <span>Import from Google Drive or Direct Cloud URL</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
              <input
                type="text"
                value={driveAssetTitle}
                onChange={(e) => setDriveAssetTitle(e.target.value)}
                placeholder="Resource title (e.g., Client Cheat Sheet)"
                className="sm:col-span-4 digi-input rounded-xl px-3 py-2 text-xs font-bold"
              />
              <input
                type="url"
                value={driveAssetUrl}
                onChange={(e) => setDriveAssetUrl(e.target.value)}
                placeholder="Paste URL (https://...)"
                className="sm:col-span-5 digi-input rounded-xl px-3 py-2 text-xs font-mono"
              />
              <select
                value={driveAssetType}
                onChange={(e) => setDriveAssetType(e.target.value)}
                className="sm:col-span-3 digi-input rounded-xl px-2.5 py-2 text-xs font-bold cursor-pointer"
              >
                <option value="pdf" className="bg-[#070D1F]">
                  PDF / Doc
                </option>
                <option value="image" className="bg-[#070D1F]">
                  Image
                </option>
                <option value="video" className="bg-[#070D1F]">
                  Drive Video
                </option>
              </select>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleAddDriveOrUrlAsset}
                className="digi-btn-cyan px-4 py-1.5 rounded-xl text-xs font-black inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Link2 className="w-3.5 h-3.5" />
                <span>Attach Resource</span>
              </button>
            </div>
          </div>
        </div>

        {/* Attached Resources List */}
        {(draft.resources || []).length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
            {draft.resources.map((res) => (
              <div
                key={res.id}
                className="p-3.5 rounded-2xl bg-[#050B18] border border-white/15 flex items-center gap-3"
              >
                {res.type === "image" && res.url ? (
                  <img
                    src={res.url}
                    alt={res.title}
                    className="w-12 h-12 rounded-xl object-cover border border-cyan-400/40 shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-[#0D1730] border border-emerald-400/40 flex items-center justify-center shrink-0">
                    {res.type === "pdf" ? (
                      <FileText className="w-5 h-5 text-emerald-300" />
                    ) : res.type === "video" ? (
                      <Video className="w-5 h-5 text-indigo-300" />
                    ) : (
                      <ImageIcon className="w-5 h-5 text-cyan-300" />
                    )}
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <span className="text-xs font-extrabold text-white block truncate">
                    {res.title}
                  </span>
                  <span className="text-[10.5px] font-bold text-slate-400 uppercase">
                    {res.type} • {res.size || res.source}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveResource(res.id)}
                  className="w-7 h-7 rounded-lg bg-rose-500/15 hover:bg-rose-500/30 text-rose-300 flex items-center justify-center cursor-pointer shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* =====================================================================
          STACK PANEL 4: INTERACTIVE QUIZ BUILDER
      ===================================================================== */}
      <section className="digi-live-border-cyan rounded-3xl p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-1 rounded-lg bg-blue-500/20 border border-blue-400/50 text-[10px] font-black font-mono text-blue-200">
              04
            </span>
            <h3 className="text-base font-black text-white">
              Module Quiz Builder
            </h3>
          </div>

          <button
            type="button"
            onClick={handleAddQuestion}
            className="digi-btn-cyan px-3.5 py-2 rounded-xl text-xs font-black inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Question</span>
          </button>
        </div>

        {/* Quiz Metadata */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
          <div className="sm:col-span-6 space-y-1">
            <label className="text-[10.5px] font-extrabold uppercase tracking-wider text-slate-300 block">
              Quiz Title
            </label>
            <input
              type="text"
              value={draft.quiz?.title || ""}
              onChange={(e) =>
                setDraft((prev) => ({
                  ...prev,
                  quiz: { ...prev.quiz, title: e.target.value },
                }))
              }
              className="digi-input w-full rounded-xl px-3.5 py-2 text-xs font-bold"
            />
          </div>

          <div className="sm:col-span-3 space-y-1">
            <label className="text-[10.5px] font-extrabold uppercase tracking-wider text-slate-300 block">
              Passing Score (%)
            </label>
            <input
              type="number"
              min="10"
              max="100"
              value={draft.quiz?.passingScore ?? 50}
              onChange={(e) =>
                setDraft((prev) => ({
                  ...prev,
                  quiz: {
                    ...prev.quiz,
                    passingScore: Math.min(100, Math.max(10, Number(e.target.value) || 50)),
                  },
                }))
              }
              className="digi-input w-full rounded-xl px-3.5 py-2 text-xs font-black font-mono"
            />
          </div>

          <div className="sm:col-span-3 space-y-1">
            <label className="text-[10.5px] font-extrabold uppercase tracking-wider text-slate-300 block">
              Time Limit (Mins)
            </label>
            <input
              type="number"
              min="1"
              max="120"
              value={draft.quiz?.timeLimitMins ?? 5}
              onChange={(e) =>
                setDraft((prev) => ({
                  ...prev,
                  quiz: {
                    ...prev.quiz,
                    timeLimitMins: Math.max(1, Number(e.target.value) || 5),
                  },
                }))
              }
              className="digi-input w-full rounded-xl px-3.5 py-2 text-xs font-black font-mono"
            />
          </div>
        </div>

        {/* Questions List */}
        <div className="space-y-4">
          {(draft.quiz?.questions || []).map((q, qIdx) => (
            <div
              key={q.id || qIdx}
              className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#102246] via-[#0B1835] to-[#081228] border-2 border-cyan-400/55 hover:border-cyan-300/85 shadow-[0_12px_30px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(186,230,253,0.16)] space-y-3 transition"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-cyan-300 block">
                    Question #{qIdx + 1}
                  </label>
                  <input
                    type="text"
                    value={q.question}
                    onChange={(e) =>
                      handleUpdateQuestion(qIdx, { question: e.target.value })
                    }
                    className="digi-input w-full rounded-xl px-3.5 py-2 text-xs font-bold"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteQuestion(qIdx)}
                  className="mt-5 w-8 h-8 rounded-lg bg-rose-500/20 border border-rose-400/45 hover:bg-rose-500/35 text-rose-200 flex items-center justify-center cursor-pointer shrink-0 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {(q.options || []).map((opt, optIdx) => {
                  const isCorrect = q.correctIndex === optIdx;
                  return (
                    <div
                      key={optIdx}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border-2 transition ${
                        isCorrect
                          ? "bg-emerald-500/20 border-emerald-300/85 shadow-[0_0_18px_rgba(52,211,153,0.22)]"
                          : "bg-[#0F1E3E] border-sky-400/35 hover:border-cyan-300/65"
                      }`}
                    >
                      <button
                        type="button"
                        title="Mark as correct answer"
                        onClick={() =>
                          handleUpdateQuestion(qIdx, { correctIndex: optIdx })
                        }
                        className={`w-6 h-6 rounded-md text-[10px] font-black flex items-center justify-center shrink-0 cursor-pointer ${
                          isCorrect
                            ? "bg-emerald-400 text-slate-950"
                            : "bg-white/10 text-slate-300 hover:bg-white/20"
                        }`}
                      >
                        {isCorrect ? (
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        ) : (
                          String.fromCharCode(65 + optIdx)
                        )}
                      </button>
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) =>
                          handleUpdateOption(qIdx, optIdx, e.target.value)
                        }
                        className="flex-1 bg-transparent text-xs font-semibold text-white outline-none"
                      />
                    </div>
                  );
                })}
              </div>

              <div>
                <input
                  type="text"
                  value={q.explanation || ""}
                  onChange={(e) =>
                    handleUpdateQuestion(qIdx, { explanation: e.target.value })
                  }
                  placeholder="Answer explanation shown after submission..."
                  className="digi-input w-full rounded-xl px-3.5 py-2 text-[11px] font-medium text-slate-300"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Save Trigger */}
        <div className="pt-2 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="digi-btn-outline px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSave(draft)}
            className="digi-btn-emerald px-6 py-2.5 rounded-xl text-xs font-black inline-flex items-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save All Module Updates</span>
          </button>
        </div>
      </section>
    </div>
  );
}

// ============================================================================
// 5. MAIN COMPONENT: ProgramDetail (DIGITAL FOCUS STUDENT WORKSPACE)
// ============================================================================
export default function ProgramDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const storageKey = `saarthi_digital_program_modules_${id || 66}`;

  const [program, setProgram] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (
        saved &&
        !saved.includes("M7lc1UVf-VE") &&
        !saved.includes("1ExampleDiscoveryChecklist")
      ) {
        return JSON.parse(saved);
      }
    } catch {
      // Ignore storage error
    }
    if (location.state?.program) {
      return mapBackendToDigitalProgram(
        location.state.program,
        DEFAULT_PROGRAM_DATA
      );
    }
    return DEFAULT_PROGRAM_DATA;
  });

  const [activeModuleId, setActiveModuleId] = useState(null);
  const [activeActivity, setActiveActivity] = useState(null); // null | 'video' | 'quiz'
  const [isEditingModule, setIsEditingModule] = useState(false);
  const [showVideoNotes, setShowVideoNotes] = useState(true);

  // Track completed quizzes
  const [completedQuizzes, setCompletedQuizzes] = useState({});
  const [previewResource, setPreviewResource] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  };

  // Persist updates locally per program ID
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(program));
    } catch {
      // Ignore quota error
    }
  }, [program, storageKey]);

  // Synchronize live backend data
  useEffect(() => {
    let mounted = true;
    const syncBackend = async () => {
      try {
        const res = await api.get(`/programs/${id || 66}`, {
          params: { _t: Date.now() },
        });
        const data = res.data?.program || res.data?.data || res.data;
        if (mounted && data) {
          setProgram((prev) => mapBackendToDigitalProgram(data, prev));
        }
      } catch {
        // Fallback to offline / initial data
      }
    };
    syncBackend();
    return () => {
      mounted = false;
    };
  }, [id]);

  const activeModule = useMemo(
    () => (program.modules || []).find((m) => String(m.id) === String(activeModuleId)) || null,
    [program.modules, activeModuleId]
  );

  const completedCount = Object.keys(completedQuizzes).length;
  const totalModules = (program.modules || []).length;
  const masteryPct =
    totalModules > 0 ? Math.round((completedCount / totalModules) * 100) : 0;

  // Save module updates
  const handleSaveModule = async (updatedMod) => {
    setProgram((prev) => ({
      ...prev,
      modules: (prev.modules || []).map((m) =>
        String(m.id) === String(updatedMod.id) ? updatedMod : m
      ),
    }));
    setIsEditingModule(false);
    setActiveActivity(null);

    try {
      await api.patch(
        `/programs/${id || 66}/modules/${updatedMod.id}`,
        updatedMod
      );
    } catch {
      // Persisted in local storage
    }
    showToast(`Saved "${updatedMod.title}" successfully`);
  };

  // Add new module unit
  const handleAddModule = () => {
    const nextNum = String((program.modules?.length || 0) + 1).padStart(2, "0");
    const accents = ["cyan", "indigo", "emerald"];
    const newMod = {
      id: `mod-${Date.now()}`,
      number: nextNum,
      title: `Module ${nextNum}: New Study Unit`,
      description:
        "Click Edit Module to link your YouTube video lecture, upload personal recordings, attach PDFs, and build interactive quiz questions.",
      duration: "10 Mins",
      status: "Draft",
      accent: accents[(program.modules?.length || 0) % accents.length],
      curos: 10,
      video: {
        sourceType: "youtube",
        title: "Untitled Video Lecture",
        url: "",
        fileName: "",
        duration: "10:00",
        explanation: "",
      },
      resources: [],
      quiz: {
        title: `Module ${nextNum} Assessment`,
        passingScore: 50,
        timeLimitMins: 5,
        questions: [],
      },
    };
    setProgram((prev) => ({
      ...prev,
      modules: [...(prev.modules || []), newMod],
    }));
    setActiveModuleId(newMod.id);
    setIsEditingModule(true);
    showToast(`Created Module ${nextNum} — ready to configure`);
  };

  return (
    <MainLayout>
      <div className="-m-4 sm:-m-6 p-5 sm:p-7 min-h-[calc(100vh-4rem)] digi-study-stage text-slate-100 font-sans space-y-6 overflow-x-hidden relative selection:bg-cyan-400 selection:text-slate-950">
        {/* ===================================================================
            DIGITAL STUDENT FOCUS THEME STYLES
            - Obsidian-Navy Cyber-Study Canvas with fine coordinate grid
            - Organic Live-Moving Digital Glowing Borders (Staggered non-harmonic)
            - Electric Cyan, Cobalt Indigo & Emerald Action Controls
        =================================================================== */}
        <style>{`
          /* 1. DEEP DIGITAL STUDY CANVAS */
          .digi-study-stage {
            background-color: #030712;
            background-image:
              radial-gradient(ellipse 58% 36% at 50% 0%, rgba(14, 165, 233, 0.16) 0%, transparent 68%),
              radial-gradient(ellipse 42% 38% at 88% 85%, rgba(99, 102, 241, 0.14) 0%, transparent 68%),
              radial-gradient(ellipse 38% 32% at 10% 78%, rgba(16, 185, 129, 0.09) 0%, transparent 68%),
              linear-gradient(rgba(56, 189, 248, 0.032) 1px, transparent 1px),
              linear-gradient(90deg, rgba(56, 189, 248, 0.032) 1px, transparent 1px);
            background-size: 100% 100%, 100% 100%, 100% 100%, 44px 44px, 44px 44px;
          }

          /* 2. ORGANIC LIVE-MOVING DIGITAL GLOWING BORDERS */
          @property --dg1x { syntax: "<percentage>"; inherits: false; initial-value: 14%; }
          @property --dg1y { syntax: "<percentage>"; inherits: false; initial-value: 10%; }
          @property --dg2x { syntax: "<percentage>"; inherits: false; initial-value: 86%; }
          @property --dg2y { syntax: "<percentage>"; inherits: false; initial-value: 88%; }

          @keyframes digiRimDriftA {
            0%   { --dg1x: 10%; --dg1y: 8%;  }
            28%  { --dg1x: 84%; --dg1y: 16%; }
            56%  { --dg1x: 92%; --dg1y: 88%; }
            82%  { --dg1x: 16%; --dg1y: 84%; }
            100% { --dg1x: 10%; --dg1y: 8%;  }
          }

          @keyframes digiRimDriftB {
            0%   { --dg2x: 88%; --dg2y: 90%; }
            32%  { --dg2x: 12%; --dg2y: 72%; }
            64%  { --dg2x: 42%; --dg2y: 6%;  }
            100% { --dg2x: 88%; --dg2y: 90%; }
          }

          .digi-live-border-cyan,
          .digi-live-border-indigo,
          .digi-live-border-emerald {
            position: relative;
            isolation: isolate;
            border: 2px solid transparent;
            background-clip: padding-box, border-box, border-box, border-box;
            background-origin: padding-box, border-box, border-box, border-box;
            transition: transform 0.24s cubic-bezier(0.22, 1, 0.36, 1),
              box-shadow 0.24s ease;
          }

          /* Cyan Electric Focus Border */
          .digi-live-border-cyan {
            background-image:
              radial-gradient(ellipse 65% 55% at 88% 8%, rgba(34, 211, 238, 0.18), transparent 65%),
              linear-gradient(150deg, #0E2346 0%, #091834 55%, #061126 100%),
              radial-gradient(ellipse 56% 52% at var(--dg1x) var(--dg1y), #FFFFFF 0%, #22D3EE 28%, transparent 64%),
              radial-gradient(ellipse 64% 58% at var(--dg2x) var(--dg2y), #38BDF8 0%, #3B82F6 34%, transparent 66%),
              linear-gradient(135deg, rgba(34, 211, 238, 0.85) 0%, rgba(59, 130, 246, 0.6) 50%, rgba(56, 189, 248, 0.88) 100%);
            background-clip: padding-box, padding-box, border-box, border-box, border-box;
            background-origin: padding-box, padding-box, border-box, border-box, border-box;
            animation:
              digiRimDriftA 11s ease-in-out infinite,
              digiRimDriftB 15.5s ease-in-out infinite;
            box-shadow:
              inset 0 1px 0 rgba(186, 230, 253, 0.22),
              0 18px 44px rgba(0, 0, 0, 0.78),
              0 0 28px -6px rgba(34, 211, 238, 0.45);
          }
          .digi-live-border-cyan:hover {
            box-shadow:
              inset 0 1px 0 rgba(186, 230, 253, 0.32),
              0 22px 52px rgba(0, 0, 0, 0.88),
              0 0 42px -2px rgba(34, 211, 238, 0.68);
          }

          /* Indigo-Violet Neural Focus Border */
          .digi-live-border-indigo {
            background-image:
              radial-gradient(ellipse 65% 55% at 88% 8%, rgba(167, 139, 250, 0.2), transparent 65%),
              linear-gradient(150deg, #171748 0%, #101134 55%, #0B0B24 100%),
              radial-gradient(ellipse 56% 52% at var(--dg1x) var(--dg1y), #FFFFFF 0%, #C7D2FE 28%, transparent 64%),
              radial-gradient(ellipse 64% 58% at var(--dg2x) var(--dg2y), #A78BFA 0%, #6366F1 34%, transparent 66%),
              linear-gradient(135deg, rgba(165, 180, 252, 0.86) 0%, rgba(99, 102, 241, 0.62) 50%, rgba(56, 189, 248, 0.8) 100%);
            background-clip: padding-box, padding-box, border-box, border-box, border-box;
            background-origin: padding-box, padding-box, border-box, border-box, border-box;
            animation:
              digiRimDriftA 12.2s ease-in-out -3.5s infinite,
              digiRimDriftB 16.8s ease-in-out -5s infinite;
            box-shadow:
              inset 0 1px 0 rgba(199, 210, 254, 0.22),
              0 18px 44px rgba(0, 0, 0, 0.78),
              0 0 28px -6px rgba(129, 140, 248, 0.48);
          }
          .digi-live-border-indigo:hover {
            box-shadow:
              inset 0 1px 0 rgba(199, 210, 254, 0.34),
              0 22px 52px rgba(0, 0, 0, 0.88),
              0 0 42px -2px rgba(129, 140, 248, 0.7);
          }

          /* Emerald Mastery Focus Border */
          .digi-live-border-emerald {
            background-image:
              radial-gradient(ellipse 65% 55% at 88% 8%, rgba(52, 211, 153, 0.18), transparent 65%),
              linear-gradient(150deg, #0B2C35 0%, #072027 55%, #05161C 100%),
              radial-gradient(ellipse 56% 52% at var(--dg1x) var(--dg1y), #FFFFFF 0%, #6EE7B7 28%, transparent 64%),
              radial-gradient(ellipse 64% 58% at var(--dg2x) var(--dg2y), #34D399 0%, #0EA5E9 34%, transparent 66%),
              linear-gradient(135deg, rgba(52, 211, 153, 0.86) 0%, rgba(16, 185, 129, 0.58) 50%, rgba(34, 211, 238, 0.82) 100%);
            background-clip: padding-box, padding-box, border-box, border-box, border-box;
            background-origin: padding-box, padding-box, border-box, border-box, border-box;
            animation:
              digiRimDriftA 11.6s ease-in-out -6.5s infinite reverse,
              digiRimDriftB 16.2s ease-in-out -2.4s infinite;
            box-shadow:
              inset 0 1px 0 rgba(167, 243, 208, 0.22),
              0 18px 44px rgba(0, 0, 0, 0.78),
              0 0 28px -6px rgba(16, 185, 129, 0.46);
          }
          .digi-live-border-emerald:hover {
            box-shadow:
              inset 0 1px 0 rgba(167, 243, 208, 0.34),
              0 22px 52px rgba(0, 0, 0, 0.88),
              0 0 42px -2px rgba(52, 211, 153, 0.68);
          }

          .digi-panel-static {
            background: linear-gradient(145deg, #102145 0%, #0A1630 58%, #071024 100%);
            border: 1.5px solid rgba(56, 189, 248, 0.68);
            box-shadow:
              inset 0 1px 0 rgba(186, 230, 253, 0.2),
              0 16px 40px rgba(0, 0, 0, 0.78),
              0 0 24px -8px rgba(56, 189, 248, 0.32);
          }

          /* 3. DIGITAL FOCUS BUTTONS */
          .digi-btn-cyan {
            position: relative;
            overflow: hidden;
            background: linear-gradient(180deg, #38BDF8 0%, #0284C7 100%);
            border: 1.5px solid #BAE6FD;
            color: #03101D;
            box-shadow: 0 6px 20px rgba(14, 165, 233, 0.42), inset 0 1px 1px rgba(255, 255, 255, 0.7);
            transition: transform 0.16s ease, filter 0.16s ease, box-shadow 0.16s ease;
          }
          .digi-btn-cyan:hover:not(:disabled) {
            filter: brightness(1.08);
            transform: translateY(-1.5px);
            box-shadow: 0 10px 26px rgba(56, 189, 248, 0.58), inset 0 1px 1px #FFFFFF;
          }

          .digi-btn-emerald {
            background: linear-gradient(180deg, #34D399 0%, #059669 100%);
            border: 1.5px solid #A7F3D0;
            color: #031811;
            box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.7);
            transition: transform 0.16s ease, filter 0.16s ease, box-shadow 0.16s ease;
          }
          .digi-btn-emerald:hover:not(:disabled) {
            filter: brightness(1.08);
            transform: translateY(-1.5px);
            box-shadow: 0 10px 26px rgba(52, 211, 153, 0.56);
          }

          .digi-btn-indigo {
            background: linear-gradient(180deg, #818CF8 0%, #4F46E5 100%);
            border: 1.5px solid #C7D2FE;
            color: #FFFFFF;
            box-shadow: 0 6px 20px rgba(99, 102, 241, 0.44);
            transition: transform 0.16s ease, filter 0.16s ease, box-shadow 0.16s ease;
          }
          .digi-btn-indigo:hover:not(:disabled) {
            filter: brightness(1.08);
            transform: translateY(-1.5px);
            box-shadow: 0 10px 26px rgba(129, 140, 248, 0.6);
          }

          .digi-btn-outline {
            background: #0A1328;
            border: 1.5px solid rgba(56, 189, 248, 0.45);
            color: #E2E8F0;
            transition: border-color 0.16s ease, color 0.16s ease, background-color 0.16s ease, transform 0.16s ease;
          }
          .digi-btn-outline:hover:not(:disabled) {
            border-color: #38BDF8;
            color: #BAE6FD;
            background: #102042;
            transform: translateY(-1px);
          }

          .digi-input {
            background: #071126;
            border: 1.5px solid rgba(56, 189, 248, 0.45);
            color: #F8FAFC;
            outline: none;
            transition: border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
          }
          .digi-input:hover:not(:focus) {
            border-color: rgba(56, 189, 248, 0.7);
            background: #091630;
          }
          .digi-input:focus {
            border-color: #38BDF8;
            background: #0A1936;
            box-shadow: 0 0 18px -3px rgba(56, 189, 248, 0.55);
          }
        `}</style>

        {/* Toast Notification */}
        {toast && (
          <div className="fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-2xl bg-[#060E22] border-2 border-cyan-400 shadow-[0_0_28px_rgba(34,211,238,0.45)] text-white text-xs font-extrabold flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span>{toast}</span>
          </div>
        )}

        {/* ===================================================================
            STAGE 1: PROGRAM OVERVIEW + 3 HORIZONTAL MODULE CARDS (SKETCH 1)
        =================================================================== */}
        {!activeModule && (
          <>
            {/* Top Digital Study Header Banner */}
            <header className="digi-live-border-cyan rounded-3xl p-6 sm:p-7 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => navigate("/programs")}
                  className="digi-btn-outline px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-2 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4 text-cyan-300" />
                  <span>Back to Programs</span>
                </button>

                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-400/50 text-[10.5px] font-black uppercase tracking-[0.2em] text-cyan-200 inline-flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                    <span>Digital Curriculum Focus Mode</span>
                  </span>

                  <button
                    type="button"
                    onClick={handleAddModule}
                    className="digi-btn-cyan px-4 py-2 rounded-xl text-xs font-black inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4 stroke-[2.6]" />
                    <span>Add Module</span>
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-end justify-between gap-6">
                <div className="space-y-2 max-w-2xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase bg-emerald-400 text-slate-950">
                      {program.status || "Published"}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-indigo-500/25 text-indigo-200 border border-indigo-400/40">
                      {program.type || "Core Curriculum"}
                    </span>
                    <span className="text-xs font-bold text-slate-300 inline-flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-cyan-300" />
                      <span>{program.duration || "32 Mins"}</span>
                    </span>
                  </div>

                  <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
                    {program.title}
                  </h1>

                  <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
                    {program.description}
                  </p>
                </div>

                {/* Course Mastery Readout */}
                <div className="w-full sm:w-72 p-4 rounded-2xl bg-[#050A19] border border-cyan-400/35 space-y-2">
                  <div className="flex items-center justify-between text-xs font-extrabold">
                    <span className="text-slate-300">Course Mastery</span>
                    <span className="text-cyan-300 font-mono">{masteryPct}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-black/70 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-emerald-400 transition-all duration-500"
                      style={{ width: `${Math.max(5, masteryPct)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10.5px] font-bold text-slate-400">
                    <span>
                      {completedCount} / {totalModules} Modules Mastered
                    </span>
                    <span className="text-emerald-300">{totalModules} Lessons</span>
                  </div>
                </div>
              </div>
            </header>

            {/* 3 HORIZONTAL MODULE CARDS */}
            <section className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-cyan-400" />
                  <h2 className="text-sm font-black uppercase tracking-[0.2em] text-cyan-200">
                    Course Modules ({totalModules})
                  </h2>
                </div>
                <span className="text-xs font-semibold text-slate-400">
                  Select a module to view lessons, take assessments &amp; access materials
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {(program.modules || []).map((mod, idx) => {
                  const borderCls =
                    mod.accent === "indigo"
                      ? "digi-live-border-indigo"
                      : mod.accent === "emerald"
                      ? "digi-live-border-emerald"
                      : "digi-live-border-cyan";

                  const isDone = Boolean(completedQuizzes[mod.id]);
                  const qCount = mod.quiz?.questions?.length || 0;
                  const resCount = mod.resources?.length || 0;

                  return (
                    <article
                      key={mod.id}
                      onClick={() => {
                        setActiveModuleId(mod.id);
                        setActiveActivity(null);
                        setIsEditingModule(false);
                      }}
                      className={`${borderCls} group cursor-pointer rounded-3xl p-6 flex flex-col justify-between space-y-5 min-h-[295px] hover:-translate-y-1.5 select-none`}
                    >
                      {/* Top Module Index & Completion Badge */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between gap-2">
                          <span className="px-3 py-1 rounded-xl bg-cyan-500/15 border border-cyan-400/50 text-xs font-black font-mono text-cyan-200">
                            MODULE {mod.number || String(idx + 1).padStart(2, "0")}
                          </span>

                          {isDone ? (
                            <span className="px-2.5 py-1 rounded-full bg-emerald-400/20 border border-emerald-400/60 text-[10px] font-black text-emerald-300 inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Passed</span>
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/15 text-[10px] font-bold text-slate-300 inline-flex items-center gap-1">
                              <Clock className="w-3 h-3 text-cyan-300" />
                              <span>{mod.duration}</span>
                            </span>
                          )}
                        </div>

                        <div>
                          <h3 className="text-xl font-black text-white group-hover:text-cyan-200 transition leading-snug line-clamp-2">
                            {mod.title}
                          </h3>
                          <p className="text-xs text-slate-300/90 font-medium mt-2 leading-relaxed line-clamp-3">
                            {mod.description}
                          </p>
                        </div>
                      </div>

                      {/* Bottom Chips + Enter CTA */}
                      <div className="space-y-4 pt-3 border-t border-white/10">
                        <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold">
                          <span className="px-2.5 py-1 rounded-lg bg-[#050A18] border border-cyan-400/30 text-cyan-200 inline-flex items-center gap-1.5">
                            <PlayCircle className="w-3.5 h-3.5 text-cyan-400" />
                            <span>1 Video</span>
                          </span>
                          <span className="px-2.5 py-1 rounded-lg bg-[#050A18] border border-indigo-400/30 text-indigo-200 inline-flex items-center gap-1.5">
                            <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
                            <span>{qCount} Quiz Qs</span>
                          </span>
                          {resCount > 0 && (
                            <span className="px-2.5 py-1 rounded-lg bg-[#050A18] border border-emerald-400/30 text-emerald-200 inline-flex items-center gap-1.5">
                              <FileText className="w-3.5 h-3.5 text-emerald-400" />
                              <span>{resCount} Resource</span>
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-black text-cyan-300 group-hover:text-white inline-flex items-center gap-1.5 transition">
                            <span>Open Study Module</span>
                            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                          </span>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveModuleId(mod.id);
                              setIsEditingModule(true);
                            }}
                            title="Quick edit module"
                            className="w-8 h-8 rounded-xl bg-white/5 hover:bg-cyan-500/20 border border-white/15 hover:border-cyan-400 text-slate-300 hover:text-cyan-200 flex items-center justify-center cursor-pointer transition"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          </>
        )}

        {/* ===================================================================
            STAGE 2: INSIDE SELECTED MODULE
            - Top Left: Back to Modules | Top Right: Edit Module Button
            - Two Prominent Horizontal Stacked Tabs:
              1. Video Lesson & Title (with YouTube thumbnail & Cinema Player)
              2. Interactive Assessment Quiz (with Question Runner)
        =================================================================== */}
        {activeModule && !isEditingModule && (
          <div className="space-y-6">
            {/* Top Bar: Back + Module Title + Edit Module Button */}
            <div className="digi-panel-static rounded-3xl px-6 py-5 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 min-w-0">
                <button
                  type="button"
                  onClick={() => {
                    setActiveModuleId(null);
                    setActiveActivity(null);
                  }}
                  className="digi-btn-outline px-3.5 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <ArrowLeft className="w-4 h-4 text-cyan-300" />
                  <span>All Modules</span>
                </button>

                <div className="min-w-0">
                  <span className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-300 block">
                    {program.title} • MODULE {activeModule.number}
                  </span>
                  <h1 className="text-xl sm:text-2xl font-black text-white truncate">
                    {activeModule.title}
                  </h1>
                </div>
              </div>

              {/* Edit Module Action */}
              <button
                type="button"
                onClick={() => {
                  setIsEditingModule(true);
                  setActiveActivity(null);
                }}
                className="digi-btn-cyan px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider inline-flex items-center gap-2 cursor-pointer ml-auto"
              >
                <Pencil className="w-4 h-4" />
                <span>Edit Module</span>
              </button>
            </div>

            {/* Module Overview Description */}
            <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-[#0F244A] via-[#0B1B38] to-[#08132A] border-2 border-cyan-400/60 shadow-[0_14px_34px_rgba(14,165,233,0.18),inset_0_1px_0_rgba(186,230,253,0.2)] space-y-2.5 hover:border-cyan-300/90 hover:shadow-[0_16px_40px_rgba(34,211,238,0.26)] transition">
              <div className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-cyan-300 shadow-[0_0_10px_#22D3EE]" />
                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-cyan-200 block">
                  Module Syllabus &amp; Overview
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-200 font-medium leading-relaxed whitespace-pre-line">
                {activeModule.description}
              </p>
            </div>

            {/* ---------------------------------------------------------------
                TWO HORIZONTAL TABS:
                TAB 1 -> VIDEO LESSON | TAB 2 -> INTERACTIVE QUIZ
            --------------------------------------------------------------- */}
            {!activeActivity && (
              <div className="space-y-5">
                {/* HORIZONTAL TAB 1: VIDEO LESSON */}
                <div
                  onClick={() => setActiveActivity("video")}
                  className="digi-live-border-cyan group cursor-pointer rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row items-center gap-6 hover:-translate-y-1 select-none"
                >
                  {/* Thumbnail with Play Overlay */}
                  <div className="relative w-full sm:w-64 h-36 rounded-2xl overflow-hidden bg-[#040814] border border-cyan-400/45 shrink-0 flex items-center justify-center">
                    {activeModule.video?.sourceType === "youtube" &&
                    getYouTubeThumb(activeModule.video?.url) ? (
                      <img
                        src={getYouTubeThumb(activeModule.video.url)}
                        alt={activeModule.video.title}
                        className="w-full h-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#0A1E3D] via-[#071229] to-[#040814] flex items-center justify-center">
                        <Video className="w-10 h-10 text-cyan-400/70" />
                      </div>
                    )}

                    <div className="absolute inset-0 bg-black/35 group-hover:bg-black/20 transition flex items-center justify-center">
                      <div className="w-14 h-14 rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center shadow-[0_0_28px_rgba(34,211,238,0.85)] group-hover:scale-110 transition-transform">
                        <Play className="w-6 h-6 fill-current ml-0.5" />
                      </div>
                    </div>

                    <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/80 border border-white/20 text-[10px] font-black font-mono text-white">
                      {activeModule.video?.duration || "10:00"}
                    </span>
                  </div>

                  {/* Video Metadata & CTA */}
                  <div className="flex-1 min-w-0 space-y-2.5 w-full">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-200 border border-rose-400/50 inline-flex items-center gap-1.5">
                        <YoutubeIcon className="w-3.5 h-3.5 text-rose-400" />
                        <span>Core Video Lesson</span>
                      </span>

                      {(activeModule.resources?.length || 0) > 0 && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-200 border border-emerald-400/40">
                          +{activeModule.resources.length} Companion Material
                        </span>
                      )}
                    </div>

                    <h2 className="text-xl sm:text-2xl font-black text-white group-hover:text-cyan-200 transition">
                      {activeModule.video?.title || activeModule.title}
                    </h2>

                    <p className="text-xs sm:text-sm text-slate-300 font-medium">
                      Launch the high-focus video player with structured
                      lesson objectives and reference notes.
                    </p>
                  </div>

                  <div className="shrink-0 w-full sm:w-auto">
                    <span className="digi-btn-cyan w-full sm:w-auto px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider inline-flex items-center justify-center gap-2">
                      <PlayCircle className="w-4 h-4" />
                      <span>Watch Lesson</span>
                    </span>
                  </div>
                </div>

                {/* HORIZONTAL TAB 2: INTERACTIVE MODULE QUIZ */}
                <div
                  onClick={() => setActiveActivity("quiz")}
                  className="digi-live-border-indigo group cursor-pointer rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-6 hover:-translate-y-1 select-none"
                >
                  <div className="flex items-center gap-5 min-w-0 w-full">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/30 to-cyan-500/20 border-2 border-indigo-400/70 flex items-center justify-center shrink-0 shadow-[0_0_24px_rgba(99,102,241,0.4)]">
                      <HelpCircle className="w-8 h-8 text-indigo-200" />
                    </div>

                    <div className="min-w-0 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/25 text-indigo-200 border border-indigo-400/50">
                          Knowledge Check Assessment
                        </span>
                        {completedQuizzes[activeModule.id] && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-400/20 text-emerald-300 border border-emerald-400/50">
                            ✓ Mastered: {completedQuizzes[activeModule.id]}%
                          </span>
                        )}
                      </div>

                      <h2 className="text-xl sm:text-2xl font-black text-white group-hover:text-indigo-200 transition">
                        {activeModule.quiz?.title || "Module Mastery Quiz"}
                      </h2>

                      <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-slate-300 font-mono">
                        <span>
                          {activeModule.quiz?.questions?.length || 0} Questions
                        </span>
                        <span className="text-indigo-400">•</span>
                        <span>
                          Passing Score: {activeModule.quiz?.passingScore || 50}%
                        </span>
                        <span className="text-indigo-400">•</span>
                        <span>
                          ~{activeModule.quiz?.timeLimitMins || 5} Mins
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 w-full sm:w-auto">
                    <span className="digi-btn-indigo w-full sm:w-auto px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider inline-flex items-center justify-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      <span>
                        {completedQuizzes[activeModule.id]
                          ? "Retake Quiz"
                          : "Start Quiz"}
                      </span>
                    </span>
                  </div>
                </div>

                {/* Attached Study Content Strip */}
                {(activeModule.resources?.length || 0) > 0 && (
                  <div className="digi-panel-static rounded-3xl p-5 space-y-3.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-300 flex items-center gap-2">
                        <BookOpen className="w-4 h-4" />
                        <span>Attached Course Materials ({activeModule.resources.length})</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {activeModule.resources.map((res) => (
                        <div
                          key={res.id}
                          onClick={() => setPreviewResource(res)}
                          className="cursor-pointer p-3.5 rounded-2xl bg-gradient-to-br from-[#0B2834] to-[#071A24] border-2 border-emerald-400/60 hover:border-cyan-300 hover:shadow-[0_0_20px_rgba(52,211,153,0.28)] flex items-center gap-3 transition"
                        >
                          {res.type === "image" && res.url ? (
                            <img
                              src={res.url}
                              alt={res.title}
                              className="w-11 h-11 rounded-xl object-cover border border-cyan-400/40 shrink-0"
                            />
                          ) : (
                            <div className="w-11 h-11 rounded-xl bg-emerald-500/15 border border-emerald-400/40 flex items-center justify-center shrink-0">
                              <FileText className="w-5 h-5 text-emerald-300" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <span className="text-xs font-extrabold text-white block truncate">
                              {res.title}
                            </span>
                            <span className="text-[10.5px] font-bold text-slate-400 uppercase">
                              {res.type} • {res.size || res.source}
                            </span>
                          </div>
                          <Eye className="w-4 h-4 text-cyan-300 shrink-0" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ---------------------------------------------------------------
                EXPANDED CINEMA VIDEO PLAYER (WHEN TAB 1 IS CLICKED)
            --------------------------------------------------------------- */}
            {activeActivity === "video" && (
              <div className="digi-live-border-cyan rounded-3xl p-5 sm:p-6 space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-300 block">
                      CINEMA PLAYER • MODULE {activeModule.number}
                    </span>
                    <h2 className="text-xl font-black text-white mt-0.5">
                      {activeModule.video?.title || activeModule.title}
                    </h2>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveActivity("quiz")}
                      className="digi-btn-indigo px-4 py-2 rounded-xl text-xs font-black inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>Take Quiz</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveActivity(null)}
                      className="digi-btn-outline px-3.5 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Close Player</span>
                    </button>
                  </div>
                </div>

                {/* Player Frame */}
                <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black border-2 border-cyan-400/45 shadow-[0_18px_50px_rgba(0,0,0,0.92)] flex items-center justify-center">
                  {activeModule.video?.sourceType === "youtube" &&
                  getYouTubeEmbedUrl(activeModule.video?.url) ? (
                    <iframe
                      src={getYouTubeEmbedUrl(activeModule.video.url)}
                      title={activeModule.video.title}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : activeModule.video?.sourceType === "local" &&
                    activeModule.video?.url ? (
                    <video
                      src={activeModule.video.url}
                      controls
                      autoPlay
                      className="w-full h-full bg-black"
                    />
                  ) : activeModule.video?.sourceType === "drive" &&
                    extractDriveFileId(activeModule.video?.url) ? (
                    <iframe
                      src={getDrivePreviewUrl(activeModule.video.url)}
                      title={activeModule.video.title}
                      className="w-full h-full"
                      allow="autoplay"
                    />
                  ) : (
                    <div className="text-center p-8 space-y-3">
                      <Video className="w-12 h-12 text-cyan-400/60 mx-auto" />
                      <h3 className="text-base font-black text-white">
                        No Video Configured Yet
                      </h3>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveActivity(null);
                          setIsEditingModule(true);
                        }}
                        className="digi-btn-cyan px-4 py-2 rounded-xl text-xs font-black cursor-pointer"
                      >
                        Add Video Now
                      </button>
                    </div>
                  )}
                </div>

                {/* Video Lesson Key Objectives / Guide Notes */}
                {activeModule.video?.explanation && (
                  <div className="p-5 rounded-2xl bg-[#060D20] border border-cyan-500/25 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10.5px] font-black uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                        <FileCheck className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Lesson Objectives &amp; Guide Notes</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowVideoNotes((v) => !v)}
                        className="text-[11px] font-bold text-cyan-400 hover:underline"
                      >
                        {showVideoNotes ? "Hide Notes" : "Show Notes"}
                      </button>
                    </div>

                    {showVideoNotes && (
                      <p className="text-xs text-slate-300 font-medium leading-relaxed whitespace-pre-line pt-1 border-t border-white/10">
                        {activeModule.video.explanation}
                      </p>
                    )}
                  </div>
                )}

                {/* Companion Course Files */}
                {(activeModule.resources?.length || 0) > 0 && (
                  <div className="pt-2 space-y-2.5">
                    <span className="text-[10.5px] font-black uppercase tracking-wider text-emerald-300 block">
                      Companion Course Notes &amp; PDF Downloads
                    </span>
                    <div className="flex flex-wrap gap-2.5">
                      {activeModule.resources.map((res) => (
                        <button
                          key={res.id}
                          type="button"
                          onClick={() => setPreviewResource(res)}
                          className="digi-btn-outline px-3.5 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-2 cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5 text-emerald-300" />
                          <span>{res.title}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ---------------------------------------------------------------
                EXPANDED INTERACTIVE QUIZ RUNNER (WHEN TAB 2 IS CLICKED)
            --------------------------------------------------------------- */}
            {activeActivity === "quiz" && (
              <InteractiveQuizPlayer
                quiz={activeModule.quiz}
                moduleTitle={activeModule.title}
                onComplete={(scorePct) => {
                  setCompletedQuizzes((prev) => ({
                    ...prev,
                    [activeModule.id]: Math.max(
                      prev[activeModule.id] || 0,
                      scorePct
                    ),
                  }));
                  showToast(
                    `Module ${activeModule.number} Quiz Passed (${scorePct}%)!`
                  );
                }}
                onClose={() => setActiveActivity(null)}
              />
            )}
          </div>
        )}

        {/* ===================================================================
            STAGE 3: FULL MODULE EDITOR STUDIO
        =================================================================== */}
        {activeModule && isEditingModule && (
          <ModuleEditorStudio
            moduleData={activeModule}
            onSave={handleSaveModule}
            onCancel={() => setIsEditingModule(false)}
          />
        )}

        {/* ===================================================================
            RESOURCE PREVIEW MODAL (PDFs, CHEAT SHEETS, IMAGES)
        =================================================================== */}
        {previewResource && (
          <div
            onClick={() => setPreviewResource(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-4xl rounded-3xl p-5 bg-[#070E22] border-2 border-cyan-400/70 shadow-[0_24px_65px_rgba(0,0,0,0.95)] space-y-4"
            >
              <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3">
                <div className="min-w-0">
                  <span className="text-[10px] font-black uppercase tracking-wider text-cyan-300 block">
                    COURSE RESOURCE • {previewResource.type}
                  </span>
                  <h3 className="text-base font-black text-white truncate">
                    {previewResource.title}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  {previewResource.url && (
                    <a
                      href={previewResource.url}
                      target="_blank"
                      rel="noreferrer"
                      className="digi-btn-cyan px-3 py-1.5 rounded-xl text-xs font-black inline-flex items-center gap-1.5"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open in Tab</span>
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => setPreviewResource(null)}
                    className="digi-btn-outline w-8 h-8 rounded-xl flex items-center justify-center cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="rounded-2xl overflow-hidden bg-[#040814] border border-white/15 min-h-[400px] max-h-[70vh] flex items-center justify-center">
                {previewResource.type === "image" && previewResource.url ? (
                  <img
                    src={previewResource.url}
                    alt={previewResource.title}
                    className="max-h-[66vh] w-auto object-contain"
                  />
                ) : previewResource.url &&
                  previewResource.url.toLowerCase().endsWith(".pdf") ? (
                  <iframe
                    src={previewResource.url}
                    title={previewResource.title}
                    className="w-full h-[65vh]"
                  />
                ) : previewResource.url &&
                  extractDriveFileId(previewResource.url) ? (
                  <iframe
                    src={getDrivePreviewUrl(previewResource.url)}
                    title={previewResource.title}
                    className="w-full h-[65vh]"
                  />
                ) : (
                  <div className="p-8 text-center space-y-3">
                    <FileText className="w-12 h-12 text-emerald-400 mx-auto" />
                    <p className="text-base font-bold text-white">
                      {previewResource.title}
                    </p>
                    {previewResource.url && (
                      <a
                        href={previewResource.url}
                        target="_blank"
                        rel="noreferrer"
                        className="digi-btn-cyan inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Download / View Resource</span>
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
