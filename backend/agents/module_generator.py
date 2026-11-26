from __future__ import annotations

import asyncio
import io
import os
import re
from collections import Counter
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field

try:
    from pydantic_ai import Agent

    PYDANTIC_AI_AVAILABLE = True
except ImportError:
    PYDANTIC_AI_AVAILABLE = False

try:
    from pypdf import PdfReader

    PYPDF_AVAILABLE = True
except ImportError:
    PYPDF_AVAILABLE = False

try:
    from youtube_transcript_api import YouTubeTranscriptApi

    YT_TRANSCRIPT_AVAILABLE = True
except ImportError:
    YT_TRANSCRIPT_AVAILABLE = False


# ============================================================================
# 1. STRICT OUTPUT SCHEMAS (MATCHES ProgramDetail.jsx ModuleEditorStudio)
# ============================================================================
class GeneratedQuizQuestion(BaseModel):
    id: str = Field(description="Unique question id")
    question: str = Field(description="Clear assessment question")
    options: List[str] = Field(
        min_length=4, max_length=4, description="Exactly 4 options"
    )
    correctIndex: int = Field(
        ge=0, le=3, description="0-based index of the correct option"
    )
    explanation: str = Field(
        description="Concise explanation shown after quiz submission"
    )


class GeneratedModuleKit(BaseModel):
    title: str
    description: str
    estimated_duration: str = "10 Mins"
    recap_bullets: List[str] = Field(default_factory=list)
    passing_score: int = 70
    questions: List[GeneratedQuizQuestion] = Field(default_factory=list)
    engine: str = "saarthi_ai"


# ============================================================================
# 2. SOURCE CONTENT EXTRACTORS (PDF, YOUTUBE, RAW NOTES)
# ============================================================================
def extract_youtube_id(url: str) -> Optional[str]:
    if not url:
        return None
    patterns = [
        r"(?:youtube\.com/watch\?v=|youtu\.be/|youtube\.com/embed/|youtube\.com/shorts/)([A-Za-z0-9_-]{11})",
        r"^([A-Za-z0-9_-]{11})$",
    ]
    for pat in patterns:
        m = re.search(pat, url.strip())
        if m:
            return m.group(1)
    return None


def extract_youtube_transcript(youtube_url: str) -> str:
    vid = extract_youtube_id(youtube_url)
    if not vid or not YT_TRANSCRIPT_AVAILABLE:
        return ""
    try:
        if hasattr(YouTubeTranscriptApi, "get_transcript"):
            chunks = YouTubeTranscriptApi.get_transcript(vid, languages=["en", "en-IN"])
            return " ".join(c.get("text", "") for c in chunks)
        api = YouTubeTranscriptApi()
        fetched = api.fetch(vid, languages=["en", "en-IN"])
        return " ".join(getattr(snippet, "text", "") for snippet in fetched)
    except Exception:
        return ""


def extract_pdf_text(file_bytes: bytes) -> str:
    if not file_bytes or not PYPDF_AVAILABLE:
        return ""
    try:
        reader = PdfReader(io.BytesIO(file_bytes))
        pages = []
        for page in reader.pages[:20]:
            text = page.extract_text() or ""
            if text.strip():
                pages.append(text.strip())
        return "\n".join(pages)
    except Exception:
        return ""


# ============================================================================
# 3. COMPLEMENTARY DETERMINISTIC BACKUP GENERATOR (ZERO-LLM HEURISTIC ENGINE)
# ============================================================================
_STOPWORDS = {
    "about",
    "above",
    "after",
    "again",
    "against",
    "because",
    "before",
    "being",
    "between",
    "could",
    "during",
    "every",
    "first",
    "found",
    "great",
    "having",
    "however",
    "into",
    "large",
    "might",
    "never",
    "other",
    "should",
    "since",
    "still",
    "their",
    "there",
    "these",
    "thing",
    "think",
    "those",
    "through",
    "under",
    "using",
    "where",
    "which",
    "while",
    "within",
    "without",
    "would",
    "module",
    "course",
    "lesson",
    "video",
    "student",
    "students",
    "learn",
}


