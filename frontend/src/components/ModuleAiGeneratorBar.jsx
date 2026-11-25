import { useState, useRef } from "react";
import axios from "axios";
import {
  Sparkles,
  FileText,
  PlayCircle,
  Loader2,
  Cpu,
  CheckCircle2,
  Upload,
} from "lucide-react";

const API_BASE_URL =
  import.meta.env?.VITE_API_URL ||
  (typeof window !== "undefined" &&
  (window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1")
    ? "http://127.0.0.1:8000"
    : "https://saarthi-curious-00e8.onrender.com");

export default function ModuleAiGeneratorBar({
  moduleTitle,
  youtubeUrl,
  onApplyKit,
}) {
  const [notes, setNotes] = useState("");
  const [pdfFile, setPdfFile] = useState(null);
  const [questionCount, setQuestionCount] = useState(5);
  const [loading, setLoading] = useState(false);
  const [statusInfo, setStatusInfo] = useState(null);
  const [recapPreview, setRecapPreview] = useState([]);
  const fileRef = useRef(null);

  const handleGenerate = async () => {
    setLoading(true);
    setStatusInfo(null);

    try {
      const formData = new FormData();
      formData.append("module_title", moduleTitle || "Study Module");
      formData.append("youtube_url", youtubeUrl || "");
      formData.append("raw_notes", notes || "");
      formData.append("question_count", String(questionCount));
      if (pdfFile) {
        formData.append("pdf_file", pdfFile);
      }

      const token =
        localStorage.getItem("token") || localStorage.getItem("access_token");
      const headers = {
        "Content-Type": "multipart/form-data",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      const res = await axios.post(
        `${API_BASE_URL}/api/ai/generate-module-kit`,
        formData,
        { headers }
      );

      const kit = res.data?.kit;
      if (kit) {
        setRecapPreview(kit.recap_bullets || []);
        onApplyKit(kit);
        setStatusInfo({
          engine: kit.engine || "saarthi_ai",
          count: kit.questions?.length || 0,
        });
      }
    } catch {
      const fallbackKit = {
        title: moduleTitle || "Study Module",
        description: `Structured study track covering core workflows and practical execution for ${
          moduleTitle || "this module"
        }.`,
        estimated_duration: `${Math.max(6, questionCount * 2)} Mins`,
        passing_score: 70,
        recap_bullets: [
          `Review key concepts introduced in ${moduleTitle || "this unit"}.`,
          "Practice applying the core framework to real enterprise scenarios.",
          "Complete the graded quiz to unlock progress and Curo milestones.",
        ],
        questions: Array.from({ length: questionCount }, (_, idx) => ({
          id: `q-local-${Date.now()}-${idx}`,
          question: `Checkpoint ${idx + 1}: What is the most effective approach when applying ${
            moduleTitle || "this module"
          } concepts?`,
          options: [
            "Follow structured verification steps and document measurable outcomes",
            "Skip initial discovery and move directly to assumptions",
            "Delay team alignment until after delivery closes",
            "Rely solely on informal check-ins without milestones",
          ],
          correctIndex: 0,
          explanation:
            "Structured execution and measurable follow-through consistently outperform ad-hoc workflows.",
        })),
        engine: "local_backup",
      };
      setRecapPreview(fallbackKit.recap_bullets);
      onApplyKit(fallbackKit);
      setStatusInfo({
        engine: "local_backup",
        count: fallbackKit.questions.length,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="digi-live-border-indigo rounded-3xl p-5 sm:p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/25 border border-indigo-400/60 flex items-center justify-center text-indigo-200">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.22em] text-indigo-200 block">
              ONE-CLICK GENERATIVE COURSE KIT (AI + BACKUP ENGINE)
            </span>
            <h3 className="text-sm sm:text-base font-black text-white">
              Auto-Build Description, Recap Notes &amp; Quiz Questions
            </h3>
          </div>
        </div>

        {statusInfo && (
          <span className="px-3 py-1 rounded-full text-[10.5px] font-black inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-200 border border-emerald-400/50">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>
              Generated {statusInfo.count} Qs via{" "}
              {statusInfo.engine === "saarthi_ai" ? "Saarthi AI" : "Backup Engine"}
            </span>
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        <div className="lg:col-span-7 space-y-2">
          <label className="text-[10.5px] font-extrabold uppercase tracking-wider text-cyan-200 block">
            Paste Study Notes, Transcript, or Key Points (Optional)
          </label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Paste lecture notes or leave blank to auto-extract from your YouTube link or uploaded PDF..."
            className="digi-input w-full rounded-xl px-3.5 py-2.5 text-xs font-medium leading-relaxed resize-none"
          />
        </div>

        <div className="lg:col-span-5 space-y-3">
          <input
            ref={fileRef}
            type="file"
            accept=".pdf"
            onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
            className="hidden"
          />

          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="p-2.5 rounded-xl bg-gradient-to-br from-[#14204D] to-[#0C1536] border-2 border-cyan-400/65 hover:border-cyan-300 hover:shadow-[0_0_18px_rgba(34,211,238,0.28)] text-xs font-bold text-cyan-100 inline-flex items-center justify-center gap-1.5 cursor-pointer transition truncate"
            >
              <Upload className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">
                {pdfFile ? pdfFile.name : "Attach PDF"}
              </span>
            </button>

            <select
              value={questionCount}
              onChange={(e) => setQuestionCount(Number(e.target.value))}
              className="digi-input rounded-xl px-3 py-2.5 text-xs font-black cursor-pointer"
            >
              <option value={3} className="bg-[#070D1F]">3 Questions</option>
              <option value={5} className="bg-[#070D1F]">5 Questions</option>
              <option value={8} className="bg-[#070D1F]">8 Questions</option>
            </select>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-300 px-1">
            <span className="inline-flex items-center gap-1.5 truncate">
              <PlayCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span>
                {youtubeUrl ? "Using Module YouTube Link" : "No YouTube link yet"}
              </span>
            </span>
            <span className="inline-flex items-center gap-1 text-indigo-300 font-bold shrink-0">
              <Cpu className="w-3 h-3" />
              <span>Auto-Failover</span>
            </span>
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={handleGenerate}
            className="digi-btn-cyan w-full py-2.5 rounded-xl text-xs font-black uppercase tracking-wider inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating Study Kit...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Description &amp; Quiz</span>
              </>
            )}
          </button>
        </div>
      </div>

      {recapPreview.length > 0 && (
        <div className="p-3.5 rounded-2xl bg-[#050A18] border border-emerald-400/35 space-y-1.5">
          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" />
            <span>Generated 2-Minute Student Recap Bullets</span>
          </span>
          <ul className="space-y-1 text-xs text-slate-200">
            {recapPreview.map((b, i) => (
              <li key={i}>• {b}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
