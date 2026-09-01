import {
  createProgram,
  uploadProgramThumbnail,
  updateRetentionQuiz,
  updateApplicationCheck,
} from "../../services/programService";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from "../../layout/mainLayout";
import SurveyQuestionBuilder from "./surveyQuestionBuilder";
import {
  PlayCircle,
  Award,
  FileQuestion,
  Clock,
  Lock,
  Star,
  Calendar,
  Tag,
  Globe,
  Layers,
  Target,
  CheckCircle,
  Upload,
  Loader2,
  RefreshCw,
  Plus,
  Trash2,
  X,
} from "lucide-react";

const RequiredMark = () => (
  <span className="text-red-500 ml-0.5" aria-hidden="true">
    *
  </span>
);

const CreatePrograms = () => {
  const navigate = useNavigate();
  const [programName, setProgramName] = useState("");
  const [description, setDescription] = useState("");
  const [videoLink, setVideoLink] = useState("");
  const [videos, setVideos] = useState([]);

  const [thumbnail, setThumbnail] = useState(null);
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [status, setStatus] = useState("Draft");

  const [programType, setProgramType] = useState("Mandatory");
  const [duration, setDuration] = useState("");
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");

  const [unlockType, setUnlockType] = useState("Immediate");
  const [unlockDays, setUnlockDays] = useState(0);

  const [language, setLanguage] = useState("English");
  const [categories, setCategories] = useState([]);
  const [categoryInput, setCategoryInput] = useState("");

  const [programCuros, setProgramCuros] = useState("");

  const [retentionUnlockDays, setRetentionUnlockDays] = useState(15);

  const [retentionDueDays, setRetentionDueDays] = useState(7);

  const [retentionPassing, setRetentionPassing] = useState(80);

  const [retentionQuizCuros, setRetentionQuizCuros] = useState("");

  const [appCheckCuros, setAppCheckCuros] = useState({
    a1: "",
    a2: "",
    a3: "",
  });

  // Retention Quiz independent state (namespaced to avoid collisions)
  const [showRetentionQuestionModal, setShowRetentionQuestionModal] =
    useState(false);
  const [retentionQuizQuestionsForm, setRetentionQuizQuestionsForm] = useState([
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

  const [retentionSavedQuestions, setRetentionSavedQuestions] = useState([]);

  // Application Check surveys: independent state for 3 checks
  const [showAppCheckModal, setShowAppCheckModal] = useState({
    a1: false,
    a2: false,
    a3: false,
  });
  const [activeAppCheckKey, setActiveAppCheckKey] = useState(null);

  const [appCheckTitle, setAppCheckTitle] = useState({
    a1: "",
    a2: "",
    a3: "",
  });
  const [appCheckDescription, setAppCheckDescription] = useState({
    a1: "",
    a2: "",
    a3: "",
  });

  const [appCheckQuestions, setAppCheckQuestions] = useState({
    a1: [{ question: "", type: "Short Answer", required: false, options: [] }],
    a2: [{ question: "", type: "Short Answer", required: false, options: [] }],
    a3: [{ question: "", type: "Short Answer", required: false, options: [] }],
  });

  const [appCheckSaved, setAppCheckSaved] = useState({
    a1: [],
    a2: [],
    a3: [],
  });

  const getAppQuestions = (key) => appCheckQuestions[key] || [];

  const setAppQuestions = (key, questions) =>
    setAppCheckQuestions((prev) => ({ ...prev, [key]: questions }));

  const openAppCheckEditor = (key) => {
    setActiveAppCheckKey(key);
    setShowAppCheckModal((s) => ({ ...s, [key]: true }));
  };

  const closeAppCheckEditor = (key) => {
    setShowAppCheckModal((s) => ({ ...s, [key]: false }));
    setActiveAppCheckKey(null);
  };

  const handleAppCheckTitleChange = (key, value) => {
    setAppCheckTitle((prev) => ({ ...prev, [key]: value }));
  };

  const handleAppCheckDescriptionChange = (key, value) => {
    setAppCheckDescription((prev) => ({ ...prev, [key]: value }));
  };

  const handleAppCheckQuestionsChange = (key, questions) => {
    setAppQuestions(key, questions);
  };

  const commitAppCheckSurvey = async (key) => {
    const questions = getAppQuestions(key);
    for (let i = 0; i < questions.length; i++) {
      if (!questions[i].question.trim()) {
        alert(`Question ${i + 1} is empty.`);
        return;
      }
    }

    const checkNumber = key === "a1" ? 1 : key === "a2" ? 2 : 3;
    const payload = {
      questions: questions.map((q, index) => ({
        question: q.question,
        display_order: index + 1,
      })),
    };

    try {
      setAppCheckSaved((prev) => ({
        ...prev,
        [key]: questions.map((q) => ({ ...q })),
      }));
      setAppQuestions(key, [
        { question: "", type: "Short Answer", required: false, options: [] },
      ]);
      setShowAppCheckModal((s) => ({ ...s, [key]: false }));
      setActiveAppCheckKey(null);
      alert("Application Check saved successfully.");
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  };

  const addRetentionQuestionToForm = () => {
    setRetentionQuizQuestionsForm([
      ...retentionQuizQuestionsForm,
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

  const addRetentionOptionToQuestion = (qIndex) => {
    const updated = [...retentionQuizQuestionsForm];
    updated[qIndex].options.push({ text: "", isCorrect: false });
    setRetentionQuizQuestionsForm(updated);
  };

  const removeRetentionQuestionFromForm = (qIndex) => {
    setRetentionQuizQuestionsForm(
      retentionQuizQuestionsForm.filter((_, i) => i !== qIndex),
    );
  };

  const handleRetentionQuestionTextChange = (qIndex, field, value) => {
    const updated = [...retentionQuizQuestionsForm];
    updated[qIndex][field] = value;
    setRetentionQuizQuestionsForm(updated);
  };

  const removeRetentionOptionFromQuestion = (qIndex, oIndex) => {
    const updated = [...retentionQuizQuestionsForm];
    updated[qIndex].options = updated[qIndex].options.filter(
      (_, i) => i !== oIndex,
    );
    setRetentionQuizQuestionsForm(updated);
  };

  const handleRetentionOptionDataChange = (qIndex, oIndex, field, value) => {
    const updated = [...retentionQuizQuestionsForm];
    if (field === "isCorrect") {
      updated[qIndex].options = updated[qIndex].options.map((opt, idx) => ({
        ...opt,
        isCorrect: idx === oIndex,
      }));
    } else {
      updated[qIndex].options[oIndex][field] = value;
    }
    setRetentionQuizQuestionsForm(updated);
  };

  const saveRetentionQuestions = async () => {
    for (let i = 0; i < retentionQuizQuestionsForm.length; i++) {
      const q = retentionQuizQuestionsForm[i];
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

    const payload = {
      questions: retentionQuizQuestionsForm.map((q, index) => {
        const correctIndex = q.options.findIndex((opt) => opt.isCorrect);

        const answerLetter =
          correctIndex === 0
            ? "A"
            : correctIndex === 1
              ? "B"
              : correctIndex === 2
                ? "C"
                : correctIndex === 3
                  ? "D"
                  : "";

        return {
          question: q.questionText,
          option_a: q.options[0]?.text || "",
          option_b: q.options[1]?.text || "",
          option_c: q.options[2]?.text || "",
          option_d: q.options[3]?.text || "",
          correct_answer: answerLetter,
          explanation: q.explanation || "",
          display_order: index + 1,
        };
      }),
    };

    console.log("Retention Quiz save payload", {
      currentProgramId: null,
      payload,
    });

    try {
      setRetentionSavedQuestions(
        retentionQuizQuestionsForm.map((q) => ({
          questionText: q.questionText,
          marks: Number(q.marks),
          options: q.options.map((o) => ({
            text: o.text,
            isCorrect: o.isCorrect,
          })),
          explanation: q.explanation || "",
        })),
      );

      setRetentionQuizQuestionsForm([
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

      setShowRetentionQuestionModal(false);
      alert("Retention Quiz saved successfully.");
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  };

  const addVideo = () => {
    if (!videoLink.trim()) return;

    setVideos([
      ...videos,
      {
        id: Date.now(),
        title: `Video ${videos.length + 1}`,
        url: videoLink,
        thumbnail: getYoutubeThumbnail(videoLink),
      },
    ]);

    setVideoLink("");
  };

  const getYoutubeThumbnail = (url) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/);

    return match ? `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg` : "";
  };

  const handleAddTag = (e) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleAddCategory = (e) => {
    if (e.key === "Enter" && categoryInput.trim()) {
      e.preventDefault();
      if (!categories.includes(categoryInput.trim())) {
        setCategories([...categories, categoryInput.trim()]);
      }
      setCategoryInput("");
    }
  };

  const handleRemoveCategory = (categoryToRemove) => {
    setCategories(
      categories.filter((category) => category !== categoryToRemove),
    );
  };

  const handleThumbnailUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      alert("Please upload a JPG, PNG, or WebP image.");
      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Thumbnail size must be 5 MB or less.");
      e.target.value = "";
      return;
    }

    try {
      setIsUploading(true);

      const publicUrl = await uploadProgramThumbnail(file);
      setThumbnailUrl(publicUrl);
      alert("Thumbnail uploaded successfully!");
    } catch (error) {
      console.error("Error uploading thumbnail:", error.message);
      alert(error.message || "Failed to upload image.");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const handleVideoTitleChange = (id, title) => {
    setVideos(
      videos.map((video) => (video.id === id ? { ...video, title } : video)),
    );
  };

  const validateForm = () => {
    if (!programName.trim()) {
      alert("Program Name is required.");
      return false;
    }

    if (!programType.trim()) {
      alert("Program Type is required.");
      return false;
    }

    if (unlockType === "After Days" && Number(unlockDays) <= 0) {
      alert("Unlock After Days is required when unlock type is After Days.");
      return false;
    }

    return true;
  };

  const handleCreateProgram = async () => {
    if (isUploading) {
      alert("Please wait for the thumbnail upload to finish.");
      return;
    }

    if (!validateForm()) return;

    try {
      const payload = {
        name: programName,
        description,
        type: programType,
        duration,
        language,
        category: categories.join(","),
        tags: tags.join(","),
        status,
        unlock_type: unlockType,
        unlock_days: Number(unlockDays),
        thumbnail: thumbnailUrl,
        curos: Number(programCuros) || 0,
      };

      const createdProgram = await createProgram(payload);
      console.log("Created Program:", createdProgram);

      console.log("Retention Saved Questions:", retentionSavedQuestions);

      console.log("Application Saved:", appCheckSaved);
      // Persist any retention quiz questions saved in the create flow
      try {
        if (retentionSavedQuestions && retentionSavedQuestions.length > 0) {
          const retentionPayload = {
            curos: Number(retentionQuizCuros) || 0,
            questions: retentionSavedQuestions.map((q, index) => ({
              question: q.questionText,
              option_a: q.options[0]?.text || "",
              option_b: q.options[1]?.text || "",
              option_c: q.options[2]?.text || "",
              option_d: q.options[3]?.text || "",
              correct_answer: (() => {
                const correctIdx = q.options.findIndex((o) => o.isCorrect);
                return correctIdx === 0
                  ? "A"
                  : correctIdx === 1
                    ? "B"
                    : correctIdx === 2
                      ? "C"
                      : correctIdx === 3
                        ? "D"
                        : "";
              })(),
              explanation: q.explanation || "",
              display_order: index + 1,
            })),
          };

          console.log("Retention Payload", retentionPayload);
          await updateRetentionQuiz(createdProgram.id, retentionPayload);
        }

        // Persist application checks saved in the create flow
        const appKeys = ["a1", "a2", "a3"];
        for (let i = 0; i < appKeys.length; i++) {
          const key = appKeys[i];
          const saved = appCheckSaved && appCheckSaved[key];
          if (saved && saved.length > 0) {
            const appPayload = {
              curos: Number(appCheckCuros[key]) || 0,
              questions: saved.map((q, index) => ({
                question: q.question,
                display_order: index + 1,
              })),
            };
            await updateApplicationCheck(createdProgram.id, i + 1, appPayload);
          }
        }
      } catch (err) {
        console.error(
          "Failed to persist validation checks during program creation",
          err,
        );
        // don't block navigation; show a warning
        alert(
          "Program created but saving validation questions failed. You can add them from Program Details.",
        );
      }

      navigate(`/programs/${createdProgram.id}`);
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="rounded-2xl bg-white p-8 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="rounded-lg bg-slate-100 p-2.5">
              <PlayCircle className="text-slate-600" size={24} />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">
              Create Program
            </h1>
          </div>
          <p className="text-sm text-slate-500 leading-relaxed">
            Create and configure a new learning program with custom settings,
            rewards, and access controls.
          </p>
        </div>

        {/* Program Info */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="rounded-lg bg-slate-100 p-2">
              <FileQuestion className="text-slate-600" size={20} />
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              Program Information
            </h2>
          </div>

          <p className="mb-6 text-xs text-slate-500">
            Fields marked with <span className="text-red-500">*</span> are
            required.
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block mb-2 font-medium text-slate-700 text-sm">
                Program Name
                <RequiredMark />
              </label>

              <input
                value={programName}
                onChange={(e) => setProgramName(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-900 placeholder:text-slate-400 transition-all duration-150 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/10 outline-none"
                placeholder="Enter program name"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block mb-2 font-medium text-slate-700 text-sm">
                Description
              </label>

              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-900 placeholder:text-slate-400 transition-all duration-150 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/10 outline-none resize-none"
                placeholder="Enter description"
              />
            </div>

            <div>
              <label className="block mb-2 font-medium text-slate-700 text-sm">
                Program Type
                <RequiredMark />
              </label>

              <select
                value={programType}
                onChange={(e) => setProgramType(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-900 transition-all duration-150 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/10 outline-none"
              >
                <option>Mandatory</option>
                <option>Optional</option>
              </select>
            </div>

            <div>
              <label className="block mb-2 font-medium text-slate-700 text-sm">
                Duration
              </label>

              <input
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-900 placeholder:text-slate-400 transition-all duration-150 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/10 outline-none"
                placeholder="Example: 2 Hours"
              />
            </div>

            <div>
              <label className="block mb-2 font-medium text-slate-700 text-sm">
                Language
              </label>

              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-900 transition-all duration-150 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/10 outline-none"
              >
                <option>English</option>
                <option>Hindi</option>
                <option>Marathi</option>
                <option>Multiple</option>
              </select>
            </div>

            <div>
              <label className="block mb-2 font-medium text-slate-700 text-sm">
                Category
              </label>

              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-1 bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm"
                    >
                      <span>{cat}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveCategory(cat)}
                        className="hover:text-indigo-900"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
                <input
                  value={categoryInput}
                  onChange={(e) => setCategoryInput(e.target.value)}
                  onKeyDown={handleAddCategory}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-900 placeholder:text-slate-400 transition-all duration-150 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/10 outline-none"
                  placeholder="Type category and press Enter (e.g., Recruitment, Sales)"
                />
              </div>
            </div>

            <div>
              <label className="block mb-2 font-medium text-slate-700 text-sm">
                Program Completion Curos
              </label>

              <input
                value={programCuros}
                onChange={(e) => setProgramCuros(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-900 placeholder:text-slate-400 transition-all duration-150 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/10 outline-none"
                placeholder="Enter Curos"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block mb-2 font-medium text-slate-700 text-sm">
                Tags
              </label>

              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm"
                    >
                      <span>{tag}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-green-900"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
                <input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-900 placeholder:text-slate-400 transition-all duration-150 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/10 outline-none"
                  placeholder="Type tag and press Enter (e.g., Sales, Leadership)"
                />
              </div>
            </div>

            <div>
              <label className="block mb-2 font-medium text-slate-700 text-sm">
                Status
              </label>

              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-900 transition-all duration-150 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/10 outline-none"
              >
                <option>Draft</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block mb-2 font-medium text-slate-700 text-sm">
                Program Thumbnail
              </label>

              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailUpload}
                  className="w-full rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-900 transition-all duration-150 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/10 outline-none cursor-pointer hover:border-indigo-300 opacity-0 absolute inset-0 z-10"
                />
                <div className="w-full rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 p-4 flex items-center justify-center min-h-[56px]">
                  {isUploading ? (
                    <Loader2
                      className="text-indigo-500 animate-spin"
                      size={20}
                    />
                  ) : (
                    <div className="flex items-center gap-2 text-slate-400">
                      <Upload size={20} />
                      <span className="text-sm">
                        Click or drag to upload thumbnail
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {thumbnailUrl && (
                <div className="mt-3">
                  <p className="text-xs text-slate-500 mb-2">
                    Thumbnail Preview:
                  </p>
                  <img
                    src={thumbnailUrl}
                    alt="Thumbnail preview"
                    className="w-32 h-32 object-cover rounded-lg border border-slate-200"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="rounded-lg bg-slate-100 p-2">
              <Lock className="text-slate-600" size={20} />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Access Control</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            <div>
              <label className="block mb-2 font-medium text-slate-700 text-sm">
                Unlock Type
                <RequiredMark />
              </label>

              <select
                value={unlockType}
                onChange={(e) => setUnlockType(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-900 transition-all duration-150 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/10 outline-none"
              >
                <option>Immediate</option>
                <option>After Days</option>
              </select>
            </div>

            <div>
              <label className="block mb-2 font-medium text-slate-700 text-sm">
                Unlock After Days
                {unlockType === "After Days" && <RequiredMark />}
              </label>

              <input
                type="number"
                min={unlockType === "After Days" ? 1 : 0}
                value={unlockDays}
                onChange={(e) => setUnlockDays(e.target.value)}
                required={unlockType === "After Days"}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-900 placeholder:text-slate-400 transition-all duration-150 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/10 outline-none"
                placeholder={
                  unlockType === "After Days" ? "Enter number of days" : "N/A"
                }
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="rounded-lg bg-slate-100 p-2">
              <Target className="text-slate-600" size={20} />
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              Retention Quiz Configuration
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            <div>
              <label className="block mb-2 font-medium text-slate-700 text-sm">
                Retention Quiz Curos
              </label>
              <input
                value={retentionQuizCuros}
                onChange={(e) => setRetentionQuizCuros(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-900 placeholder:text-slate-400 transition-all duration-150 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/10 outline-none"
                placeholder="Enter Curos"
              />
            </div>
            <div className="md:col-span-3 mt-3">
              <label className="block mb-2 font-medium text-slate-700 text-sm">
                Retention Quiz Questions
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowRetentionQuestionModal(true)}
                  className="rounded-xl border border-blue-600 px-4 py-2 text-sm font-bold transition text-blue-600 hover:bg-blue-50"
                >
                  Manage Retention Quiz Questions
                </button>
                <div className="text-sm text-slate-500">
                  {retentionSavedQuestions.length} saved question(s)
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="rounded-lg bg-slate-100 p-2">
              <Calendar className="text-slate-600" size={20} />
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              Application Check Configuration
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                key: "a1",
                label: "Month 1 Check",
                description: "First application milestone",
                saved: appCheckSaved.a1.length,
              },
              {
                key: "a2",
                label: "Month 2 Check",
                description: "Second application milestone",
                saved: appCheckSaved.a2.length,
              },
              {
                key: "a3",
                label: "Month 3 Check",
                description: "Third application milestone",
                saved: appCheckSaved.a3.length,
              },
            ].map((card) => (
              <div
                key={card.key}
                role="button"
                tabIndex={0}
                onClick={() => openAppCheckEditor(card.key)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    openAppCheckEditor(card.key);
                  }
                }}
                className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-center transition cursor-pointer hover:border-blue-400 hover:bg-blue-50/40"
              >
                <div className="rounded-full bg-slate-200 w-12 h-12 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="text-slate-600" size={24} />
                </div>
                <h3 className="font-semibold mb-1 text-slate-900">
                  {card.label}
                </h3>
                <p className="text-xs text-slate-500">{card.description}</p>
                <div className="mt-3 mb-2">
                  <label className="block mb-1 font-medium text-slate-700 text-xs">
                    Curos
                  </label>
                  <input
                    type="number"
                    value={appCheckCuros[card.key]}
                    onChange={(e) => {
                      e.stopPropagation();
                      setAppCheckCuros((prev) => ({
                        ...prev,
                        [card.key]: e.target.value,
                      }));
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full rounded-lg border border-slate-200 bg-white p-2 text-sm text-slate-900 placeholder:text-slate-400 transition-all duration-150 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none"
                    placeholder="Enter Curos"
                  />
                </div>
                <div className="flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openAppCheckEditor(card.key);
                    }}
                    className="rounded-xl border border-blue-600 px-3 py-1.5 text-sm font-bold transition text-blue-600 hover:bg-blue-50"
                  >
                    Manage
                  </button>
                  <div className="text-xs text-slate-500">
                    {card.saved} saved
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {showRetentionQuestionModal && (
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
                {retentionQuizQuestionsForm.map((question, qIndex) => (
                  <div
                    key={qIndex}
                    className="p-5 border border-gray-200 bg-gray-50/50 rounded-2xl relative space-y-4"
                  >
                    {retentionQuizQuestionsForm.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeRetentionQuestionFromForm(qIndex)}
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
                            handleRetentionQuestionTextChange(
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
                            handleRetentionQuestionTextChange(
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
                        Dynamic Options Options
                      </label>
                      {question.options.map((option, oIndex) => (
                        <div key={oIndex} className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={option.isCorrect}
                            onChange={(e) =>
                              handleRetentionOptionDataChange(
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
                              handleRetentionOptionDataChange(
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
                                removeRetentionOptionFromQuestion(
                                  qIndex,
                                  oIndex,
                                )
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
                        onClick={() => addRetentionOptionToQuestion(qIndex)}
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
                          handleRetentionQuestionTextChange(
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
                    onClick={addRetentionQuestionToForm}
                    className="rounded-xl border border-blue-600 text-blue-600 px-4 py-2 text-sm font-bold hover:bg-blue-50 transition"
                  >
                    + Add Next Question Block
                  </button>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowRetentionQuestionModal(false)}
                      className="rounded-xl border px-4 py-2 text-sm font-medium hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveRetentionQuestions}
                      className="rounded-xl bg-[#10B981] px-5 py-2 text-white text-sm font-bold shadow-sm hover:opacity-95"
                    >
                      {`Inject Form Questions (${retentionQuizQuestionsForm.length})`}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeAppCheckKey && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs">
            <div className="w-[920px] max-w-[95vw] rounded-3xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto border">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="mb-1 text-2xl font-bold text-gray-900">
                    {activeAppCheckKey === "a1"
                      ? "Application Check 1"
                      : activeAppCheckKey === "a2"
                        ? "Application Check 2"
                        : "Application Check 3"}
                  </h2>
                  <p className="text-xs text-gray-400 font-medium">
                    Create open-ended questions for this application milestone.
                  </p>
                </div>
                <button
                  onClick={() => closeAppCheckEditor(activeAppCheckKey)}
                  className="text-gray-400 hover:text-gray-700"
                >
                  <X />
                </button>
              </div>

              <SurveyQuestionBuilder
                title={appCheckTitle[activeAppCheckKey]}
                description={appCheckDescription[activeAppCheckKey]}
                onTitleChange={(value) =>
                  handleAppCheckTitleChange(activeAppCheckKey, value)
                }
                onDescriptionChange={(value) =>
                  handleAppCheckDescriptionChange(activeAppCheckKey, value)
                }
                questions={getAppQuestions(activeAppCheckKey)}
                onQuestionsChange={(questions) =>
                  handleAppCheckQuestionsChange(activeAppCheckKey, questions)
                }
                onSave={() => commitAppCheckSurvey(activeAppCheckKey)}
                onCancel={() => closeAppCheckEditor(activeAppCheckKey)}
                heading={
                  activeAppCheckKey === "a1"
                    ? "Application Check 1"
                    : activeAppCheckKey === "a2"
                      ? "Application Check 2"
                      : "Application Check 3"
                }
                subtitle="Create open-ended questions for this application milestone."
                saveLabel="Save Questions"
                emptyStateTitle="This application check currently contains zero questions."
                emptyStateButton="Add First Question"
                isAppCheck={true}
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4">
          <button
            onClick={handleCreateProgram}
            disabled={isUploading}
            className="rounded-lg border border-slate-200 px-5 py-2.5 font-medium text-slate-700 hover:bg-slate-50 transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isUploading ? "Uploading Thumbnail..." : "Save Draft"}
          </button>
        </div>
      </div>
    </MainLayout>
  );
};

export default CreatePrograms;