def _clean_sentences(raw_text: str) -> List[str]:
    collapsed = re.sub(r"\s+", " ", raw_text or "").strip()
    if not collapsed:
        return []
    parts = re.split(r"(?<=[.!?])\s+", collapsed)
    return [s.strip() for s in parts if 28 <= len(s.strip()) <= 260]


def _extract_top_keywords(text: str, limit: int = 8) -> List[str]:
    words = re.findall(r"\b[A-Za-z][A-Za-z\-]{4,}\b", text.lower())
    filtered = [w for w in words if w not in _STOPWORDS]
    counts = Counter(filtered)
    return [w.title() for w, _ in counts.most_common(limit)]


def build_deterministic_module_kit(
    *,
    module_title: str,
    source_text: str,
    question_count: int = 5,
    difficulty: str = "medium",
) -> GeneratedModuleKit:
    """
    Runs whenever Groq/PydanticAI is unavailable, times out, or fails validation.
    Builds structured study summaries and grounded MCQs directly from extracted text.
    """
    clean_title = (module_title or "Core Study Module").strip()
    sentences = _clean_sentences(source_text)
    keywords = _extract_top_keywords(source_text, limit=8)

    if not keywords:
        keywords = [
            "Consultative Discovery",
            "Client Retention",
            "Structured Follow-Up",
            "Executive Alignment",
            "Value Measurement",
        ]

    if len(sentences) >= 2:
        description = f"{sentences[0]} {sentences[1]}"[:360]
    elif len(sentences) == 1:
        description = sentences[0][:360]
    else:
        description = (
            f"Master the core principles of {clean_title}, covering "
            f"{', '.join(keywords[:3])} and practical real-world execution."
        )

    recap_bullets = (
        sentences[:3]
        if len(sentences) >= 3
        else [
            f"Understand the foundational role of {keywords[0]} inside {clean_title}.",
            f"Apply {keywords[1 % len(keywords)]} consistently during client or team reviews.",
            "Verify readiness through checkpoint quizzes before advancing to the next unit.",
        ]
    )

    questions: List[GeneratedQuizQuestion] = []
    target_n = max(1, min(10, question_count))

    for idx in range(target_n):
        kw = keywords[idx % len(keywords)]
        alt1 = keywords[(idx + 1) % len(keywords)]
        alt2 = keywords[(idx + 2) % len(keywords)]
        sent = sentences[idx] if idx < len(sentences) else None

        if sent and len(sent) >= 45:
            q_text = (
                f"[Challenge Case] In an executive {clean_title} scenario involving {kw}, which approach resolves root-cause risk without compromising {alt1.lower()}?"
                if str(difficulty).lower() == "hard"
                else f"Based on the {clean_title} material, which statement accurately reflects {kw}?"
            )
            correct_opt = sent[:120].rstrip(".,;:") + ("..." if len(sent) > 120 else "")
            options = [
                f"Skip {kw} entirely until final certification.",
                correct_opt,
                f"Replace {kw} with unverified ad-hoc steps unrelated to {alt1}.",
                f"Delay {alt2} indefinitely without tracking measurable outcomes.",
            ]
            correct_idx = 1
            explanation = f"Source takeaway: {sent[:180]}"
        else:
            q_text = (
                f"[Advanced Assessment] When troubleshooting a stalled {clean_title} deployment around {kw}, what is the strongest high-leverage intervention?"
                if str(difficulty).lower() == "hard"
                else f"What is the primary operational goal of applying {kw} in {clean_title}?"
            )
            options = [
                f"Drive consistent, measurable outcomes through structured {kw.lower()} practices and milestone verification.",
                f"Avoid documenting progress or reviewing {alt1.lower()} metrics.",
                f"Bypass {alt2.lower()} checkpoints during active delivery.",
                "Defer all follow-up actions until the end of the quarter.",
            ]
            correct_idx = 0
            explanation = (
                f"Applying {kw} systematically establishes clear accountability "
                f"and improves retention across {clean_title}."
            )

        questions.append(
            GeneratedQuizQuestion(
                id=f"q-bk-{idx + 1}",
                question=q_text,
                options=options,
                correctIndex=correct_idx,
                explanation=explanation,
            )
        )

    est_mins = max(6, min(30, (6 if str(difficulty).lower() == "hard" else 4) + target_n * 2))
    passing = 80 if str(difficulty).lower() == "hard" else (60 if str(difficulty).lower() == "easy" else 70)
    return GeneratedModuleKit(
        title=clean_title,
        description=description,
        estimated_duration=f"{est_mins} Mins",
        recap_bullets=recap_bullets,
        passing_score=passing,
        questions=questions,
        engine="deterministic_backup",
    )


