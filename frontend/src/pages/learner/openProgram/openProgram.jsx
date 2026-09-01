import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../../utils/axios";
import MainLayout from "../../../layout/mainLayout";
import {
  ArrowLeft,
  BookOpen,
  PlayCircle,
  Clock,
  Award,
  CheckCircle,
  Lock,
  Zap,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Hourglass,
  XCircle,
} from "lucide-react";


import {
  API_BASE_URL,
} from "./dummyData";

import VideoContent from "./videoContent";
import QuizContent from "./quizContent";
import ReadingContent from "./readingContent";
import SurveyContent from "./surveyContent";
import DocumentContent from "./documentContent";

const OpenProgram = () => {
  const { programId } = useParams();
  const navigate = useNavigate();
  const userId = Number(localStorage.getItem("user_id"));
  const [refreshKey, setRefreshKey] = useState(0);

  // Uses type + id so items of different types sharing the same numeric id
  // (e.g. a video with id 1 and a quiz with id 1) still get unique keys.
  const getContentKey = (content) => {
    const type = content.type?.toLowerCase();
    console.log(`getContentKey for content ${content.id}: type=${type}, key=${type}-${content.id}`);
    return `${type}-${content.id}`;
  };

  const [program, setProgram] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedModule, setSelectedModule] = useState(null);
  const [selectedContent, setSelectedContent] = useState(null);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState(null);
  const [expandedModules, setExpandedModules] = useState({});
  const [contentProgress, setContentProgress] = useState({});
  const [programMilestones, setProgramMilestones] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch program and progress data
  const fetchProgramData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch program data
      const programResponse = await api.get(`/programs/${programId}`);

      // Transform backend program data to match frontend structure
      const backendProgram = programResponse.data;
      const transformedProgram = {
        id: backendProgram.id,
        name: backendProgram.name,
        description: backendProgram.description,
        category: backendProgram.category || "General",
        duration: backendProgram.duration || "Self-paced",
        program_curos: backendProgram.program_curos || 0,
        is_mandatory: backendProgram.type?.toLowerCase() === "mandatory",
        modules: [],
      };

      // Transform modules from backend structure - preserve hierarchy
      if (backendProgram.modules) {
        backendProgram.modules.forEach((module) => {
          const transformedModule = {
            id: module.id,
            title: module.title,
            description: module.description,
            module_order: module.module_order,
            is_active: module.is_active,
            content: [],
          };

          // Add videos as content items
          if (module.videos && module.videos.length > 0) {
            module.videos.forEach((video) => {
              transformedModule.content.push({
                id: video.id,
                type: "video",
                title: video.title,
                description: video.description || video.explanation_text || "",
                duration: video.duration || "10 min",
                points: 15,
                youtube_url: video.youtube_url,
                thumbnail_url: video.thumbnail_url,
                documents: video.documents || [],
                content_order: video.content_order,
              });
            });
          }

          // Add quizzes as content items
          if (module.quizzes && module.quizzes.length > 0) {
            module.quizzes.forEach((quiz) => {
              transformedModule.content.push({
                id: quiz.id,
                type: "quiz",
                title: quiz.title,
                description: quiz.description || "",
                duration: "15 min",
                points: 20,
                questions: quiz.questions || [],
                passing_percentage: quiz.passing_percentage,
                content_order: quiz.content_order,
              });
            });
          }

          // Add written lessons as content items
          if (module.written_lessons && module.written_lessons.length > 0) {
            module.written_lessons.forEach((lesson) => {
              transformedModule.content.push({
                id: lesson.id,
                type: "written_lesson", // Standardized
                title: lesson.title,
                description: lesson.content || "",
                duration: "20 min",
                points: 15,
                pdf_url: lesson.pdf_url,
                content_order: lesson.content_order,
              });
            });
          }

          // Add surveys as content items
          if (module.survey_forms && module.survey_forms.length > 0) {
            module.survey_forms.forEach((survey) => {
              transformedModule.content.push({
                id: survey.id,
                type: "survey",
                title: survey.title,
                description: survey.description || "",
                duration: "10 min",
                points: 10,
                questions: survey.questions || [],
                content_order: survey.content_order,
              });
            });
          } else if (module.surveys && module.surveys.length > 0) {
            module.surveys.forEach((survey) => {
              transformedModule.content.push({
                id: survey.id,
                type: "survey",
                title: survey.title,
                description: survey.description || "",
                duration: "10 min",
                points: 10,
                questions: survey.questions || [],
                content_order: survey.content_order,
              });
            });
          }

          // Sort content by content_order
          transformedModule.content.sort(
            (a, b) => (a.content_order || 0) - (b.content_order || 0),
          );

          transformedProgram.modules.push(transformedModule);
        });
      }

      // Sort modules by module_order
      transformedProgram.modules.sort(
        (a, b) => (a.module_order || 0) - (b.module_order || 0),
      );

      setProgram(transformedProgram);

      // Fetch program milestones
      await fetchProgramMilestones();

      // Set initial module and content selection based on fresh progress
      const latestProgress = await fetchProgressData();

      if (transformedProgram.modules?.length > 0) {
        const currentModuleId = latestProgress?.current_module;

        // First try to open the module that backend says is currently active
        let targetModule = transformedProgram.modules.find(
          (module) => Number(module.id) === Number(currentModuleId)
        );

        // If backend does not give a current module,
        // find the first module that is not completed
        if (!targetModule) {
          const completedModules =
            latestProgress?.completed_modules?.map(Number) || [];

          targetModule =
            transformedProgram.modules.find(
              (module) => !completedModules.includes(Number(module.id))
            ) || transformedProgram.modules[0];
        }

        setSelectedModule(targetModule);

        // Find the next incomplete content inside the selected module
        if (targetModule.content && targetModule.content.length > 0) {
          try {
            const nextContentResponse = await api.get(
              `/learner/next-content/${userId}/${targetModule.id}`
            );

            const nextContentData = nextContentResponse.data;

            if (
              nextContentData.next_content &&
              !nextContentData.all_completed
            ) {
              const nextContent = targetModule.content.find(
                (content) =>
                  Number(content.id) ===
                    Number(nextContentData.next_content.id) &&
                  content.type === nextContentData.next_content.type
              );

              setSelectedContent(
                nextContent || targetModule.content[0]
              );
            } else {
              setSelectedContent(targetModule.content[0]);
            }
          } catch (error) {
            console.error(
              "Failed to fetch next incomplete content:",
              error
            );

            setSelectedContent(targetModule.content[0]);
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch program data:", error);
      setError("Failed to load program. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch progress data from backend
  const fetchProgressData = async () => {
    try {
      const progressResponse = await api.get(
        `/learner/progress/${userId}/${programId}`
      );

      const backendProgress = progressResponse.data;

      const transformedProgress = {
        completed_modules: backendProgress.completed_modules || [],
        current_module: backendProgress.current_module,
        progress: backendProgress.completed_percentage || 0,
        completed: backendProgress.completed || false,
        status: backendProgress.status || "In Progress",
      };

      setProgress(transformedProgress);

      try {
        const moduleProgressResponse = await api.get(
          `/learner/module-progress/${userId}/${programId}`
        );

        const contentProgressMap = {};

        if (moduleProgressResponse.data) {
          const progressData = moduleProgressResponse.data;

          if (progressData.content_progress) {
            Object.keys(progressData.content_progress).forEach((contentId) => {
              if (progressData.content_progress[contentId]) {
                contentProgressMap[contentId] = true;
              }
            });
          }
        }

        setContentProgress(contentProgressMap);
        setRefreshKey((prev) => prev + 1);
      } catch (err) {
        console.error("Failed to fetch content progress:", err);
        setContentProgress({});
      }

      // IMPORTANT:
      // Return the fresh progress object so callers don't use stale React state.
      return transformedProgress;

    } catch (err) {
      console.error("Failed to fetch progress:", err);

      const fallbackProgress = {
        completed_modules: [],
        current_module: null,
        progress: 0,
        completed: false,
        status: "In Progress",
      };

      setProgress(fallbackProgress);
      setContentProgress({});

      return fallbackProgress;
    }
  };

  const fetchProgramMilestones = async () => {
    try {
      const milestonesResponse = await api.get(
        `/learner/program-milestones/${userId}/${programId}`
      );

      console.log(
        "Updated Program Milestones:",
        milestonesResponse.data
      );

      setProgramMilestones(milestonesResponse.data);

      return milestonesResponse.data;
    } catch (error) {
      console.error(
        "Failed to fetch program milestones:",
        error
      );

      setProgramMilestones(null);

      return null;
    }
  };

  useEffect(() => {
    if (programId) {
      fetchProgramData();
    }
  }, [programId, userId]);

  // Refresh progress data after content completion
  const refreshProgress = async () => {
    console.log("=== REFRESHING PROGRESS ===");
    await fetchProgressData();

    if (programId) {
      try {
        const programResponse = await api.get(`/programs/${programId}`);
        const backendProgram = programResponse.data;
        const transformedProgram = {
          id: backendProgram.id,
          name: backendProgram.name,
          description: backendProgram.description,
          category: backendProgram.category || "General",
          duration: backendProgram.duration || "Self-paced",
          modules: []
        };

        if (backendProgram.modules && backendProgram.modules.length > 0) {
          backendProgram.modules.forEach((module) => {
            const transformedModule = {
              id: module.id,
              title: module.title,
              description: module.description,
              module_order: module.module_order,
              content: [],
            };

            if (module.videos && module.videos.length > 0) {
              module.videos.forEach((video) => {
                transformedModule.content.push({
                  id: video.id,
                  type: "video",
                  title: video.title,
                  subtitle: video.subtitle,
                  youtube_url: video.youtube_url,
                  description: video.description,
                  explanation_text: video.explanation_text,
                  thumbnail_url: video.thumbnail_url,
                  duration: "10 min",
                  points: 10,
                  documents: video.documents || [],
                  content_order: video.content_order,
                });
              });
            }

            if (module.quizzes && module.quizzes.length > 0) {
              module.quizzes.forEach((quiz) => {
                transformedModule.content.push({
                  id: quiz.id,
                  type: "quiz",
                  title: quiz.title,
                  description: quiz.description,
                  duration: "15 min",
                  points: 20,
                  questions: quiz.questions || [],
                  content_order: quiz.content_order,
                });
              });
            }

            if (module.written_lessons && module.written_lessons.length > 0) {
              module.written_lessons.forEach((lesson) => {
                transformedModule.content.push({
                  id: lesson.id,
                  type: "written_lesson",
                  title: lesson.title,
                  description: lesson.content || "",
                  duration: "20 min",
                  points: 15,
                  pdf_url: lesson.pdf_url,
                  content_order: lesson.content_order,
                });
              });
            }

            if (module.survey_forms && module.survey_forms.length > 0) {
              module.survey_forms.forEach((survey) => {
                transformedModule.content.push({
                  id: survey.id,
                  type: "survey",
                  title: survey.title,
                  description: survey.description || "",
                  duration: "10 min",
                  points: 10,
                  questions: survey.questions || [],
                  content_order: survey.content_order,
                });
              });
            } else if (module.surveys && module.surveys.length > 0) {
              module.surveys.forEach((survey) => {
                transformedModule.content.push({
                  id: survey.id,
                  type: "survey",
                  title: survey.title,
                  description: survey.description || "",
                  duration: "10 min",
                  points: 10,
                  questions: survey.questions || [],
                  content_order: survey.content_order,
                });
              });
            }

            transformedProgram.modules.push(transformedModule);
          });
        }

        transformedProgram.modules.sort(
          (a, b) => (a.module_order || 0) - (b.module_order || 0),
        );

        setProgram(transformedProgram);
        setRefreshKey(prev => prev + 1);
      } catch (error) {
        console.error("Failed to refresh program data:", error);
      }
    }
  };

  const handleModuleClick = (module) => {
    if (getModuleStatus(module.id) !== "locked") {
      setSelectedModule(module);
      setExpandedModules((prev) => ({
        ...prev,
        [module.id]: true,
      }));

      if (module.content && module.content.length > 0) {
        setSelectedContent(module.content[0]);
      } else {
        setSelectedContent(null);
      }
    }
  };

  const handleContentClick = (content) => {
    setSelectedContent(content);
  };

  const toggleModuleExpand = (moduleId) => {
    setExpandedModules((prev) => ({
      ...prev,
      [moduleId]: !prev[moduleId],
    }));
  };

  const getModuleStatus = (moduleId) => {
    if (!progress) return "locked";

    const completedModules = progress?.completed_modules || [];
    const currentModule = progress?.current_module;

    const moduleIdNum = Number(moduleId);
    const currentModuleNum = Number(currentModule);
    const completedModulesNum = completedModules.map(Number);

    if (completedModulesNum.includes(moduleIdNum)) {
      return "completed";
    }

    if (currentModuleNum === moduleIdNum) {
      return "active";
    }

    const moduleIndex = program?.modules?.findIndex((m) => Number(m.id) === moduleIdNum);
    const currentModuleIndex = program?.modules?.findIndex((m) => Number(m.id) === currentModuleNum);
    
    if (moduleIndex !== -1 && currentModuleIndex !== -1) {
      if (moduleIndex < currentModuleIndex) {
        return "available";
      } else if (moduleIndex > currentModuleIndex) {
        return "locked";
      }
    }

    if (moduleIndex === 0) {
      return "active";
    }

    return "available";
  };

  const getModuleProgress = (module) => {
    if (!module.content || module.content.length === 0) return 100;

    const completedCount = module.content.filter(
      (content) => {
        const key = getContentKey(content);
        return contentProgress[key];
      }
    ).length;

    return Math.round((completedCount / module.content.length) * 100);
  };

  const getModuleIcon = (module) => {
    const status = getModuleStatus(module.id);
    if (status === "completed") {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
    if (status === "locked") {
      return <Lock className="w-4 h-4 text-gray-400" />;
    }
    return <BookOpen className="w-4 h-4 text-[#693C83]" />;
  };

  const getModuleStatusColor = (moduleId) => {
    const status = getModuleStatus(moduleId);
    switch (status) {
      case "completed":
        return "bg-green-50 border-green-200";
      case "active":
        return "bg-[#693C83]/10 border-[#693C83] border-2";
      case "locked":
        return "bg-gray-50 border-gray-200 opacity-60";
      default:
        return "bg-white border-gray-200 hover:border-[#693C83]";
    }
  };

  const handleContentComplete = async (contentId, contentType, skipBackendCall = false) => {
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      const accessToken = localStorage.getItem("token");

      if (contentType === "quiz" || contentType === "survey") {
        await new Promise(resolve => setTimeout(resolve, 1000));
        try {
          await refreshProgress();
          const latestProgressResponse = await api.get(
            `/learner/progress/${userId}/${programId}`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );

          const latestProgress = latestProgressResponse.data;
          if (
            latestProgress.completed_percentage >= 100 &&
            !latestProgress.completed
          ) {
            await api.post(
              `/programs/${programId}/complete/${userId}`,
              {},
              {
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                },
              }
            );
            await refreshProgress();
            await fetchProgramMilestones();
          }
        } catch (error) {
          console.error(`Failed to refresh/check program completion after ${contentType}:`, error);
        }

        setRefreshKey(prev => prev + 1);

        if (selectedModule && getModuleStatus(selectedModule.id) === "completed") {
          const nextModule = program.modules.find(
            (module) => getModuleStatus(module.id) !== "locked" && module.id !== selectedModule.id
          );
          if (nextModule) {
            setSelectedModule(nextModule);
            if (nextModule.content && nextModule.content.length > 0) {
              try {
                const nextContentResponse = await api.get(`/learner/next-content/${userId}/${nextModule.id}`);
                const nextContentData = nextContentResponse.data;
                if (nextContentData.next_content && !nextContentData.all_completed) {
                  const nextContent = nextModule.content.find(
                    (content) => content.id === nextContentData.next_content.id &&
                                content.type === nextContentData.next_content.type
                  );
                  if (nextContent) {
                    setSelectedContent(nextContent);
                  } else {
                    setSelectedContent(nextModule.content[0]);
                  }
                } else {
                  setSelectedContent(nextModule.content[0]);
                }
              } catch (error) {
                console.error("Failed to fetch next incomplete content:", error);
                setSelectedContent(nextModule.content[0]);
              }
            }
          }
        }
        return;
      }

      if (!skipBackendCall) {
        let endpoint = "";
        let requestData = {};

        switch (contentType) {
          case "video":
            endpoint = `${API_BASE_URL}/learner/video-progress`;
            requestData = {
              user_id: userId,
              video_id: contentId,
              watch_time_seconds: 0,
              last_position: 0,
              is_completed: true,
            };
            break;

          case "written_lesson":
            endpoint = `${API_BASE_URL}/learner/written-lesson-progress`;
            requestData = {
              user_id: userId,
              lesson_id: contentId,
              scroll_position: 100,
              is_completed: true,
            };
            break;

          case "survey":
            endpoint = `${API_BASE_URL}/learner/survey-progress`;
            requestData = {
              user_id: userId,
              survey_id: contentId,
              is_completed: true,
            };
            break;

          case "assignment":
            endpoint = `${API_BASE_URL}/learner/assignment-submission`;
            requestData = {
              user_id: userId,
              assignment_id: contentId,
              text_answer: "Completed",
              file_url: null,
            };
            break;

          default:
            return;
        }

        await api.post(endpoint, requestData);
        await api.post(`/learner/streak/${userId}`, {});
        await new Promise(resolve => setTimeout(resolve, 500));

        try {
          await refreshProgress();
          const latestProgressResponse = await api.get(
            `/learner/progress/${userId}/${programId}`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );

          const latestProgress = latestProgressResponse.data;
          if (
            latestProgress.completed_percentage >= 100 &&
            !latestProgress.completed
          ) {
            await api.post(
              `${API_BASE_URL}/programs/${programId}/complete/${userId}`,
              {},
              {
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                },
              }
            );
            await refreshProgress();
            await fetchProgramMilestones();
          }
        } catch (error) {
          console.error("Failed to refresh/check program completion:", error);
        }

        setRefreshKey(prev => prev + 1);
      } else {
        try {
          await refreshProgress();
          const latestProgressResponse = await api.get(
            `${API_BASE_URL}/learner/progress/${userId}/${programId}`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );

          const latestProgress = latestProgressResponse.data;
          if (
            latestProgress.completed_percentage >= 100 &&
            !latestProgress.completed
          ) {
            await api.post(
              `${API_BASE_URL}/programs/${programId}/complete/${userId}`,
              {},
              {
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                },
              }
            );
            await refreshProgress();
            await fetchProgramMilestones();
          }
        } catch (error) {
          console.error("Failed to refresh progress after content completion (skipBackendCall):", error);
        }

        try {
          await api.post(`/learner/streak/${userId}`, {});
        } catch (error) {
          console.error("Failed to update learning streak (skipBackendCall):", error);
        }

        setRefreshKey(prev => prev + 1);

        if (selectedModule && getModuleStatus(selectedModule.id) === "completed") {
          const nextModule = program.modules.find(
            (module) => getModuleStatus(module.id) !== "locked" && module.id !== selectedModule.id
          );
          if (nextModule) {
            setSelectedModule(nextModule);
            if (nextModule.content && nextModule.content.length > 0) {
              try {
                const nextContentResponse = await api.get(`/learner/next-content/${userId}/${nextModule.id}`);
                const nextContentData = nextContentResponse.data;
                if (nextContentData.next_content && !nextContentData.all_completed) {
                  const nextContent = nextModule.content.find(
                    (content) => content.id === nextContentData.next_content.id &&
                                content.type === nextContentData.next_content.type
                  );
                  if (nextContent) {
                    setSelectedContent(nextContent);
                  } else {
                    setSelectedContent(nextModule.content[0]);
                  }
                } else {
                  setSelectedContent(nextModule.content[0]);
                }
              } catch (error) {
                console.error("Failed to fetch next incomplete content:", error);
                setSelectedContent(nextModule.content[0]);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("Failed to mark content as complete:", error);
      const contentKey = `${contentType}-${contentId}`;
      setContentProgress(prev => {
        const newState = { ...prev };
        delete newState[contentKey];
        return newState;
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmptyModuleComplete = async () => {
    if (isSubmitting || !selectedModule) return;

    try {
      setIsSubmitting(true);
      await api.post("/learner/module/complete", {
        user_id: userId,
        module_id: selectedModule.id,
        program_id: programId,
      });

      await api.post(`/learner/streak/${userId}`, {});
      await new Promise(resolve => setTimeout(resolve, 500));

      const latestProgress = await fetchProgressData();

      if (
        latestProgress.progress >= 100 &&
        !latestProgress.completed
      ) {
        try {
          const accessToken = localStorage.getItem("token");

          await api.post(
            `${API_BASE_URL}/programs/${programId}/complete/${userId}`,
            {},
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );

          await refreshProgress();
          await fetchProgramMilestones();
        } catch (completionError) {
          console.error(
            "Failed to complete program after empty module completion:",
            completionError
          );
        }
      }

      const nextModule = program.modules.find(
        (module) =>
          getModuleStatus(module.id) !== "locked" &&
          module.id !== selectedModule.id,
      );
      if (nextModule) {
        setSelectedModule(nextModule);
        
        if (nextModule.content && nextModule.content.length > 0) {
          try {
            const nextContentResponse = await api.get(`/learner/next-content/${userId}/${nextModule.id}`);
            const nextContentData = nextContentResponse.data;

            if (nextContentData.next_content && !nextContentData.all_completed) {
              const nextContent = nextModule.content.find(
                (content) => content.id === nextContentData.next_content.id && 
                            content.type === nextContentData.next_content.type
              );
              if (nextContent) {
                setSelectedContent(nextContent);
              } else {
                setSelectedContent(nextModule.content[0]);
              }
            } else {
              setSelectedContent(nextModule.content[0]);
            }
          } catch (error) {
            console.error("Failed to fetch next incomplete content for new module:", error);
            setSelectedContent(nextModule.content[0]);
          }
        }
      }
    } catch (error) {
      console.error("Failed to mark empty module as complete:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCompletedModulesCount = () => {
    return progress?.completed_modules?.length || 0;
  };

  const getTotalModulesCount = () => {
    return program?.modules?.length || 0;
  };

  const getProgressPercentage = () => {
    return progress?.progress || 0;
  };

  const renderContentByType = (content) => {
    const contentType = content.type?.toLowerCase();
    const contentKey = getContentKey(content);
    const isComplete = contentProgress[contentKey];

    switch (contentType) {
      case "video":
        return (
          <VideoContent
            key={`${content.type}-${content.id}-${refreshKey}`}
            content={content}
            userId={userId}
            handleContentComplete={handleContentComplete}
            isCompleted={isComplete}
            isSubmitting={isSubmitting}
          />
        );
      case "quiz":
        return (
          <QuizContent
            key={`${content.type}-${content.id}-${refreshKey}`}
            content={content}
            userId={userId}
            handleContentComplete={handleContentComplete}
            isCompleted={isComplete}
            isSubmitting={isSubmitting}
          />
        );
      case "written_lesson":
        return (
          <ReadingContent
            key={`${content.type}-${content.id}-${refreshKey}`}
            content={content}
            userId={userId}
            handleContentComplete={handleContentComplete}
            isCompleted={isComplete}
            isSubmitting={isSubmitting}
          />
        );
      case "survey":
        return (
          <SurveyContent
            key={`${content.type}-${content.id}-${refreshKey}`}
            content={content}
            userId={userId}
            handleContentComplete={handleContentComplete}
            isCompleted={isComplete}
            isSubmitting={isSubmitting}
          />
        );
      case "document":
        return (
          <DocumentContent
            key={`${content.type}-${content.id}-${refreshKey}`}
            content={content}
            userId={userId}
            handleContentComplete={handleContentComplete}
            isCompleted={isComplete}
            isSubmitting={isSubmitting}
          />
        );
      default:
        return (
          <div className="bg-gray-50 rounded-xl p-6">
            <p className="text-gray-500">Unknown content type: {contentType}</p>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#693C83] mx-auto"></div>
            <p className="mt-4 text-[#1E1B4B] font-medium">
              Loading program...
            </p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error || !program) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-[#1E1B4B]">
            {error || "Program not found"}
          </h2>
          <p className="text-gray-500 mt-2">
            The program you're looking for doesn't exist or has been removed.
          </p>
          <button
            onClick={() => navigate("/learner")}
            className="mt-6 bg-[#693C83] text-white px-6 py-2 rounded-xl hover:bg-[#5a2e6e] transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-120px)]">
        {/* Left Section - Program Info & Modules */}
        <div className="lg:w-[320px] xl:w-[380px] flex-shrink-0 overflow-y-auto">
          {/* Back Button */}
          <button
            onClick={() => navigate("/learner")}
            className="flex items-center gap-2 text-[#693C83] hover:text-[#5a2e6e] mb-4 transition-colors font-medium text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          {/* Program Header Card */}
          <div className="bg-gradient-to-r from-[#693C83] to-[#10B981] rounded-2xl p-5 text-white shadow-lg mb-4">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-white/20 backdrop-blur px-2 py-0.5 rounded-full text-[10px]">
                    {program.category || "General"}
                  </span>
                
                </div>
                <h1 className="text-lg font-bold truncate">{program.name}</h1>
              </div>
              <div className="bg-white/20 backdrop-blur rounded-xl px-3 py-1.5 text-center ml-3 flex-shrink-0">
                <div className="flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-yellow-300" />
                  <span className="font-bold text-sm">
                    {program.program_curos || 0}
                  </span>
                </div>
                <p className="text-[10px] text-white/80">Curos</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-3">
              <div className="flex justify-between text-xs text-white/80 mb-1">
                <span>Progress</span>
                <span>{getProgressPercentage()}%</span>
              </div>
              <div className="bg-white/20 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-white h-full rounded-full transition-all duration-700"
                  style={{ width: `${getProgressPercentage()}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-white/70 mt-1">
                <span>{getCompletedModulesCount()} completed</span>
                <span>{getTotalModulesCount()} total</span>
              </div>
            </div>
          </div>

          {/* Modules List */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-[#1E1B4B] flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#693C83]" />
                Modules
              </h2>
              <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded-full text-gray-600">
                {getCompletedModulesCount()}/{getTotalModulesCount()}
              </span>
            </div>
            <div className="space-y-1.5 max-h-[calc(100vh-350px)] overflow-y-auto pr-1">
              {program.modules?.map((module, index) => {
                const status = getModuleStatus(module.id);
                const statusColor = getModuleStatusColor(module.id);
                const isExpanded = expandedModules[module.id];
                const isCompleted = status === "completed";
                const moduleProgress = getModuleProgress(module);

                return (
                  <div key={module.id}>
                    <button
                      onClick={() => {
                        handleModuleClick(module);
                        if (isExpanded) {
                          toggleModuleExpand(module.id);
                        }
                      }}
                      className={`w-full text-left p-2.5 rounded-xl transition-all ${
                        statusColor
                      } ${status === "locked" ? "cursor-not-allowed" : "cursor-pointer"}`}
                      disabled={status === "locked"}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <div className="flex-shrink-0">
                            {getModuleIcon(module)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p
                              className={`font-medium text-sm truncate ${
                                status === "completed"
                                  ? "text-green-600"
                                  : status === "locked"
                                    ? "text-gray-400"
                                    : "text-[#1E1B4B]"
                              }`}
                            >
                              {index + 1}. {module.title}
                            </p>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-gray-500">
                                {module.content?.length || 0} items
                              </span>
                              <span className="text-[10px] text-gray-400">
                                •
                              </span>
                              <span className="text-[10px] text-gray-500">
                                {moduleProgress}% complete
                              </span>
                              {isCompleted && (
                                <span className="text-[10px] text-green-500 flex items-center gap-0.5">
                                  <CheckCircle className="w-3 h-3" />
                                  Done
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                          )}
                        </div>
                      </div>
                    </button>
                    {/* Expanded Content Items */}
                    {isExpanded &&
                      module.content &&
                      module.content.length > 0 && (
                        <div className="ml-4 mt-1 space-y-1">
                          {module.content.map((content) => {
                            const isContentSelected =
                              getContentKey(selectedContent) ===
                              getContentKey(content);
                            const isContentCompleted =
                              contentProgress[getContentKey(content)];
                            return (
                              <button
                                key={getContentKey(content)}
                                onClick={() => handleContentClick(content)}
                                className={`w-full text-left p-2 rounded-lg transition-all text-xs ${
                                  isContentSelected
                                    ? "bg-[#693C83]/10 border border-[#693C83]"
                                    : "bg-white border border-gray-200 hover:border-gray-300"
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <div className="flex-shrink-0">
                                    {isContentCompleted ? (
                                      <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                                    ) : (
                                      <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-300" />
                                    )}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p
                                      className={`font-medium truncate ${
                                        isContentSelected
                                          ? "text-[#693C83]"
                                          : "text-gray-700"
                                      }`}
                                    >
                                      {content.title}
                                    </p>
                                    <span className="text-[9px] text-gray-500 capitalize">
                                      {content.type === "written_lesson"
                                        ? "written lesson"
                                        : content.type}
                                    </span>
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Section - Module Content */}
        <div className="flex-1 overflow-y-auto min-w-0">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            {selectedModule && selectedContent ? (
              <>
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="bg-[#F1ECF7] text-[#693C83] px-3 py-1 rounded-full text-xs font-medium">
                        Module
                      </span>
                      {getModuleStatus(selectedModule.id) === "completed" && (
                        <span className="bg-green-100 text-green-600 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Completed
                        </span>
                      )}
                      {getModuleStatus(selectedModule.id) === "active" && (
                        <span className="bg-[#693C83]/10 text-[#693C83] px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                          <PlayCircle className="w-3.5 h-3.5" />
                          In Progress
                        </span>
                      )}
                    </div>
                    <h2 className="text-2xl font-bold text-[#1E1B4B]">
                      {selectedModule.title}
                    </h2>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {selectedModule.content?.length || 0} content items
                      </span>
                      <span className="flex items-center gap-1">
                        <Award className="w-4 h-4" />
                        {getModuleProgress(selectedModule)}% complete
                      </span>
                    </div>
                  </div>
                </div>

                {/* Content Navigation */}
                <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
                  {selectedModule.content.map((content) => (
                    <button
                      key={getContentKey(content)}
                      onClick={() => handleContentClick(content)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all whitespace-nowrap ${
                        getContentKey(selectedContent) ===
                        getContentKey(content)
                          ? "bg-[#693C83] text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      <div className="flex-shrink-0">
                        {contentProgress[getContentKey(content)] ? (
                          <CheckCircle className="w-3.5 h-3.5" />
                        ) : (
                          <div className="w-3.5 h-3.5 rounded-full border-2 border-current" />
                        )}
                      </div>
                      <span className="truncate max-w-[100px]">
                        {content.title}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="prose max-w-none">
                  {/* Single Content Item Display */}
                  <div className="flex items-center gap-2 mb-4">
                    <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs capitalize">
                      {selectedContent.type === "written_lesson"
                        ? "written lesson"
                        : selectedContent.type}
                    </span>
                    {contentProgress[getContentKey(selectedContent)] && (
                      <span className="text-green-600 text-xs font-medium flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Completed
                      </span>
                    )}
                  </div>

                  <div className="not-prose my-6 w-full block">
                    {renderContentByType(selectedContent)}
                  </div>
                </div>
              </>
            ) : selectedModule ? (
              <>
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="bg-[#F1ECF7] text-[#693C83] px-3 py-1 rounded-full text-xs font-medium">
                        Module
                      </span>
                      {getModuleStatus(selectedModule.id) === "completed" && (
                        <span className="bg-green-100 text-green-600 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Completed
                        </span>
                      )}
                      {getModuleStatus(selectedModule.id) === "active" && (
                        <span className="bg-[#693C83]/10 text-[#693C83] px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                          <PlayCircle className="w-3.5 h-3.5" />
                          In Progress
                        </span>
                      )}
                    </div>
                    <h2 className="text-2xl font-bold text-[#1E1B4B]">
                      {selectedModule.title}
                    </h2>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {selectedModule.content?.length || 0} content items
                      </span>
                      <span className="flex items-center gap-1">
                        <Award className="w-4 h-4" />
                        {getModuleProgress(selectedModule)}% complete
                      </span>
                    </div>
                  </div>
                </div>

                {/* Empty Module State */}
                <div className="text-center py-12">
                  <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-600 mb-2">
                    This module has no content
                  </h3>
                  <p className="text-sm text-gray-500 mb-6">
                    You can mark this module as complete to proceed to the next one.
                  </p>
                  {getModuleStatus(selectedModule.id) !== "completed" && (
                    <button
                      onClick={handleEmptyModuleComplete}
                      disabled={isSubmitting}
                      className="bg-[#693C83] text-white px-6 py-3 rounded-xl hover:bg-[#5a2e6e] transition-colors flex items-center gap-2 mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <CheckCircle className="w-5 h-5" />
                      {isSubmitting ? "Completing..." : "Complete Module"}
                    </button>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <BookOpen className="w-16 h-16 text-gray-300 mx-auto" />
                  <h3 className="text-xl font-semibold text-[#1E1B4B] mt-4">
                    Select a Module
                  </h3>
                  <p className="text-gray-500 mt-2">
                    Choose a module from the left sidebar to start learning.
                  </p>
                </div>
              </div>
            )}

            {/* LEARNING MILESTONES SECTION */}
            {programMilestones?.program_completed && (
              <div className="mt-10 pt-8 border-t border-gray-200">
                <div className="flex items-center gap-2 mb-6">
                  <Sparkles className="w-5 h-5 text-[#693C83]" />
                  <h3 className="text-xl font-bold text-[#1E1B4B]">
                    Learning Milestones
                  </h3>
                </div>

                <div className="space-y-4">
                  {/* Retention Quiz Milestone */}
                  {programMilestones.retention_quiz && (
                    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <h4 className="text-base font-semibold text-[#1E1B4B]">
                            {programMilestones.retention_quiz.title || "Retention Quiz"}
                          </h4>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {programMilestones.retention_quiz.required_days} days after program completion
                          </p>
                        </div>
                        <div>
                          {programMilestones.retention_quiz.is_completed ? (

  // PASSED
  <div className="flex items-center gap-2">
    <span className="inline-flex items-center gap-1.5 text-green-600 text-xs font-semibold bg-green-50 px-3 py-1.5 rounded-xl border border-green-200">
      <CheckCircle className="w-4 h-4" />
      Completed
    </span>

    <button
      type="button"
      onClick={() =>
        navigate(
          `/retention-quiz/${programMilestones.retention_quiz.id}/result?user_id=${userId}`
        )
      }
      className="inline-flex items-center justify-center rounded-xl bg-[#693C83] px-4 py-2 text-xs font-semibold text-white hover:bg-[#5a2e6e] transition-colors"
    >
      View Result
    </button>
  </div>

) : programMilestones.retention_quiz.can_reattempt ? (

  // FAILED — allow reattempt and view result
  <div className="flex items-center gap-2">
    <button
      type="button"
      onClick={() =>
        navigate(
          `/retention-quiz/${programMilestones.retention_quiz.id}?user_id=${userId}`
        )
      }
      className="inline-flex items-center justify-center rounded-xl bg-[#693C83] px-4 py-2 text-xs font-semibold text-white hover:bg-[#5a2e6e] transition-colors"
    >
      Reattempt Quiz
    </button>

    <button
      type="button"
      onClick={() =>
        navigate(
          `/retention-quiz/${programMilestones.retention_quiz.id}/result?user_id=${userId}`
        )
      }
      className="inline-flex items-center justify-center rounded-xl border border-[#693C83] px-4 py-2 text-xs font-semibold text-[#693C83] hover:bg-purple-50 transition-colors"
    >
      View Result
    </button>
  </div>

) : programMilestones.retention_quiz.is_unlocked ? (

  // AVAILABLE — no previous attempt
  <button
    type="button"
    onClick={() =>
      navigate(
        `/retention-quiz/${programMilestones.retention_quiz.id}?user_id=${userId}`
      )
    }
    className="inline-flex items-center justify-center rounded-xl bg-[#693C83] px-4 py-2 text-xs font-semibold text-white hover:bg-[#5a2e6e] transition-colors"
  >
    Start Retention Quiz
  </button>

) : (

  // LOCKED
  <span className="inline-flex items-center gap-1.5 text-gray-500 text-xs font-medium bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200">
    <Lock className="w-4 h-4 text-gray-400" />
    Unlocks in {programMilestones.retention_quiz.days_remaining} days
  </span>

)}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Application Checks Milestones */}
                  {programMilestones.application_checks &&
                    programMilestones.application_checks.map((check) => {
                      const statusLower = (check.status || "").toLowerCase();
                      return (
                        <div
                          key={check.id}
                          className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                              <h4 className="text-base font-semibold text-[#1E1B4B]">
                                {check.title || `Application Check ${check.check_number}`}
                              </h4>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {check.required_days} days after program completion
                              </p>
                            </div>
                            <div>
                              {statusLower === "completed" || statusLower === "approved" ? (
  <div className="flex items-center gap-2">
    <span className="inline-flex items-center gap-1.5 text-green-600 text-xs font-semibold bg-green-50 px-3 py-1.5 rounded-xl border border-green-200">
      <CheckCircle className="w-4 h-4" />
      {check.status}
    </span>

    <button
      type="button"
      onClick={() =>
  navigate(
    `/learner/application-check/${check.id}/result?user_id=${userId}`
  )
}
      className="inline-flex items-center justify-center rounded-xl bg-[#693C83] px-4 py-2 text-xs font-semibold text-white hover:bg-[#5a2e6e] transition-colors"
    >
      View Result
    </button>
  </div>
) : statusLower === "rejected" ? (

  <div className="flex flex-col items-end gap-2">

    <span className="inline-flex items-center gap-1.5 text-red-600 text-xs font-semibold bg-red-50 px-3 py-1.5 rounded-xl border border-red-200">
      <XCircle className="w-4 h-4" />
      Rejected
    </span>

    {check.review_comment && (
      <div className="max-w-md bg-red-50 border border-red-200 rounded-xl px-4 py-3">
        <p className="text-xs font-semibold text-red-700 mb-1">
          Admin Feedback
        </p>

        <p className="text-sm text-red-600">
          {check.review_comment}
        </p>
      </div>
    )}

    <div className="flex gap-2">

      <button
        type="button"
        onClick={() =>
          navigate(
            `/application-check/${check.id}/result?user_id=${userId}`
          )
        }
        className="inline-flex items-center justify-center rounded-xl border border-[#693C83] px-4 py-2 text-xs font-semibold text-[#693C83] hover:bg-purple-50 transition-colors"
      >
        View Result
      </button>

      <button
        type="button"
        onClick={() => navigate(`/application-check/${check.id}`)}
        className="inline-flex items-center justify-center rounded-xl bg-[#693C83] px-4 py-2 text-xs font-semibold text-white hover:bg-[#5a2e6e] transition-colors"
      >
        Reattempt Application Check
      </button>

    </div>

  </div>
                              ) : statusLower === "pending review" || statusLower === "pending" ? (
                                <span className="inline-flex items-center gap-1.5 text-yellow-600 text-xs font-semibold bg-yellow-50 px-3 py-1.5 rounded-xl border border-yellow-200">
                                  <Hourglass className="w-4 h-4" />
                                  Pending Review
                                </span>
                              ) : check.is_unlocked || statusLower === "available" ? (
                                <button
                                  type="button"
                                  onClick={() => navigate(`/application-check/${check.id}`)}
                                  className="inline-flex items-center justify-center rounded-xl bg-[#693C83] px-4 py-2 text-xs font-semibold text-white hover:bg-[#5a2e6e] transition-colors"
                                >
                                  Start {check.title}
                                </button>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 text-gray-500 text-xs font-medium bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200">
                                  <Lock className="w-4 h-4 text-gray-400" />
                                  Unlocks in {check.days_remaining} days
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default OpenProgram;