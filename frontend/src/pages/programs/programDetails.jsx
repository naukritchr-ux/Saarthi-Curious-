import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import MainLayout from "../../layout/mainLayout";
import SurveyTemplateGallery from "./surveyTemplateGallery";
import SurveyQuestionBuilder from "./surveyQuestionBuilder";
import { appendActorParams } from "../../utils/auditHelper";
import {
  getRetentionQuiz,
  getApplicationCheck,
  updateRetentionQuiz,
  updateApplicationCheck,
} from "../../services/programService";
import {
  Plus,
  PlayCircle,
  FileQuestion,
  ClipboardCheck,
  BookOpen,
  Trash2,
  X,
  Layers,
  CheckCircle,
  GripVertical,
  Calendar,
  Settings,
  ShieldAlert,
  UploadCloud,
  RefreshCw,
  Clock,
  Check,
  Info,
  Award,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

// ============ SORTABLE MODULE ITEM COMPONENT ============
const SortableModuleItem = ({
  module,
  index,
  selectedModule,
  onSelect,
  onDelete,
  children,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: module.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="group">
      <div
        className={`flex items-center justify-between rounded-xl p-3.5 transition-all duration-200 cursor-pointer ${
          selectedModule?.id === module.id
            ? "bg-gradient-to-r from-[#2A0E4A] to-[#1E0B38] text-white border-2 border-[#D946EF] shadow-[0_0_20px_rgba(217,70,239,0.4)]"
            : "bg-[#0D1224] text-slate-200 hover:bg-[#131A33] border-2 border-slate-700/60 hover:border-purple-400/60"
        }`}
        onClick={() => onSelect(module)}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <button
            {...attributes}
            {...listeners}
            onClick={(e) => e.stopPropagation()}
            className={`cursor-grab active:cursor-grabbing p-1 rounded ${
              selectedModule?.id === module.id
                ? "text-white/70 hover:text-white"
                : "text-slate-400 hover:text-purple-300"
            }`}
            title="Drag Module"
          >
            <GripVertical size={17} />
          </button>

          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${
              selectedModule?.id === module.id
                ? "bg-white/20 text-white"
                : "bg-purple-900/40 text-purple-300 border border-purple-500/30"
            }`}
          >
            {index + 1}
          </div>

          <span className="font-bold truncate">{module.title}</span>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(module.id);
          }}
          className={`ml-2 p-1.5 rounded-lg transition-all ${
            selectedModule?.id === module.id
              ? "text-white/70 hover:text-white hover:bg-white/20"
              : "text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
          }`}
          title="Delete Module"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* Children wrapper - REMOVED onMouseDown handler */}
      <div>{selectedModule?.id === module.id && children}</div>
    </div>
  );
};

// ============ MAIN COMPONENT ============
const ProgramDetails = () => {
  const { id: programId } = useParams();
  const navigate = useNavigate();
  const editorContainerRef = useRef(null);
  // Mirror ref so fetchProgram can read the freshest selectedModule without
  // depending on it (which would recreate the callback and clobber edits).
  const selectedModuleRef = useRef(null);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
  );

  // Primary backend state pools
  const [modules, setModules] = useState([]);
  const [selectedModule, setSelectedModule] = useState(null);
  const [selectedContent, setSelectedContent] = useState(null);
  const [playingVideo, setPlayingVideo] = useState(null);
  const [showContentTypes, setShowContentTypes] = useState(false);
  const [programData, setProgramData] = useState(null);
  const [isPublishing, setIsPublishing] = useState(false);

  // Live module form editing state pools
  const [editModuleTitle, setEditModuleTitle] = useState("");
  const [editModuleDescription, setEditModuleDescription] = useState("");
  const [editModuleCuros, setEditModuleCuros] = useState("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Optimized Action & Transactional Loading States
  const [loading, setLoading] = useState(true);
  const [savingModule, setSavingModule] = useState(false);
  const [savingVideo, setSavingVideo] = useState(false);
  const [savingQuiz, setSavingQuiz] = useState(false);
  const [savingQuestions, setSavingQuestions] = useState(false);
  const [savingWrittenLesson, setSavingWrittenLesson] = useState(false);
  const [uploadingNote, setUploadingNote] = useState(false);
  const [savingSurvey, setSavingSurvey] = useState(false);

  // Form states for adding items
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonDescription, setLessonDescription] = useState("");
  const [videoExplanation, setVideoExplanation] = useState("");
  const [youtubeLink, setYoutubeLink] = useState("");
  const [thumbnail, setThumbnail] = useState("");

  const [quizResults, setQuizResults] = useState([]);
  const [loadingResults, setLoadingResults] = useState(false);
  const [selectedResult, setSelectedResult] = useState(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [quizTitle, setQuizTitle] = useState("");
  const [quizDescription, setQuizDescription] = useState("");
  const [quizType, setQuizType] = useState("MCQ");
  const [unlockType, setUnlockType] = useState("Immediate");
  const [passingPercentage, setPassingPercentage] = useState("");
  const [assignmentTitle, setAssignmentTitle] = useState("");

  // Survey Creation Form States
  const [surveyTitle, setSurveyTitle] = useState("");
  const [surveyDescription, setSurveyDescription] = useState("");
  const [surveyQuestions, setSurveyQuestions] = useState([]);

  // Written Lesson Form States
  const [writtenLessonTitle, setWrittenLessonTitle] = useState("");
  const [writtenLessonContent, setWrittenLessonContent] = useState("");
  const [writtenLessonPdfUrl, setWrittenLessonPdfUrl] = useState("");
  const [writtenLessonFile, setWrittenLessonFile] = useState(null);

  // Assignment Form States
  const [assignments, setAssignments] = useState([]);
  const [assignmentDescription, setAssignmentDescription] = useState("");
  const [assignmentInstructions, setAssignmentInstructions] = useState("");
  const [assignmentDeadline, setAssignmentDeadline] = useState("");
  const [assignmentMaxMarks, setAssignmentMaxMarks] = useState(100);
  const [assignmentPassingMarks, setAssignmentPassingMarks] = useState(60);
  const [assignmentSubmissionType, setAssignmentSubmissionType] =
    useState("file");
  const [allowMultipleFiles, setAllowMultipleFiles] = useState(false);
  const [allowLateSubmission, setAllowLateSubmission] = useState(false);
  const [latePenalty, setLatePenalty] = useState(0);
  const [maxFileSize, setMaxFileSize] = useState(50);
  const [savingAssignment, setSavingAssignment] = useState(false);
  const [editingAssignmentId, setEditingAssignmentId] = useState(null);
  const [retentionQuiz, setRetentionQuiz] = useState(null);
  const [applicationCheck1, setApplicationCheck1] = useState(null);
  const [applicationCheck2, setApplicationCheck2] = useState(null);
  const [applicationCheck3, setApplicationCheck3] = useState(null);
  const [showRetentionQuizModal, setShowRetentionQuizModal] = useState(false);
  const [retentionQuizQuestions, setRetentionQuizQuestions] = useState([]);
  const [retentionQuizTitle, setRetentionQuizTitle] =
    useState("Retention Quiz");
  const [retentionQuizDescription, setRetentionQuizDescription] = useState(
    "Configure retention quiz questions for this program.",
  );
  const [showApplicationCheckModal, setShowApplicationCheckModal] =
    useState(false);
  const [activeApplicationCheckKey, setActiveApplicationCheckKey] =
    useState(null);
  const [applicationCheckTitle, setApplicationCheckTitle] = useState("");
  const [applicationCheckDescription, setApplicationCheckDescription] =
    useState("");
  const [applicationCheckQuestions, setApplicationCheckQuestions] = useState(
    [],
  );
  const [savingValidation, setSavingValidation] = useState(false);

  // Upgraded state variables
  const [allowedFileTypes, setAllowedFileTypes] = useState(["ZIP", "PDF"]);
  const [maxLateDays, setMaxLateDays] = useState(3);
  const [attemptsAllowed, setAttemptsAllowed] = useState("Unlimited");

  // Advanced Notes Form States
  const [noteTitle, setNoteTitle] = useState("");
  const [noteDescription, setNoteDescription] = useState("");
  const [noteUrlLink, setNoteUrlLink] = useState("");
  const [noteFile, setNoteFile] = useState(null);

  // Active Note File State for the inline portal display window
  const [viewingNote, setViewingNote] = useState(null);

  // Targets which specific item receives the note
  const [noteTargetItem, setNoteTargetItem] = useState(null);

  // Modal Visibility States
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [showSurveyModal, setShowSurveyModal] = useState(false);
  const [showSurveyChoiceModal, setShowSurveyChoiceModal] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [showWrittenLessonModal, setShowWrittenLessonModal] = useState(false);
  const [showSurveyGallery, setShowSurveyGallery] = useState(false);

  // Fixed: declared previewTemplateUrl state (was referenced but never declared)
  const [previewTemplateUrl, setPreviewTemplateUrl] = useState(null);

  // Fully Connected Dynamic Form States for Quiz Multi-Question Builders
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [quizQuestionsForm, setQuizQuestionsForm] = useState([
    {
      questionText: "",
      marks: 1,
      explanation: "",
      options: [
        { text: "", isCorrect: true },
        { text: "", isCorrect: false },
      ],
    },
  ]);

  // Keep the mirror ref in sync with the state.
  useEffect(() => {
    selectedModuleRef.current = selectedModule;
  }, [selectedModule]);

  // ============ HELPER FUNCTIONS ============
  const extractYoutubeId = (url) => {
    if (!url) return "";
    const regExp =
      /^.*(?:youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|shorts\/)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[1].length === 11 ? match[1] : "";
  };

  const getYoutubeThumbnail = (url) => {
    const videoId = extractYoutubeId(url);
    return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : "";
  };

  // ============ CENTRALIZED ERROR HANDLER ============
  const handleApiError = (error) => {
    console.error(error);
    const message =
      error?.response?.data?.detail || error?.message || "Something went wrong";
    alert(message);
  };

  // ============ DYNAMIC MULTI-QUESTION ACTIONS ============
  const addQuestionToForm = () => {
    setQuizQuestionsForm([
      ...quizQuestionsForm,
      {
        questionText: "",
        marks: 1,
        explanation: "",
        options: [
          { text: "", isCorrect: true },
          { text: "", isCorrect: false },
        ],
      },
    ]);
  };

  const addOptionToQuestion = (qIndex) => {
    const updated = [...quizQuestionsForm];
    updated[qIndex].options.push({ text: "", isCorrect: false });
    setQuizQuestionsForm(updated);
  };

  const removeQuestionFromForm = (qIndex) => {
    setQuizQuestionsForm(quizQuestionsForm.filter((_, i) => i !== qIndex));
  };

  const handleQuestionTextChange = (qIndex, field, value) => {
    const updated = [...quizQuestionsForm];
    updated[qIndex][field] = value;
    setQuizQuestionsForm(updated);
  };

  const removeOptionFromQuestion = (qIndex, oIndex) => {
    const updated = [...quizQuestionsForm];
    updated[qIndex].options = updated[qIndex].options.filter(
      (_, i) => i !== oIndex,
    );
    setQuizQuestionsForm(updated);
  };

  const handleOptionDataChange = (qIndex, oIndex, field, value) => {
    const updated = [...quizQuestionsForm];
    if (field === "isCorrect") {
      updated[qIndex].options = updated[qIndex].options.map((opt, idx) => ({
        ...opt,
        isCorrect: idx === oIndex,
      }));
    } else {
      updated[qIndex].options[oIndex][field] = value;
    }
    setQuizQuestionsForm(updated);
  };

  // ============ FETCH FUNCTIONS ============
  const fetchProgram = useCallback(
    async (updateSelection = false, targetModuleId = null, options = {}) => {
      if (!programId) return;
      const showFullLoader = options.showFullLoader ?? false;
      try {
        if (showFullLoader) setLoading(true);
        const response = await axios.get(
          `${API_BASE_URL}/programs/${programId}`,
        );
        const data = response.data;
        setProgramData(data);
        const fetchedModules = data.modules || [];
        setModules(fetchedModules);

        if (fetchedModules.length === 0) {
          setSelectedModule(null);
          selectedModuleRef.current = null;
          setSelectedContent(null);
          setEditModuleTitle("");
          setEditModuleDescription("");
          setEditModuleCuros("");
          return;
        }

        // ---- selectedModule, without depending on selectedModule ----
        const prevSelected = selectedModuleRef.current;

        let nextModule;
        if (updateSelection && targetModuleId) {
          nextModule =
            fetchedModules.find((m) => m.id === targetModuleId) ||
            fetchedModules[0];
        } else if (!prevSelected) {
          nextModule = fetchedModules[0];
        } else {
          nextModule =
            fetchedModules.find((m) => m.id === prevSelected.id) ||
            fetchedModules[0];
        }

        const moduleChanged =
          !prevSelected || prevSelected.id !== nextModule.id;

        setSelectedModule(nextModule);
        selectedModuleRef.current = nextModule;

        // Only touch the edit-form fields when the selected module actually
        // changed. This is what stops keystrokes from being wiped out by
        // background refreshes.
        if (moduleChanged) {
          setEditModuleTitle(nextModule.title);
          setEditModuleDescription(nextModule.description || "");
          setEditModuleCuros(nextModule.curos || 0);
          setHasUnsavedChanges(false);
        }

        // ---- selectedContent, without depending on selectedContent ----
        setSelectedContent((prevContent) => {
          if (!prevContent) return prevContent;

          if (prevContent.type === "video") {
            for (const m of fetchedModules) {
              const match = m.videos?.find(
                (v) => v.id === prevContent.data?.id,
              );
              if (match) return { type: "video", data: match };
            }
          } else if (prevContent.type === "quiz") {
            for (const m of fetchedModules) {
              const match = m.quizzes?.find(
                (q) => q.id === prevContent.data?.id,
              );
              if (match) return { type: "quiz", data: match };
            }
          } else if (prevContent.type === "writtenLesson") {
            for (const m of fetchedModules) {
              const match = m.written_lessons?.find(
                (l) => l.id === prevContent.data?.id,
              );
              if (match) return { type: "writtenLesson", data: match };
            }
          } else if (prevContent.type === "survey") {
            for (const m of fetchedModules) {
              const match = m.surveys?.find(
                (s) => s.id === prevContent.data?.id,
              );
              if (match) {
                const formattedQuestions = (match.questions || []).map((q) => ({
                  question: q.question || q.question_text || "",
                  type: q.question_type || "Multiple Choice",
                  required: q.is_required || false,
                  options: (q.options || []).map((o) => o.option_text || o),
                }));
                setSurveyQuestions(formattedQuestions);
                return { type: "survey", data: match };
              }
            }
          } else if (prevContent.type === "assignment") {
            for (const m of fetchedModules) {
              const match = m.assignments?.find(
                (a) => a.id === prevContent.data?.id,
              );
              if (match) return { type: "assignment", data: match };
            }
          }

          return null; // item no longer exists (e.g. deleted elsewhere)
        });
      } catch (error) {
        handleApiError(error);
      } finally {
        if (showFullLoader) setLoading(false);
      }
    },
    [programId], // ← ONLY this. This is the actual fix.
  );

  const fetchProgramValidationData = useCallback(async () => {
    if (!programId) return;

    try {
      const retentionResponse = await getRetentionQuiz(programId);
      setRetentionQuiz(retentionResponse);
    } catch (error) {
      console.error("Retention quiz request failed:", error);
      setRetentionQuiz(null);
    }

    try {
      const response = await getApplicationCheck(programId, 1);
      setApplicationCheck1(response);
    } catch (error) {
      console.error("Application Check 1 request failed:", error);
      setApplicationCheck1(null);
    }

    try {
      const response = await getApplicationCheck(programId, 2);
      setApplicationCheck2(response);
    } catch (error) {
      console.error("Application Check 2 request failed:", error);
      setApplicationCheck2(null);
    }

    try {
      const response = await getApplicationCheck(programId, 3);
      setApplicationCheck3(response);
    } catch (error) {
      console.error("Application Check 3 request failed:", error);
      setApplicationCheck3(null);
    }
  }, [programId]);

  // ============ EFFECTS ============
  useEffect(() => {
    if (programId) {
      fetchProgram(false, null, { showFullLoader: true });
      fetchProgramValidationData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [programId]);

  // ============ PROGRAM PUBLISHING ============
  const handlePublishProgram = async () => {
    if (!programId || !programData) return;

    setIsPublishing(true);
    try {
      const url = appendActorParams(
        `${API_BASE_URL}/programs/${programId}/publish`,
      );
      const response = await axios.post(url);
      const updatedProgram = response.data;
      setProgramData(updatedProgram);
      await fetchProgram();
      alert("Program published successfully.");
    } catch (error) {
      console.error(error);
      alert(error?.message || "Failed to publish program.");
    } finally {
      setIsPublishing(false);
    }
  };

  // ============ RETENTION QUIZ HANDLERS ============
  const openRetentionQuizModal = () => {
    const existingQuestions = Array.isArray(retentionQuiz?.questions)
      ? retentionQuiz.questions.map((question) => ({
          question: question.question || "",
          type: question.response_format || "Multiple Choice",
          required: question.required ?? false,
          options: [
            question.option_a || "Option 1",
            question.option_b || "Option 2",
            question.option_c || "Option 3",
            question.option_d || "Option 4",
          ],
          correctOption:
            question.correct_answer === "A"
              ? 0
              : question.correct_answer === "B"
                ? 1
                : question.correct_answer === "C"
                  ? 2
                  : question.correct_answer === "D"
                    ? 3
                    : 0,
        }))
      : [];

    setRetentionQuizQuestions(existingQuestions);
    setRetentionQuizTitle("Retention Quiz");
    setRetentionQuizDescription(
      "Configure retention quiz questions for this program.",
    );
    setShowRetentionQuizModal(true);
  };

  const handleSaveRetentionQuiz = async () => {
    if (!programId) return;

    if (retentionQuizQuestions.length === 0) {
      alert("Please add at least one retention quiz question.");
      return;
    }

    const hasEmptyQuestion = retentionQuizQuestions.some(
      (question) => !question.question?.trim(),
    );
    if (hasEmptyQuestion) {
      alert("Please complete all retention quiz questions before saving.");
      return;
    }

    setSavingValidation(true);

    try {
      const payload = {
        questions: retentionQuizQuestions.map((question, index) => ({
          question: question.question,
          response_format: question.type || "Multiple Choice",
          option_a:
            question.type === "Multiple Choice"
              ? question.options?.[0] || ""
              : "",
          option_b:
            question.type === "Multiple Choice"
              ? question.options?.[1] || ""
              : "",
          option_c:
            question.type === "Multiple Choice"
              ? question.options?.[2] || ""
              : "",
          option_d:
            question.type === "Multiple Choice"
              ? question.options?.[3] || ""
              : "",
          correct_answer:
            question.type === "Multiple Choice"
              ? ["A", "B", "C", "D"][question.correctOption ?? 0]
              : "",
          explanation: "",
          required: question.required || false,
          display_order: index + 1,
        })),
      };

      await updateRetentionQuiz(programId, payload);
      await fetchProgramValidationData();
      setShowRetentionQuizModal(false);
      alert("Retention quiz saved successfully.");
    } catch (error) {
      console.error("Retention quiz save failed", error);
      alert(error?.message || "Failed to save retention quiz.");
    } finally {
      setSavingValidation(false);
    }
  };

  // ============ APPLICATION CHECK HANDLERS ============
  const openApplicationCheckModal = (checkNumber) => {
    const currentCheck =
      checkNumber === 1
        ? applicationCheck1
        : checkNumber === 2
          ? applicationCheck2
          : applicationCheck3;

    const existingQuestions = Array.isArray(currentCheck?.questions)
      ? currentCheck.questions.map((question) => ({
          question: question.question || "",
          type: "Short Answer",
          required: question.required ?? false,
          options: [],
        }))
      : [];

    setActiveApplicationCheckKey(checkNumber);
    setApplicationCheckTitle(`Application Check ${checkNumber}`);
    setApplicationCheckDescription(
      "Create open-ended questions for this application milestone.",
    );
    setApplicationCheckQuestions(existingQuestions);
    setShowApplicationCheckModal(true);
  };

  const handleSaveApplicationCheck = async () => {
    if (!programId || !activeApplicationCheckKey) return;

    if (applicationCheckQuestions.length === 0) {
      alert("Please add at least one application check question.");
      return;
    }

    const hasEmptyQuestion = applicationCheckQuestions.some(
      (question) => !question.question?.trim(),
    );
    if (hasEmptyQuestion) {
      alert("Please complete all application check questions before saving.");
      return;
    }

    setSavingValidation(true);

    try {
      const payload = {
        questions: applicationCheckQuestions.map((question, index) => ({
          question: question.question,
          option_a: "",
          option_b: "",
          option_c: "",
          option_d: "",
          correct_answer: "",
          explanation: "",
          display_order: index + 1,
        })),
      };

      await updateApplicationCheck(
        programId,
        activeApplicationCheckKey,
        payload,
      );
      await fetchProgramValidationData();
      setShowApplicationCheckModal(false);
      setActiveApplicationCheckKey(null);
      alert("Application check saved successfully.");
    } catch (error) {
      console.error("Application check save failed", error);
      alert(error?.message || "Failed to save application check.");
    } finally {
      setSavingValidation(false);
    }
  };

  // ============ MODULE CRUD OPERATIONS ============
  const addModule = async () => {
    setSavingModule(true);
    try {
      let highestNumber = 0;
      modules.forEach((m) => {
        const match = m.title.match(/Module\s+(\d+)/i);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > highestNumber) {
            highestNumber = num;
          }
        }
      });
      const nextNumber = highestNumber + 1;

      const url = appendActorParams(
        `${API_BASE_URL}/programs/${programId}/modules/`,
      );
      const response = await axios.post(url, {
        title: `Module ${nextNumber}`,
        description: "Default program structure block overview details.",
        curos: 0,
      });

      const created = response.data;

      // Prime the editor state immediately so the new module is visible
      // in the form without waiting for the refetch to populate it.
      setSelectedContent(null);
      setSelectedModule(created);
      selectedModuleRef.current = created;
      setEditModuleTitle(created.title || "");
      setEditModuleDescription(created.description || "");
      setEditModuleCuros(created.curos || 0);
      setHasUnsavedChanges(false);

      // Silent background refresh (no full-page loader, no editor clobber).
      await fetchProgram(true, created.id, { showFullLoader: false });
    } catch (error) {
      handleApiError(error);
    } finally {
      setSavingModule(false);
    }
  };

  const updateModuleDetails = async () => {
    if (!selectedModule) return;
    setSavingModule(true);
    try {
      const url = appendActorParams(
        `${API_BASE_URL}/programs/modules/${selectedModule.id}`,
      );
      await axios.put(url, {
        title: editModuleTitle,
        description: editModuleDescription,
        curos: Number(editModuleCuros) || 0,
      });
      setHasUnsavedChanges(false);
      await fetchProgram();
      alert("Module details saved successfully!");
    } catch (error) {
      handleApiError(error);
    } finally {
      setSavingModule(false);
    }
  };

  const deleteModule = async (moduleId) => {
    const ok = window.confirm("Delete this module?");
    if (!ok) return;

    try {
      const url = appendActorParams(
        `${API_BASE_URL}/programs/modules/${moduleId}`,
      );
      await axios.delete(url);
      await fetchProgram();
      alert("Module deleted successfully.");
    } catch (error) {
      handleApiError(error);
    }
  };

  // ============ FILE UPLOAD HELPERS ============
  const uploadPdfFileHelper = async (file) => {
    if (!file) return null;

    if (file.type !== "application/pdf") {
      alert("Please upload PDF documents only.");
      return null;
    }

    setUploadingNote(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/programs/upload-file`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );
      alert("File uploaded successfully.");
      return response.data.file_url;
    } catch (error) {
      handleApiError(error);
      return null;
    } finally {
      setUploadingNote(false);
    }
  };

  const handleNoteFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const uploadedUrl = await uploadPdfFileHelper(file);
    if (uploadedUrl) {
      setNoteUrlLink(uploadedUrl);
      setNoteFile(file);
    } else {
      setNoteFile(null);
      setNoteUrlLink("");
    }
  };

  const handleWrittenLessonFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const uploadedUrl = await uploadPdfFileHelper(file);
    if (uploadedUrl) {
      setWrittenLessonPdfUrl(uploadedUrl);
      setWrittenLessonFile(file);
    } else {
      setWrittenLessonFile(null);
      setWrittenLessonPdfUrl("");
    }
  };

  // ============ VIDEO LESSON OPERATIONS ============
  const saveVideoLesson = async () => {
    if (!selectedModule) {
      alert("Please select a module first.");
      return;
    }
    if (!lessonTitle || !youtubeLink) {
      alert("Please fill required fields (Title and YouTube URL)");
      return;
    }

    setSavingVideo(true);
    const calculatedThumbnail = thumbnail || getYoutubeThumbnail(youtubeLink);

    try {
      await axios.post(
        `${API_BASE_URL}/programs/modules/${selectedModule?.id}/videos/`,
        {
          module_id: selectedModule?.id,
          title: lessonTitle,
          subtitle: "Video Lecture Block",
          youtube_url: youtubeLink,
          description: lessonDescription,
          explanation_text: videoExplanation,
          thumbnail_url: calculatedThumbnail,
        },
      );

      setLessonTitle("");
      setLessonDescription("");
      setVideoExplanation("");
      setYoutubeLink("");
      setThumbnail("");
      setShowVideoModal(false);
      setShowContentTypes(false);

      await fetchProgram();
    } catch (error) {
      handleApiError(error);
    } finally {
      setSavingVideo(false);
    }
  };

  // ============ QUIZ OPERATIONS ============
  const saveQuiz = async () => {
    if (!selectedModule) {
      alert("Please select a module first.");
      return;
    }

    if (!quizTitle.trim()) {
      alert("Please enter quiz title.");
      return;
    }

    if (passingPercentage === "") {
      alert("Please enter passing percentage.");
      return;
    }

    const passingValue = Number(passingPercentage);

    if (Number.isNaN(passingValue) || passingValue < 0 || passingValue > 100) {
      alert("Passing percentage must be between 0 and 100.");
      return;
    }

    setSavingQuiz(true);

    try {
      await axios.post(
        `${API_BASE_URL}/programs/modules/${selectedModule.id}/quizzes/`,
        null,
        {
          params: {
            title: quizTitle,
            description: quizDescription,
            quiz_type: quizType,
            unlock_type: unlockType,
            passing_percentage: passingValue,
          },
        },
      );

      setQuizTitle("");
      setQuizDescription("");
      setQuizType("MCQ");
      setUnlockType("Immediate");
      setPassingPercentage("");

      setShowQuizModal(false);
      setShowContentTypes(false);

      await fetchProgram();

      alert("Quiz created successfully!");
    } catch (error) {
      handleApiError(error);
    } finally {
      setSavingQuiz(false);
    }
  };

  // ============ WRITTEN LESSON OPERATIONS ============
  const saveWrittenLesson = async () => {
    if (!selectedModule) {
      alert("Please select a module first.");
      return;
    }
    if (!writtenLessonTitle || !writtenLessonContent) {
      alert("Please enter both a lesson title and content.");
      return;
    }

    setSavingWrittenLesson(true);
    try {
      await axios.post(
        `${API_BASE_URL}/programs/modules/${selectedModule?.id}/written-lessons`,
        {
          title: writtenLessonTitle,
          content: writtenLessonContent,
          pdf_url: writtenLessonPdfUrl,
        },
      );

      setWrittenLessonTitle("");
      setWrittenLessonContent("");
      setWrittenLessonPdfUrl("");
      setWrittenLessonFile(null);
      setShowWrittenLessonModal(false);
      setShowContentTypes(false);

      await fetchProgram();
    } catch (error) {
      handleApiError(error);
    } finally {
      setSavingWrittenLesson(false);
    }
  };

  // ============ SURVEY OPERATIONS ============
  const handleCreateInitialSurvey = async () => {
    if (!surveyTitle.trim()) {
      alert("Please enter a survey title.");
      return;
    }
    if (!selectedModule) {
      alert("Please select a module first.");
      return;
    }

    setSavingSurvey(true);
    try {
      const response = await axios.post(
        `${API_BASE_URL}/programs/modules/${selectedModule.id}/surveys`,
        {
          module_id: selectedModule.id,
          title: surveyTitle,
          description:
            surveyDescription ||
            "No custom structural summary guidelines established yet.",
          is_template: false,
        },
      );

      const newSurvey = response.data;
      setSurveyTitle("");
      setSurveyDescription("");
      setShowSurveyModal(false);
      setShowContentTypes(false);

      await fetchProgram();
      setSelectedContent({ type: "survey", data: newSurvey });
      setSurveyQuestions([]);
    } catch (error) {
      handleApiError(error);
    } finally {
      setSavingSurvey(false);
    }
  };

  const handleSelectTemplateFromGallery = async (template) => {
    if (!selectedModule) return;

    const confirmUse = window.confirm(
      `Are you sure you want to initialize a copy of "${template.title}" inside this module block structure?`,
    );
    if (!confirmUse) return;

    setSavingSurvey(true);
    try {
      const response = await axios.post(
        `${API_BASE_URL}/programs/modules/${selectedModule.id}/surveys/${template.id}/clone-template`,
      );

      alert(
        "Survey canvas workspace parameters cloned structurally from gallery template.",
      );
      setShowSurveyGallery(false);
      setShowContentTypes(false);

      await fetchProgram();

      const clonedSurvey = response.data;
      setSelectedContent({ type: "survey", data: clonedSurvey });

      const formattedQuestions = (clonedSurvey.questions || []).map((q) => ({
        question: q.question || q.question_text || "",
        type: q.question_type || "Multiple Choice",
        required: q.is_required || false,
        options: (q.options || []).map((o) => o.option_text || o),
      }));
      setSurveyQuestions(formattedQuestions);
    } catch (error) {
      handleApiError(error);
    } finally {
      setSavingSurvey(false);
    }
  };

  const addSurveyQuestion = () => {
    setSurveyQuestions([
      ...surveyQuestions,
      {
        question: "",
        type: "Multiple Choice",
        required: false,
        options: ["Option 1", "Option 2"],
      },
    ]);
  };

  const updateSurveyQuestionField = (qIdx, field, value) => {
    const updated = [...surveyQuestions];
    updated[qIdx][field] = value;
    setSurveyQuestions(updated);
  };

  const removeSurveyQuestion = (qIdx) => {
    setSurveyQuestions(surveyQuestions.filter((_, idx) => idx !== qIdx));
  };

  const addSurveyOption = (qIdx) => {
    const updated = [...surveyQuestions];
    const optionCounter = (updated[qIdx].options || []).length + 1;
    updated[qIdx].options = [
      ...(updated[qIdx].options || []),
      `Option ${optionCounter}`,
    ];
    setSurveyQuestions(updated);
  };

  const updateSurveyOptionValue = (qIdx, oIdx, val) => {
    const updated = [...surveyQuestions];
    updated[qIdx].options[oIdx] = val;
    setSurveyQuestions(updated);
  };

  const removeSurveyOption = (qIdx, oIdx) => {
    const updated = [...surveyQuestions];
    if (updated[qIdx].options.length <= 2) {
      alert("A question must retain at least 2 distinct choosing options.");
      return;
    }
    updated[qIdx].options = updated[qIdx].options.filter(
      (_, idx) => idx !== oIdx,
    );
    setSurveyQuestions(updated);
  };

  const commitLiveSurveyToModulePool = async () => {
    if (!selectedContent || selectedContent.type !== "survey") return;

    for (let i = 0; i < surveyQuestions.length; i++) {
      if (!surveyQuestions[i].question.trim()) {
        alert(
          `Question block #${i + 1} does not possess an active query prompt.`,
        );
        return;
      }
    }

    setSavingSurvey(true);
    try {
      const surveyId = selectedContent.data.id;

      await axios.put(`${API_BASE_URL}/programs/surveys/${surveyId}`, {
        title: selectedContent.data.title,
        description: selectedContent.data.description,
      });

      for (let i = 0; i < surveyQuestions.length; i++) {
        const currentQ = surveyQuestions[i];

        const payloadQuestion = {
          question: currentQ.question,
          question_type: currentQ.type,
          is_required: currentQ.required || false,
          question_order: i + 1,
          options: (currentQ.options || []).map((optText, oIdx) => ({
            option_text: optText,
            option_order: oIdx + 1,
          })),
        };

        await axios.post(
          `${API_BASE_URL}/programs/surveys/${surveyId}/questions`,
          payloadQuestion,
        );
      }

      alert("Survey data committed successfully to the database.");
      await fetchProgram();
    } catch (error) {
      handleApiError(error);
    } finally {
      setSavingSurvey(false);
    }
  };

  const inlineDeleteSurveyItem = async (surveyId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this configuration block completely from this module structure?",
      )
    )
      return;

    try {
      await axios.delete(`${API_BASE_URL}/programs/surveys/${surveyId}`);
      alert("Survey template deleted successfully from database.");

      setSelectedContent(null);
      setSurveyQuestions([]);
      await fetchProgram();
    } catch (error) {
      handleApiError(error);
    }
  };

  // ============ ASSIGNMENT OPERATIONS ============
  const saveAssignment = async () => {
    if (!selectedModule) {
      alert("Please select a module first.");
      return;
    }

    if (!assignmentTitle.trim()) {
      alert("Please enter assignment title.");
      return;
    }

    setSavingAssignment(true);

    const payload = {
      module_id: selectedModule.id,
      title: assignmentTitle,
      description: assignmentDescription,
      instructions: assignmentInstructions,
      deadline: assignmentDeadline,
      max_marks: Number(assignmentMaxMarks),
      passing_marks: Number(assignmentPassingMarks),
      submission_type: assignmentSubmissionType,
      allow_multiple_files: allowMultipleFiles,
      allow_late_submission: allowLateSubmission,
      late_penalty: Number(latePenalty),
      max_file_size: Number(maxFileSize),
      allowed_file_types: allowedFileTypes,
      max_late_days: Number(maxLateDays),
      attempts_allowed: attemptsAllowed,
    };

    try {
      if (editingAssignmentId) {
        await axios.put(
          `${API_BASE_URL}/programs/assignments/${editingAssignmentId}`,
          payload,
        );
        alert("Assignment updated successfully!");
      } else {
        await axios.post(
          `${API_BASE_URL}/programs/modules/${selectedModule.id}/assignments`,
          payload,
        );
        alert("Assignment created successfully!");
      }

      setShowAssignmentModal(false);
      resetAssignmentForm();
      await fetchProgram();
    } catch (error) {
      handleApiError(error);
    } finally {
      setSavingAssignment(false);
    }
  };

  const deleteAssignment = async (assignmentId) => {
    if (!window.confirm("Are you sure you want to delete this assignment?"))
      return;
    try {
      await axios.delete(
        `${API_BASE_URL}/programs/assignments/${assignmentId}`,
      );
      alert("Assignment deleted successfully.");
      setSelectedContent(null);
      await fetchProgram();
    } catch (error) {
      handleApiError(error);
    }
  };

  const handleEditAssignmentClick = (assignment) => {
    setEditingAssignmentId(assignment.id);
    setAssignmentTitle(assignment.title || "");
    setAssignmentDescription(assignment.description || "");
    setAssignmentInstructions(assignment.instructions || "");
    setAssignmentDeadline(
      assignment.deadline ? assignment.deadline.substring(0, 16) : "",
    );
    setAssignmentMaxMarks(assignment.max_marks ?? 100);
    setAssignmentPassingMarks(assignment.passing_marks ?? 60);
    setAssignmentSubmissionType(assignment.submission_type || "file");
    setAllowMultipleFiles(assignment.allow_multiple_files || false);
    setAllowLateSubmission(assignment.allow_late_submission || false);
    setLatePenalty(assignment.late_penalty ?? 0);
    setMaxFileSize(assignment.max_file_size ?? 50);
    setAllowedFileTypes(assignment.allowed_file_types || ["ZIP", "PDF"]);
    setMaxLateDays(assignment.max_late_days ?? 3);
    setAttemptsAllowed(assignment.attempts_allowed || "Unlimited");
    setShowAssignmentModal(true);
  };

  const resetAssignmentForm = () => {
    setEditingAssignmentId(null);
    setAssignmentTitle("");
    setAssignmentDescription("");
    setAssignmentInstructions("");
    setAssignmentDeadline("");
    setAssignmentMaxMarks(100);
    setAssignmentPassingMarks(60);
    setAssignmentSubmissionType("file");
    setAllowMultipleFiles(false);
    setAllowLateSubmission(false);
    setLatePenalty(0);
    setMaxFileSize(50);
    setAllowedFileTypes(["ZIP", "PDF"]);
    setMaxLateDays(3);
    setAttemptsAllowed("Unlimited");
  };

  // ============ NOTES OPERATIONS ============
  const saveNotes = async () => {
    if (!noteTitle || !noteUrlLink) {
      alert("Please upload a file or insert an online document link.");
      return;
    }

    try {
      if (noteTargetItem?.type === "video") {
        await axios.post(
          `${API_BASE_URL}/programs/videos/${noteTargetItem.id}/documents`,
          {
            title: noteTitle,
            description: noteDescription,
            file_url: noteUrlLink,
          },
        );
      }

      setNoteTitle("");
      setNoteDescription("");
      setNoteUrlLink("");
      setNoteFile(null);
      setNoteTargetItem(null);
      setShowNotesModal(false);

      await fetchProgram();
    } catch (error) {
      handleApiError(error);
    }
  };

  const deleteDocument = async (documentId) => {
    if (!window.confirm("Are you sure you want to delete this document?"))
      return;
    try {
      await axios.delete(
        `${API_BASE_URL}/programs/video-documents/${documentId}`,
      );
      await fetchProgram();
    } catch (error) {
      handleApiError(error);
    }
  };

  // ============ QUIZ QUESTIONS OPERATIONS ============
  const saveQuestion = async () => {
    if (!selectedQuiz) {
      alert("Please select a quiz first.");
      return;
    }

    for (let i = 0; i < quizQuestionsForm.length; i++) {
      const q = quizQuestionsForm[i];
      if (!q.questionText.trim()) {
        alert(
          `Please insert missing prompt text details for Question ${i + 1}`,
        );
        return;
      }
      if (!q.marks || Number(q.marks) <= 0) {
        alert(`Please enter valid marks for Question ${i + 1}`);
        return;
      }
      if (q.options.some((opt) => !opt.text.trim())) {
        alert(
          `Please complete blank option text values inside Question ${i + 1}`,
        );
        return;
      }
      if (!q.options.some((opt) => opt.isCorrect)) {
        alert(
          `Please declare at least one explicit correct choice answer box for Question ${i + 1}`,
        );
        return;
      }
    }

    setSavingQuestions(true);
    const payloadQuestions = quizQuestionsForm.map((q) => ({
      question: q.questionText,
      marks: Number(q.marks),
      options: q.options.map((opt) => ({
        text: opt.text,
        isCorrect: opt.isCorrect,
      })),
      explanation: q.explanation || "",
    }));

    try {
      await axios.post(
        `${API_BASE_URL}/programs/quizzes/${selectedQuiz?.id}/questions/`,
        {
          questions: payloadQuestions,
        },
      );

      setQuizQuestionsForm([
        {
          questionText: "",
          marks: 1,
          explanation: "",
          options: [
            { text: "", isCorrect: true },
            { text: "", isCorrect: false },
          ],
        },
      ]);
      setShowQuestionModal(false);
      await fetchProgram();
    } catch (error) {
      handleApiError(error);
    } finally {
      setSavingQuestions(false);
    }
  };

  // ============ QUIZ RESULTS ============
  const mapQuizResults = async (quizId) => {
    setLoadingResults(true);

    try {
      const response = await axios.get(
        `${API_BASE_URL}/programs/quizzes/${quizId}/results`,
      );

      setQuizResults(response.data);
      setShowResultModal(true);
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoadingResults(false);
    }
  };

  // ============ MODULE REORDER ============
  const handleModuleDragEnd = async (event) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = modules.findIndex(
      (module) => module.id === Number(active.id),
    );
    const newIndex = modules.findIndex(
      (module) => module.id === Number(over.id),
    );

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    const reorderedModules = arrayMove(modules, oldIndex, newIndex);

    setModules(reorderedModules);

    const payload = {
      modules: reorderedModules.map((module, index) => ({
        id: Number(module.id),
        module_order: index + 1,
      })),
    };

    try {
      await axios.put(
        `${API_BASE_URL}/programs/${programId}/modules/reorder`,
        payload,
      );
    } catch (error) {
      console.error("MODULE REORDER ERROR:", error.response?.data || error);

      alert(JSON.stringify(error.response?.data || error.message, null, 2));

      fetchProgram();
    }
  };

  // ============ FILE TYPE TOGGLE ============
  const handleFileTypeToggle = (type) => {
    if (allowedFileTypes.includes(type)) {
      setAllowedFileTypes(allowedFileTypes.filter((t) => t !== type));
    } else {
      setAllowedFileTypes([...allowedFileTypes, type]);
    }
  };

  // ============ MEMOIZED VALUES ============
  const validationCards = useMemo(
    () => [
      {
        title: "Retention Quiz",
        description: "Configure retention quiz questions",
        count: Array.isArray(retentionQuiz?.questions)
          ? retentionQuiz.questions.length
          : 0,
        onClick: openRetentionQuizModal,
      },
      {
        title: "Application Check 1",
        description: "Manage first application milestone",
        count: Array.isArray(applicationCheck1?.questions)
          ? applicationCheck1.questions.length
          : 0,
        onClick: () => openApplicationCheckModal(1),
      },
      {
        title: "Application Check 2",
        description: "Manage second application milestone",
        count: Array.isArray(applicationCheck2?.questions)
          ? applicationCheck2.questions.length
          : 0,
        onClick: () => openApplicationCheckModal(2),
      },
      {
        title: "Application Check 3",
        description: "Manage third application milestone",
        count: Array.isArray(applicationCheck3?.questions)
          ? applicationCheck3.questions.length
          : 0,
        onClick: () => openApplicationCheckModal(3),
      },
    ],
    [retentionQuiz, applicationCheck1, applicationCheck2, applicationCheck3],
  );

  // ============ RENDER ============
  if (loading) {
    return (
      <MainLayout dark>
        <div className="flex h-[50vh] items-center justify-center font-bold text-slate-400 text-sm tracking-wider uppercase">
          Loading Program...
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout dark>
      <div className="-m-4 sm:-m-6 p-5 sm:p-7 min-h-[calc(100vh-4rem)] bg-[#04050A] prog-page-calm-bg text-slate-100 font-sans space-y-6 overflow-x-hidden relative selection:bg-purple-500 selection:text-white">
        <style>{`
          @keyframes ultraCalmProgDrift {
            0%   { background-position: 0% 50%; }
            50%  { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          @keyframes calmProgOrbA {
            0%   { transform: translate3d(-6%, -4%, 0) scale(1); opacity: 0.16; }
            50%  { transform: translate3d(14%, 8%, 0) scale(1.08); opacity: 0.24; }
            100% { transform: translate3d(-6%, -4%, 0) scale(1); opacity: 0.16; }
          }
          @keyframes calmProgOrbB {
            0%   { transform: translate3d(8%, 10%, 0) scale(1.06); opacity: 0.14; }
            50%  { transform: translate3d(-10%, -6%, 0) scale(0.96); opacity: 0.22; }
            100% { transform: translate3d(8%, 10%, 0) scale(1.06); opacity: 0.14; }
          }

          .prog-page-calm-bg {
            position: relative;
            isolation: isolate;
            background: linear-gradient(
              135deg,
              #04050A 0%,
              #080714 34%,
              #050B14 67%,
              #0A0612 100%
            );
            background-size: 260% 260%;
            animation: ultraCalmProgDrift 26s ease-in-out infinite;
          }

          .prog-calm-orb-a {
            position: fixed;
            width: 580px;
            height: 580px;
            top: -6%;
            left: 5%;
            pointer-events: none;
            z-index: 0;
            background: radial-gradient(
              circle,
              rgba(168, 85, 247, 0.32) 0%,
              rgba(56, 189, 248, 0.14) 45%,
              transparent 72%
            );
            filter: blur(96px);
            animation: calmProgOrbA 28s ease-in-out infinite;
          }

          .prog-calm-orb-b {
            position: fixed;
            width: 540px;
            height: 540px;
            bottom: -8%;
            right: 4%;
            pointer-events: none;
            z-index: 0;
            background: radial-gradient(
              circle,
              rgba(16, 185, 129, 0.24) 0%,
              rgba(217, 70, 239, 0.14) 45%,
              transparent 72%
            );
            filter: blur(98px);
            animation: calmProgOrbB 32s ease-in-out infinite;
          }
        `}</style>

        {/* Ambient Roaming Background Orbs */}
        <div className="prog-calm-orb-a" />
        <div className="prog-calm-orb-b" />

        {/* Header */}
        <div className="rounded-3xl p-6 sm:p-7 bg-[#060414] border-[2.5px] border-[#B026FF] shadow-[0_0_36px_rgba(176,38,255,0.45),inset_0_0_24px_rgba(176,38,255,0.14)] relative z-10 flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <button
              type="button"
              onClick={() => navigate("/programs")}
              className="w-12 h-12 rounded-2xl bg-[#02050E] border-2 border-[#00F5FF] text-[#00F5FF] hover:bg-[#00F5FF] hover:text-slate-950 flex items-center justify-center transition cursor-pointer shrink-0 shadow-[0_0_18px_rgba(0,245,255,0.4)] mt-0.5"
              title="Back to Programs"
            >
              <BookOpen size={18} className="stroke-[2.5]" />
            </button>

            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.22em] text-[#C084FC] block drop-shadow-[0_0_8px_rgba(192,132,252,0.6)]">
                PROGRAM CURRICULUM
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-0.5 drop-shadow-[0_2px_12px_rgba(255,255,255,0.2)]">
                {programData?.name || "Program Details"}
              </h1>

              <p className="mt-1 text-xs sm:text-sm text-slate-300 font-semibold max-w-3xl leading-relaxed">
                {programData?.description || "No description available."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {programData?.status === "Draft" && (
              <span className="rounded-full bg-amber-950/90 text-amber-300 border-2 border-amber-400 px-3.5 py-1.5 text-xs font-black uppercase tracking-wider shadow-md">
                Draft
              </span>
            )}

            {programData?.status === "Published" && (
              <span className="rounded-full bg-emerald-950/90 text-emerald-300 border-2 border-emerald-400 px-3.5 py-1.5 text-xs font-black uppercase tracking-wider shadow-md">
                Published
              </span>
            )}

            {programData?.status === "Draft" && (
              <button
                type="button"
                onClick={handlePublishProgram}
                disabled={isPublishing}
                className="rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 px-5 py-3 text-sm font-bold text-white shadow-[0_4px_16px_rgba(16,185,129,0.4)] border border-emerald-400/40 disabled:cursor-not-allowed disabled:opacity-50 transition-all flex items-center gap-2 cursor-pointer"
              >
                {isPublishing ? (
                  <>
                    <RefreshCw className="animate-spin" size={16} />
                    Publishing...
                  </>
                ) : (
                  <>
                    <UploadCloud size={16} />
                    Publish Program
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Main Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
          {/* Left Sidebar */}
          <div className="lg:col-span-4 rounded-3xl bg-[#080C1A] p-5 sm:p-6 border-[2.5px] border-[#00F5FF] shadow-[0_0_32px_rgba(0,245,255,0.35),inset_0_0_20px_rgba(0,245,255,0.08)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-black text-white">Modules</h3>
                <span className="text-xs font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-400/50 px-3 py-1 rounded-full shadow-sm">
                  {modules.length} Modules
                </span>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  addModule();
                }}
                disabled={savingModule}
                className="mb-5 w-full rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 py-3.5 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_4px_16px_rgba(16,185,129,0.35)] hover:shadow-[0_4px_20px_rgba(16,185,129,0.5)] border border-emerald-400/40 flex items-center justify-center gap-2 cursor-pointer text-sm"
              >
                {savingModule ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    Adding Module...
                  </>
                ) : (
                  <>
                    <Plus size={18} className="stroke-[2.5]" />
                    Add Module
                  </>
                )}
              </button>

              <div className="space-y-2.5 overflow-y-auto max-h-[60vh] lg:max-h-[65vh] pr-1 custom-scrollbar">
                {modules.length === 0 ? (
                  <div className="text-center py-8 px-4 bg-slate-900/40 border border-slate-700/50 rounded-2xl">
                    <div className="w-14 h-14 bg-slate-800/80 border border-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-3 text-slate-400">
                      <Layers size={24} />
                    </div>
                    <p className="text-sm text-slate-300 font-bold">
                      No modules yet
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Create your first module to get started
                    </p>
                  </div>
                ) : (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleModuleDragEnd}
                  >
                    <SortableContext
                      items={modules.map((module) => module.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {modules.map((module, index) => (
                        <SortableModuleItem
                          key={module.id}
                          module={module}
                          index={index}
                          selectedModule={selectedModule}
                          onDelete={deleteModule}
                          onSelect={(module) => {
                            setSelectedModule(module);
                            selectedModuleRef.current = module;
                            setEditModuleTitle(module.title);
                            setEditModuleDescription(module.description || "");
                            setEditModuleCuros(module.curos || 0);
                            setHasUnsavedChanges(false);
                            setSelectedContent(null);
                            setViewingNote(null);
                          }}
                        >
                          <div className="ml-4 mt-2 space-y-2 pl-3 border-l-2 border-[#D946EF]/50">
                            {/* Videos */}
                            {module.videos?.map((video) => (
                              <div
                                key={video.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPlayingVideo(video);
                                  setSelectedContent({
                                    type: "video",
                                    data: video,
                                  });
                                  setViewingNote(null);
                                }}
                                className="cursor-pointer flex items-center gap-2.5 rounded-xl bg-[#0A0E1F] p-2.5 hover:bg-[#141B38] border border-slate-700/80 hover:border-purple-400/80 transition-all group shadow-sm"
                              >
                                {video.thumbnail_url ? (
                                  <img
                                    src={video.thumbnail_url}
                                    alt=""
                                    className="h-10 w-16 rounded-lg object-cover"
                                  />
                                ) : (
                                  <div className="h-10 w-16 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400">
                                    <PlayCircle size={20} />
                                  </div>
                                )}

                                <div className="flex-1 min-w-0">
                                  <p className="font-bold text-sm truncate text-white group-hover:text-purple-300">
                                    {video.title}
                                  </p>
                                  <p className="text-xs text-slate-400">
                                    Video Lesson
                                  </p>
                                </div>
                              </div>
                            ))}

                            {/* Written Lessons */}
                            {module.written_lessons?.map((lesson) => (
                              <div
                                key={lesson.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedContent({
                                    type: "writtenLesson",
                                    data: lesson,
                                  });
                                  setViewingNote(null);
                                }}
                                className="cursor-pointer flex items-center gap-2.5 rounded-xl bg-[#0A0E1F] p-2.5 hover:bg-[#141B38] border border-slate-700/80 hover:border-purple-400/80 transition-all group shadow-sm"
                              >
                                <div className="h-10 w-10 rounded-lg bg-blue-950/80 border border-blue-500/40 flex items-center justify-center shrink-0">
                                  <BookOpen className="text-blue-400" size={18} />
                                </div>

                                <div className="flex-1 min-w-0">
                                  <p className="font-bold text-sm truncate text-white group-hover:text-purple-300">
                                    {lesson.title}
                                  </p>
                                  <p className="text-xs text-slate-400">
                                    Written Lesson
                                  </p>
                                </div>
                              </div>
                            ))}

                            {/* Quizzes */}
                            {module.quizzes?.map((quiz) => (
                              <div
                                key={quiz.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedContent({
                                    type: "quiz",
                                    data: quiz,
                                  });
                                  setViewingNote(null);
                                }}
                                className="cursor-pointer flex items-center gap-2.5 rounded-xl bg-[#0A0E1F] p-2.5 hover:bg-[#141B38] border border-slate-700/80 hover:border-purple-400/80 transition-all group shadow-sm"
                              >
                                <div className="h-10 w-10 rounded-lg bg-purple-950/80 border border-purple-500/40 flex items-center justify-center shrink-0">
                                  <ClipboardCheck
                                    className="text-purple-400"
                                    size={18}
                                  />
                                </div>

                                <div className="flex-1 min-w-0">
                                  <p className="font-bold text-sm truncate text-white group-hover:text-purple-300">
                                    {quiz.title}
                                  </p>
                                  <p className="text-xs text-slate-400">
                                    Quiz Assessment
                                  </p>
                                </div>
                              </div>
                            ))}

                            {/* Surveys */}
                            {module.surveys?.map((survey) => (
                              <div
                                key={survey.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedContent({
                                    type: "survey",
                                    data: survey,
                                  });

                                  const formattedQuestions = (
                                    survey.questions || []
                                  ).map((q) => ({
                                    question: q.question || q.question_text || "",
                                    type: q.question_type || "Multiple Choice",
                                    required: q.is_required || false,
                                    options: (q.options || []).map(
                                      (o) => o.option_text || o,
                                    ),
                                  }));

                                  setSurveyQuestions(formattedQuestions);
                                  setViewingNote(null);
                                }}
                                className="cursor-pointer flex items-center gap-2.5 rounded-xl bg-[#0A0E1F] p-2.5 hover:bg-[#141B38] border border-slate-700/80 hover:border-purple-400/80 transition-all group shadow-sm"
                              >
                                <div className="h-10 w-10 rounded-lg bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center shrink-0">
                                  <FileQuestion
                                    className="text-emerald-400"
                                    size={18}
                                  />
                                </div>

                                <div className="flex-1 min-w-0">
                                  <p className="font-bold text-sm truncate text-white group-hover:text-purple-300">
                                    {survey.title}
                                  </p>
                                  <p className="text-xs text-slate-400">
                                    Survey Block
                                  </p>
                                </div>
                              </div>
                            ))}

                            {/* Assignments */}
                            {module.assignments?.map((assignment) => (
                              <div
                                key={assignment.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedContent({
                                    type: "assignment",
                                    data: assignment,
                                  });
                                  setViewingNote(null);
                                }}
                                className="cursor-pointer flex items-center gap-2.5 rounded-xl bg-[#0A0E1F] p-2.5 hover:bg-[#141B38] border border-slate-700/80 hover:border-purple-400/80 transition-all group shadow-sm"
                              >
                                <div className="h-10 w-10 rounded-lg bg-amber-950/80 border border-amber-500/40 flex items-center justify-center shrink-0">
                                  <ClipboardCheck
                                    className="text-amber-400"
                                    size={18}
                                  />
                                </div>

                                <div className="flex-1 min-w-0">
                                  <p className="font-bold text-sm truncate text-white group-hover:text-purple-300">
                                    {assignment.title}
                                  </p>
                                  <p className="text-xs text-slate-400">
                                    Assignment
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </SortableModuleItem>
                      ))}
                    </SortableContext>
                  </DndContext>
                )}
              </div>
            </div>

            {/* Program Validation Cards */}
            <div className="mt-5 rounded-2xl border-2 border-slate-700/80 bg-[#050814] p-4">
              <div className="mb-4 flex items-center gap-2.5">
                <div className="rounded-xl bg-purple-900/30 border border-purple-500/40 p-2 text-purple-300 shadow-sm">
                  <Settings size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">
                    Program Validation
                  </h3>
                  <p className="text-xs text-slate-400">
                    Program-level configuration cards
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {validationCards.map((card) => (
                  <div
                    key={card.title}
                    className="rounded-xl border border-slate-700/80 bg-[#0A0E1F] p-3.5 shadow-sm hover:border-[#00F5FF]/60 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-bold text-white">
                          {card.title}
                        </h4>
                        <p className="mt-1 text-xs text-slate-400 leading-snug">
                          {card.description}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={card.onClick}
                        className="rounded-xl border border-purple-400/50 bg-purple-600/30 px-3 py-1.5 text-xs font-bold text-purple-200 transition hover:bg-purple-600/50 cursor-pointer shrink-0 shadow-sm"
                      >
                        Create/Edit
                      </button>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-xs font-medium text-slate-400 pt-2 border-t border-slate-800">
                      <span>Questions Saved: {card.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Retention Quiz Modal */}
          {showRetentionQuizModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md">
              <div className="w-[920px] max-w-[95vw] rounded-3xl bg-[#080C1A] p-6 sm:p-8 shadow-[0_0_50px_rgba(176,38,255,0.4)] max-h-[90vh] overflow-y-auto border-2 border-[#B026FF] text-white custom-scrollbar">
                <div className="flex items-start justify-between gap-4 mb-4 pb-4 border-b border-slate-800">
                  <div>
                    <h2 className="text-2xl font-black text-white tracking-tight">
                      {retentionQuizTitle}
                    </h2>
                    <p className="text-sm text-slate-400 mt-1">
                      {retentionQuizDescription}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowRetentionQuizModal(false)}
                    className="rounded-xl border border-slate-700 bg-slate-900/90 p-2 text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                <SurveyQuestionBuilder
                  title={retentionQuizTitle}
                  description={retentionQuizDescription}
                  onTitleChange={setRetentionQuizTitle}
                  onDescriptionChange={setRetentionQuizDescription}
                  questions={retentionQuizQuestions}
                  onQuestionsChange={setRetentionQuizQuestions}
                  onSave={handleSaveRetentionQuiz}
                  onCancel={() => setShowRetentionQuizModal(false)}
                  heading="Retention Quiz"
                  subtitle="Create and edit questions for the retention quiz."
                  saveLabel="Save Retention Quiz"
                  defaultQuestionType="Multiple Choice"
                  emptyStateTitle="This retention quiz currently contains zero questions."
                  emptyStateButton="Add First Question"
                  saving={savingValidation}
                  dark={true}
                />
              </div>
            </div>
          )}

          {/* Application Check Modal */}
          {showApplicationCheckModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md">
              <div className="w-[920px] max-w-[95vw] rounded-3xl bg-[#080C1A] p-6 sm:p-8 shadow-[0_0_50px_rgba(0,245,255,0.4)] max-h-[90vh] overflow-y-auto border-2 border-[#00F5FF] text-white custom-scrollbar">
                <div className="flex items-start justify-between gap-4 mb-4 pb-4 border-b border-slate-800">
                  <div>
                    <h2 className="text-2xl font-black text-white tracking-tight">
                      {applicationCheckTitle}
                    </h2>
                    <p className="text-sm text-slate-400 mt-1">
                      {applicationCheckDescription}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowApplicationCheckModal(false);
                      setActiveApplicationCheckKey(null);
                    }}
                    className="rounded-xl border border-slate-700 bg-slate-900/90 p-2 text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                <SurveyQuestionBuilder
                  title={applicationCheckTitle}
                  description={applicationCheckDescription}
                  onTitleChange={setApplicationCheckTitle}
                  onDescriptionChange={setApplicationCheckDescription}
                  questions={applicationCheckQuestions}
                  onQuestionsChange={setApplicationCheckQuestions}
                  onSave={handleSaveApplicationCheck}
                  onCancel={() => {
                    setShowApplicationCheckModal(false);
                    setActiveApplicationCheckKey(null);
                  }}
                  heading={applicationCheckTitle}
                  subtitle="Create and edit questions for this application check."
                  saveLabel="Save Application Check"
                  emptyStateTitle="This application check currently contains zero questions."
                  emptyStateButton="Add First Question"
                  isAppCheck={true}
                  saving={savingValidation}
                  dark={true}
                />
              </div>
            </div>
          )}

          {/* Right Content Area - NOTICEABLE 2.5px GOLD BORDER ON OPAQUE DEEP VOID */}
          <div
            className="lg:col-span-8 rounded-3xl bg-[#080C1A] p-6 sm:p-7 border-[2.5px] border-[#FFE600] shadow-[0_0_36px_rgba(255,230,0,0.35),inset_0_0_20px_rgba(255,230,0,0.08)] relative z-10 text-white"
            onMouseDown={(e) => {
              // Prevent click from bubbling up to sidebar
              e.stopPropagation();
            }}
          >
            {selectedContent ? (
              <div className="mb-6 rounded-2xl border-2 border-slate-700/80 bg-[#050814] p-6 text-white shadow-inner">
                <button
                  onClick={() => {
                    setSelectedContent(null);
                    setViewingNote(null);
                  }}
                  className="mb-4 rounded-xl border-2 border-slate-700 bg-slate-900/90 px-4 py-2 text-sm font-bold hover:bg-slate-800 hover:border-purple-400 text-purple-300 transition flex items-center gap-2 cursor-pointer shadow-sm"
                >
                  &larr; Back To Module Overview
                </button>

                {/* Video Content */}
                {selectedContent.type === "video" && (
                  <>
                    <h2 className="mb-4 text-2xl font-black text-white">
                      🎥 {selectedContent?.data?.title}
                    </h2>

                    {viewingNote ? (
                      <div className="mb-6 rounded-2xl border-2 border-purple-500/40 p-4 bg-[#0A0E1F] relative shadow-lg">
                        <div className="flex justify-between items-center mb-2">
                          <p className="text-sm font-bold text-slate-200">
                            📄 Viewing File:{" "}
                            <span className="text-purple-300">
                              {viewingNote.title}
                            </span>
                          </p>
                          <button
                            onClick={() => setViewingNote(null)}
                            className="bg-rose-600 hover:bg-rose-500 text-white rounded-lg px-3 py-1 text-xs font-bold transition cursor-pointer"
                          >
                            Close Document Viewer
                          </button>
                        </div>
                        <iframe
                          src={viewingNote.file_url}
                          width="100%"
                          height="550px"
                          title="Portal Inline PDF Engine"
                          className="rounded-xl border border-slate-700 bg-[#0A0E1F] shadow-inner"
                        />
                        {viewingNote.description && (
                          <p className="mt-2 text-xs text-slate-400 bg-[#050814] p-2.5 rounded-lg border border-slate-800 italic">
                            Info: {viewingNote.description}
                          </p>
                        )}
                      </div>
                    ) : (
                      <iframe
                        width="100%"
                        height="450"
                        src={`https://www.youtube.com/embed/${extractYoutubeId(selectedContent?.data?.youtube_url)}`}
                        title="Video Content Panel"
                        allowFullScreen
                        className="rounded-xl shadow-lg border border-slate-800"
                      />
                    )}

                    <p className="mt-4 text-slate-300 font-bold">
                      Description:
                    </p>
                    <p className="text-slate-400 text-sm leading-relaxed mt-1">
                      {selectedContent?.data?.description ||
                        "No short description provided."}
                    </p>

                    {selectedContent?.data?.explanation_text && (
                      <div className="mt-4 p-4 rounded-xl bg-purple-950/40 border border-purple-500/40 text-purple-200 shadow-sm">
                        <h4 className="text-sm font-bold text-purple-300 mb-1">
                          Lesson Explanation Notes:
                        </h4>
                        <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                          {selectedContent?.data?.explanation_text}
                        </p>
                      </div>
                    )}

                    <div className="mt-6 border-t border-slate-800 pt-4">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="text-md font-bold text-white">
                          Attached Lecture Documents & PDF Notes
                        </h4>
                        <button
                          onClick={() => {
                            setNoteTargetItem({
                              id: selectedContent?.data?.id,
                              type: "video",
                            });
                            setShowNotesModal(true);
                          }}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-md cursor-pointer transition"
                        >
                          + Add Note Material
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {selectedContent?.data?.documents &&
                        selectedContent?.data?.documents.length > 0 ? (
                          selectedContent?.data?.documents.map((n) => (
                            <div
                              key={n.id}
                              className="p-3.5 border border-slate-700/80 rounded-xl bg-[#0A0E1F] flex flex-col justify-between shadow-sm relative hover:border-purple-500/50 transition"
                            >
                              <button
                                onClick={() => deleteDocument(n.id)}
                                className="absolute top-2 right-2 text-slate-400 hover:text-rose-400 p-1 rounded-lg transition"
                                title="Delete Document"
                              >
                                <Trash2 size={14} />
                              </button>
                              <div className="pr-6">
                                <span className="text-sm font-bold text-white block">
                                  📚 {n.title}
                                </span>
                                {n.description && (
                                  <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">
                                    {n.description}
                                  </p>
                                )}
                              </div>
                              <div className="flex gap-2 mt-3 pt-2 border-t border-slate-800">
                                <button
                                  onClick={() => setViewingNote(n)}
                                  className="text-xs flex-1 bg-purple-600 hover:bg-purple-500 text-white py-1.5 rounded-lg font-bold text-center transition cursor-pointer shadow-sm"
                                >
                                  View on Portal
                                </button>
                                <a
                                  href={n.file_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-xs flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 py-1.5 rounded-lg font-bold text-center border border-slate-700 transition"
                                >
                                  Open Link &rarr;
                                </a>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-slate-500 italic col-span-2">
                            No document sheets attached to this lesson block.
                          </p>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* Written Lesson Content */}
                {selectedContent.type === "writtenLesson" && (
                  <div className="space-y-4">
                    {viewingNote ? (
                      <div className="mb-6 rounded-2xl border-2 border-purple-500/40 p-4 bg-[#0A0E1F] shadow-lg">
                        <div className="flex justify-between mb-3">
                          <p className="font-bold text-white">📄 {viewingNote.title}</p>
                          <button
                            onClick={() => setViewingNote(null)}
                            className="bg-rose-600 hover:bg-rose-500 text-white px-3 py-1 rounded-lg font-bold text-xs transition"
                          >
                            Close Viewer
                          </button>
                        </div>
                        <iframe
                          src={viewingNote.file_url}
                          width="100%"
                          height="650"
                          title="Written Lesson Document View"
                          className="rounded-xl border border-slate-700 bg-[#0A0E1F]"
                        />
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                          <h2 className="text-2xl font-black text-white">
                            📖 {selectedContent?.data?.title}
                          </h2>
                          {selectedContent?.data?.pdf_url && (
                            <div className="flex gap-2">
                              <button
                                onClick={() =>
                                  setViewingNote({
                                    title: selectedContent.data.title,
                                    file_url: selectedContent.data.pdf_url,
                                    description: "",
                                  })
                                }
                                className="text-xs bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-xl font-bold text-center transition cursor-pointer shadow-sm"
                              >
                                View on Portal
                              </button>
                              <button
                                onClick={() =>
                                  window.open(
                                    selectedContent.data.pdf_url,
                                    "_blank",
                                    "noopener,noreferrer",
                                  )
                                }
                                className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-xl font-bold text-center border border-slate-700 transition cursor-pointer"
                              >
                                Open PDF Link
                              </button>
                            </div>
                          )}
                        </div>
                        <div className="p-5 bg-[#050814] border-2 border-slate-700/80 rounded-2xl text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">
                          {selectedContent?.data?.content}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Quiz Content */}
                {selectedContent.type === "quiz" && (
                  <>
                    <div className="flex justify-between items-start border-b border-slate-800 pb-4">
                      <div>
                        <h2 className="text-2xl font-black text-white">
                          ❓ {selectedContent?.data?.title}
                        </h2>

                        <p className="mt-1 text-sm text-slate-400">
                          {selectedContent?.data?.description ||
                            "No description loaded."}
                        </p>

                        <div className="mt-3 inline-flex items-center gap-2 rounded-xl bg-emerald-950/80 border border-emerald-500/50 px-3 py-2 text-emerald-300 font-bold text-sm shadow-sm">
                          <span>Passing Percentage:</span>
                          <span className="text-emerald-200">
                            {selectedContent?.data?.passing_percentage ?? 0}%
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            mapQuizResults(selectedContent.data.id)
                          }
                          className="rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-white font-bold text-sm shadow-md transition cursor-pointer"
                        >
                          View Results
                        </button>

                        <button
                          onClick={() => {
                            setSelectedQuiz(selectedContent.data);
                            setShowQuestionModal(true);
                          }}
                          className="rounded-xl bg-purple-600 hover:bg-purple-500 px-4 py-2 text-white font-bold text-sm shadow-md transition cursor-pointer"
                        >
                          + Add/Edit Questions Form
                        </button>
                      </div>
                    </div>
                    <div className="mt-6 space-y-4">
                      <h3 className="text-lg font-bold text-white">
                        Saved Evaluation Questions
                      </h3>
                      {selectedContent?.data?.questions &&
                      selectedContent?.data?.questions.length > 0 ? (
                        selectedContent?.data?.questions.map((q, index) => (
                          <div
                            key={q.id || index}
                            className="rounded-xl border-2 border-slate-700/80 p-5 bg-[#0A0E1F] shadow-sm space-y-3"
                          >
                            <div className="flex items-center justify-between">
                              <h4 className="font-bold text-white">
                                Q{index + 1}. {q.question}
                              </h4>

                              <span className="bg-purple-950/80 text-purple-300 border border-purple-500/40 px-3 py-1 rounded-lg text-sm font-bold">
                                {q.marks} Marks
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-sm text-slate-300">
                              {q.options?.map((opt, oIdx) => (
                                <p
                                  key={oIdx}
                                  className={`p-2.5 rounded-xl border ${
                                    opt.isCorrect
                                      ? "border-emerald-500 bg-emerald-950/60 text-emerald-200 font-bold shadow-sm"
                                      : "border-slate-700 bg-[#050814] text-slate-300"
                                  }`}
                                >
                                  <strong className="text-white">Option {oIdx + 1}:</strong> {opt.text}
                                </p>
                              ))}
                            </div>
                            <div className="bg-amber-950/40 border border-amber-500/40 rounded-xl p-3.5 text-xs text-amber-200">
                              <span className="font-bold">
                                Explanation Note:
                              </span>
                              <p className="mt-1 whitespace-pre-wrap italic text-amber-300">
                                {q.explanation ||
                                  "No explanation text added for this question block."}
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-500 italic">
                          No evaluation questions have been added to this quiz
                          configurations pool yet.
                        </p>
                      )}
                    </div>
                  </>
                )}

                {/* Survey Content */}
                {selectedContent.type === "survey" && (
                  <div className="space-y-6">
                    <SurveyQuestionBuilder
                      title={selectedContent.data.title || ""}
                      description={selectedContent.data.description || ""}
                      onTitleChange={(value) => {
                        setSelectedContent({
                          ...selectedContent,
                          data: {
                            ...selectedContent.data,
                            title: value,
                          },
                        });
                      }}
                      onDescriptionChange={(value) => {
                        setSelectedContent({
                          ...selectedContent,
                          data: {
                            ...selectedContent.data,
                            description: value,
                          },
                        });
                      }}
                      questions={surveyQuestions}
                      onQuestionsChange={setSurveyQuestions}
                      onSave={commitLiveSurveyToModulePool}
                      onCancel={() => setSelectedContent(null)}
                      saving={savingSurvey}
                      heading="Survey Builder"
                      subtitle="Create and edit survey questions for this module."
                      saveLabel="Save Survey"
                      emptyStateTitle="This survey template currently contains zero question nodes."
                      emptyStateButton="Populate First Form Field Node"
                      showHeader={true}
                      showFooterActions={false}
                      dark={true}
                      headerActions={
                        <div className="flex flex-wrap gap-2 shrink-0">
                          <button
                            onClick={commitLiveSurveyToModulePool}
                            disabled={savingSurvey}
                            className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 px-4 py-2 text-white text-xs font-bold shadow-sm transition disabled:opacity-50 cursor-pointer"
                          >
                            {savingSurvey ? "Saving..." : "Save Survey"}
                          </button>

                          <button
                            onClick={() =>
                              inlineDeleteSurveyItem(selectedContent.data.id)
                            }
                            className="rounded-xl border border-rose-500/50 bg-rose-950/40 text-rose-300 hover:bg-rose-900/60 p-2 text-xs font-semibold transition cursor-pointer"
                            title="Delete Survey Form Configuration"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      }
                    />
                  </div>
                )}

                {/* Assignment Content */}
                {selectedContent.type === "assignment" && (
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-800 pb-5 gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-amber-950/80 flex items-center justify-center text-amber-400 border border-amber-500/40 shadow-sm">
                          <ClipboardCheck size={24} />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-amber-300 uppercase tracking-widest bg-amber-950/80 border border-amber-500/50 rounded-full px-2.5 py-0.5">
                            Saarthi Assignment
                          </span>
                          <h2 className="text-2xl font-black text-white mt-1">
                            {selectedContent?.data?.title}
                          </h2>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button
                          onClick={() =>
                            handleEditAssignmentClick(selectedContent.data)
                          }
                          className="flex-1 sm:flex-none px-4 py-2 border border-slate-700 rounded-xl font-bold text-sm text-slate-200 bg-slate-900 hover:bg-slate-800 transition flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Settings size={15} /> Edit
                        </button>
                        <button
                          onClick={() =>
                            deleteAssignment(selectedContent.data.id)
                          }
                          className="flex-1 sm:flex-none px-4 py-2 border border-transparent rounded-xl font-bold text-sm text-white bg-rose-600 hover:bg-rose-500 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                        >
                          <Trash2 size={15} /> Delete
                        </button>
                      </div>
                    </div>

                    {/* Quick Stats Grid Overview */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-[#0A0E1F] border border-slate-700/80 shadow-sm rounded-2xl p-4 flex flex-col justify-between">
                        <span className="text-xs font-bold text-slate-400 uppercase">
                          Max Score
                        </span>
                        <span className="text-xl font-black text-purple-300 mt-1">
                          {selectedContent?.data?.max_marks}{" "}
                          <span className="text-xs font-normal text-slate-500">
                            marks
                          </span>
                        </span>
                      </div>
                      <div className="bg-[#0A0E1F] border border-slate-700/80 shadow-sm rounded-2xl p-4 flex flex-col justify-between">
                        <span className="text-xs font-bold text-slate-400 uppercase">
                          Passing Bench
                        </span>
                        <span className="text-xl font-black text-emerald-400 mt-1">
                          {selectedContent?.data?.passing_marks}{" "}
                          <span className="text-xs font-normal text-slate-500">
                            marks
                          </span>
                        </span>
                      </div>
                      <div className="bg-[#0A0E1F] border border-slate-700/80 shadow-sm rounded-2xl p-4 flex flex-col justify-between">
                        <span className="text-xs font-bold text-slate-400 uppercase">
                          Format
                        </span>
                        <span className="text-sm font-bold text-cyan-300 mt-2 capitalize">
                          {selectedContent?.data?.submission_type === "file"
                            ? "📁 File Submission"
                            : selectedContent?.data?.submission_type === "text"
                              ? "📝 Text Answer"
                              : "💡 Hybrid Format"}
                        </span>
                      </div>
                      <div className="bg-[#0A0E1F] border border-slate-700/80 shadow-sm rounded-2xl p-4 flex flex-col justify-between">
                        <span className="text-xs font-bold text-slate-400 uppercase">
                          Target Due
                        </span>
                        <span className="text-xs font-bold text-amber-300 mt-2 flex items-center gap-1 truncate">
                          <Clock size={13} />{" "}
                          {selectedContent?.data?.deadline
                            ? new Date(
                                selectedContent.data.deadline,
                              ).toLocaleDateString()
                            : "No Limit"}
                        </span>
                      </div>
                    </div>

                    {/* Context Cards */}
                    <div className="space-y-4">
                      <div className="bg-[#0A0E1F] border border-slate-700/80 shadow-sm rounded-2xl p-5 space-y-2">
                        <h4 className="text-xs font-black text-amber-400/90 uppercase tracking-wider flex items-center gap-1.5">
                          <Info size={14} /> Assignment Summary
                        </h4>
                        <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                          {selectedContent?.data?.description ||
                            "No description summary context provided."}
                        </p>
                      </div>

                      <div className="bg-[#0A0E1F] border border-slate-700/80 shadow-sm rounded-2xl p-5 space-y-2">
                        <h4 className="text-xs font-black text-amber-400/90 uppercase tracking-wider flex items-center gap-1.5">
                          <BookOpen size={14} /> Detailed Instruction Deck
                        </h4>
                        <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                          {selectedContent?.data?.instructions ||
                            "No custom evaluation task workflows established yet."}
                        </p>
                      </div>

                      {/* Expanded Compliance Information Box */}
                      <div className="bg-[#050814] border border-slate-800 rounded-2xl p-5 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-400">
                        <div className="space-y-1.5">
                          <span className="font-bold text-white block">
                            System Rules Checklist
                          </span>
                          <p className="flex items-center gap-2">
                            {selectedContent?.data?.allow_multiple_files
                              ? "✅"
                              : "❌"}{" "}
                            Multiple File Upload Bundles Allowed
                          </p>
                          <p className="flex items-center gap-2">
                            {selectedContent?.data?.allow_late_submission
                              ? "✅"
                              : "❌"}{" "}
                            Late Grace Period Submissions Enabled
                          </p>
                        </div>
                        <div className="space-y-1.5">
                          <span className="font-bold text-white block">
                            Upload Constraints
                          </span>
                          <p>
                            • Maximum Allowed Package Payload Size:{" "}
                            <span className="font-bold text-purple-300">
                              {selectedContent?.data?.max_file_size || 50} MB
                            </span>
                          </p>
                          {selectedContent?.data?.allow_late_submission && (
                            <p className="text-amber-300 font-medium">
                              • Active Delay Reduction Deduction Penalty:{" "}
                              <span className="font-bold">
                                {selectedContent?.data?.late_penalty} Marks
                              </span>
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // No Content Selected - Show Module Editor with ENHANCED DARK INPUTS
              <>
                <div className="border-b border-slate-800 pb-5 mb-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-900 to-indigo-900 border border-purple-400/40 flex items-center justify-center shadow-lg shadow-purple-900/30">
                      <Layers className="text-white" size={24} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-white">
                        {selectedModule
                          ? selectedModule.title
                          : "No Module Selected"}
                      </h2>
                      <p className="text-sm text-slate-400">
                        Attach course items here
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-4" ref={editorContainerRef}>
                    <div className="relative">
                      <label className="text-xs font-bold text-amber-400/90 uppercase tracking-wider block mb-1.5">
                        Module Name
                      </label>
                      <input
                        value={editModuleTitle}
                        disabled={!selectedModule}
                        onChange={(e) => {
                          setEditModuleTitle(e.target.value);
                          setHasUnsavedChanges(true);
                        }}
                        className="w-full rounded-xl border-2 border-slate-700/80 p-4 bg-[#050814] font-semibold text-lg text-white outline-none focus:border-[#FFE600] focus:ring-4 focus:ring-[#FFE600]/15 transition-all placeholder-slate-500 disabled:bg-slate-900/60 disabled:text-slate-600 shadow-inner"
                        placeholder="Enter module name..."
                      />
                      {hasUnsavedChanges && (
                        <span className="absolute right-3 top-9 text-xs font-bold text-amber-300 bg-amber-950/80 px-2.5 py-1 rounded-full border border-amber-500/50 shadow-sm">
                          Unsaved changes
                        </span>
                      )}
                    </div>

                    <div>
                      <label className="text-xs font-bold text-amber-400/90 uppercase tracking-wider block mb-1.5">
                        Module Description
                      </label>
                      <textarea
                        value={editModuleDescription}
                        disabled={!selectedModule}
                        onChange={(e) => {
                          setEditModuleDescription(e.target.value);
                          setHasUnsavedChanges(true);
                        }}
                        className="w-full rounded-xl border-2 border-slate-700/80 p-4 bg-[#050814] text-white outline-none focus:border-[#FFE600] focus:ring-4 focus:ring-[#FFE600]/15 transition-all resize-none placeholder-slate-500 disabled:bg-slate-900/60 disabled:text-slate-600 shadow-inner"
                        rows={3}
                        placeholder="Provide a general summary/description for this module..."
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-amber-400/90 uppercase tracking-wider block mb-1.5">
                        Module Completion Curos
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={editModuleCuros}
                        disabled={!selectedModule}
                        onChange={(e) => {
                          setEditModuleCuros(e.target.value);
                          setHasUnsavedChanges(true);
                        }}
                        className="w-full rounded-xl border-2 border-slate-700/80 p-4 bg-[#050814] font-semibold text-lg text-white outline-none focus:border-[#FFE600] focus:ring-4 focus:ring-[#FFE600]/15 transition-all placeholder-slate-500 disabled:bg-slate-900/60 disabled:text-slate-600 shadow-inner"
                        placeholder="Enter curos awarded for module completion"
                      />
                    </div>

                    {selectedModule && (
                      <div className="flex justify-end gap-3 pt-2">
                        <button
                          onClick={() => {
                            if (selectedModule) {
                              setEditModuleTitle(selectedModule.title);
                              setEditModuleDescription(
                                selectedModule.description || "",
                              );
                              setEditModuleCuros(selectedModule.curos || 0);
                              setHasUnsavedChanges(false);
                            }
                          }}
                          disabled={!hasUnsavedChanges || savingModule}
                          className="rounded-xl border-2 border-slate-700 bg-slate-900/80 px-5 py-2.5 text-slate-300 text-sm font-bold hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={updateModuleDetails}
                          disabled={savingModule}
                          className="rounded-xl bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-700 hover:from-purple-500 hover:to-indigo-600 px-6 py-2.5 text-white text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_0_20px_rgba(168,85,247,0.4)] border border-purple-400/40 flex items-center gap-2 cursor-pointer"
                        >
                          {savingModule ? (
                            <>
                              <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                              Saving...
                            </>
                          ) : (
                            <>
                              Save Changes
                              <CheckCircle size={16} />
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    <button
                      onClick={() => setShowContentTypes(!showContentTypes)}
                      className="mt-5 rounded-xl border-2 border-dashed border-[#10F5A0] px-5 py-4 text-[#10F5A0] bg-[#10F5A0]/10 hover:bg-[#10F5A0]/20 font-black text-sm w-full transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,245,160,0.2)] cursor-pointer group"
                    >
                      {showContentTypes && (
                        <>
                          <X size={18} />
                          Hide Content Menu
                        </>
                      )}
                      {!showContentTypes && (
                        <>
                          <Plus
                            size={18}
                            className="group-hover:rotate-90 transition-transform stroke-[2.5]"
                          />
                          Add Core Content Items To Module
                        </>
                      )}
                    </button>

                    {showContentTypes && (
                      <div className="mt-4 grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 bg-[#050814] p-5 rounded-2xl border-2 border-slate-800 shadow-inner">
                        <button
                          onClick={() => setShowVideoModal(true)}
                          className="group bg-[#0A0E1F] rounded-xl border-2 border-slate-700/80 p-4 shadow-sm hover:border-red-400 hover:bg-[#121936] transition-all text-left cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-red-950/80 border border-red-500/40 flex items-center justify-center group-hover:bg-red-900/60 transition-colors">
                              <PlayCircle className="text-red-400" size={20} />
                            </div>
                            <div>
                              <p className="font-bold text-sm text-white">
                                Video Lesson
                              </p>
                              <p className="text-xs text-slate-400">
                                YouTube content
                              </p>
                            </div>
                          </div>
                        </button>
                        <button
                          onClick={() => setShowWrittenLessonModal(true)}
                          className="group bg-[#0A0E1F] rounded-xl border-2 border-slate-700/80 p-4 shadow-sm hover:border-blue-400 hover:bg-[#121936] transition-all text-left cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-blue-950/80 border border-blue-500/40 flex items-center justify-center group-hover:bg-blue-900/60 transition-colors">
                              <BookOpen className="text-blue-400" size={20} />
                            </div>
                            <div>
                              <p className="font-bold text-sm text-white">
                                Written Lesson
                              </p>
                              <p className="text-xs text-slate-400">
                                Text & PDF content
                              </p>
                            </div>
                          </div>
                        </button>
                        <button
                          onClick={() => setShowQuizModal(true)}
                          className="group bg-[#0A0E1F] rounded-xl border-2 border-slate-700/80 p-4 shadow-sm hover:border-purple-400 hover:bg-[#121936] transition-all text-left cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-purple-950/80 border border-purple-500/40 flex items-center justify-center group-hover:bg-purple-900/60 transition-colors">
                              <ClipboardCheck
                                className="text-purple-400"
                                size={20}
                              />
                            </div>
                            <div>
                              <p className="font-bold text-sm text-white">
                                Quiz Assessment
                              </p>
                              <p className="text-xs text-slate-400">
                                MCQ evaluations
                              </p>
                            </div>
                          </div>
                        </button>
                        <button
                          onClick={() => setShowSurveyChoiceModal(true)}
                          className="group bg-[#0A0E1F] rounded-xl border-2 border-slate-700/80 p-4 shadow-sm hover:border-emerald-400 hover:bg-[#121936] transition-all text-left cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center group-hover:bg-emerald-900/60 transition-colors">
                              <FileQuestion
                                className="text-emerald-400"
                                size={20}
                              />
                            </div>
                            <div>
                              <p className="font-bold text-sm text-white">
                                Survey Block
                              </p>
                              <p className="text-xs text-slate-400">
                                Feedback forms
                              </p>
                            </div>
                          </div>
                        </button>
                        <button
                          onClick={() => {
                            resetAssignmentForm();
                            setShowAssignmentModal(true);
                          }}
                          className="group bg-[#0A0E1F] rounded-xl border-2 border-slate-700/80 p-4 shadow-sm hover:border-amber-400 hover:bg-[#121936] transition-all text-left sm:col-span-2 lg:col-span-1 cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-amber-950/80 border border-amber-500/40 flex items-center justify-center group-hover:bg-amber-900/60 transition-colors">
                              <ClipboardCheck
                                className="text-amber-400"
                                size={20}
                              />
                            </div>
                            <div>
                              <p className="font-bold text-sm text-white">
                                Assignment Deck
                              </p>
                              <p className="text-xs text-slate-400">
                                Task management
                              </p>
                            </div>
                          </div>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ============ MODALS ============ */}

      {/* Written Lesson Modal */}
      {showWrittenLessonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md">
          <div className="w-[650px] max-w-[95vw] rounded-3xl bg-[#080C1A] p-6 sm:p-7 shadow-[0_0_50px_rgba(176,38,255,0.35)] max-h-[90vh] overflow-y-auto border-2 border-[#B026FF] text-white custom-scrollbar">
            <h2 className="mb-4 text-2xl font-black text-white tracking-tight">
              Add Written Lesson
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Lesson Title *
                </label>
                <input
                  value={writtenLessonTitle}
                  onChange={(e) => setWrittenLessonTitle(e.target.value)}
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                  placeholder="E.g., Complete Object-Oriented Framework Overview"
                  className="w-full rounded-xl border-2 border-slate-700/80 p-3 text-sm bg-[#050814] text-white placeholder-slate-500 focus:border-purple-400 outline-none transition"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Lesson Markdown / Content Details *
                </label>
                <textarea
                  value={writtenLessonContent}
                  onChange={(e) => setWrittenLessonContent(e.target.value)}
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                  rows={8}
                  placeholder="Type or paste core written notes documentation text inside this sheet viewport..."
                  className="w-full rounded-xl border-2 border-slate-700/80 p-3 text-sm bg-[#050814] text-white placeholder-slate-500 focus:border-purple-400 outline-none transition resize-none"
                />
              </div>
              <div className="p-4 border-2 border-dashed border-purple-500/50 rounded-xl bg-[#0A0E1F] text-center">
                <label
                  className={`block ${uploadingNote ? "pointer-events-none opacity-60" : "cursor-pointer"}`}
                >
                  <span className="text-xs font-bold text-purple-300 block hover:underline">
                    {uploadingNote
                      ? "⏳ Uploading PDF..."
                      : "📂 Upload PDF from Device"}
                  </span>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleWrittenLessonFileChange}
                    className="hidden"
                    disabled={uploadingNote}
                  />
                </label>
                {writtenLessonFile && !uploadingNote && (
                  <p className="text-xs text-emerald-400 mt-2 font-bold bg-emerald-950/80 border border-emerald-500/50 rounded-lg p-1.5 inline-block truncate max-w-full">
                    &check; Uploaded: {writtenLessonFile.name}
                  </p>
                )}
              </div>
              <div className="relative flex py-2 items-center font-bold text-xs text-slate-500">
                <div className="flex-grow border-t border-slate-800"></div>
                <span className="flex-shrink mx-4 uppercase">OR</span>
                <div className="flex-grow border-t border-slate-800"></div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Hosted PDF URL (optional)
                </label>
                <input
                  value={writtenLessonPdfUrl}
                  onChange={(e) => setWrittenLessonPdfUrl(e.target.value)}
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                  placeholder="https://example.com/assets/handout.pdf"
                  className="w-full rounded-xl border-2 border-slate-700/80 p-3 text-sm bg-[#050814] text-white placeholder-slate-500 focus:border-purple-400 outline-none transition disabled:opacity-50"
                  disabled={!!writtenLessonFile || uploadingNote}
                />
              </div>
              <div className="flex justify-end gap-3 mt-4 pt-3 border-t border-slate-800">
                <button
                  onClick={() => {
                    setShowWrittenLessonModal(false);
                    setWrittenLessonTitle("");
                    setWrittenLessonContent("");
                    setWrittenLessonPdfUrl("");
                    setWrittenLessonFile(null);
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  disabled={savingWrittenLesson || uploadingNote}
                  className="rounded-xl border border-slate-700 bg-slate-900/90 text-slate-300 hover:bg-slate-800 px-4 py-2 text-sm font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={saveWrittenLesson}
                  onMouseDown={(e) => e.stopPropagation()}
                  disabled={savingWrittenLesson || uploadingNote}
                  className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 px-5 py-2 text-white text-sm font-bold shadow-md transition disabled:opacity-50 cursor-pointer"
                >
                  {savingWrittenLesson
                    ? "Saving Written Lesson..."
                    : "Save Written Lesson"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Video Modal */}
      {showVideoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md">
          <div className="w-[650px] max-w-[95vw] rounded-3xl bg-[#080C1A] p-6 sm:p-7 shadow-[0_0_50px_rgba(176,38,255,0.35)] max-h-[90vh] overflow-y-auto border-2 border-[#B026FF] text-white custom-scrollbar">
            <h2 className="mb-4 text-2xl font-black text-white tracking-tight">
              Add Video Lesson
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Video Title *
                </label>
                <input
                  value={lessonTitle}
                  onChange={(e) => setLessonTitle(e.target.value)}
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                  placeholder="Video Title"
                  className="w-full rounded-xl border-2 border-slate-700/80 p-3 text-sm bg-[#050814] text-white placeholder-slate-500 focus:border-purple-400 outline-none transition"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Brief Subtitle
                </label>
                <textarea
                  value={lessonDescription}
                  onChange={(e) => setLessonDescription(e.target.value)}
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                  rows={2}
                  placeholder="Brief Description Subtitle"
                  className="w-full rounded-xl border-2 border-slate-700/80 p-3 text-sm bg-[#050814] text-white placeholder-slate-500 focus:border-purple-400 outline-none transition resize-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Explanation Notes
                </label>
                <textarea
                  value={videoExplanation}
                  onChange={(e) => setVideoExplanation(e.target.value)}
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                  rows={4}
                  placeholder="Write long descriptions / explanation text sheet records for this video session..."
                  className="w-full rounded-xl border-2 border-slate-700/80 p-3 text-sm bg-[#050814] text-white placeholder-slate-500 focus:border-purple-400 outline-none transition resize-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  YouTube URL *
                </label>
                <input
                  value={youtubeLink}
                  onChange={(e) => setYoutubeLink(e.target.value)}
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full rounded-xl border-2 border-slate-700/80 p-3 text-sm bg-[#050814] text-white placeholder-slate-500 focus:border-purple-400 outline-none transition"
                />
              </div>
              <div className="flex justify-end gap-3 mt-4 pt-3 border-t border-slate-800">
                <button
                  onClick={() => setShowVideoModal(false)}
                  onMouseDown={(e) => e.stopPropagation()}
                  disabled={savingVideo}
                  className="rounded-xl border border-slate-700 bg-slate-900/90 text-slate-300 hover:bg-slate-800 px-4 py-2 text-sm font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={saveVideoLesson}
                  onMouseDown={(e) => e.stopPropagation()}
                  disabled={savingVideo}
                  className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 px-5 py-2 text-white text-sm font-bold shadow-md transition disabled:opacity-50 cursor-pointer"
                >
                  {savingVideo ? "Saving Video..." : "Save Video"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quiz Modal */}
      {showQuizModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 overflow-y-auto transition-all duration-300">
          <div className="w-full max-w-4xl bg-[#080C1A] rounded-3xl shadow-[0_0_50px_rgba(16,185,129,0.3)] flex flex-col max-h-[92vh] border-2 border-emerald-500 overflow-hidden transform scale-100 animate-fadeIn text-white">
            <div className="bg-[#0D1226] text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-950/80 flex items-center justify-center border border-emerald-500/40 text-emerald-400">
                  <ClipboardCheck size={22} />
                </div>
                <div>
                  <h2 className="text-xl font-black tracking-tight text-white">
                    Create New Assessment
                  </h2>
                  <p className="text-xs text-slate-400">
                    Set criteria, evaluations, and enterprise result layout
                    systems.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowQuizModal(false);
                  setQuizTitle("");
                  setQuizDescription("");
                  setPassingPercentage("");
                }}
                className="text-slate-400 hover:text-white p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[#050814]">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="md:col-span-2 space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
                      Quiz Assessment Title *
                    </label>
                    <input
                      value={quizTitle}
                      onChange={(e) => setQuizTitle(e.target.value)}
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => e.stopPropagation()}
                      placeholder="Example: Final Module Technical Benchmark"
                      className="w-full rounded-xl border-2 border-slate-700/80 p-3 text-sm outline-none focus:border-emerald-400 bg-[#0A0E1F] font-medium text-white transition placeholder-slate-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
                      Core Description Overview
                    </label>
                    <textarea
                      value={quizDescription}
                      onChange={(e) => setQuizDescription(e.target.value)}
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => e.stopPropagation()}
                      rows={3}
                      placeholder="Describe the assessment objectives, topics, and constraints..."
                      className="w-full rounded-xl border-2 border-slate-700/80 p-3 text-sm outline-none focus:border-emerald-400 bg-[#0A0E1F] text-slate-200 transition resize-none placeholder-slate-500"
                    />
                  </div>
                </div>

                <div className="bg-[#0A0E1F] rounded-2xl p-4 border border-slate-700/80 flex flex-col justify-between shadow-xs">
                  <div>
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
                      Passing Bench Criteria *
                    </label>
                    <div className="relative rounded-xl overflow-hidden shadow-2xs">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={passingPercentage}
                        onChange={(e) => setPassingPercentage(e.target.value)}
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                        placeholder="70"
                        className="w-full rounded-xl border-2 border-slate-700/80 p-3 pr-12 text-sm font-bold text-white bg-[#050814] outline-none focus:border-emerald-400 transition"
                      />
                      <span className="absolute right-4 top-3.5 text-slate-400 text-sm font-bold">
                        %
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 bg-emerald-950/60 border border-emerald-500/40 rounded-xl p-3 text-xs text-emerald-300 flex items-start gap-2">
                    <Award
                      className="text-emerald-400 shrink-0 mt-0.5"
                      size={15}
                    />
                    <p>
                      Candidates scoring below{" "}
                      <span className="font-bold text-white">
                        {passingPercentage || "0"}%
                      </span>{" "}
                      will be flagged with a non-passing evaluation status.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[#0D1226] border-t border-slate-800 px-6 py-4 flex items-center justify-end gap-3 shrink-0 shadow-lg">
              <button
                type="button"
                onClick={() => {
                  setShowQuizModal(false);
                  setQuizTitle("");
                  setQuizDescription("");
                  setPassingPercentage("");
                }}
                onMouseDown={(e) => e.stopPropagation()}
                disabled={savingQuiz}
                className="rounded-xl border border-slate-700 px-5 py-2.5 text-sm font-semibold text-slate-300 bg-slate-900/90 hover:bg-slate-800 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveQuiz}
                onMouseDown={(e) => e.stopPropagation()}
                disabled={savingQuiz}
                className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 px-6 py-2.5 text-white text-sm font-bold shadow-md shadow-emerald-500/20 active:scale-98 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {savingQuiz ? (
                  <>
                    <RefreshCw className="animate-spin" size={16} /> Creating
                    Sheet...
                  </>
                ) : (
                  <>
                    Initialize Quiz Pool <CheckCircle size={16} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quiz Questions Modal */}
      {showQuestionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md">
          <div className="w-[750px] max-w-[95vw] rounded-3xl bg-[#080C1A] p-6 shadow-[0_0_50px_rgba(16,185,129,0.3)] max-h-[90vh] overflow-y-auto border-2 border-emerald-500 text-white custom-scrollbar">
            <h2 className="mb-1 text-2xl font-black text-white tracking-tight">
              Construct Evaluation Questions
            </h2>
            <p className="text-xs text-slate-400 mb-4 font-medium">
              Dynamically append multiple quiz questions with fluid individual
              choose options templates.
            </p>
            <div className="space-y-6">
              {quizQuestionsForm.map((question, qIndex) => (
                <div
                  key={qIndex}
                  className="p-5 border-2 border-slate-700/80 bg-[#0A0E1F] rounded-2xl relative space-y-4 shadow-sm"
                >
                  {quizQuestionsForm.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeQuestionFromForm(qIndex)}
                      onMouseDown={(e) => e.stopPropagation()}
                      className="absolute top-4 right-4 text-slate-400 hover:text-rose-400 p-1.5 rounded-lg transition cursor-pointer"
                      title="Remove Question block"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-3">
                      <label className="text-xs font-bold text-slate-300 block mb-1">
                        Question {qIndex + 1} Prompt *
                      </label>

                      <textarea
                        value={question.questionText}
                        onChange={(e) =>
                          handleQuestionTextChange(
                            qIndex,
                            "questionText",
                            e.target.value,
                          )
                        }
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                        placeholder="Type your main question text here..."
                        rows={2}
                        className="w-full rounded-xl border border-slate-700 p-3 text-sm bg-[#050814] text-white outline-none focus:border-emerald-400"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1">
                        Marks *
                      </label>

                      <input
                        type="number"
                        min="1"
                        value={question.marks}
                        onChange={(e) =>
                          handleQuestionTextChange(
                            qIndex,
                            "marks",
                            e.target.value,
                          )
                        }
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                        placeholder="Marks"
                        className="w-full rounded-xl border border-slate-700 p-3 text-sm bg-[#050814] text-white outline-none focus:border-emerald-400"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 block uppercase tracking-wider">
                      Dynamic Options
                    </label>
                    {question.options.map((option, oIndex) => (
                      <div key={oIndex} className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={option.isCorrect}
                          onChange={(e) =>
                            handleOptionDataChange(
                              qIndex,
                              oIndex,
                              "isCorrect",
                              e.target.checked,
                            )
                          }
                          onMouseDown={(e) => e.stopPropagation()}
                          onClick={(e) => e.stopPropagation()}
                          className="h-4 w-4 text-emerald-500 rounded cursor-pointer accent-emerald-500"
                          title="Mark Option as Correct Answer"
                        />
                        <input
                          type="text"
                          value={option.text}
                          onChange={(e) =>
                            handleOptionDataChange(
                              qIndex,
                              oIndex,
                              "text",
                              e.target.value,
                            )
                          }
                          onMouseDown={(e) => e.stopPropagation()}
                          onClick={(e) => e.stopPropagation()}
                          placeholder={`Option ${oIndex + 1}`}
                          className="flex-1 rounded-xl border border-slate-700 px-3 py-2 text-sm bg-[#050814] text-white outline-none focus:border-emerald-400"
                        />
                        {question.options.length > 2 && (
                          <button
                            type="button"
                            onClick={() =>
                              removeOptionFromQuestion(qIndex, oIndex)
                            }
                            onMouseDown={(e) => e.stopPropagation()}
                            className="text-slate-400 hover:text-rose-400 transition cursor-pointer"
                            title="Minus Option Field"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addOptionToQuestion(qIndex)}
                      onMouseDown={(e) => e.stopPropagation()}
                      className="text-xs font-bold text-emerald-300 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 px-3 py-1.5 rounded-lg transition inline-flex items-center gap-1 mt-1 cursor-pointer"
                    >
                      + Add Option
                    </button>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">
                      Feedback/Explanation Text
                    </label>
                    <textarea
                      value={question.explanation}
                      onChange={(e) =>
                        handleQuestionTextChange(
                          qIndex,
                          "explanation",
                          e.target.value,
                        )
                      }
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => e.stopPropagation()}
                      placeholder="Add custom explanation/feedback text shown after incorrect answers..."
                      rows={2}
                      className="w-full rounded-xl border border-slate-700 p-3 text-sm bg-[#050814] text-white outline-none focus:border-emerald-400"
                    />
                  </div>
                </div>
              ))}
              <div className="flex justify-between items-center pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={addQuestionToForm}
                  onMouseDown={(e) => e.stopPropagation()}
                  className="rounded-xl border border-purple-500/50 bg-purple-950/40 text-purple-300 px-4 py-2 text-sm font-bold hover:bg-purple-900/60 transition cursor-pointer"
                >
                  + Add Next Question Block
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowQuestionModal(false)}
                    onMouseDown={(e) => e.stopPropagation()}
                    disabled={savingQuestions}
                    className="rounded-xl border border-slate-700 bg-slate-900/90 text-slate-300 hover:bg-slate-800 px-4 py-2 text-sm font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveQuestion}
                    onMouseDown={(e) => e.stopPropagation()}
                    disabled={savingQuestions}
                    className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2 text-white text-sm font-bold shadow-md hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 cursor-pointer"
                  >
                    {savingQuestions
                      ? "Injecting Form Questions..."
                      : `Inject Form Questions (${quizQuestionsForm.length})`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notes Modal */}
      {showNotesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md">
          <div className="w-[550px] max-w-[95vw] rounded-3xl bg-[#080C1A] p-6 shadow-[0_0_50px_rgba(16,185,129,0.3)] border-2 border-emerald-500 text-white">
            <h3 className="text-xl font-black mb-1 text-white tracking-tight">
              Attach Lesson Document/PDF
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Upload docs directly or attach an online document web link to
              preview it instantly on the portal player frame.
            </p>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Document/Notes Title *
                </label>
                <input
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                  placeholder="E.g., Complete SQL Notes PDF"
                  className="w-full rounded-xl border-2 border-slate-700/80 p-3 text-sm bg-[#050814] text-white placeholder-slate-500 focus:border-emerald-400 outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Short Description Subtitle
                </label>
                <textarea
                  value={noteDescription}
                  onChange={(e) => setNoteDescription(e.target.value)}
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                  placeholder="Brief summary of what this note covers..."
                  rows={2}
                  className="w-full rounded-xl border-2 border-slate-700/80 p-3 text-sm bg-[#050814] text-white placeholder-slate-500 focus:border-emerald-400 outline-none resize-none"
                />
              </div>
              <div className="p-4 border-2 border-dashed border-emerald-500/50 rounded-xl bg-[#0A0E1F] text-center">
                <label
                  className={`block ${uploadingNote ? "pointer-events-none opacity-60" : "cursor-pointer"}`}
                >
                  <span className="text-xs font-bold text-emerald-300 block hover:underline">
                    {uploadingNote
                      ? "⏳ Uploading PDF..."
                      : "📂 Click to Upload Local PDF or Document Asset"}
                  </span>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleNoteFileChange}
                    className="hidden"
                    disabled={uploadingNote}
                  />
                </label>
                {noteFile && !uploadingNote && (
                  <p className="text-xs text-emerald-400 mt-2 font-bold bg-emerald-950/80 border border-emerald-500/50 rounded-lg p-1.5 inline-block truncate max-w-full">
                    &check; Uploaded: {noteFile.name}
                  </p>
                )}
              </div>
              <div className="relative flex py-2 items-center font-bold text-xs text-slate-500">
                <div className="flex-grow border-t border-slate-800"></div>
                <span className="flex-shrink mx-4 uppercase">OR</span>
                <div className="flex-grow border-t border-slate-800"></div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Online Document Web URL Link
                </label>
                <input
                  value={noteUrlLink}
                  onChange={(e) => setNoteUrlLink(e.target.value)}
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                  placeholder="https://example.com/hosted_document.pdf"
                  className="w-full rounded-xl border-2 border-slate-700/80 p-3 text-sm bg-[#050814] text-white placeholder-slate-500 focus:border-emerald-400 outline-none disabled:opacity-50"
                  disabled={!!noteFile || uploadingNote}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5 pt-3 border-t border-slate-800">
              <button
                onClick={() => {
                  setShowNotesModal(false);
                  setNoteTargetItem(null);
                  setNoteFile(null);
                  setNoteUrlLink("");
                }}
                onMouseDown={(e) => e.stopPropagation()}
                className="border border-slate-700 bg-slate-900/90 text-slate-300 hover:bg-slate-800 px-4 py-2 rounded-xl text-sm font-bold cursor-pointer"
                disabled={uploadingNote}
              >
                Cancel
              </button>
              <button
                onClick={saveNotes}
                onMouseDown={(e) => e.stopPropagation()}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-5 py-2 rounded-xl text-sm font-bold shadow-md hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 cursor-pointer"
                disabled={uploadingNote}
              >
                Save & Embed Asset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Survey Initial Configuration Modal */}
      {showSurveyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md">
          <div className="bg-[#080C1A] rounded-3xl p-6 sm:p-8 w-[700px] max-w-[95vw] border-2 border-purple-500 shadow-[0_0_50px_rgba(168,85,247,0.35)] text-white">
            <h3 className="text-xl font-black mb-2 text-white tracking-tight">
              Create New Survey Template
            </h3>
            <p className="text-xs text-slate-400 mb-4 font-medium">
              Initialize the header settings of your new Google Forms styled
              module entity block.
            </p>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Survey Form Title *
                </label>
                <input
                  type="text"
                  value={surveyTitle}
                  onChange={(e) => setSurveyTitle(e.target.value)}
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                  placeholder="E.g., End-of-Course Feedback Survey"
                  className="w-full rounded-xl border-2 border-slate-700/80 p-3 text-sm bg-[#050814] text-white placeholder-slate-500 outline-none focus:border-purple-400"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Description / Summary Instructions
                </label>
                <textarea
                  value={surveyDescription}
                  onChange={(e) => setSurveyDescription(e.target.value)}
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                  placeholder="Provide high-level guidelines or operational context for respondents..."
                  rows={3}
                  className="w-full rounded-xl border-2 border-slate-700/80 p-3 text-sm bg-[#050814] text-white placeholder-slate-500 outline-none focus:border-purple-400 resize-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  onClick={() => {
                    setShowSurveyModal(false);
                    setSurveyTitle("");
                    setSurveyDescription("");
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  className="border border-slate-700 bg-slate-900/90 text-slate-300 px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-800 transition cursor-pointer"
                  disabled={savingSurvey}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateInitialSurvey}
                  onMouseDown={(e) => e.stopPropagation()}
                  disabled={savingSurvey}
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-5 py-2 rounded-xl text-sm font-bold shadow-md transition disabled:opacity-50 cursor-pointer"
                >
                  {savingSurvey ? "Creating..." : "Create Form Canvas"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assignment Modal - Fix all inputs */}
      {showAssignmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-fadeIn">
          <div className="w-full max-w-3xl rounded-3xl bg-[#080C1A] shadow-[0_0_50px_rgba(245,158,11,0.3)] max-h-[92vh] flex flex-col overflow-hidden border-2 border-amber-500 text-white">
            <div className="bg-[#0D1226] border-b border-slate-800 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-950/80 flex items-center justify-center text-amber-400 border border-amber-500/40">
                  <ClipboardCheck size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">
                    {editingAssignmentId
                      ? "Edit Assignment Details"
                      : "Create New Assignment"}
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">
                    Configure task objectives, grading parameters and policies.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowAssignmentModal(false);
                  resetAssignmentForm();
                }}
                onMouseDown={(e) => e.stopPropagation()}
                className="text-slate-400 hover:text-white hover:bg-slate-800 p-2 rounded-xl border border-slate-700 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[#050814]">
              {/* Section 1 - Assignment Information */}
              <div className="bg-[#0A0E1F] rounded-2xl p-5 border border-slate-700/80 shadow-xs space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                  <span className="text-xs font-bold text-amber-400 bg-amber-950/80 border border-amber-500/40 rounded px-2 py-0.5 uppercase tracking-wider">
                    Section 1
                  </span>
                  <h4 className="text-sm font-bold text-white">
                    Assignment Information
                  </h4>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">
                      Assignment Title *
                    </label>
                    <input
                      value={assignmentTitle}
                      onChange={(e) => setAssignmentTitle(e.target.value)}
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => e.stopPropagation()}
                      placeholder="React Authentication System"
                      className="w-full rounded-xl border border-slate-700 p-3 text-sm outline-none focus:border-amber-400 transition-all text-white placeholder-slate-500 bg-[#050814]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">
                      Short Description *
                    </label>
                    <input
                      value={assignmentDescription}
                      onChange={(e) => setAssignmentDescription(e.target.value)}
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => e.stopPropagation()}
                      placeholder="Build a secure authentication system using React."
                      className="w-full rounded-xl border border-slate-700 p-3 text-sm outline-none focus:border-amber-400 transition-all text-white placeholder-slate-500 bg-[#050814]"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      A concise snippet introducing the primary framework
                      requirements.
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">
                      Detailed Instructions *
                    </label>
                    <textarea
                      value={assignmentInstructions}
                      onChange={(e) =>
                        setAssignmentInstructions(e.target.value)
                      }
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => e.stopPropagation()}
                      placeholder="Complete all tasks listed below..."
                      rows={4}
                      className="w-full rounded-xl border border-slate-700 p-3 text-sm outline-none focus:border-amber-400 transition-all text-white placeholder-slate-500 bg-[#050814] resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2 - Submission Settings */}
              <div className="bg-[#0A0E1F] rounded-2xl p-5 border border-slate-700/80 shadow-xs space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                  <span className="text-xs font-bold text-amber-400 bg-amber-950/80 border border-amber-500/40 rounded px-2 py-0.5 uppercase tracking-wider">
                    Section 2
                  </span>
                  <h4 className="text-sm font-bold text-white">
                    Submission Settings
                  </h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1 mb-1">
                      <Calendar size={14} className="text-amber-400" /> Deadline
                      *
                    </label>
                    <input
                      type="datetime-local"
                      value={assignmentDeadline}
                      onChange={(e) => setAssignmentDeadline(e.target.value)}
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full rounded-xl border border-slate-700 p-3 text-sm outline-none focus:border-amber-400 transition-all text-white bg-[#050814]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">
                      Submission Type
                    </label>
                    <select
                      value={assignmentSubmissionType}
                      onChange={(e) =>
                        setAssignmentSubmissionType(e.target.value)
                      }
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full rounded-xl border border-slate-700 p-3 text-sm bg-[#050814] text-white outline-none focus:border-amber-400 transition-all cursor-pointer"
                    >
                      <option value="file">File Upload</option>
                      <option value="text">Text Answer</option>
                      <option value="both">File + Text</option>
                      <option value="url">
                        URL Submission (GitHub / Drive)
                      </option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 3 - Evaluation Settings */}
              <div className="bg-[#0A0E1F] rounded-2xl p-5 border border-slate-700/80 shadow-xs space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                  <span className="text-xs font-bold text-amber-400 bg-amber-950/80 border border-amber-500/40 rounded px-2 py-0.5 uppercase tracking-wider">
                    Section 3
                  </span>
                  <h4 className="text-sm font-bold text-white">
                    Evaluation Settings
                  </h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">
                      Maximum Marks
                    </label>
                    <input
                      type="number"
                      value={assignmentMaxMarks}
                      onChange={(e) => setAssignmentMaxMarks(e.target.value)}
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full rounded-xl border border-slate-700 p-3 text-sm outline-none focus:border-amber-400 transition-all text-white bg-[#050814]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">
                      Passing Marks
                    </label>
                    <input
                      type="number"
                      value={assignmentPassingMarks}
                      onChange={(e) =>
                        setAssignmentPassingMarks(e.target.value)
                      }
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full rounded-xl border border-slate-700 p-3 text-sm outline-none focus:border-amber-400 transition-all text-white bg-[#050814]"
                    />
                    <p className="text-[11px] text-rose-400 font-medium flex items-center gap-1 mt-1.5">
                      <ShieldAlert size={12} /> Students scoring below this
                      value will fail this assignment.
                    </p>
                  </div>
                </div>
              </div>

              {/* Section 4 - Upload Settings */}
              <div className="bg-[#0A0E1F] rounded-2xl p-5 border border-slate-700/80 shadow-xs space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                  <span className="text-xs font-bold text-amber-400 bg-amber-950/80 border border-amber-500/40 rounded px-2 py-0.5 uppercase tracking-wider">
                    Section 4
                  </span>
                  <h4 className="text-sm font-bold text-white">
                    Upload Settings
                  </h4>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">
                      Maximum File Size (MB)
                    </label>
                    <input
                      type="number"
                      value={maxFileSize}
                      onChange={(e) => setMaxFileSize(e.target.value)}
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full rounded-xl border border-slate-700 p-3 text-sm outline-none focus:border-amber-400 transition-all text-white bg-[#050814]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-2">
                      Allowed File Types
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        "ZIP",
                        "PDF",
                        "DOCX",
                        "PPTX",
                        "JPG",
                        "PNG",
                        "JAVA",
                        "JS",
                        "PY",
                        "SQL",
                      ].map((ext) => {
                        const isSelected = allowedFileTypes.includes(ext);
                        return (
                          <button
                            key={ext}
                            type="button"
                            onClick={() => handleFileTypeToggle(ext)}
                            onMouseDown={(e) => e.stopPropagation()}
                            className={`px-3 py-1.5 rounded-full border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                              isSelected
                                ? "bg-amber-500 border-amber-500 text-slate-950 shadow-xs"
                                : "bg-[#050814] border-slate-700 text-slate-300 hover:border-slate-500 hover:bg-slate-800"
                            }`}
                          >
                            {isSelected && <Check size={12} />}
                            {ext}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 5 - Submission Rules */}
              <div className="bg-[#0A0E1F] rounded-2xl p-5 border border-slate-700/80 shadow-xs space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                  <span className="text-xs font-bold text-amber-400 bg-amber-950/80 border border-amber-500/40 rounded px-2 py-0.5 uppercase tracking-wider">
                    Section 5
                  </span>
                  <h4 className="text-sm font-bold text-white">
                    Submission Rules
                  </h4>
                </div>

                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-[#050814] rounded-xl gap-4 border border-slate-800">
                    <div className="flex items-center justify-between flex-1">
                      <div>
                        <span className="text-xs font-bold text-white block">
                          Allow Multiple Files
                        </span>
                        <p className="text-[11px] text-slate-400">
                          Students can upload multiple distinct asset folders.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setAllowMultipleFiles(!allowMultipleFiles)
                        }
                        onMouseDown={(e) => e.stopPropagation()}
                        className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 outline-none cursor-pointer ${
                          allowMultipleFiles ? "bg-amber-500" : "bg-slate-700"
                        }`}
                      >
                        <div
                          className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                            allowMultipleFiles
                              ? "translate-x-5"
                              : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>

                    <div className="hidden sm:block h-8 w-px bg-slate-800" />

                    <div className="flex items-center justify-between flex-1">
                      <div>
                        <span className="text-xs font-bold text-white block">
                          Allow Late Submission
                        </span>
                        <p className="text-[11px] text-slate-400">
                          Permit assignment pushes after due targets pass.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setAllowLateSubmission(!allowLateSubmission)
                        }
                        onMouseDown={(e) => e.stopPropagation()}
                        className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 outline-none cursor-pointer ${
                          allowLateSubmission ? "bg-amber-500" : "bg-slate-700"
                        }`}
                      >
                        <div
                          className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                            allowLateSubmission
                              ? "translate-x-5"
                              : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {allowLateSubmission && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border border-amber-500/40 bg-amber-950/30 rounded-2xl animate-fadeIn">
                      <div>
                        <label className="text-xs font-bold text-amber-300 block mb-1">
                          Late Penalty
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            value={latePenalty}
                            onChange={(e) => setLatePenalty(e.target.value)}
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => e.stopPropagation()}
                            placeholder="10%"
                            className="w-full rounded-xl border border-slate-700 p-3 text-sm outline-none focus:border-amber-400 bg-[#050814] text-white"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-amber-300 block mb-1">
                          Maximum Late Days
                        </label>
                        <input
                          type="number"
                          value={maxLateDays}
                          onChange={(e) =>
                            setMaxLateDays(Number(e.target.value))
                          }
                          onMouseDown={(e) => e.stopPropagation()}
                          onClick={(e) => e.stopPropagation()}
                          placeholder="3"
                          className="w-full rounded-xl border border-slate-700 p-3 text-sm outline-none focus:border-amber-400 bg-[#050814] text-white"
                        />
                        <p className="text-[11px] text-amber-300 font-medium flex items-center gap-1 mt-1.5">
                          <Clock size={12} /> Students can submit for only{" "}
                          {maxLateDays} days after the deadline.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Section 6 - Attempts */}
              <div className="bg-[#0A0E1F] rounded-2xl p-5 border border-slate-700/80 shadow-xs space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                  <span className="text-xs font-bold text-amber-400 bg-amber-950/80 border border-amber-500/40 rounded px-2 py-0.5 uppercase tracking-wider">
                    Section 6
                  </span>
                  <h4 className="text-sm font-bold text-white">Attempts</h4>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Attempts Allowed
                  </label>
                  <select
                    value={attemptsAllowed}
                    onChange={(e) => setAttemptsAllowed(e.target.value)}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full rounded-xl border border-slate-700 p-3 text-sm bg-[#050814] text-white outline-none focus:border-amber-400 transition-all cursor-pointer"
                  >
                    <option value="1">1 Attempt</option>
                    <option value="2">2 Attempts</option>
                    <option value="3">3 Attempts</option>
                    <option value="Unlimited">Unlimited</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-[#0D1226] border-t border-slate-800 px-6 py-4 flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setShowAssignmentModal(false);
                  resetAssignmentForm();
                }}
                onMouseDown={(e) => e.stopPropagation()}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-300 bg-slate-900 border border-slate-700 hover:bg-slate-800 transition-all cursor-pointer"
                disabled={savingAssignment}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={saveAssignment}
                onMouseDown={(e) => e.stopPropagation()}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-200 bg-slate-800 border border-slate-700 shadow-xs hover:bg-slate-700 transition-all cursor-pointer"
                disabled={savingAssignment}
              >
                Save Draft
              </button>

              <button
                type="button"
                onClick={saveAssignment}
                onMouseDown={(e) => e.stopPropagation()}
                className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-md shadow-emerald-500/20 active:scale-98 transition-all flex items-center gap-1.5 cursor-pointer"
                disabled={savingAssignment}
              >
                {savingAssignment ? (
                  <>
                    <RefreshCw className="animate-spin" size={16} />{" "}
                    Committing...
                  </>
                ) : (
                  <>
                    <UploadCloud size={16} /> Publish Assignment
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Survey Choice Modal */}
      {showSurveyChoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md">
          <div className="bg-[#080C1A] rounded-3xl p-6 sm:p-8 w-[700px] max-w-[95vw] border-2 border-purple-500 shadow-[0_0_50px_rgba(168,85,247,0.35)] text-white">
            <h2 className="text-2xl font-black mb-6 text-white tracking-tight">Create Survey</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div
                onClick={() => {
                  setShowSurveyChoiceModal(false);
                  setShowSurveyModal(true);
                }}
                onMouseDown={(e) => e.stopPropagation()}
                className="cursor-pointer border-2 border-slate-700 bg-[#0A0E1F] rounded-2xl p-6 hover:border-blue-400 hover:bg-[#121936] transition"
              >
                <h3 className="font-bold text-lg text-white">Create Blank Survey</h3>
                <p className="text-sm text-slate-400 mt-2">
                  Start with an empty survey canvas.
                </p>
              </div>

              <div
                onClick={() => {
                  setShowSurveyChoiceModal(false);
                  setShowSurveyGallery(true);
                }}
                onMouseDown={(e) => e.stopPropagation()}
                className="cursor-pointer border-2 border-slate-700 bg-[#0A0E1F] rounded-2xl p-6 hover:border-emerald-400 hover:bg-[#121936] transition"
              >
                <h3 className="font-bold text-lg text-white">Reuse Existing Survey</h3>
                <p className="text-sm text-slate-400 mt-2">
                  Browse all previously created surveys from library.
                </p>
              </div>
            </div>

            <div className="flex justify-end mt-6 pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowSurveyChoiceModal(false)}
                onMouseDown={(e) => e.stopPropagation()}
                className="px-4 py-2 border border-slate-700 bg-slate-900 text-slate-300 rounded-xl text-sm font-bold hover:bg-slate-800 transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Survey Template Gallery */}
      <SurveyTemplateGallery
        isOpen={showSurveyGallery}
        onClose={() => setShowSurveyGallery(false)}
        onSelectTemplate={handleSelectTemplateFromGallery}
        apiBaseUrl={API_BASE_URL}
      />

      {/* Quiz Results Modal */}
      {showResultModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md">
          <div className="bg-[#080C1A] rounded-2xl shadow-2xl w-[90%] max-w-5xl max-h-[85vh] overflow-y-auto p-6 border-2 border-cyan-500 text-white custom-scrollbar">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-800">
              <h2 className="text-2xl font-black text-white">Quiz Results</h2>
              <button
                onClick={() => setShowResultModal(false)}
                onMouseDown={(e) => e.stopPropagation()}
                className="bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 rounded-xl text-sm font-bold transition cursor-pointer"
              >
                Close
              </button>
            </div>

            {loadingResults ? (
              <div className="text-center py-8 text-slate-400 font-bold">Loading...</div>
            ) : (
              <table className="w-full border border-slate-800 rounded-xl overflow-hidden">
                <thead className="bg-[#0D1226] text-white border-b border-slate-700">
                  <tr>
                    <th className="p-3 text-left">Attempt</th>
                    <th className="p-3 text-left">Candidate</th>
                    <th className="p-3 text-center">Score</th>
                    <th className="p-3 text-center">Percentage</th>
                    <th className="p-3 text-center">Result</th>
                  </tr>
                </thead>

                <tbody>
                  {quizResults?.results?.length > 0 ? (
                    quizResults.results.map((result) => (
                      <tr key={result.attempt_id} className="border-b border-slate-800 hover:bg-[#0E152E] transition">
                        <td className="p-3 text-left font-medium">
                          {result.attempt_number}
                        </td>
                        <td className="p-3 font-bold text-white">{result.candidate_name}</td>
                        <td className="p-3 text-center font-bold text-purple-300">
                          {result.score} / {result.total_marks}
                        </td>
                        <td className="p-3 text-center font-bold">
                          {result.percentage}%
                        </td>
                        <td className="p-3 text-center font-bold">
                          {result.passed ? (
                            <span className="text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-full border border-emerald-500/40 text-xs">
                              Passed
                            </span>
                          ) : (
                            <span className="text-rose-400 bg-rose-950/80 px-2.5 py-1 rounded-full border border-rose-500/40 text-xs">
                              Failed
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="text-center p-6 text-slate-500 italic">
                        No quiz attempts found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Preview Template Modal */}
      {previewTemplateUrl && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fadeIn"
          onClick={() => setPreviewTemplateUrl(null)}
        >
          <div
            className="bg-[#080C1A] rounded-3xl p-5 shadow-2xl w-full max-w-2xl transform scale-100 transition-all relative border-2 border-purple-500 text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPreviewTemplateUrl(null)}
              className="absolute top-4 right-4 bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 p-2 rounded-xl transition shadow-md z-10 border border-slate-700 cursor-pointer"
            >
              <X size={16} />
            </button>
            <div className="rounded-2xl overflow-hidden border border-slate-800 bg-[#050814] max-h-[70vh] flex items-center justify-center shadow-inner">
              {previewTemplateUrl === "placeholder" ? (
                <div className="text-center py-20 px-6">
                  <span className="text-6xl block mb-2">📊</span>
                  <h3 className="text-lg font-black text-white">
                    Dynamic UI Preview Window
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    This engine block renders layout structures dynamically
                    during candidate completion passes.
                  </p>
                </div>
              ) : (
                <img
                  src={previewTemplateUrl}
                  alt="Template Large View"
                  className="w-full h-auto object-contain max-h-[70vh]"
                />
              )}
            </div>
            <div className="mt-4 flex items-center justify-between px-2 text-xs text-slate-400 font-medium">
              <span className="flex items-center gap-1">
                <Info size={13} /> Press ESC or click outside to close viewport
              </span>
              <span className="bg-purple-950/80 border border-purple-500/40 text-purple-300 font-bold px-2 py-0.5 rounded-md">
                LMS Core Previewer
              </span>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default ProgramDetails;
