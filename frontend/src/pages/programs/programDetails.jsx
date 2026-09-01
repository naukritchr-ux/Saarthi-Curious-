import { useState, useEffect, useCallback, useMemo } from "react";
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
            ? "bg-[#1E1B4B] text-white shadow-lg shadow-[#1E1B4B]/20"
            : "bg-[#F8F5FC] text-gray-800 hover:bg-[#E8E4F0] border-2 border-transparent hover:border-[#1E1B4B]/20"
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
                : "text-gray-400 hover:text-[#1E1B4B]"
            }`}
            title="Drag Module"
          >
            <GripVertical size={17} />
          </button>

          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${
              selectedModule?.id === module.id
                ? "bg-white/20 text-white"
                : "bg-[#1E1B4B]/10 text-[#1E1B4B]"
            }`}
          >
            {index + 1}
          </div>

          <span className="font-semibold truncate">{module.title}</span>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(module.id);
          }}
          className={`ml-2 p-1.5 rounded-lg transition-all ${
            selectedModule?.id === module.id
              ? "text-white/70 hover:text-white hover:bg-white/20"
              : "text-gray-400 hover:text-red-500 hover:bg-red-50"
          }`}
          title="Delete Module"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {selectedModule?.id === module.id && children}
    </div>
  );
};