# ============================================================================
# 4. PRIMARY PYDANTIC-AI V2 GENERATOR WITH AUTOMATIC DETERMINISTIC FAILOVER
# ============================================================================
MODEL_NAME = os.getenv("SAARTHI_AI_MODEL", "groq:llama-3.3-70b-versatile")


def _build_kit_agent() -> Optional[Any]:
    if not PYDANTIC_AI_AVAILABLE or not os.getenv("GROQ_API_KEY"):
        return None

    return Agent(
        MODEL_NAME,
        output_type=GeneratedModuleKit,
        retries=2,
        system_prompt=(
            "You are an expert enterprise curriculum designer for Saarthi Curious LMS. "
            "Given a module title and source content (transcript, PDF text, or notes), "
            "produce a crisp 2-sentence module description, 3 actionable study recap bullets, "
            "and high-quality multiple-choice questions with 4 distinct options, exact correctIndex (0-3), "
            "and a clear explanation for every answer. Set engine='saarthi_ai'."
        ),
    )


_KIT_AGENT = _build_kit_agent()


async def generate_module_kit(
    *,
    module_title: str,
    youtube_url: str = "",
    raw_notes: str = "",
    pdf_bytes: Optional[bytes] = None,
    question_count: int = 5,
    difficulty: str = "medium",
    force_backup: bool = False,
) -> Dict[str, Any]:
    text_blocks: List[str] = []
    sources_used: List[str] = []

    if pdf_bytes:
        pdf_text = extract_pdf_text(pdf_bytes)
        if pdf_text:
            text_blocks.append(pdf_text)
            sources_used.append("pdf")

    if youtube_url:
        yt_text = extract_youtube_transcript(youtube_url)
        if yt_text:
            text_blocks.append(yt_text)
            sources_used.append("youtube_transcript")

    if raw_notes and raw_notes.strip():
        text_blocks.append(raw_notes.strip())
        sources_used.append("notes")

    combined_text = "\n\n".join(text_blocks)[:10000]

    diff_norm = str(difficulty or "medium").lower().strip()
    if diff_norm not in ("easy", "medium", "hard"):
        diff_norm = "medium"

    if not force_backup and _KIT_AGENT is not None:
        diff_instruction = (
            "Generate HARD scenario-based, multi-step analytical MCQs with subtle distractors and passing_score=80."
            if diff_norm == "hard"
            else "Generate balanced enterprise assessment MCQs with passing_score=70."
        )
        prompt = (
            f"Module Title: {module_title}\n"
            f"Difficulty Level: {diff_norm.upper()} ({diff_instruction})\n"
            f"Requested Question Count: {question_count}\n"
            f"Source Material:\n{combined_text or 'Use enterprise best practices for this module title.'}"
        )
        try:
            res = await asyncio.wait_for(_KIT_AGENT.run(prompt), timeout=14.0)
            kit: GeneratedModuleKit = res.output
            kit.engine = "saarthi_ai"
            return {
                "kit": kit.model_dump(),
                "sources_used": sources_used or ["module_title"],
            }
        except Exception:
            pass

    backup_kit = build_deterministic_module_kit(
        module_title=module_title,
        source_text=combined_text,
        question_count=question_count,
        difficulty=diff_norm,
    )
    return {
        "kit": backup_kit.model_dump(),
        "sources_used": sources_used or ["module_title"],
    }

