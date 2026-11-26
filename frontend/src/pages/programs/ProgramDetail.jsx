/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect, useMemo, useRef } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import MainLayout from "../../layout/mainLayout";
import api from "../../utils/axios";
import ModuleAiGeneratorBar from "../../components/ModuleAiGeneratorBar";
import darkStudyBgAsset from "../../assets/Dark Academic Study Background.png";
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
  Users,
  UserCheck,
  Search,
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
    const isPersonal = Boolean(m.is_personal);
    const videoData = isPersonal && !primaryVideo
      ? null
      : primaryVideo
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

    // 3. Map ALL Quizzes (standard module quizzes + hybrid candidate quizzes)
    const rawBackendQuizzes = Array.isArray(m.quizzes) ? m.quizzes : [];
    let mappedQuizzes = rawBackendQuizzes.map((qz, qzIdx) => ({
      id: qz.id ?? `qz-${m.id}-${qzIdx + 1}`,
      vaultQuizId: qz.vault_quiz_id || m.vault_quiz_id || null,
      batchKey: qz.batch_key || null,
      quizMode:
        qz.quiz_mode === "hybrid" ||
        qz.type === "hybrid_candidate" ||
        qz.type === "personal_vault"
          ? "hybrid"
          : "standard",
      isPersonal: Boolean(qz.is_personal || m.is_personal),
      difficulty: qz.difficulty || m.difficulty || null,
      targetUsers: Array.isArray(qz.target_users) ? qz.target_users : [],
      bestScore: qz.best_score ?? m.best_score ?? null,
      title:
        qz.title ||
        (qzIdx === 0 ? fallbackMod.quiz?.title : null) ||
        `Module ${idx + 1} Assessment ${qzIdx > 0 ? qzIdx + 1 : ""}`.trim(),
      passingScore:
        qz.passing_percentage ?? fallbackMod.quiz?.passingScore ?? 50,
      timeLimitMins: qz.time_limit_mins || 5,
      questions: (qz.questions || []).map((q, qIndex) => {
        const opts = Array.isArray(q.options)
          ? q.options.map((o) => (typeof o === "string" ? o : o.text || ""))
          : ["Option A", "Option B", "Option C", "Option D"];
        let cIdx = Array.isArray(q.options)
          ? q.options.findIndex(
              (o) => typeof o === "object" && (o.isCorrect || o.is_correct)
            )
          : 0;
        if (cIdx === -1) cIdx = 0;
        return {
          id: q.id || `q-${qIndex}`,
          question:
            q.question || q.question_text || `Question ${qIndex + 1}`,
          options: opts,
          correctIndex: q.correctIndex ?? cIdx,
          explanation: q.explanation || "",
        };
      }),
    }));

    if (mappedQuizzes.length === 0) {
      const fbQuiz = fallbackMod.quiz
        ? {
            ...fallbackMod.quiz,
            id: `fb-${m.id || idx + 1}`,
            quizMode: "standard",
            targetUsers: [],
          }
        : {
            id: `new-${m.id || idx + 1}`,
            quizMode: "standard",
            targetUsers: [],
            title: `Module ${idx + 1} Assessment`,
            passingScore: 70,
            timeLimitMins: 5,
            questions: [],
          };
      mappedQuizzes = [fbQuiz];
    }

    const quizData = mappedQuizzes[0];

    return {
      id: String(m.id || `mod-${idx + 1}`),
      number: String(idx + 1).padStart(2, "0"),
      title: m.title || fallbackMod.title || `Module ${idx + 1}`,
      description: m.description || fallbackMod.description || "",
      duration: isPersonal
        ? `${quizData?.timeLimitMins || 15} Mins`
        : fallbackMod.duration || `${10 + idx * 2} Mins`,
      status: m.status || "Published",
      accent: accents[idx % accents.length],
      curos: m.curos || 10,
      isPersonal,
      difficulty: m.difficulty || quizData?.difficulty || null,
      vaultQuizId: m.vault_quiz_id || quizData?.vaultQuizId || null,
      video: videoData,
      resources,
      quiz: quizData,
      quizzes: mappedQuizzes,
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
function InteractiveQuizPlayer({
  quiz,
  moduleTitle,
  onComplete,
  onClose,
  canEdit = false,
  onEditQuiz,
}) {
  const questions = quiz?.questions || [];
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [serverResult, setServerResult] = useState(null);

  const currentQ = questions[currentIdx];

  useEffect(() => {
    setAnswers({});
    setCurrentIdx(0);
    setSubmitted(false);
    setServerResult(null);
  }, [quiz?.id, quiz?.vaultQuizId]);

  const results = useMemo(() => {
    if (!submitted) return null;
    if (serverResult) {
      return {
        correct: serverResult.correct,
        total: serverResult.total,
        pct: serverResult.score,
        passed: serverResult.passed,
        breakdown: serverResult.breakdown || [],
      };
    }
    let correct = 0;
    questions.forEach((q, idx) => {
      if (answers[idx] === q.correctIndex) correct += 1;
    });
    const pct =
      questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0;
    const passed = pct >= Number(quiz?.passingScore || 50);
    return { correct, total: questions.length, pct, passed, breakdown: null };
  }, [submitted, serverResult, questions, answers, quiz]);

  const handleSelect = (optIdx) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [currentIdx]: optIdx }));
  };

  const handleSubmit = async () => {
    if (quiz?.vaultQuizId && !canEdit) {
      try {
        const mapped = {};
        questions.forEach((q, idx) => {
          if (answers[idx] !== undefined) {
            mapped[String(q.id || idx)] = answers[idx];
          }
        });
        const res = await api.post(`/api/vault/quizzes/${quiz.vaultQuizId}/submit`, {
          answers: mapped,
        });
        setServerResult(res.data);
        setSubmitted(true);
        if (res.data?.passed && onComplete) {
          onComplete(res.data.score);
        }
        return;
      } catch {
        // fallback to client scoring if offline
      }
    }
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
    setServerResult(null);
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
        <div className="flex flex-wrap items-center justify-center gap-3">
          {canEdit && onEditQuiz && (
            <button
              type="button"
              onClick={onEditQuiz}
              className="digi-btn-cyan px-4 py-2 rounded-xl text-xs font-black inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Edit Quiz Questions</span>
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="digi-btn-outline px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
          >
            Back to Module Overview
          </button>
        </div>
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

        <div className="flex flex-wrap items-center gap-2.5">
          <span className="px-3 py-1 rounded-xl bg-[#070E22] border border-indigo-400/45 text-xs font-bold text-indigo-200 font-mono">
            Pass ≥ {quiz.passingScore || 50}%
          </span>
          {canEdit && onEditQuiz && (
            <button
              type="button"
              onClick={onEditQuiz}
              className="digi-btn-cyan px-3.5 py-1.5 rounded-xl text-xs font-black inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Edit Quiz</span>
            </button>
          )}
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
              const fb = results?.breakdown?.[idx];
              const correctIdx = fb ? fb.correctIndex : q.correctIndex;
              const isRight = fb ? fb.is_correct : userAns === correctIdx;
              const expl = fb?.explanation || q.explanation;
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
                      Correct Answer: <strong>{q.options[correctIdx]}</strong>
                    </p>
                  )}
                  {expl && (
                    <p className="text-[11px] text-slate-400 pt-1 border-t border-white/10 leading-relaxed">
                      {expl}
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
function ModuleEditorStudio({
  programId,
  moduleData,
  initialQuizAction = null,
  onSave,
  onRefreshBackend,
  onShowToast,
  onCancel,
  focusSection = null,
}) {
  const [draft, setDraft] = useState(() =>
    JSON.parse(JSON.stringify(moduleData))
  );
  const quizBuilderRef = useRef(null);

  const existingQuizzes = useMemo(() => {
    if (Array.isArray(draft.quizzes) && draft.quizzes.length > 0) {
      return draft.quizzes;
    }
    return draft.quiz ? [draft.quiz] : [];
  }, [draft.quizzes, draft.quiz]);

  const buildBlankQuiz = (kind = "standard") => ({
    id: null,
    batchKey: null,
    vaultQuizId: null,
    quizMode: kind,
    difficulty: kind === "hybrid" ? "medium" : null,
    targetUsers: [],
    title:
      kind === "hybrid"
        ? `Hybrid Challenge: ${moduleData.title || "Targeted Assessment"}`
        : `Assessment ${(existingQuizzes?.length || 0) + 1}: ${
            moduleData.title || "Quiz"
          }`,
    passingScore: kind === "hybrid" ? 75 : 70,
    timeLimitMins: kind === "hybrid" ? 10 : 5,
    questions: [
      {
        id: `q-${Date.now()}`,
        question: "Enter your first assessment question...",
        options: [
          "A. First answer option",
          "B. Second answer option",
          "C. Third answer option",
          "D. Fourth answer option",
        ],
        correctIndex: 0,
        explanation: "Provide a brief explanation shown after grading.",
      },
    ],
  });

  const [isCreatingNewQuiz, setIsCreatingNewQuiz] = useState(
    () =>
      initialQuizAction?.mode === "create-standard" ||
      initialQuizAction?.mode === "create-hybrid"
  );
  const [quizKind, setQuizKind] = useState(() => {
    if (initialQuizAction?.mode === "create-hybrid") return "hybrid";
    if (initialQuizAction?.mode === "create-standard") return "standard";
    const matched =
      existingQuizzes.find(
        (q) => String(q.id) === String(initialQuizAction?.quizId)
      ) || existingQuizzes[0];
    return matched?.quizMode === "hybrid" ? "hybrid" : "standard";
  });

  const [quizDraft, setQuizDraft] = useState(() => {
    if (initialQuizAction?.mode === "create-hybrid") {
      return buildBlankQuiz("hybrid");
    }
    if (initialQuizAction?.mode === "create-standard") {
      return buildBlankQuiz("standard");
    }
    const matched =
      existingQuizzes.find(
        (q) => String(q.id) === String(initialQuizAction?.quizId)
      ) || existingQuizzes[0];
    return matched
      ? JSON.parse(JSON.stringify(matched))
      : buildBlankQuiz("standard");
  });

  const [selectedCandidateIds, setSelectedCandidateIds] = useState(() => {
    if (initialQuizAction?.mode === "edit") {
      const matched =
        existingQuizzes.find(
          (q) => String(q.id) === String(initialQuizAction?.quizId)
        ) || existingQuizzes[0];
      return (matched?.targetUsers || []).map((u) => Number(u.user_id));
    }
    return [];
  });
  const [candidates, setCandidates] = useState([]);
  const [candidateSearch, setCandidateSearch] = useState("");
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [savingQuizOnly, setSavingQuizOnly] = useState(false);

  useEffect(() => {
    if (quizKind !== "hybrid") return;
    let active = true;
    const fetchCandidates = async () => {
      setLoadingCandidates(true);
      try {
        const res = await api.get("/api/vault/candidates");
        if (active && Array.isArray(res.data?.candidates)) {
          setCandidates(res.data.candidates);
        }
      } catch {
        // ignore offline candidate fetch error
      } finally {
        if (active) setLoadingCandidates(false);
      }
    };
    fetchCandidates();
    return () => {
      active = false;
    };
  }, [quizKind]);

  useEffect(() => {
    if (focusSection === "quiz") {
      const timer = setTimeout(() => {
        quizBuilderRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 120);
      return () => clearTimeout(timer);
    }
  }, [focusSection]);

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

  const handleSelectExistingQuiz = (qItem) => {
    setIsCreatingNewQuiz(false);
    setQuizKind(qItem.quizMode === "hybrid" ? "hybrid" : "standard");
    setQuizDraft(JSON.parse(JSON.stringify(qItem)));
    setSelectedCandidateIds(
      (qItem.targetUsers || []).map((u) => Number(u.user_id))
    );
  };

  const handleStartNewStandardQuiz = () => {
    setIsCreatingNewQuiz(true);
    setQuizKind("standard");
    setSelectedCandidateIds([]);
    setQuizDraft(buildBlankQuiz("standard"));
  };

  const handleStartHybridQuiz = () => {
    setIsCreatingNewQuiz(true);
    setQuizKind("hybrid");
    setSelectedCandidateIds([]);
    setQuizDraft(buildBlankQuiz("hybrid"));
  };

  const handleToggleCandidate = (uid) => {
    const idNum = Number(uid);
    setSelectedCandidateIds((prev) =>
      prev.includes(idNum) ? prev.filter((x) => x !== idNum) : [...prev, idNum]
    );
  };

  const handleAddQuestion = () => {
    setQuizDraft((prev) => ({
      ...prev,
      questions: [
        ...(prev.questions || []),
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
    }));
  };

  const handleUpdateQuestion = (qIndex, patch) => {
    setQuizDraft((prev) => {
      const nextQs = [...(prev.questions || [])];
      nextQs[qIndex] = { ...nextQs[qIndex], ...patch };
      return { ...prev, questions: nextQs };
    });
  };

  const handleUpdateOption = (qIndex, optIndex, value) => {
    setQuizDraft((prev) => {
      const nextQs = [...(prev.questions || [])];
      const nextOpts = [...(nextQs[qIndex].options || [])];
      nextOpts[optIndex] = value;
      nextQs[qIndex] = { ...nextQs[qIndex], options: nextOpts };
      return { ...prev, questions: nextQs };
    });
  };

  const handleDeleteQuestion = (qIndex) => {
    setQuizDraft((prev) => ({
      ...prev,
      questions: (prev.questions || []).filter((_, i) => i !== qIndex),
    }));
  };

  const persistQuizOnly = async () => {
    setSavingQuizOnly(true);
    try {
      const pid = Number(programId || 66);
      const midNumeric = Number.isFinite(Number(draft.id))
        ? Number(draft.id)
        : null;

      if (quizKind === "hybrid") {
        if (selectedCandidateIds.length === 0) {
          onShowToast?.("Select at least one target candidate for the Hybrid Quiz.");
          setSavingQuizOnly(false);
          return false;
        }
        const payload = {
          program_id: pid,
          module_id: midNumeric,
          title: quizDraft.title || `Hybrid Assessment`,
          topic: draft.title,
          difficulty: quizDraft.difficulty || "medium",
          passing_score: Number(quizDraft.passingScore || 75),
          time_limit_mins: Number(quizDraft.timeLimitMins || 10),
          target_user_ids: selectedCandidateIds,
          questions: quizDraft.questions || [],
        };
        if (isCreatingNewQuiz) {
          await api.post("/api/vault/hybrid-quizzes", payload);
          onShowToast?.(
            `Hybrid Quiz assigned to ${selectedCandidateIds.length} candidate(s)`
          );
        } else {
          const targetKey = quizDraft.batchKey || quizDraft.vaultQuizId;
          await api.put(`/api/vault/hybrid-quizzes/${targetKey}`, payload);
          onShowToast?.(`Updated Hybrid Quiz "${quizDraft.title}"`);
        }
      } else if (isCreatingNewQuiz) {
        if (!midNumeric) {
          onShowToast?.("Save the module first before creating an additional quiz.");
          setSavingQuizOnly(false);
          return false;
        }
        await api.post(`/programs/${pid}/modules/${midNumeric}/quizzes/studio`, {
          title: quizDraft.title || "New Module Assessment",
          passingScore: Number(quizDraft.passingScore || 70),
          questions: quizDraft.questions || [],
        });
        onShowToast?.(`Created new quiz "${quizDraft.title}" (previous quizzes preserved)`);
      } else {
        await api.patch(`/programs/${pid}/modules/${draft.id}`, {
          id: draft.id,
          title: draft.title,
          description: draft.description,
          video: draft.video,
          quiz: quizDraft,
        });
        onShowToast?.(`Updated "${quizDraft.title}" successfully`);
      }

      if (onRefreshBackend) {
        await onRefreshBackend();
      }
      return true;
    } catch (err) {
      const detail = err?.response?.data?.detail || "Could not save quiz changes.";
      onShowToast?.(detail);
      return false;
    } finally {
      setSavingQuizOnly(false);
    }
  };

  const handleSaveEverything = async () => {
    if (quizKind === "hybrid" || isCreatingNewQuiz) {
      const ok = await persistQuizOnly();
      if (!ok) return;
      await onSave({ ...draft }, { skipQuiz: true });
      return;
    }
    const updatedQuizzes = existingQuizzes.map((q) =>
      String(q.id) === String(quizDraft.id) ? quizDraft : q
    );
    await onSave({
      ...draft,
      quiz: quizDraft,
      quizzes: updatedQuizzes.length > 0 ? updatedQuizzes : [quizDraft],
    });
  };

  const previewYouTubeEmbed =
    draft.video?.sourceType === "youtube"
      ? getYouTubeEmbedUrl(draft.video?.url)
      : null;

  return (
    <div className="space-y-5">
      {/* Studio Action Bar */}
      <div className="digi-panel-static rounded-2xl px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-sky-500/20 border border-sky-300/60 flex items-center justify-center text-sky-200">
            <Pencil className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-200/90 block">
              Module Content &amp; Quiz Studio • Module {draft.number}
            </span>
            <h2 className="text-base sm:text-lg font-bold text-white">
              Edit Module, Media &amp; Multi-Quiz Assessments
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <button
            type="button"
            onClick={onCancel}
            className="digi-btn-outline px-3.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSaveEverything}
            disabled={savingQuizOnly}
            className="digi-btn-emerald px-4 py-1.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{savingQuizOnly ? "Saving..." : "Save Changes"}</span>
          </button>
        </div>
      </div>

      {/* =====================================================================
          GENERATIVE MODULE STUDIO (AI + DETERMINISTIC BACKUP)
      ===================================================================== */}
      <ModuleAiGeneratorBar
        moduleTitle={draft.title}
        youtubeUrl={draft.video?.url}
        onApplyKit={(kit) => {
          setDraft((prev) => ({
            ...prev,
            description: kit.description || prev.description,
            duration: kit.estimated_duration || prev.duration,
          }));
          const generatedQs = Array.isArray(kit.questions) ? kit.questions : [];
          if (kit.applyMode === "new") {
            setIsCreatingNewQuiz(true);
            setQuizKind("standard");
            setQuizDraft({
              ...buildBlankQuiz("standard"),
              title: kit.title || `AI Quiz: ${draft.title || "Assessment"}`,
              passingScore: kit.passing_score || 70,
              questions: generatedQs,
            });
            onShowToast?.(
              `Created draft new quiz with ${generatedQs.length} AI questions (previous quizzes untouched).`
            );
          } else if (kit.applyMode === "append") {
            setQuizDraft((prev) => ({
              ...prev,
              questions: [...(prev.questions || []), ...generatedQs],
            }));
            onShowToast?.(`Appended ${generatedQs.length} questions to current quiz.`);
          } else {
            setQuizDraft((prev) => ({
              ...prev,
              passingScore: kit.passing_score || prev.passingScore || 70,
              questions: generatedQs.length > 0 ? generatedQs : prev.questions || [],
            }));
            onShowToast?.(`Replaced current draft questions with ${generatedQs.length} AI questions.`);
          }
        }}
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
          STACK PANEL 4: MULTI-QUIZ & HYBRID CANDIDATE BUILDER
      ===================================================================== */}
      <section
        id="module-quiz-builder"
        ref={quizBuilderRef}
        className={`rounded-2xl p-5 space-y-5 scroll-mt-6 ${
          quizKind === "hybrid" ? "digi-live-border-amber" : "digi-live-border-cyan"
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/15 pb-3.5">
          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-0.5 rounded-lg bg-amber-400/20 border border-amber-300/60 text-[11px] font-bold font-mono text-amber-200">
              04
            </span>
            <div>
              <h3 className="text-base font-bold text-white">
                Multi-Quiz &amp; Hybrid Candidate Studio
              </h3>
              <p className="text-[11px] text-slate-300">
                Edit existing assessments, add new quizzes without overwriting prior ones, or target specific candidates.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleStartNewStandardQuiz}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition ${
                isCreatingNewQuiz && quizKind === "standard"
                  ? "digi-btn-indigo"
                  : "digi-btn-outline"
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Quiz</span>
            </button>

            <button
              type="button"
              onClick={handleStartHybridQuiz}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition ${
                isCreatingNewQuiz && quizKind === "hybrid"
                  ? "digi-btn-amber"
                  : "digi-btn-outline border-amber-400/50 text-amber-200"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Hybrid Quiz (Candidates)</span>
            </button>

            <button
              type="button"
              onClick={handleAddQuestion}
              className="digi-btn-cyan px-3 py-1.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Question</span>
            </button>
          </div>
        </div>

        {/* Existing Quizzes Switcher Pills (keeps previous quizzes always accessible!) */}
        {existingQuizzes.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-300 block">
              Existing Quizzes in This Module ({existingQuizzes.length}) — Click to Edit:
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {existingQuizzes.map((qz, idx) => {
                const isSelected =
                  !isCreatingNewQuiz && String(quizDraft.id) === String(qz.id);
                const isHyb = qz.quizMode === "hybrid";
                return (
                  <button
                    key={qz.id || idx}
                    type="button"
                    onClick={() => handleSelectExistingQuiz(qz)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold inline-flex items-center gap-2 cursor-pointer transition border ${
                      isSelected
                        ? isHyb
                          ? "bg-amber-500/25 border-amber-300 text-white shadow-sm"
                          : "bg-indigo-500/30 border-sky-300 text-white shadow-sm"
                        : "bg-slate-900/60 border-white/20 text-slate-300 hover:border-white/45 hover:text-white"
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isHyb ? "bg-amber-400" : "bg-sky-400"
                      }`}
                    />
                    <span>{qz.title || `Quiz ${idx + 1}`}</span>
                    <span className="text-[10px] font-mono text-slate-300/90">
                      ({qz.questions?.length || 0} Qs)
                    </span>
                    {isHyb && (
                      <span className="px-1.5 py-0.5 rounded bg-amber-400/20 text-[9.5px] font-bold text-amber-200">
                        Hybrid • {qz.targetUsers?.length || 1}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Active Mode Notice Banner */}
        <div
          className={`px-3.5 py-2.5 rounded-xl border text-xs font-medium flex flex-wrap items-center justify-between gap-2 ${
            isCreatingNewQuiz && quizKind === "hybrid"
              ? "bg-amber-500/15 border-amber-300/60 text-amber-100"
              : isCreatingNewQuiz
              ? "bg-indigo-500/15 border-indigo-300/60 text-indigo-100"
              : "bg-sky-500/15 border-sky-300/50 text-sky-100"
          }`}
        >
          <span>
            {isCreatingNewQuiz && quizKind === "hybrid"
              ? "Creating a NEW Targeted Hybrid Quiz (visible exclusively to selected candidates below)."
              : isCreatingNewQuiz
              ? "Creating a NEW Module Quiz — all existing quizzes in this module remain untouched."
              : quizKind === "hybrid"
              ? `Editing Hybrid Quiz "${quizDraft.title}" (${selectedCandidateIds.length} candidate(s) assigned).`
              : `Editing "${quizDraft.title || "Module Quiz"}" (${quizDraft.questions?.length || 0} question(s)).`}
          </span>
          <button
            type="button"
            disabled={savingQuizOnly}
            onClick={persistQuizOnly}
            className="digi-btn-emerald px-3 py-1 rounded-lg text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-3 h-3" />
            <span>
              {savingQuizOnly
                ? "Saving..."
                : isCreatingNewQuiz
                ? quizKind === "hybrid"
                  ? "Assign Hybrid Quiz"
                  : "Create This Quiz"
                : "Save Quiz Only"}
            </span>
          </button>
        </div>

        {/* Specific Candidates Multi-Selector (when Hybrid Mode is active) */}
        {quizKind === "hybrid" && (
          <div className="p-4 rounded-2xl bg-slate-900/70 border border-amber-300/55 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-amber-300" />
                <span className="text-xs font-bold text-amber-100">
                  Target Specific Candidates ({selectedCandidateIds.length} selected)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                  <input
                    type="text"
                    value={candidateSearch}
                    onChange={(e) => setCandidateSearch(e.target.value)}
                    placeholder="Search student or email..."
                    className="digi-input rounded-lg pl-8 pr-3 py-1 text-xs w-48 sm:w-56"
                  />
                </div>
                <select
                  value={quizDraft.difficulty || "medium"}
                  onChange={(e) =>
                    setQuizDraft((prev) => ({ ...prev, difficulty: e.target.value }))
                  }
                  className="digi-input rounded-lg px-2.5 py-1 text-xs font-semibold cursor-pointer"
                >
                  <option value="easy" className="bg-[#0F172A]">Difficulty: Easy</option>
                  <option value="medium" className="bg-[#0F172A]">Difficulty: Medium</option>
                  <option value="hard" className="bg-[#0F172A]">Difficulty: Hard</option>
                </select>
              </div>
            </div>

            {loadingCandidates ? (
              <p className="text-xs text-slate-300">Loading active candidates...</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-44 overflow-y-auto pr-1">
                {candidates
                  .filter((c) => {
                    const q = candidateSearch.trim().toLowerCase();
                    if (!q) return true;
                    return (
                      (c.full_name || "").toLowerCase().includes(q) ||
                      (c.email || "").toLowerCase().includes(q) ||
                      (c.role_name || "").toLowerCase().includes(q)
                    );
                  })
                  .map((cand) => {
                    const checked = selectedCandidateIds.includes(Number(cand.user_id));
                    return (
                      <button
                        key={cand.user_id}
                        type="button"
                        onClick={() => handleToggleCandidate(cand.user_id)}
                        className={`p-2 rounded-xl border text-left flex items-center gap-2 cursor-pointer transition ${
                          checked
                            ? "bg-amber-500/20 border-amber-300 text-white"
                            : "bg-slate-800/70 border-white/15 text-slate-300 hover:border-amber-300/50"
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border ${
                            checked
                              ? "bg-amber-400 border-amber-200 text-slate-950"
                              : "border-white/30 bg-transparent"
                          }`}
                        >
                          {checked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-xs font-semibold block truncate">
                            {cand.full_name}
                          </span>
                          <span className="text-[10px] text-slate-400 block truncate">
                            {cand.role_name} • {cand.email}
                          </span>
                        </div>
                      </button>
                    );
                  })}
              </div>
            )}
          </div>
        )}

        {/* Quiz Metadata */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
          <div className="sm:col-span-6 space-y-1">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-300 block">
              Quiz Title
            </label>
            <input
              type="text"
              value={quizDraft.title || ""}
              onChange={(e) =>
                setQuizDraft((prev) => ({ ...prev, title: e.target.value }))
              }
              className="digi-input w-full rounded-xl px-3.5 py-2 text-xs font-semibold"
            />
          </div>

          <div className="sm:col-span-3 space-y-1">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-300 block">
              Passing Score (%)
            </label>
            <input
              type="number"
              min="10"
              max="100"
              value={quizDraft.passingScore ?? 50}
              onChange={(e) =>
                setQuizDraft((prev) => ({
                  ...prev,
                  passingScore: Math.min(100, Math.max(10, Number(e.target.value) || 50)),
                }))
              }
              className="digi-input w-full rounded-xl px-3.5 py-2 text-xs font-bold font-mono"
            />
          </div>

          <div className="sm:col-span-3 space-y-1">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-300 block">
              Time Limit (Mins)
            </label>
            <input
              type="number"
              min="1"
              max="120"
              value={quizDraft.timeLimitMins ?? 5}
              onChange={(e) =>
                setQuizDraft((prev) => ({
                  ...prev,
                  timeLimitMins: Math.max(1, Number(e.target.value) || 5),
                }))
              }
              className="digi-input w-full rounded-xl px-3.5 py-2 text-xs font-bold font-mono"
            />
          </div>
        </div>

        {/* Questions List */}
        <div className="space-y-3.5">
          {(quizDraft.questions || []).map((q, qIdx) => (
            <div
              key={q.id || qIdx}
              className="p-4 rounded-2xl bg-slate-900/75 border border-sky-300/45 hover:border-sky-300/80 shadow-md space-y-3 transition"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 space-y-1">
                  <label className="text-[10.5px] font-bold uppercase tracking-wider text-sky-300 block">
                    Question #{qIdx + 1}
                  </label>
                  <input
                    type="text"
                    value={q.question}
                    onChange={(e) =>
                      handleUpdateQuestion(qIdx, { question: e.target.value })
                    }
                    className="digi-input w-full rounded-xl px-3.5 py-2 text-xs font-semibold"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteQuestion(qIdx)}
                  className="mt-5 w-7 h-7 rounded-lg bg-rose-500/20 border border-rose-400/45 hover:bg-rose-500/35 text-rose-200 flex items-center justify-center cursor-pointer shrink-0 transition"
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
                      className={`flex items-center gap-2 p-2 rounded-xl border transition ${
                        isCorrect
                          ? "bg-emerald-500/20 border-emerald-300/85"
                          : "bg-slate-800/75 border-white/20 hover:border-sky-300/60"
                      }`}
                    >
                      <button
                        type="button"
                        title="Mark as correct answer"
                        onClick={() =>
                          handleUpdateQuestion(qIdx, { correctIndex: optIdx })
                        }
                        className={`w-6 h-6 rounded-md text-[10px] font-bold flex items-center justify-center shrink-0 cursor-pointer ${
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
                        className="flex-1 bg-transparent text-xs font-medium text-white outline-none"
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
                  className="digi-input w-full rounded-xl px-3.5 py-2 text-[11px] font-medium text-slate-200"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Save Trigger */}
        <div className="pt-2 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="digi-btn-outline px-3.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={savingQuizOnly}
            onClick={handleSaveEverything}
            className="digi-btn-emerald px-4 py-1.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{savingQuizOnly ? "Saving..." : "Save Changes"}</span>
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

  const isAdmin = [1, 2].includes(Number(localStorage.getItem("role_id")));

  const [activeModuleId, setActiveModuleId] = useState(null);
  const [activeActivity, setActiveActivity] = useState(null); // null | 'video' | 'quiz'
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [isEditingModule, setIsEditingModule] = useState(false);
  const [editFocusSection, setEditFocusSection] = useState(null); // null | 'quiz'
  const [editQuizAction, setEditQuizAction] = useState(null); // { mode, quizId }
  const [showVideoNotes, setShowVideoNotes] = useState(true);

  // Track completed quizzes (keyed by moduleId:quizId and moduleId)
  const [completedQuizzes, setCompletedQuizzes] = useState({});
  const [previewResource, setPreviewResource] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  };

  const openQuizStudio = (modId, mode = "edit", qItem = null) => {
    setActiveModuleId(modId);
    setEditFocusSection("quiz");
    setEditQuizAction({ mode, quizId: qItem?.id ?? null });
    setIsEditingModule(true);
    setActiveActivity(null);
  };

  // Persist updates locally per program ID
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(program));
    } catch {
      // Ignore quota error
    }
  }, [program, storageKey]);

  const refreshProgramFromBackend = async () => {
    try {
      const res = await api.get(`/programs/${id || 66}`, {
        params: { _t: Date.now() },
      });
      const data = res.data?.program || res.data?.data || res.data;
      if (data) {
        setProgram(mapBackendToDigitalProgram(data, DEFAULT_PROGRAM_DATA));
      }
    } catch {
      // Fallback to offline / initial data
    }
  };

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
          setProgram(mapBackendToDigitalProgram(data, DEFAULT_PROGRAM_DATA));
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

  // Save module & quiz updates
  const handleSaveModule = async (updatedMod, opts = {}) => {
    setProgram((prev) => ({
      ...prev,
      modules: (prev.modules || []).map((m) =>
        String(m.id) === String(updatedMod.id) ? updatedMod : m
      ),
    }));
    setIsEditingModule(false);
    setEditFocusSection(null);
    setEditQuizAction(null);
    setActiveActivity(null);

    if (opts.skipQuiz) {
      try {
        await api.patch(`/programs/${id || 66}/modules/${updatedMod.id}`, {
          id: updatedMod.id,
          title: updatedMod.title,
          description: updatedMod.description,
          video: updatedMod.video,
        });
      } catch {
        // non-blocking metadata sync
      }
      await refreshProgramFromBackend();
      showToast(`Saved "${updatedMod.title}" & quiz updates to server`);
      return;
    }

    const isPersonalVaultMod =
      updatedMod.isPersonal || String(updatedMod.id || "").startsWith("vault-");

    try {
      if (isPersonalVaultMod) {
        const vaultId =
          updatedMod.vaultQuizId ||
          updatedMod.quiz?.vaultQuizId ||
          String(updatedMod.id).replace(/^vault-/, "");
        await api.put(`/api/vault/quizzes/${vaultId}`, {
          title: updatedMod.quiz?.title || updatedMod.title,
          difficulty:
            updatedMod.difficulty || updatedMod.quiz?.difficulty || "hard",
          passing_score: Number(updatedMod.quiz?.passingScore || 75),
          time_limit_mins: Number(updatedMod.quiz?.timeLimitMins || 15),
          questions: updatedMod.quiz?.questions || [],
        });
      } else {
        await api.patch(
          `/programs/${id || 66}/modules/${updatedMod.id}`,
          updatedMod
        );
      }
      await refreshProgramFromBackend();
      showToast(`Saved "${updatedMod.title}" & quiz updates to server`);
    } catch (err) {
      const detail =
        err?.response?.data?.detail || "Backend sync unavailable; saved locally.";
      showToast(`Saved locally — ${detail}`);
    }
  };

  const handleDeleteQuiz = async (modObj, qItem) => {
    if (!window.confirm(`Delete "${qItem.title}" from ${modObj.title}?`)) return;
    try {
      if (qItem.quizMode === "hybrid") {
        const key = qItem.batchKey || qItem.vaultQuizId;
        await api.delete(`/api/vault/hybrid-quizzes/${key}`);
      } else {
        await api.delete(
          `/programs/${id || 66}/modules/${modObj.id}/quizzes/${qItem.id}`
        );
      }
      await refreshProgramFromBackend();
      showToast(`Deleted "${qItem.title}"`);
    } catch (err) {
      showToast(err?.response?.data?.detail || "Could not delete quiz.");
    }
  };

  // Add new module unit
  const handleAddModule = () => {
    const nextNum = String((program.modules?.length || 0) + 1).padStart(2, "0");
    const accents = ["cyan", "indigo", "emerald"];
    const baseQuiz = {
      id: `new-q-${Date.now()}`,
      quizMode: "standard",
      targetUsers: [],
      title: `Module ${nextNum} Assessment`,
      passingScore: 50,
      timeLimitMins: 5,
      questions: [],
    };
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
      quiz: baseQuiz,
      quizzes: [baseQuiz],
    };
    setProgram((prev) => ({
      ...prev,
      modules: [...(prev.modules || []), newMod],
    }));
    setActiveModuleId(newMod.id);
    setEditFocusSection(null);
    setEditQuizAction(null);
    setIsEditingModule(true);
    showToast(`Created Module ${nextNum} — ready to configure`);
  };

  return (
    <MainLayout>
      <div className="-m-4 sm:-m-6 p-4 sm:p-6 min-h-[calc(100vh-4rem)] text-[#F7F2E7] font-sans space-y-5 overflow-x-hidden relative selection:bg-amber-300 selection:text-slate-950">
        {/* ===================================================================
            ILLUMINATED ACADEMIC-GLASS STUDY STAGE
            - Matches the outer Programs sanctuary with default overhead light
            - Brighter frosted navy-slate glass cards + crisp separated borders
            - Balanced, ergonomic normal-proportioned buttons
        =================================================================== */}
        <div
          className="acad-study-bg-img"
          style={{ backgroundImage: `url(${darkStudyBgAsset})` }}
        />
        <div className="acad-study-scrim" />
        <div className="acad-study-lamp-aura" />

        <style>{`
          .acad-study-bg-img {
            position: absolute;
            inset: 0;
            z-index: 0;
            background-position: right bottom;
            background-size: cover;
            background-repeat: no-repeat;
            background-color: #11182C;
            filter: brightness(1.30) contrast(1.06) saturate(1.08);
          }

          .acad-study-scrim {
            position: absolute;
            inset: 0;
            z-index: 1;
            pointer-events: none;
            background:
              radial-gradient(ellipse 68% 46% at 50% 0%, rgba(254, 243, 199, 0.19) 0%, transparent 68%),
              radial-gradient(ellipse 46% 42% at 86% 40%, rgba(251, 191, 36, 0.16) 0%, transparent 65%),
              linear-gradient(
                122deg,
                rgba(13, 19, 36, 0.50) 0%,
                rgba(18, 26, 48, 0.34) 48%,
                rgba(14, 20, 36, 0.18) 100%
              );
          }

          .acad-study-lamp-aura {
            position: absolute;
            top: 4%;
            right: 4%;
            width: 420px;
            height: 420px;
            border-radius: 9999px;
            z-index: 1;
            pointer-events: none;
            background: radial-gradient(
              circle,
              rgba(253, 230, 138, 0.24) 0%,
              rgba(245, 158, 11, 0.10) 48%,
              transparent 72%
            );
            filter: blur(50px);
          }

          .acad-stage-content {
            position: relative;
            z-index: 2;
          }

          .digi-live-border-cyan,
          .digi-live-border-indigo,
          .digi-live-border-emerald,
          .digi-live-border-amber,
          .digi-panel-static {
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
          }

          /* Cyan / Sky Illuminated Card */
          .digi-live-border-cyan {
            background: linear-gradient(145deg, rgba(25, 42, 78, 0.84) 0%, rgba(18, 30, 58, 0.86) 100%);
            border: 1.5px solid rgba(56, 189, 248, 0.72);
            box-shadow:
              inset 0 1px 0 rgba(224, 242, 254, 0.26),
              0 12px 30px rgba(4, 8, 22, 0.45);
          }
          .digi-live-border-cyan:hover {
            border-color: rgba(125, 211, 252, 0.92);
            box-shadow:
              inset 0 1px 0 rgba(255, 255, 255, 0.34),
              0 16px 36px rgba(4, 8, 22, 0.56),
              0 0 22px -6px rgba(56, 189, 248, 0.38);
          }

          /* Indigo Assessment Card */
          .digi-live-border-indigo {
            background: linear-gradient(145deg, rgba(31, 36, 82, 0.84) 0%, rgba(21, 26, 62, 0.86) 100%);
            border: 1.5px solid rgba(129, 140, 248, 0.72);
            box-shadow:
              inset 0 1px 0 rgba(224, 231, 255, 0.26),
              0 12px 30px rgba(4, 8, 22, 0.45);
          }
          .digi-live-border-indigo:hover {
            border-color: rgba(165, 180, 252, 0.94);
            box-shadow:
              inset 0 1px 0 rgba(255, 255, 255, 0.34),
              0 16px 36px rgba(4, 8, 22, 0.56),
              0 0 22px -6px rgba(129, 140, 248, 0.42);
          }

          /* Amber Gold Hybrid Candidate Card */
          .digi-live-border-amber {
            background: linear-gradient(145deg, rgba(48, 38, 24, 0.84) 0%, rgba(30, 25, 22, 0.86) 100%);
            border: 1.5px solid rgba(245, 189, 65, 0.74);
            box-shadow:
              inset 0 1px 0 rgba(254, 243, 199, 0.28),
              0 12px 30px rgba(4, 8, 22, 0.45);
          }
          .digi-live-border-amber:hover {
            border-color: rgba(253, 224, 71, 0.92);
            box-shadow:
              inset 0 1px 0 rgba(254, 249, 195, 0.36),
              0 16px 36px rgba(4, 8, 22, 0.56);
          }

          /* Emerald Mastery Card */
          .digi-live-border-emerald {
            background: linear-gradient(145deg, rgba(18, 49, 54, 0.84) 0%, rgba(13, 36, 42, 0.86) 100%);
            border: 1.5px solid rgba(52, 211, 153, 0.70);
            box-shadow:
              inset 0 1px 0 rgba(209, 250, 229, 0.26),
              0 12px 30px rgba(4, 8, 22, 0.45);
          }
          .digi-live-border-emerald:hover {
            border-color: rgba(110, 231, 183, 0.92);
          }

          /* Static Header & Navigation Dock */
          .digi-panel-static {
            background: linear-gradient(135deg, rgba(24, 34, 62, 0.84) 0%, rgba(28, 35, 58, 0.82) 100%);
            border: 1.5px solid rgba(226, 186, 98, 0.62);
            box-shadow:
              inset 0 1px 0 rgba(254, 243, 199, 0.28),
              0 12px 30px rgba(4, 8, 22, 0.48);
          }

          /* ERGONOMIC, NORMAL-PROPORTIONED BUTTONS */
          .digi-btn-cyan {
            background: linear-gradient(180deg, #38BDF8 0%, #0284C7 100%);
            border: 1px solid rgba(186, 230, 253, 0.9);
            color: #061322;
            box-shadow: 0 3px 10px rgba(14, 165, 233, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.55);
            transition: transform 0.14s ease, filter 0.14s ease;
          }
          .digi-btn-cyan:hover:not(:disabled) {
            filter: brightness(1.07);
            transform: translateY(-1px);
          }

          .digi-btn-emerald {
            background: linear-gradient(180deg, #34D399 0%, #059669 100%);
            border: 1px solid rgba(167, 243, 208, 0.9);
            color: #052017;
            box-shadow: 0 3px 10px rgba(16, 185, 129, 0.28), inset 0 1px 0 rgba(255, 255, 255, 0.55);
            transition: transform 0.14s ease, filter 0.14s ease;
          }
          .digi-btn-emerald:hover:not(:disabled) {
            filter: brightness(1.07);
            transform: translateY(-1px);
          }

          .digi-btn-indigo {
            background: linear-gradient(180deg, #6366F1 0%, #4338CA 100%);
            border: 1px solid rgba(199, 210, 254, 0.78);
            color: #FFFFFF;
            box-shadow: 0 3px 10px rgba(79, 70, 229, 0.32), inset 0 1px 0 rgba(255, 255, 255, 0.3);
            transition: transform 0.14s ease, filter 0.14s ease;
          }
          .digi-btn-indigo:hover:not(:disabled) {
            filter: brightness(1.08);
            transform: translateY(-1px);
          }

          .digi-btn-amber {
            background: linear-gradient(180deg, #FBBF24 0%, #D97706 100%);
            border: 1px solid rgba(254, 243, 199, 0.9);
            color: #1C1204;
            box-shadow: 0 3px 10px rgba(217, 119, 6, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.6);
            transition: transform 0.14s ease, filter 0.14s ease;
          }
          .digi-btn-amber:hover:not(:disabled) {
            filter: brightness(1.07);
            transform: translateY(-1px);
          }

          .digi-btn-outline {
            background: rgba(15, 23, 42, 0.72);
            border: 1px solid rgba(148, 163, 184, 0.48);
            color: #F1F5F9;
            transition: border-color 0.14s ease, background-color 0.14s ease, color 0.14s ease;
          }
          .digi-btn-outline:hover:not(:disabled) {
            border-color: rgba(226, 186, 98, 0.85);
            background: rgba(30, 41, 68, 0.9);
            color: #FFFFFF;
          }

          .digi-input {
            background: rgba(12, 20, 40, 0.82);
            border: 1.5px solid rgba(148, 163, 184, 0.42);
            color: #F8FAFC;
            outline: none;
            transition: border-color 0.18s ease, box-shadow 0.18s ease, background-color 0.18s ease;
          }
          .digi-input:hover:not(:focus) {
            border-color: rgba(226, 186, 98, 0.65);
          }
          .digi-input:focus {
            border-color: #38BDF8;
            background: rgba(15, 26, 52, 0.95);
            box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.16);
          }
        `}</style>

        <div className="acad-stage-content space-y-5">
        {/* Toast Notification */}
        {toast && (
          <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl bg-slate-900/95 border border-amber-300/75 shadow-xl text-white text-xs font-semibold flex items-center gap-2 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>{toast}</span>
          </div>
        )}

        {/* ===================================================================
            STAGE 1: PROGRAM OVERVIEW + COURSE MODULES GRID
        =================================================================== */}
        {!activeModule && (
          <>
            {/* Top Illuminated Header Banner */}
            <header className="digi-panel-static rounded-2xl p-5 sm:p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2.5">
                <button
                  type="button"
                  onClick={() => navigate("/programs")}
                  className="digi-btn-outline px-3 py-1.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-amber-300" />
                  <span>Back to Programs</span>
                </button>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full bg-amber-400/15 border border-amber-300/50 text-[10.5px] font-semibold text-amber-100 inline-flex items-center gap-1.5">
                    <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
                    <span>Curriculum Focus Workspace</span>
                  </span>

                  {isAdmin && (
                    <button
                      type="button"
                      onClick={handleAddModule}
                      className="digi-btn-cyan px-3.5 py-1.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Module</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-end justify-between gap-5">
                <div className="space-y-1.5 max-w-2xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md text-[10.5px] font-bold bg-emerald-400 text-slate-950">
                      {program.status || "Published"}
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10.5px] font-semibold bg-indigo-500/30 text-indigo-100 border border-indigo-300/50">
                      {program.type || "Core Curriculum"}
                    </span>
                    <span className="text-xs font-semibold text-slate-200 inline-flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-300" />
                      <span>{program.duration || "32 Mins"}</span>
                    </span>
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                    {program.title}
                  </h1>

                  <p className="text-xs sm:text-sm text-slate-200 font-normal leading-relaxed">
                    {program.description}
                  </p>
                </div>

                {/* Course Mastery Readout */}
                <div className="w-full sm:w-64 p-3.5 rounded-xl bg-slate-900/75 border border-amber-300/45 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-200">Course Mastery</span>
                    <span className="text-amber-300 font-mono">{masteryPct}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-950/80 border border-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-400 via-sky-400 to-emerald-400 transition-all duration-500"
                      style={{ width: `${Math.max(5, masteryPct)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-medium text-slate-300">
                    <span>
                      {completedCount} / {totalModules} Modules Passed
                    </span>
                    <span className="text-emerald-300 font-semibold">{totalModules} Units</span>
                  </div>
                </div>
              </div>
            </header>

            {/* COURSE MODULES GRID */}
            <section className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 px-1">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-amber-300" />
                  <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-amber-200">
                    Course Modules ({totalModules})
                  </h2>
                </div>
                <span className="text-xs font-medium text-slate-200/90">
                  Select a module to watch lessons, take multiple quizzes &amp; download guides
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {(program.modules || []).map((mod, idx) => {
                  const borderCls =
                    mod.accent === "indigo"
                      ? "digi-live-border-indigo"
                      : mod.accent === "emerald"
                      ? "digi-live-border-emerald"
                      : "digi-live-border-cyan";

                  const modQuizzes = mod.quizzes?.length ? mod.quizzes : mod.quiz ? [mod.quiz] : [];
                  const totalQuizCount = modQuizzes.length;
                  const hybridCount = modQuizzes.filter((q) => q.quizMode === "hybrid").length;
                  const totalQQuestions = modQuizzes.reduce(
                    (sum, q) => sum + (q.questions?.length || 0),
                    0
                  );
                  const isDone = Boolean(completedQuizzes[mod.id]);
                  const resCount = mod.resources?.length || 0;

                  return (
                    <article
                      key={mod.id}
                      onClick={() => {
                        setActiveModuleId(mod.id);
                        setActiveActivity(null);
                        setActiveQuiz(null);
                        setIsEditingModule(false);
                      }}
                      className={`${borderCls} group cursor-pointer rounded-2xl p-5 flex flex-col justify-between space-y-4 min-h-[265px] hover:-translate-y-1 select-none`}
                    >
                      {/* Top Module Index & Completion Badge */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="px-2.5 py-0.5 rounded-lg bg-slate-900/75 border border-sky-300/50 text-[11px] font-bold font-mono text-sky-200">
                              MODULE {mod.number || String(idx + 1).padStart(2, "0")}
                            </span>
                            {mod.isPersonal && (
                              <span className="px-2 py-0.5 rounded-lg bg-amber-400/20 border border-amber-300/60 text-[10px] font-bold text-amber-200">
                                Personal • {mod.difficulty || "Hard"}
                              </span>
                            )}
                          </div>

                          {isDone ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-400/20 border border-emerald-300/60 text-[10.5px] font-bold text-emerald-200 inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Passed</span>
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full bg-slate-900/60 border border-white/20 text-[10.5px] font-semibold text-slate-200 inline-flex items-center gap-1">
                              <Clock className="w-3 h-3 text-amber-300" />
                              <span>{mod.duration}</span>
                            </span>
                          )}
                        </div>

                        <div>
                          <h3 className="text-lg font-bold text-white group-hover:text-amber-200 transition leading-snug line-clamp-2">
                            {mod.title}
                          </h3>
                          <p className="text-xs text-slate-200/90 font-normal mt-1.5 leading-relaxed line-clamp-3">
                            {mod.description}
                          </p>
                        </div>
                      </div>

                      {/* Bottom Chips + Compact Action Controls */}
                      <div className="space-y-3 pt-3 border-t border-white/15">
                        <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold">
                          <span className="px-2 py-0.5 rounded-md bg-slate-900/75 border border-sky-300/40 text-sky-200 inline-flex items-center gap-1">
                            <PlayCircle className="w-3 h-3 text-sky-300" />
                            <span>1 Video</span>
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-slate-900/75 border border-indigo-300/45 text-indigo-200 inline-flex items-center gap-1">
                            <HelpCircle className="w-3 h-3 text-indigo-300" />
                            <span>
                              {totalQuizCount} {totalQuizCount === 1 ? "Quiz" : "Quizzes"} ({totalQQuestions} Qs)
                            </span>
                          </span>
                          {hybridCount > 0 && (
                            <span className="px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-300/60 text-amber-200 inline-flex items-center gap-1">
                              <Users className="w-3 h-3 text-amber-300" />
                              <span>{hybridCount} Hybrid</span>
                            </span>
                          )}
                          {resCount > 0 && (
                            <span className="px-2 py-0.5 rounded-md bg-slate-900/75 border border-emerald-300/40 text-emerald-200 inline-flex items-center gap-1">
                              <FileText className="w-3 h-3 text-emerald-300" />
                              <span>{resCount} Guide</span>
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-amber-200 group-hover:text-white inline-flex items-center gap-1 transition">
                            <span>Open Module</span>
                            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                          </span>

                          {isAdmin && (
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openQuizStudio(mod.id, "edit", modQuizzes[0]);
                                }}
                                title="Open Quiz Studio"
                                className="px-2.5 py-1 rounded-lg bg-indigo-500/25 hover:bg-indigo-500/45 border border-indigo-300/55 text-indigo-100 text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer transition"
                              >
                                <HelpCircle className="w-3 h-3" />
                                <span>Quizzes</span>
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveModuleId(mod.id);
                                  setEditFocusSection(null);
                                  setEditQuizAction(null);
                                  setIsEditingModule(true);
                                }}
                                title="Edit module details & media"
                                className="px-2 py-1 rounded-lg bg-slate-900/70 hover:bg-slate-800 border border-white/25 hover:border-amber-300/70 text-slate-200 hover:text-white inline-flex items-center justify-center cursor-pointer transition"
                              >
                                <Pencil className="w-3 h-3" />
                              </button>
                            </div>
                          )}
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
          <div className="space-y-5">
            {/* Top Bar: Back + Module Title + Compact Admin Actions */}
            <div className="digi-panel-static rounded-2xl px-5 py-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  onClick={() => {
                    setActiveModuleId(null);
                    setActiveActivity(null);
                    setActiveQuiz(null);
                  }}
                  className="digi-btn-outline px-3 py-1.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-amber-300" />
                  <span>All Modules</span>
                </button>

                <div className="min-w-0">
                  <span className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-amber-200/90 block">
                    {program.title} • Module {activeModule.number}
                  </span>
                  <h1 className="text-lg sm:text-xl font-bold text-white truncate">
                    {activeModule.title}
                  </h1>
                </div>
              </div>

              {/* Compact Admin Actions */}
              {isAdmin && (
                <div className="flex flex-wrap items-center gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={() =>
                      openQuizStudio(
                        activeModule.id,
                        "edit",
                        (activeModule.quizzes || [])[0] || activeModule.quiz
                      )
                    }
                    className="digi-btn-indigo px-3 py-1.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>Quiz Studio</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditFocusSection(null);
                      setEditQuizAction(null);
                      setIsEditingModule(true);
                      setActiveActivity(null);
                    }}
                    className="digi-btn-cyan px-3.5 py-1.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>Edit Module</span>
                  </button>
                </div>
              )}
            </div>

            {/* Module Overview Description */}
            <div className="digi-live-border-cyan rounded-2xl p-5 space-y-2">
              <div className="flex items-center gap-2 border-b border-white/15 pb-2">
                <span className="inline-block w-2 h-2 rounded-full bg-sky-300" />
                <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-sky-200">
                  Module Syllabus &amp; Overview
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-100/90 font-normal leading-relaxed whitespace-pre-line">
                {activeModule.description}
              </p>
            </div>

            {/* ---------------------------------------------------------------
                TWO CLEARLY SEPARATED SECTIONS:
                1. VIDEO LESSON CARD
                2. ASSESSMENTS & MULTI-QUIZ + HYBRID CANDIDATES HUB
            --------------------------------------------------------------- */}
            {!activeActivity && (
              <div className="space-y-5">
                {/* TAB 1: CORE VIDEO LESSON */}
                {activeModule.video && (
                  <div
                    onClick={() => setActiveActivity("video")}
                    className="digi-live-border-cyan group cursor-pointer rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center gap-5 select-none"
                  >
                    {/* Thumbnail with Compact Play Overlay */}
                    <div className="relative w-full sm:w-52 h-28 rounded-xl overflow-hidden bg-slate-950 border border-sky-300/50 shrink-0 flex items-center justify-center">
                      {activeModule.video?.sourceType === "youtube" &&
                      getYouTubeThumb(activeModule.video?.url) ? (
                        <img
                          src={getYouTubeThumb(activeModule.video.url)}
                          alt={activeModule.video.title}
                          className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                          <Video className="w-8 h-8 text-sky-300/75" />
                        </div>
                      )}

                      <div className="absolute inset-0 bg-black/25 group-hover:bg-black/10 transition flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full bg-sky-400 text-slate-950 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                          <Play className="w-4 h-4 fill-current ml-0.5" />
                        </div>
                      </div>

                      <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/80 border border-white/20 text-[10px] font-bold font-mono text-white">
                        {activeModule.video?.duration || "10:00"}
                      </span>
                    </div>

                    {/* Video Metadata & Compact CTA */}
                    <div className="flex-1 min-w-0 space-y-1.5 w-full">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold bg-rose-500/20 text-rose-100 border border-rose-300/50 inline-flex items-center gap-1.5">
                          <YoutubeIcon className="w-3 h-3 text-rose-300" />
                          <span>Core Video Lesson</span>
                        </span>

                        {(activeModule.resources?.length || 0) > 0 && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold bg-emerald-500/20 text-emerald-100 border border-emerald-300/45">
                            +{activeModule.resources.length} Study Guide
                          </span>
                        )}
                      </div>

                      <h2 className="text-base sm:text-lg font-bold text-white group-hover:text-sky-200 transition">
                        {activeModule.video?.title || activeModule.title}
                      </h2>

                      <p className="text-xs text-slate-200/85 font-normal">
                        Launch the lesson video player with structured objectives and downloadable guides.
                      </p>
                    </div>

                    <div className="shrink-0">
                      <span className="digi-btn-cyan px-3.5 py-1.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5">
                        <PlayCircle className="w-3.5 h-3.5" />
                        <span>Watch Lesson</span>
                      </span>
                    </div>
                  </div>
                )}

                {/* TAB 2: ASSESSMENTS & MULTI-QUIZ HUB (PREVIOUS QUIZZES ALWAYS VISIBLE!) */}
                <section className="digi-live-border-indigo rounded-2xl p-5 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/15 pb-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-indigo-500/25 border border-indigo-300/60 flex items-center justify-center text-indigo-100 shrink-0">
                        <HelpCircle className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-indigo-200 block">
                          Knowledge Checks &amp; Targeted Assessments
                        </span>
                        <h2 className="text-base font-bold text-white">
                          Module Quizzes ({(activeModule.quizzes?.length || (activeModule.quiz ? 1 : 0))})
                        </h2>
                      </div>
                    </div>

                    {isAdmin && (
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            openQuizStudio(activeModule.id, "create-standard")
                          }
                          className="digi-btn-outline px-3 py-1.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5 text-sky-300" />
                          <span>New Quiz</span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            openQuizStudio(activeModule.id, "create-hybrid")
                          }
                          className="digi-btn-amber px-3 py-1.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <Users className="w-3.5 h-3.5" />
                          <span>Hybrid Quiz (Candidates)</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* List EVERY Quiz attached to this Module cleanly */}
                  <div className="space-y-3">
                    {(activeModule.quizzes?.length
                      ? activeModule.quizzes
                      : activeModule.quiz
                      ? [activeModule.quiz]
                      : []
                    ).map((qItem, qIdx) => {
                      const isHyb = qItem.quizMode === "hybrid";
                      const scoreKey = `${activeModule.id}:${qItem.id || qIdx}`;
                      const donePct =
                        completedQuizzes[scoreKey] ??
                        qItem.bestScore ??
                        (qIdx === 0 ? completedQuizzes[activeModule.id] : null);

                      return (
                        <div
                          key={qItem.id || qIdx}
                          className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition ${
                            isHyb
                              ? "bg-amber-950/35 border-amber-300/60 hover:border-amber-200/85"
                              : "bg-slate-900/65 border-indigo-300/45 hover:border-sky-300/75"
                          }`}
                        >
                          <div className="min-w-0 space-y-1.5 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                  isHyb
                                    ? "bg-amber-400/20 border-amber-300/60 text-amber-100"
                                    : qIdx === 0
                                    ? "bg-indigo-500/25 border-indigo-300/60 text-indigo-100"
                                    : "bg-sky-500/20 border-sky-300/55 text-sky-100"
                                }`}
                              >
                                {isHyb
                                  ? `Hybrid • ${qItem.difficulty || "Targeted"}`
                                  : qIdx === 0
                                  ? "Core Quiz"
                                  : "Custom Quiz"}
                              </span>

                              {isHyb && !isAdmin && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 border border-emerald-300/55 text-emerald-100">
                                  Assigned to You
                                </span>
                              )}

                              {donePct != null && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/25 border border-emerald-300/60 text-emerald-200">
                                  ✓ Best Score: {donePct}%
                                </span>
                              )}
                            </div>

                            <h3 className="text-sm sm:text-base font-bold text-white">
                              {qItem.title || `Module Assessment ${qIdx + 1}`}
                            </h3>

                            <div className="flex flex-wrap items-center gap-2.5 text-[11px] font-medium text-slate-300 font-mono">
                              <span>{qItem.questions?.length || 0} Questions</span>
                              <span className="text-slate-500">•</span>
                              <span>Pass: {qItem.passingScore || 50}%</span>
                              <span className="text-slate-500">•</span>
                              <span>~{qItem.timeLimitMins || 5} Mins</span>
                            </div>

                            {isAdmin && isHyb && (qItem.targetUsers?.length || 0) > 0 && (
                              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                <span className="text-[10.5px] font-semibold text-amber-200">
                                  Assigned Candidates:
                                </span>
                                {qItem.targetUsers.map((u) => (
                                  <span
                                    key={u.user_id}
                                    className="px-2 py-0.5 rounded-md bg-slate-900/75 border border-amber-300/45 text-[10px] font-semibold text-amber-100"
                                  >
                                    {u.full_name}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="shrink-0 flex flex-wrap items-center gap-2">
                            {isAdmin && (
                              <>
                                <button
                                  type="button"
                                  onClick={() =>
                                    openQuizStudio(activeModule.id, "edit", qItem)
                                  }
                                  className="digi-btn-outline px-3 py-1.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                                >
                                  <Pencil className="w-3 h-3 text-sky-300" />
                                  <span>Edit Quiz</span>
                                </button>
                                {(isHyb || (activeModule.quizzes?.length || 0) > 1) && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteQuiz(activeModule, qItem)}
                                    title="Delete quiz"
                                    className="px-2.5 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/35 border border-rose-300/45 text-rose-200 text-xs inline-flex items-center justify-center cursor-pointer transition"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setActiveQuiz(qItem);
                                setActiveActivity("quiz");
                              }}
                              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer ${
                                isHyb ? "digi-btn-amber" : "digi-btn-indigo"
                              }`}
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>{donePct != null ? "Retake" : "Start Quiz"}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>

                {/* Attached Study Content Strip */}
                {(activeModule.resources?.length || 0) > 0 && (
                  <div className="digi-panel-static rounded-2xl p-5 space-y-3">
                    <div className="flex items-center justify-between border-b border-white/15 pb-2">
                      <span className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-200 flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-emerald-300" />
                        <span>Attached Study Materials ({activeModule.resources.length})</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {activeModule.resources.map((res) => (
                        <div
                          key={res.id}
                          onClick={() => setPreviewResource(res)}
                          className="cursor-pointer p-3 rounded-xl bg-slate-900/70 border border-emerald-300/50 hover:border-emerald-200 flex items-center gap-3 transition"
                        >
                          {res.type === "image" && res.url ? (
                            <img
                              src={res.url}
                              alt={res.title}
                              className="w-10 h-10 rounded-lg object-cover border border-sky-300/40 shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 border border-emerald-300/50 flex items-center justify-center shrink-0">
                              <FileText className="w-4 h-4 text-emerald-200" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <span className="text-xs font-bold text-white block truncate">
                              {res.title}
                            </span>
                            <span className="text-[10.5px] font-medium text-slate-300 uppercase">
                              {res.type} • {res.size || res.source}
                            </span>
                          </div>
                          <Eye className="w-4 h-4 text-sky-300 shrink-0" />
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
                EXPANDED INTERACTIVE QUIZ RUNNER
            --------------------------------------------------------------- */}
            {activeActivity === "quiz" && (
              <InteractiveQuizPlayer
                quiz={activeQuiz || activeModule.quiz}
                moduleTitle={activeModule.title}
                canEdit={isAdmin}
                onEditQuiz={() =>
                  openQuizStudio(
                    activeModule.id,
                    "edit",
                    activeQuiz || activeModule.quiz
                  )
                }
                onComplete={(scorePct) => {
                  const chosen = activeQuiz || activeModule.quiz;
                  const scoreKey = `${activeModule.id}:${chosen?.id || 0}`;
                  setCompletedQuizzes((prev) => ({
                    ...prev,
                    [activeModule.id]: Math.max(
                      prev[activeModule.id] || 0,
                      scorePct
                    ),
                    [scoreKey]: Math.max(prev[scoreKey] || 0, scorePct),
                  }));
                  showToast(
                    `${chosen?.title || `Module ${activeModule.number} Quiz`} Passed (${scorePct}%)!`
                  );
                }}
                onClose={() => {
                  setActiveActivity(null);
                  setActiveQuiz(null);
                }}
              />
            )}
          </div>
        )}

        {/* ===================================================================
            STAGE 3: FULL MODULE & MULTI-QUIZ STUDIO
        =================================================================== */}
        {activeModule && isEditingModule && (
          <ModuleEditorStudio
            programId={program.id || id || 66}
            moduleData={activeModule}
            initialQuizAction={editQuizAction}
            focusSection={editFocusSection}
            onSave={handleSaveModule}
            onRefreshBackend={refreshProgramFromBackend}
            onShowToast={showToast}
            onCancel={() => {
              setIsEditingModule(false);
              setEditFocusSection(null);
              setEditQuizAction(null);
            }}
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
      </div>
    </MainLayout>
  );
}