// ============ MAIN COMPONENT ============
const ProgramDetails = () => {
  const { id: programId } = useParams();
  const navigate = useNavigate();

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
    async (updateSelection = false, targetModuleId = null) => {
      if (!programId) return;

      try {
        setLoading(true);
        const response = await axios.get(
          `${API_BASE_URL}/programs/${programId}`,
        );
        const data = response.data;
        setProgramData(data);
        const fetchedModules = data.modules || [];
        setModules(fetchedModules);

        if (fetchedModules.length > 0) {
          if (updateSelection && targetModuleId) {
            const matched = fetchedModules.find((m) => m.id === targetModuleId);
            setSelectedModule(matched || fetchedModules[0]);
            setEditModuleTitle(
              matched ? matched.title : fetchedModules[0].title,
            );
            setEditModuleDescription(
              matched
                ? matched.description || ""
                : fetchedModules[0].description || "",
            );
            setEditModuleCuros(
              matched ? matched.curos || 0 : fetchedModules[0].curos || 0,
            );
          } else if (!selectedModule) {
            setSelectedModule(fetchedModules[0]);
            setEditModuleTitle(fetchedModules[0].title);
            setEditModuleDescription(fetchedModules[0].description || "");
            setEditModuleCuros(fetchedModules[0].curos || 0);
          } else {
            const recheck = fetchedModules.find(
              (m) => m.id === selectedModule?.id,
            );
            setSelectedModule(recheck || fetchedModules[0]);
            if (recheck) {
              setEditModuleTitle(recheck.title);
              setEditModuleDescription(recheck.description || "");
              setEditModuleCuros(recheck.curos || 0);
            }

            if (selectedContent && recheck) {
              if (selectedContent.type === "video") {
                const activeVideo = recheck.videos?.find(
                  (v) => v.id === selectedContent?.data?.id,
                );
                if (activeVideo)
                  setSelectedContent({ type: "video", data: activeVideo });
              } else if (selectedContent.type === "quiz") {
                const activeQuiz = recheck.quizzes?.find(
                  (q) => q.id === selectedContent?.data?.id,
                );
                if (activeQuiz)
                  setSelectedContent({ type: "quiz", data: activeQuiz });
              } else if (selectedContent.type === "writtenLesson") {
                const activeLesson = recheck.written_lessons?.find(
                  (l) => l.id === selectedContent?.data?.id,
                );
                if (activeLesson)
                  setSelectedContent({
                    type: "writtenLesson",
                    data: activeLesson,
                  });
              } else if (selectedContent.type === "survey") {
                const activeSurvey = recheck.surveys?.find(
                  (s) => s.id === selectedContent?.data?.id,
                );
                if (activeSurvey) {
                  setSelectedContent({ type: "survey", data: activeSurvey });
                  const formattedQuestions = (activeSurvey.questions || []).map(
                    (q) => ({
                      question: q.question || q.question_text || "",
                      type: q.question_type || "Multiple Choice",
                      required: q.is_required || false,
                      options: (q.options || []).map((o) => o.option_text || o),
                    }),
                  );
                  setSurveyQuestions(formattedQuestions);
                }
              } else if (selectedContent.type === "assignment") {
                const activeAssignment = recheck.assignments?.find(
                  (a) => a.id === selectedContent?.data?.id,
                );
                if (activeAssignment) {
                  setSelectedContent({
                    type: "assignment",
                    data: activeAssignment,
                  });
                }
              }
            }
          }
        } else {
          setSelectedModule(null);
          setSelectedContent(null);
          setEditModuleTitle("");
          setEditModuleDescription("");
          setEditModuleCuros("");
        }
      } catch (error) {
        handleApiError(error);
      } finally {
        setLoading(false);
      }
    },
    [programId, selectedModule, selectedContent],
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
      fetchProgram();
      fetchProgramValidationData();
    }
  }, [programId, fetchProgram, fetchProgramValidationData]);

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
      await fetchProgram(true, response.data?.id);
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

  // Fixed: removed undefined `question` variable reference
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

    // Fixed: Added missing fields to payload
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
      <MainLayout>
        <div className="flex h-[50vh] items-center justify-center font-semibold text-gray-500">
          Loading Program...
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="rounded-3xl bg-white p-6 shadow">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-[#1E1B4B]">
                {programData?.name || "Program Details"}
              </h1>

              <p className="mt-2 text-gray-500">
                {programData?.description || "No description available."}
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {programData?.status === "Draft" && (
                <span className="rounded-full bg-amber-100 px-3 py-1.5 text-sm font-semibold text-amber-700">
                  Draft
                </span>
              )}

              {programData?.status === "Published" && (
                <span className="rounded-full bg-emerald-100 px-3 py-1.5 text-sm font-semibold text-emerald-700">
                  Published
                </span>
              )}

              {programData?.status === "Draft" && (
                <button
                  type="button"
                  onClick={handlePublishProgram}
                  disabled={isPublishing}
                  className="rounded-xl bg-[#10B981] px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-[#0fA773] disabled:cursor-not-allowed disabled:opacity-50 transition-all flex items-center gap-2"
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
        </div>

        {/* Main Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Sidebar */}
          <div className="lg:col-span-3 rounded-3xl bg-white p-5 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[#1E1B4B]">Modules</h3>
              <span className="text-xs font-medium bg-[#F8F5FC] text-[#1E1B4B] px-2.5 py-1 rounded-full">
                {modules.length}
              </span>
            </div>

            <button
              onClick={addModule}
              disabled={savingModule}
              className="mb-5 w-full rounded-xl bg-gradient-to-r from-[#10B981] to-[#059669] py-3 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-[#10B981]/20 hover:shadow-xl hover:shadow-[#10B981]/30 flex items-center justify-center gap-2"
            >
              {savingModule ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Adding Module...
                </>
              ) : (
                <>
                  <Plus size={18} />
                  Add Module
                </>
              )}
            </button>

            <div className="space-y-2 overflow-y-auto max-h-[60vh] lg:max-h-[70vh] pr-1 custom-scrollbar">
              {modules.length === 0 ? (
                <div className="text-center py-8 px-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Layers className="text-gray-400" size={24} />
                  </div>
                  <p className="text-sm text-gray-500 font-medium">
                    No modules yet
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
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
                          setEditModuleTitle(module.title);
                          setEditModuleDescription(module.description || "");
                          setEditModuleCuros(module.curos || 0);
                          setHasUnsavedChanges(false);
                          setSelectedContent(null);
                          setViewingNote(null);
                        }}
                      >
                        <div className="ml-4 mt-2 space-y-1.5 pl-3 border-l-2 border-[#1E1B4B]/20">
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
                              className="cursor-pointer flex items-center gap-2 rounded-lg bg-white p-2.5 hover:bg-gray-50 border border-gray-100 hover:border-[#1E1B4B]/30 transition-all group"
                            >
                              {video.thumbnail_url ? (
                                <img
                                  src={video.thumbnail_url}
                                  alt=""
                                  className="h-10 w-16 rounded object-cover"
                                />
                              ) : (
                                <div className="h-10 w-16 rounded bg-gray-100 flex items-center justify-center">
                                  <PlayCircle
                                    className="text-gray-400"
                                    size={20}
                                  />
                                </div>
                              )}

                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate text-gray-800 group-hover:text-[#1E1B4B]">
                                  {video.title}
                                </p>
                                <p className="text-xs text-gray-400">
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
                              className="cursor-pointer flex items-center gap-2 rounded-lg bg-white p-2.5 hover:bg-gray-50 border border-gray-100 hover:border-[#1E1B4B]/30 transition-all group"
                            >
                              <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                                <BookOpen className="text-blue-500" size={18} />
                              </div>

                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate text-gray-800 group-hover:text-[#1E1B4B]">
                                  {lesson.title}
                                </p>
                                <p className="text-xs text-gray-400">
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
                              className="cursor-pointer flex items-center gap-2 rounded-lg bg-white p-2.5 hover:bg-gray-50 border border-gray-100 hover:border-[#1E1B4B]/30 transition-all group"
                            >
                              <div className="h-10 w-10 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
                                <ClipboardCheck
                                  className="text-purple-500"
                                  size={18}
                                />
                              </div>

                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate text-gray-800 group-hover:text-[#1E1B4B]">
                                  {quiz.title}
                                </p>
                                <p className="text-xs text-gray-400">
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
                              className="cursor-pointer flex items-center gap-2 rounded-lg bg-white p-2.5 hover:bg-gray-50 border border-gray-100 hover:border-[#1E1B4B]/30 transition-all group"
                            >
                              <div className="h-10 w-10 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
                                <FileQuestion
                                  className="text-green-500"
                                  size={18}
                                />
                              </div>

                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate text-gray-800 group-hover:text-[#1E1B4B]">
                                  {survey.title}
                                </p>
                                <p className="text-xs text-gray-400">
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
                              className="cursor-pointer flex items-center gap-2 rounded-lg bg-white p-2.5 hover:bg-gray-50 border border-gray-100 hover:border-[#1E1B4B]/30 transition-all group"
                            >
                              <div className="h-10 w-10 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                                <ClipboardCheck
                                  className="text-amber-500"
                                  size={18}
                                />
                              </div>

                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate text-gray-800 group-hover:text-[#1E1B4B]">
                                  {assignment.title}
                                </p>
                                <p className="text-xs text-gray-400">
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

            {/* Program Validation Cards */}
            <div className="mt-5 rounded-2xl border border-gray-100 bg-[#F8F5FC]/70 p-4">
              <div className="mb-4 flex items-center gap-2">
                <div className="rounded-lg bg-[#1E1B4B]/10 p-2">
                  <Settings className="text-[#1E1B4B]" size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#1E1B4B]">
                    Program Validation
                  </h3>
                  <p className="text-xs text-gray-500">
                    Program-level configuration cards
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {validationCards.map((card) => (
                  <div
                    key={card.title}
                    className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-semibold text-gray-800">
                          {card.title}
                        </h4>
                        <p className="mt-1 text-xs text-gray-500">
                          {card.description}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={card.onClick}
                        className="rounded-lg border border-[#1E1B4B]/20 bg-[#F8F5FC] px-3 py-1.5 text-xs font-semibold text-[#1E1B4B] transition hover:bg-[#E8E4F0]"
                      >
                        Create/Edit
                      </button>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                      <span>Questions Saved: {card.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Retention Quiz Modal */}
          {showRetentionQuizModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
              <div className="w-[920px] max-w-[95vw] rounded-3xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto border">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {retentionQuizTitle}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {retentionQuizDescription}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowRetentionQuizModal(false)}
                    className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-gray-50"
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
                />
              </div>
            </div>
          )}

          {/* Application Check Modal */}
          {showApplicationCheckModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
              <div className="w-[920px] max-w-[95vw] rounded-3xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto border">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {applicationCheckTitle}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {applicationCheckDescription}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowApplicationCheckModal(false);
                      setActiveApplicationCheckKey(null);
                    }}
                    className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-gray-50"
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
                />
              </div>
            </div>
          )}

          {/* Right Content Area */}
          <div className="lg:col-span-9 rounded-3xl bg-white p-6 shadow-lg border border-gray-100">
            {selectedContent ? (
              <div className="mb-6 rounded-2xl border bg-white p-6">
                <button
                  onClick={() => {
                    setSelectedContent(null);
                    setViewingNote(null);
                  }}
                  className="mb-4 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50 text-gray-600 transition"
                >
                  &larr; Back To Module Overview
                </button>

                {/* Video Content */}
                {selectedContent.type === "video" && (
                  <>
                    <h2 className="mb-4 text-2xl font-bold">
                      🎥 {selectedContent?.data?.title}
                    </h2>

                    {viewingNote ? (
                      <div className="mb-6 rounded-2xl border p-4 bg-gray-50 relative shadow-md">
                        <div className="flex justify-between items-center mb-2">
                          <p className="text-sm font-bold text-gray-800">
                            📄 Viewing File:{" "}
                            <span className="text-[#1E1B4B]">
                              {viewingNote.title}
                            </span>
                          </p>
                          <button
                            onClick={() => setViewingNote(null)}
                            className="bg-red-500 hover:bg-red-600 text-white rounded-lg px-3 py-1 text-xs font-semibold"
                          >
                            Close Document Viewer
                          </button>
                        </div>
                        <iframe
                          src={viewingNote.file_url}
                          width="100%"
                          height="550px"
                          title="Portal Inline PDF Engine"
                          className="rounded-xl border bg-white shadow-inner"
                        />
                        {viewingNote.description && (
                          <p className="mt-2 text-xs text-gray-500 bg-white p-2 rounded-lg border italic">
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
                        className="rounded-xl shadow"
                      />
                    )}

                    <p className="mt-4 text-gray-600 font-semibold">
                      Description:
                    </p>
                    <p className="text-gray-500 text-sm">
                      {selectedContent?.data?.description ||
                        "No short description provided."}
                    </p>

                    {selectedContent?.data?.explanation_text && (
                      <div className="mt-4 p-4 rounded-xl bg-blue-50/50 border border-blue-100">
                        <h4 className="text-sm font-bold text-blue-900 mb-1">
                          Lesson Explanation Notes:
                        </h4>
                        <p className="text-sm text-blue-800 leading-relaxed whitespace-pre-wrap">
                          {selectedContent?.data?.explanation_text}
                        </p>
                      </div>
                    )}

                    <div className="mt-6 border-t pt-4">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="text-md font-bold text-[#1E1B4B]">
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
                          className="bg-[#10B981] text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-2xs"
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
                              className="p-3 border rounded-xl bg-gray-50 flex flex-col justify-between shadow-xs relative"
                            >
                              <button
                                onClick={() => deleteDocument(n.id)}
                                className="absolute top-2 right-2 text-gray-400 hover:text-red-500 p-1 rounded-lg"
                                title="Delete Document"
                              >
                                <Trash2 size={14} />
                              </button>
                              <div className="pr-6">
                                <span className="text-sm font-bold text-gray-800 block">
                                  📚 {n.title}
                                </span>
                                {n.description && (
                                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                                    {n.description}
                                  </p>
                                )}
                              </div>
                              <div className="flex gap-2 mt-3 pt-2 border-t border-gray-200/60">
                                <button
                                  onClick={() => setViewingNote(n)}
                                  className="text-xs flex-1 bg-[#1E1B4B] text-white py-1.5 rounded-md font-medium text-center hover:opacity-90 shadow-2xs"
                                >
                                  View on Portal
                                </button>
                                <a
                                  href={n.file_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-xs flex-1 bg-gray-200 text-gray-700 py-1.5 rounded-md font-medium text-center hover:bg-gray-300"
                                >
                                  Open Link &rarr;
                                </a>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-gray-400 italic col-span-2">
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
                      <div className="mb-6 rounded-2xl border p-4 bg-gray-50 shadow-md">
                        <div className="flex justify-between mb-3">
                          <p className="font-bold">📄 {viewingNote.title}</p>
                          <button
                            onClick={() => setViewingNote(null)}
                            className="bg-red-500 text-white px-3 py-1 rounded-lg"
                          >
                            Close Viewer
                          </button>
                        </div>
                        <iframe
                          src={viewingNote.file_url}
                          width="100%"
                          height="650"
                          title="Written Lesson Document View"
                          className="rounded-xl border"
                        />
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between items-center border-b pb-4">
                          <h2 className="text-2xl font-bold">
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
                                className="text-xs bg-[#1E1B4B] text-white px-4 py-2 rounded-xl font-semibold text-center hover:opacity-90"
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
                                className="text-xs bg-gray-200 text-gray-700 px-4 py-2 rounded-xl font-semibold text-center hover:bg-gray-300"
                              >
                                Open PDF Link
                              </button>
                            </div>
                          )}
                        </div>
                        <div className="p-5 bg-gray-50/60 border rounded-2xl text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">
                          {selectedContent?.data?.content}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Quiz Content */}
                {selectedContent.type === "quiz" && (
                  <>
                    <div className="flex justify-between items-start border-b pb-4">
                      <div>
                        <h2 className="text-2xl font-bold">
                          ❓ {selectedContent?.data?.title}
                        </h2>

                        <p className="mt-1 text-sm text-gray-500">
                          {selectedContent?.data?.description ||
                            "No description loaded."}
                        </p>

                        <div className="mt-3 inline-flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-3 py-2">
                          <span className="text-sm font-semibold text-green-700">
                            Passing Percentage:
                          </span>

                          <span className="text-sm font-bold text-green-800">
                            {selectedContent?.data?.passing_percentage ?? 0}%
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            mapQuizResults(selectedContent.data.id)
                          }
                          className="rounded-lg bg-green-600 hover:bg-green-700 px-4 py-2 text-white font-semibold text-sm"
                        >
                          View Results
                        </button>

                        <button
                          onClick={() => {
                            setSelectedQuiz(selectedContent.data);
                            setShowQuestionModal(true);
                          }}
                          className="rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2 text-white font-semibold text-sm"
                        >
                          + Add/Edit Questions Form
                        </button>
                      </div>
                    </div>
                    <div className="mt-6 space-y-4">
                      <h3 className="text-lg font-bold text-[#1E1B4B]">
                        Saved Evaluation Questions
                      </h3>
                      {selectedContent?.data?.questions &&
                      selectedContent?.data?.questions.length > 0 ? (
                        selectedContent?.data?.questions.map((q, index) => (
                          <div
                            key={q.id || index}
                            className="rounded-xl border p-5 bg-gray-50/60 shadow-xs space-y-3"
                          >
                            <div className="flex items-center justify-between">
                              <h4 className="font-bold text-gray-900">
                                Q{index + 1}. {q.question}
                              </h4>

                              <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-lg text-sm font-bold">
                                {q.marks} Marks
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-sm text-gray-700">
                              {q.options?.map((opt, oIdx) => (
                                <p
                                  key={oIdx}
                                  className={`p-2.5 rounded-xl border bg-white ${opt.isCorrect ? "border-green-500 bg-green-50/50 text-green-800 font-bold shadow-2xs" : ""}`}
                                >
                                  <strong>Option {oIdx + 1}:</strong> {opt.text}
                                </p>
                              ))}
                            </div>
                            <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-900">
                              <span className="font-bold">
                                Explanation Note:
                              </span>
                              <p className="mt-1 whitespace-pre-wrap italic text-amber-800">
                                {q.explanation ||
                                  "No explanation text added for this question block."}
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-gray-400 italic">
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
                      headerActions={
                        <div className="flex flex-wrap gap-2 shrink-0">
                          <button
                            onClick={commitLiveSurveyToModulePool}
                            disabled={savingSurvey}
                            className="rounded-xl bg-[#10B981] hover:bg-[#0fA773] px-4 py-2 text-white text-xs font-bold shadow-sm transition disabled:opacity-50"
                          >
                            {savingSurvey ? "Saving..." : "Save Survey"}
                          </button>

                          <button
                            onClick={() =>
                              inlineDeleteSurveyItem(selectedContent.data.id)
                            }
                            className="rounded-xl border border-red-200 bg-white text-red-500 hover:bg-red-50 p-2 text-xs font-semibold transition"
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
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-100 pb-5 gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-200 shadow-xs">
                          <ClipboardCheck size={24} />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-amber-600 uppercase tracking-widest bg-amber-50 border border-amber-100 rounded-full px-2.5 py-0.5">
                            {" "}
                            Saarthi Assignment
                          </span>
                          <h2 className="text-2xl font-bold text-gray-900 mt-1">
                            {selectedContent?.data?.title}
                          </h2>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button
                          onClick={() =>
                            handleEditAssignmentClick(selectedContent.data)
                          }
                          className="flex-1 sm:flex-none px-4 py-2 border border-gray-200 rounded-xl font-semibold text-sm text-gray-700 bg-white shadow-xs hover:bg-gray-50 transition flex items-center justify-center gap-1.5"
                        >
                          <Settings size={15} /> Edit
                        </button>
                        <button
                          onClick={() =>
                            deleteAssignment(selectedContent.data.id)
                          }
                          className="flex-1 sm:flex-none px-4 py-2 border border-transparent rounded-xl font-semibold text-sm text-white bg-red-600 shadow-sm hover:bg-red-700 transition flex items-center justify-center gap-1.5"
                        >
                          <Trash2 size={15} /> Delete
                        </button>
                      </div>
                    </div>

                    {/* Quick Stats Grid Overview */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-white border border-gray-100 shadow-xs rounded-2xl p-4 flex flex-col justify-between">
                        <span className="text-xs font-bold text-gray-400 uppercase">
                          Max Score
                        </span>
                        <span className="text-xl font-black text-[#1E1B4B] mt-1">
                          {selectedContent?.data?.max_marks}{" "}
                          <span className="text-xs font-normal text-gray-400">
                            marks
                          </span>
                        </span>
                      </div>
                      <div className="bg-white border border-gray-100 shadow-xs rounded-2xl p-4 flex flex-col justify-between">
                        <span className="text-xs font-bold text-gray-400 uppercase">
                          Passing Bench
                        </span>
                        <span className="text-xl font-black text-emerald-600 mt-1">
                          {selectedContent?.data?.passing_marks}{" "}
                          <span className="text-xs font-normal text-gray-400">
                            marks
                          </span>
                        </span>
                      </div>
                      <div className="bg-white border border-gray-100 shadow-xs rounded-2xl p-4 flex flex-col justify-between">
                        <span className="text-xs font-bold text-gray-400 uppercase">
                          Format
                        </span>
                        <span className="text-sm font-bold text-gray-700 mt-2 capitalize">
                          {selectedContent?.data?.submission_type === "file"
                            ? "📁 File Submission"
                            : selectedContent?.data?.submission_type === "text"
                              ? "📝 Text Answer"
                              : "💡 Hybrid Format"}
                        </span>
                      </div>
                      <div className="bg-white border border-gray-100 shadow-xs rounded-2xl p-4 flex flex-col justify-between">
                        <span className="text-xs font-bold text-gray-400 uppercase">
                          Target Due
                        </span>
                        <span className="text-xs font-bold text-amber-600 mt-2 flex items-center gap-1 truncate">
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
                      <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-5 space-y-2">
                        <h4 className="text-xs font-black text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Info size={14} /> Assignment Summary
                        </h4>
                        <p className="text-sm text-gray-666 leading-relaxed whitespace-pre-wrap">
                          {selectedContent?.data?.description ||
                            "No description summary context provided."}
                        </p>
                      </div>

                      <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-5 space-y-2">
                        <h4 className="text-xs font-black text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                          <BookOpen size={14} /> Detailed Instruction Deck
                        </h4>
                        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                          {selectedContent?.data?.instructions ||
                            "No custom evaluation task workflows established yet."}
                        </p>
                      </div>

                      {/* Expanded Compliance Information Box */}
                      <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-500">
                        <div className="space-y-1.5">
                          <span className="font-bold text-gray-700 block">
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
                          <span className="font-bold text-gray-700 block">
                            Upload Constraints
                          </span>
                          <p>
                            • Maximum Allowed Package Payload Size:{" "}
                            <span className="font-bold text-gray-700">
                              {selectedContent?.data?.max_file_size || 50} MB
                            </span>
                          </p>
                          {selectedContent?.data?.allow_late_submission && (
                            <p className="text-amber-700 font-medium">
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
              // No Content Selected - Show Module Editor
              <>
                <div className="border-b pb-5 mb-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#1E1B4B] to-[#3D3680] flex items-center justify-center shadow-lg shadow-[#1E1B4B]/20">
                      <Layers className="text-white" size={24} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-[#1E1B4B]">
                        {selectedModule
                          ? selectedModule.title
                          : "No Module Selected"}
                      </h2>
                      <p className="text-sm text-gray-500">
                        Attach course items here
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="relative">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                      Module Name
                    </label>
                    <input
                      value={selectedModule ? editModuleTitle : ""}
                      onChange={(e) => {
                        setEditModuleTitle(e.target.value);
                        setHasUnsavedChanges(true);
                      }}
                      className="w-full rounded-xl border-2 border-gray-200 p-4 bg-white font-semibold text-lg outline-none focus:border-[#1E1B4B] focus:ring-4 focus:ring-[#1E1B4B]/10 transition-all"
                      placeholder="Enter module name..."
                      disabled={!selectedModule}
                    />
                    {hasUnsavedChanges && (
                      <span className="absolute right-3 top-9 text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-full border border-amber-200">
                        Unsaved changes
                      </span>
                    )}
                  </div>

                  <div className="relative">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                      Module Description
                    </label>
                    <textarea
                      value={selectedModule ? editModuleDescription : ""}
                      onChange={(e) => {
                        setEditModuleDescription(e.target.value);
                        setHasUnsavedChanges(true);
                      }}
                      className="w-full rounded-xl border-2 border-gray-200 p-4 bg-white outline-none focus:border-[#1E1B4B] focus:ring-4 focus:ring-[#1E1B4B]/10 transition-all resize-none"
                      rows={3}
                      placeholder="Provide a general summary/description for this module..."
                      disabled={!selectedModule}
                    />
                  </div>

                  <div className="relative">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                      Module Completion Curos
                    </label>
                    <input
                      type="number"
                      value={selectedModule ? editModuleCuros : ""}
                      onChange={(e) => {
                        setEditModuleCuros(e.target.value);
                        setHasUnsavedChanges(true);
                      }}
                      className="w-full rounded-xl border-2 border-gray-200 p-4 bg-white font-semibold text-lg outline-none focus:border-[#1E1B4B] focus:ring-4 focus:ring-[#1E1B4B]/10 transition-all"
                      placeholder="Enter curos awarded for module completion"
                      disabled={!selectedModule}
                    />
                  </div>

                  {selectedModule && (
                    <div className="flex justify-end gap-3">
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
                        className="rounded-xl border-2 border-gray-200 px-5 py-2.5 text-gray-600 text-sm font-medium hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={updateModuleDetails}
                        disabled={savingModule}
                        className="rounded-xl bg-[#1E1B4B] px-6 py-2.5 text-white text-sm font-medium hover:bg-[#2D256B] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-[#1E1B4B]/20 flex items-center gap-2"
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
                    className="mt-4 rounded-xl border-2 border-dashed border-[#10B981] px-5 py-4 text-[#10B981] font-semibold w-full hover:bg-[#10B981]/5 transition-all flex items-center justify-center gap-2 group"
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
                          className="group-hover:rotate-90 transition-transform"
                        />
                        Add Core Content Items To Module
                      </>
                    )}
                  </button>

                  {showContentTypes && (
                    <div className="mt-4 grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 bg-gradient-to-br from-gray-50 to-white p-5 rounded-2xl border border-gray-200">
                      <button
                        onClick={() => setShowVideoModal(true)}
                        className="group bg-white rounded-xl border-2 border-gray-100 p-4 shadow-sm hover:border-[#10B981] hover:shadow-md transition-all text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center group-hover:bg-red-100 transition-colors">
                            <PlayCircle className="text-red-500" size={20} />
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-gray-800">
                              Video Lesson
                            </p>
                            <p className="text-xs text-gray-400">
                              YouTube content
                            </p>
                          </div>
                        </div>
                      </button>
                      <button
                        onClick={() => setShowWrittenLessonModal(true)}
                        className="group bg-white rounded-xl border-2 border-gray-100 p-4 shadow-sm hover:border-[#10B981] hover:shadow-md transition-all text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                            <BookOpen className="text-blue-500" size={20} />
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-gray-800">
                              Written Lesson
                            </p>
                            <p className="text-xs text-gray-400">
                              Text & PDF content
                            </p>
                          </div>
                        </div>
                      </button>
                      <button
                        onClick={() => setShowQuizModal(true)}
                        className="group bg-white rounded-xl border-2 border-gray-100 p-4 shadow-sm hover:border-[#10B981] hover:shadow-md transition-all text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center group-hover:bg-purple-100 transition-colors">
                            <ClipboardCheck
                              className="text-purple-500"
                              size={20}
                            />
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-gray-800">
                              Quiz Assessment
                            </p>
                            <p className="text-xs text-gray-400">
                              MCQ evaluations
                            </p>
                          </div>
                        </div>
                      </button>
                      <button
                        onClick={() => setShowSurveyChoiceModal(true)}
                        className="group bg-white rounded-xl border-2 border-gray-100 p-4 shadow-sm hover:border-[#10B981] hover:shadow-md transition-all text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center group-hover:bg-green-100 transition-colors">
                            <FileQuestion
                              className="text-green-500"
                              size={20}
                            />
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-gray-800">
                              Survey Block
                            </p>
                            <p className="text-xs text-gray-400">
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
                        className="group bg-white rounded-xl border-2 border-gray-100 p-4 shadow-sm hover:border-[#10B981] hover:shadow-md transition-all text-left sm:col-span-2 lg:col-span-1"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center group-hover:bg-amber-100 transition-colors">
                            <ClipboardCheck
                              className="text-amber-500"
                              size={20}
                            />
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-gray-800">
                              Assignment Deck
                            </p>
                            <p className="text-xs text-gray-400">
                              Task management
                            </p>
                          </div>
                        </div>
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ============ MODALS ============ */}

      {/* Written Lesson Modal */}
      {showWrittenLessonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs">
          <div className="w-[650px] rounded-3xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="mb-4 text-2xl font-bold text-gray-900">
              Add Written Lesson
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">
                  Lesson Title *
                </label>
                <input
                  value={writtenLessonTitle}
                  onChange={(e) => setWrittenLessonTitle(e.target.value)}
                  placeholder="E.g., Complete Object-Oriented Framework Overview"
                  className="w-full rounded-xl border p-3 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">
                  Lesson Markdown / Content Details *
                </label>
                <textarea
                  value={writtenLessonContent}
                  onChange={(e) => setWrittenLessonContent(e.target.value)}
                  rows={10}
                  placeholder="Type or paste core written notes documentation text inside this sheet viewport..."
                  className="w-full rounded-xl border p-3 text-sm"
                />
              </div>
              <div className="p-4 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 text-center">
                <label
                  className={`block ${uploadingNote ? "pointer-events-none opacity-60" : "cursor-pointer"}`}
                >
                  <span className="text-xs font-bold text-[#1E1B4B] block hover:underline">
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
                  <p className="text-xs text-green-600 mt-2 font-medium bg-green-50 rounded p-1 inline-block truncate max-w-full">
                    &check; Uploaded: {writtenLessonFile.name}
                  </p>
                )}
              </div>
              <div className="relative flex py-2 items-center font-bold text-xs text-gray-400">
                <div className="flex-grow border-t border-gray-300"></div>
                <span className="flex-shrink mx-4 uppercase">OR</span>
                <div className="flex-grow border-t border-gray-300"></div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">
                  Hosted PDF URL (optional)
                </label>
                <input
                  value={writtenLessonPdfUrl}
                  onChange={(e) => setWrittenLessonPdfUrl(e.target.value)}
                  placeholder="https://example.com/assets/handout.pdf"
                  className="w-full rounded-xl border p-3 text-sm"
                  disabled={!!writtenLessonFile || uploadingNote}
                />
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={() => {
                    setShowWrittenLessonModal(false);
                    setWrittenLessonTitle("");
                    setWrittenLessonContent("");
                    setWrittenLessonPdfUrl("");
                    setWrittenLessonFile(null);
                  }}
                  disabled={savingWrittenLesson || uploadingNote}
                  className="rounded-xl border px-4 py-2 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={saveWrittenLesson}
                  disabled={savingWrittenLesson || uploadingNote}
                  className="rounded-xl bg-[#10B981] px-5 py-2 text-white text-sm font-medium disabled:opacity-50"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs">
          <div className="w-[650px] rounded-3xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="mb-4 text-2xl font-bold text-gray-900">
              Add Video Lesson
            </h2>
            <div className="space-y-4">
              <input
                value={lessonTitle}
                onChange={(e) => setLessonTitle(e.target.value)}
                placeholder="Video Title"
                className="w-full rounded-xl border p-3 text-sm"
              />
              <textarea
                value={lessonDescription}
                onChange={(e) => setLessonDescription(e.target.value)}
                rows={2}
                placeholder="Brief Description Subtitle"
                className="w-full rounded-xl border p-3 text-sm"
              />
              <textarea
                value={videoExplanation}
                onChange={(e) => setVideoExplanation(e.target.value)}
                rows={4}
                placeholder="Write long descriptions / explanation text sheet records for this video session..."
                className="w-full rounded-xl border p-3 text-sm"
              />
              <input
                value={youtubeLink}
                onChange={(e) => setYoutubeLink(e.target.value)}
                placeholder="YouTube URL Link String"
                className="w-full rounded-xl border p-3 text-sm"
              />
              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={() => setShowVideoModal(false)}
                  disabled={savingVideo}
                  className="rounded-xl border px-4 py-2 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={saveVideoLesson}
                  disabled={savingVideo}
                  className="rounded-xl bg-[#10B981] px-5 py-2 text-white text-sm font-medium disabled:opacity-50"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto transition-all duration-300">
          <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl flex flex-col max-h-[92vh] border border-gray-100 overflow-hidden transform scale-100 animate-fadeIn">
            <div className="bg-[#1E1B4B] text-white px-6 py-4 flex items-center justify-between shadow-md">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
                  <ClipboardCheck className="text-emerald-400" size={22} />
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-tight">
                    Create New Assessment
                  </h2>
                  <p className="text-xs text-indigo-200">
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
                className="text-white/70 hover:text-white p-2 rounded-xl bg-white/5 hover:bg-white/10 transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-slate-50/50">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="md:col-span-2 space-y-4">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">
                      Quiz Assessment Title *
                    </label>
                    <input
                      value={quizTitle}
                      onChange={(e) => setQuizTitle(e.target.value)}
                      placeholder="Example: Final Module Technical Benchmark"
                      className="w-full rounded-xl border border-gray-200 p-3 text-sm outline-none focus:border-[#1E1B4B] focus:ring-2 focus:ring-indigo-100 bg-white font-medium text-gray-800 transition"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">
                      Core Description Overview
                    </label>
                    <textarea
                      value={quizDescription}
                      onChange={(e) => setQuizDescription(e.target.value)}
                      rows={2}
                      placeholder="Describe the assessment objectives, topics, and constraints..."
                      className="w-full rounded-xl border border-gray-200 p-3 text-sm outline-none focus:border-[#1E1B4B] focus:ring-2 focus:ring-indigo-100 bg-white text-gray-700 transition resize-none"
                    />
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-4 border border-gray-200 flex flex-col justify-between shadow-xs">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">
                      Passing Bench Criteria *
                    </label>
                    <div className="relative rounded-xl overflow-hidden shadow-2xs">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={passingPercentage}
                        onChange={(e) => setPassingPercentage(e.target.value)}
                        placeholder="70"
                        className="w-full rounded-xl border border-gray-200 p-3 pr-12 text-sm font-bold text-gray-800 outline-none focus:border-[#1E1B4B] transition"
                      />
                      <span className="absolute right-4 top-3 text-gray-400 text-sm font-bold">
                        %
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-xs text-emerald-800 flex items-start gap-2">
                    <Award
                      className="text-emerald-600 shrink-0 mt-0.5"
                      size={15}
                    />
                    <p>
                      Candidates scoring below{" "}
                      <span className="font-bold text-emerald-900">
                        {passingPercentage || "0"}%
                      </span>{" "}
                      will be flagged with a non-passing evaluation status.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3 shrink-0 shadow-lg">
              <button
                type="button"
                onClick={() => {
                  setShowQuizModal(false);
                  setQuizTitle("");
                  setQuizDescription("");
                  setPassingPercentage("");
                }}
                disabled={savingQuiz}
                className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-600 bg-white hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveQuiz}
                disabled={savingQuiz}
                className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 px-6 py-2.5 text-white text-sm font-bold shadow-md shadow-emerald-500/10 active:scale-98 transition-all flex items-center gap-2 disabled:opacity-50"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs">
          <div className="w-[750px] rounded-3xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto border">
            <h2 className="mb-1 text-2xl font-bold text-gray-900">
              Construct Evaluation Questions
            </h2>
            <p className="text-xs text-gray-400 mb-4 font-medium">
              Dynamically append multiple quiz questions with fluid individual
              choose options templates.
            </p>
            <div className="space-y-6">
              {quizQuestionsForm.map((question, qIndex) => (
                <div
                  key={qIndex}
                  className="p-5 border border-gray-200 bg-gray-50/50 rounded-2xl relative space-y-4"
                >
                  {quizQuestionsForm.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeQuestionFromForm(qIndex)}
                      className="absolute top-4 right-4 text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition"
                      title="Remove Question block"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-3">
                      <label className="text-xs font-bold text-gray-700 block mb-1">
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
                        placeholder="Type your main question text here..."
                        rows={2}
                        className="w-full rounded-xl border border-gray-300 p-3 text-sm bg-white outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-700 block mb-1">
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
                        placeholder="Marks"
                        className="w-full rounded-xl border border-gray-300 p-3 text-sm bg-white outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 block uppercase tracking-wider">
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
                          className="h-4 w-4 text-green-600 rounded cursor-pointer"
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
                          placeholder={`Option ${oIndex + 1}`}
                          className="flex-1 rounded-xl border border-gray-300 px-3 py-2 text-sm bg-white outline-none focus:border-blue-400"
                        />
                        {question.options.length > 2 && (
                          <button
                            type="button"
                            onClick={() =>
                              removeOptionFromQuestion(qIndex, oIndex)
                            }
                            className="text-gray-400 hover:text-red-500 transition"
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
                      className="text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition inline-flex items-center gap-1 mt-1"
                    >
                      + Add Option
                    </button>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-600 block mb-1">
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
                      placeholder="Add custom explanation/feedback text shown after incorrect answers..."
                      rows={2}
                      className="w-full rounded-xl border border-gray-300 p-3 text-sm bg-white outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              ))}
              <div className="flex justify-between items-center pt-4 border-t">
                <button
                  type="button"
                  onClick={addQuestionToForm}
                  className="rounded-xl border border-blue-600 text-blue-600 px-4 py-2 text-sm font-bold hover:bg-blue-50 transition"
                >
                  + Add Next Question Block
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowQuestionModal(false)}
                    disabled={savingQuestions}
                    className="rounded-xl border px-4 py-2 text-sm font-medium hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveQuestion}
                    disabled={savingQuestions}
                    className="rounded-xl bg-[#10B981] px-5 py-2 text-white text-sm font-bold shadow-sm hover:opacity-95 disabled:opacity-50"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs">
          <div className="w-[550px] rounded-2xl bg-white p-6 shadow-2xl border">
            <h3 className="text-xl font-bold mb-1 text-gray-900">
              Attach Lesson Document/PDF
            </h3>
            <p className="text-xs text-gray-400 mb-4">
              Upload docs directly or attach an online document web link to
              preview it instantly on the portal player frame.
            </p>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">
                  Document/Notes Title *
                </label>
                <input
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  placeholder="E.g., Complete SQL Notes PDF"
                  className="w-full rounded-xl border p-3 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">
                  Short Description Subtitle
                </label>
                <textarea
                  value={noteDescription}
                  onChange={(e) => setNoteDescription(e.target.value)}
                  placeholder="Brief summary of what this note covers..."
                  rows={2}
                  className="w-full rounded-xl border p-3 text-sm"
                />
              </div>
              <div className="p-4 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 text-center">
                <label
                  className={`block ${uploadingNote ? "pointer-events-none opacity-60" : "cursor-pointer"}`}
                >
                  <span className="text-xs font-bold text-[#1E1B4B] block hover:underline">
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
                  <p className="text-xs text-green-600 mt-2 font-medium bg-green-50 rounded p-1 inline-block truncate max-w-full">
                    &check; Uploaded: {noteFile.name}
                  </p>
                )}
              </div>
              <div className="relative flex py-2 items-center font-bold text-xs text-gray-400">
                <div className="flex-grow border-t border-gray-300"></div>
                <span className="flex-shrink mx-4 uppercase">OR</span>
                <div className="flex-grow border-t border-gray-300"></div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">
                  Online Document Web URL Link
                </label>
                <input
                  value={noteUrlLink}
                  onChange={(e) => setNoteUrlLink(e.target.value)}
                  placeholder="https://example.com/hosted_document.pdf"
                  className="w-full rounded-xl border p-3 text-sm"
                  disabled={!!noteFile || uploadingNote}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => {
                  setShowNotesModal(false);
                  setNoteTargetItem(null);
                  setNoteFile(null);
                  setNoteUrlLink("");
                }}
                className="border px-4 py-2 rounded-xl text-sm font-medium"
                disabled={uploadingNote}
              >
                Cancel
              </button>
              <button
                onClick={saveNotes}
                className="bg-[#10B981] text-white px-5 py-2 rounded-xl text-sm font-medium shadow-sm disabled:opacity-50"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-8 w-[700px]">
            <h3 className="text-xl font-bold mb-2 text-gray-900">
              Create New Survey Template
            </h3>
            <p className="text-xs text-gray-400 mb-4 font-medium">
              Initialize the header settings of your new Google Forms styled
              module entity block.
            </p>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-600 block mb-1">
                  Survey Form Title *
                </label>
                <input
                  type="text"
                  value={surveyTitle}
                  onChange={(e) => setSurveyTitle(e.target.value)}
                  placeholder="E.g., End-of-Course Feedback Survey"
                  className="w-full rounded-xl border border-gray-300 p-3 text-sm outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 block mb-1">
                  Description / Summary Instructions
                </label>
                <textarea
                  value={surveyDescription}
                  onChange={(e) => setSurveyDescription(e.target.value)}
                  placeholder="Provide high-level guidelines or operational context for respondents..."
                  rows={3}
                  className="w-full rounded-xl border border-gray-300 p-3 text-sm outline-none focus:border-purple-500 resize-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => {
                    setShowSurveyModal(false);
                    setSurveyTitle("");
                    setSurveyDescription("");
                  }}
                  className="border px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition"
                  disabled={savingSurvey}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateInitialSurvey}
                  disabled={savingSurvey}
                  className="bg-[#10B981] hover:bg-[#0fA773] text-white px-5 py-2 rounded-xl text-sm font-bold shadow-sm transition disabled:opacity-50"
                >
                  {savingSurvey ? "Creating..." : "Create Form Canvas"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assignment Modal */}
      {showAssignmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f172a]/40 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-3xl rounded-3xl bg-slate-50 shadow-2xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
            <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-200">
                  <ClipboardCheck size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">
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
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-xl transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              {/* Section 1 - Assignment Information */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 rounded px-2 py-0.5 uppercase tracking-wider">
                    Section 1
                  </span>
                  <h4 className="text-sm font-bold text-slate-700">
                    Assignment Information
                  </h4>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">
                      Assignment Title *
                    </label>
                    <input
                      value={assignmentTitle}
                      onChange={(e) => setAssignmentTitle(e.target.value)}
                      placeholder="React Authentication System"
                      className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all text-slate-800 placeholder-slate-400 bg-slate-50/50"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">
                      Short Description *
                    </label>
                    <input
                      value={assignmentDescription}
                      onChange={(e) => setAssignmentDescription(e.target.value)}
                      placeholder="Build a secure authentication system using React."
                      className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all text-slate-800 placeholder-slate-400 bg-slate-50/50"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      A concise snippet introducing the primary framework
                      requirements.
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">
                      Detailed Instructions *
                    </label>
                    <textarea
                      value={assignmentInstructions}
                      onChange={(e) =>
                        setAssignmentInstructions(e.target.value)
                      }
                      placeholder="Complete all tasks listed below..."
                      rows={4}
                      className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all text-slate-800 placeholder-slate-400 bg-slate-50/50 resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2 - Submission Settings */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 rounded px-2 py-0.5 uppercase tracking-wider">
                    Section 2
                  </span>
                  <h4 className="text-sm font-bold text-slate-700">
                    Submission Settings
                  </h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 flex items-center gap-1 mb-1">
                      <Calendar size={14} className="text-slate-400" /> Deadline
                      *
                    </label>
                    <input
                      type="datetime-local"
                      value={assignmentDeadline}
                      onChange={(e) => setAssignmentDeadline(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all text-slate-800 bg-slate-50/50"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">
                      Submission Type
                    </label>
                    <select
                      value={assignmentSubmissionType}
                      onChange={(e) =>
                        setAssignmentSubmissionType(e.target.value)
                      }
                      className="w-full rounded-xl border border-slate-200 p-3 text-sm bg-slate-50/50 text-slate-800 outline-none focus:border-indigo-500 transition-all cursor-pointer"
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
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 rounded px-2 py-0.5 uppercase tracking-wider">
                    Section 3
                  </span>
                  <h4 className="text-sm font-bold text-slate-700">
                    Evaluation Settings
                  </h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">
                      Maximum Marks
                    </label>
                    <input
                      type="number"
                      value={assignmentMaxMarks}
                      onChange={(e) => setAssignmentMaxMarks(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all text-slate-800 bg-slate-50/50"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">
                      Passing Marks
                    </label>
                    <input
                      type="number"
                      value={assignmentPassingMarks}
                      onChange={(e) =>
                        setAssignmentPassingMarks(e.target.value)
                      }
                      className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all text-slate-800 bg-slate-50/50"
                    />
                    <p className="text-[11px] text-rose-500 font-medium flex items-center gap-1 mt-1.5">
                      <ShieldAlert size={12} /> Students scoring below this
                      value will fail this assignment.
                    </p>
                  </div>
                </div>
              </div>

              {/* Section 4 - Upload Settings */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 rounded px-2 py-0.5 uppercase tracking-wider">
                    Section 4
                  </span>
                  <h4 className="text-sm font-bold text-slate-700">
                    Upload Settings
                  </h4>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">
                      Maximum File Size (MB)
                    </label>
                    <input
                      type="number"
                      value={maxFileSize}
                      onChange={(e) => setMaxFileSize(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all text-slate-800 bg-slate-50/50"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-2">
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
                            className={`px-3 py-1.5 rounded-full border text-xs font-bold transition-all flex items-center gap-1.5 ${
                              isSelected
                                ? "bg-indigo-600 border-indigo-600 text-white shadow-xs"
                                : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
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
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 rounded px-2 py-0.5 uppercase tracking-wider">
                    Section 5
                  </span>
                  <h4 className="text-sm font-bold text-slate-700">
                    Submission Rules
                  </h4>
                </div>

                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-slate-50 rounded-xl gap-4">
                    <div className="flex items-center justify-between flex-1">
                      <div>
                        <span className="text-xs font-bold text-slate-700 block">
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
                        className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 outline-none ${
                          allowMultipleFiles ? "bg-indigo-600" : "bg-slate-300"
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

                    <div className="hidden sm:block h-8 w-px bg-slate-200" />

                    <div className="flex items-center justify-between flex-1">
                      <div>
                        <span className="text-xs font-bold text-slate-700 block">
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
                        className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 outline-none ${
                          allowLateSubmission ? "bg-indigo-600" : "bg-slate-300"
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border border-amber-200 bg-amber-50/40 rounded-2xl animate-fadeIn">
                      <div>
                        <label className="text-xs font-bold text-slate-600 block mb-1">
                          Late Penalty
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            value={latePenalty}
                            onChange={(e) => setLatePenalty(e.target.value)}
                            placeholder="10%"
                            className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-indigo-500 bg-white text-slate-800"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-600 block mb-1">
                          Maximum Late Days
                        </label>
                        <input
                          type="number"
                          value={maxLateDays}
                          onChange={(e) =>
                            setMaxLateDays(Number(e.target.value))
                          }
                          placeholder="3"
                          className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-indigo-500 bg-white text-slate-800"
                        />
                        <p className="text-[11px] text-amber-700 font-medium flex items-center gap-1 mt-1.5">
                          <Clock size={12} /> Students can submit for only{" "}
                          {maxLateDays} days after the deadline.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Section 6 - Attempts */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 rounded px-2 py-0.5 uppercase tracking-wider">
                    Section 6
                  </span>
                  <h4 className="text-sm font-bold text-slate-700">Attempts</h4>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">
                    Attempts Allowed
                  </label>
                  <select
                    value={attemptsAllowed}
                    onChange={(e) => setAttemptsAllowed(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-3 text-sm bg-slate-50/50 text-slate-800 outline-none focus:border-indigo-500 transition-all cursor-pointer"
                  >
                    <option value="1">1 Attempt</option>
                    <option value="2">2 Attempts</option>
                    <option value="3">3 Attempts</option>
                    <option value="Unlimited">Unlimited</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-white border-t border-slate-200 px-6 py-4 flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setShowAssignmentModal(false);
                  resetAssignmentForm();
                }}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 border border-transparent transition-all"
                disabled={savingAssignment}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={saveAssignment}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-700 bg-white border border-slate-300 shadow-xs hover:bg-slate-50 transition-all"
                disabled={savingAssignment}
              >
                Save Draft
              </button>

              <button
                type="button"
                onClick={saveAssignment}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-md shadow-emerald-500/20 active:scale-98 transition-all flex items-center gap-1.5"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-3xl p-8 w-[700px]">
            <h2 className="text-2xl font-bold mb-6">Create Survey</h2>
            <div className="grid grid-cols-2 gap-6">
              <div
                onClick={() => {
                  setShowSurveyChoiceModal(false);
                  setShowSurveyModal(true);
                }}
                className="cursor-pointer border rounded-2xl p-6 hover:border-blue-600"
              >
                <h3 className="font-bold text-lg">Create Blank Survey</h3>
                <p className="text-sm text-gray-500 mt-2">
                  Start with an empty survey.
                </p>
              </div>

              <div
                onClick={() => {
                  setShowSurveyChoiceModal(false);
                  setShowSurveyGallery(true);
                }}
                className="cursor-pointer border rounded-2xl p-6 hover:border-green-600"
              >
                <h3 className="font-bold text-lg">Reuse Existing Survey</h3>
                <p className="text-sm text-gray-500 mt-2">
                  Browse all previously created surveys.
                </p>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowSurveyChoiceModal(false)}
                className="px-4 py-2 border rounded-xl"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-[90%] max-w-5xl max-h-[85vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-2xl font-bold">Quiz Results</h2>
              <button
                onClick={() => setShowResultModal(false)}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
              >
                Close
              </button>
            </div>

            {loadingResults ? (
              <div className="text-center py-8">Loading...</div>
            ) : (
              <table className="w-full border border-gray-300">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border p-2">Attempt</th>
                    <th className="border p-2">Candidate</th>
                    <th className="border p-2">Score</th>
                    <th className="border p-2">Percentage</th>
                    <th className="border p-2">Result</th>
                  </tr>
                </thead>

                <tbody>
                  {quizResults?.results?.length > 0 ? (
                    quizResults.results.map((result) => (
                      <tr key={result.attempt_id}>
                        <td className="border p-2 text-center">
                          {result.attempt_number}
                        </td>
                        <td className="border p-2">{result.candidate_name}</td>
                        <td className="border p-2 text-center">
                          {result.score} / {result.total_marks}
                        </td>
                        <td className="border p-2 text-center">
                          {result.percentage}%
                        </td>
                        <td className="border p-2 text-center">
                          {result.passed ? (
                            <span className="text-green-600 font-semibold">
                              Passed
                            </span>
                          ) : (
                            <span className="text-red-600 font-semibold">
                              Failed
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="text-center p-6 text-gray-500">
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
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fadeIn"
          onClick={() => setPreviewTemplateUrl(null)}
        >
          <div
            className="bg-white rounded-3xl p-4 shadow-2xl w-full max-w-2xl transform scale-100 transition-all relative border border-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPreviewTemplateUrl(null)}
              className="absolute top-4 right-4 bg-slate-900 text-white hover:bg-slate-800 p-2 rounded-xl transition shadow-md z-10"
            >
              <X size={16} />
            </button>
            <div className="rounded-2xl overflow-hidden border border-slate-100 bg-slate-50 max-h-[70vh] flex items-center justify-center shadow-inner">
              {previewTemplateUrl === "placeholder" ? (
                <div className="text-center py-20 px-6">
                  <span className="text-6xl block mb-2">📊</span>
                  <h3 className="text-lg font-bold text-slate-800">
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
              <span className="bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-md">
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
