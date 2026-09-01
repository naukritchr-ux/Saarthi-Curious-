import { useState, useEffect, useRef, useCallback } from "react";
import api from "../../../utils/axios";
import { PlayCircle, FileText, Download, CheckCircle } from "lucide-react";
import { API_BASE_URL } from "./dummyData";

const VideoContent = ({
  content,
  userId,
  handleContentComplete,
  isCompleted,
  isSubmitting,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasMarkedComplete, setHasMarkedComplete] = useState(false);
  const [actualWatchPercentage, setActualWatchPercentage] = useState(0);
  const playerRef = useRef(null);
  const intervalRef = useRef(null);
  const containerRef = useRef(null);
  const apiReadyRef = useRef(false);
  const initializedRef = useRef(false);
  const lastUpdateTimeRef = useRef(Date.now());
  const isCompletingRef = useRef(false);
  const watchedSecondsRef = useRef(0);
  const lastPlayerTimeRef = useRef(0);
  const lastWallClockRef = useRef(Date.now());
  const playerIdRef = useRef(`youtube-player-${content.id}`);
  const parentUpdateRef = useRef(false);

  // Fix: Extract video ID from URL
  const getVideoId = useCallback((url) => {
    if (!url) return null;
    const match = url.match(
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/,
    );
    return match ? match[1] : null;
  }, []);

  // Single function for all video progress updates
  const updateVideoProgress = useCallback(
    async (
      videoId,
      currentTime,
      duration,
      markComplete = false,
      watchedSeconds = 0
    ) => {
      try {
        const accessToken = localStorage.getItem("token");
        await api.post("/learner/video-progress", {
          user_id: userId,
          video_id: videoId,
          watch_time_seconds: Math.floor(watchedSeconds),
          last_position: Math.floor(currentTime),
          is_completed: markComplete,
        },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          params: { video_duration: Math.floor(duration) },
        },
        );

        if (markComplete && !isCompleted && !hasMarkedComplete) {
          parentUpdateRef.current = true;
          await handleContentComplete(videoId, "video", true); 
          parentUpdateRef.current = false;
          setHasMarkedComplete(true);
        }
      } catch (error) {
        console.error("Failed to update video progress:", error);
        if (markComplete) {
          setHasMarkedComplete(false);
          parentUpdateRef.current = false;
        }
      }
    },
    [userId, isCompleted, hasMarkedComplete, handleContentComplete],
  );

  // Handle manual completion
  const handleManualComplete = useCallback(async () => {
    if (
      isSubmitting ||
      hasMarkedComplete ||
      isCompleted ||
      isCompletingRef.current
    ) {
      return;
    }

    try {
      isCompletingRef.current = true;
      setHasMarkedComplete(true);

      if (
        playerRef.current &&
        typeof playerRef.current.getCurrentTime === "function"
      ) {
        const currentTime = playerRef.current.getCurrentTime() || 0;
        const duration = playerRef.current.getDuration() || 0;
        await updateVideoProgress(content.id, currentTime, duration, true, watchedSecondsRef.current);
      } else {
        const accessToken = localStorage.getItem("token");
        await api.post(
          "/learner/video-progress",
          {
            user_id: userId,
            video_id: content.id,
            watch_time_seconds: Math.floor(watchedSecondsRef.current),
            last_position: 0,
            is_completed: true,
          },
          {
            headers: { Authorization: `Bearer ${accessToken}` },
            params: { video_duration: 0 },
          },
        );
        parentUpdateRef.current = true;
        await handleContentComplete(content.id, "video", true);
        parentUpdateRef.current = false;
        setHasMarkedComplete(true);
      }
    } catch (error) {
      console.error("Failed to mark video as complete:", error);
      setHasMarkedComplete(false);
      parentUpdateRef.current = false;
    } finally {
      setTimeout(() => {
        isCompletingRef.current = false;
      }, 500);
    }
  }, [
    content.id,
    userId,
    isSubmitting,
    hasMarkedComplete,
    isCompleted,
    updateVideoProgress,
    handleContentComplete,
  ]);

  // Track video progress
  const startProgressTracking = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (!playerRef.current) return;

    lastPlayerTimeRef.current = playerRef.current.getCurrentTime() || 0;
    lastWallClockRef.current = Date.now();
    lastUpdateTimeRef.current = Date.now();

    intervalRef.current = setInterval(() => {
      if (!playerRef.current) return;

      try {
        const currentTime = playerRef.current.getCurrentTime();
        const duration = playerRef.current.getDuration();

        if (isNaN(currentTime) || isNaN(duration) || duration <= 0) return;

        const now = Date.now();
        const playerDelta = currentTime - lastPlayerTimeRef.current;
        const wallClockDelta = (now - lastWallClockRef.current) / 1000;

        if (playerDelta > 0 && playerDelta <= wallClockDelta + 2) {
          watchedSecondsRef.current += playerDelta;
        }

        lastPlayerTimeRef.current = currentTime;
        lastWallClockRef.current = now;

        const percentage = (watchedSecondsRef.current / duration) * 100;
        setActualWatchPercentage(percentage);

        const shouldComplete =
          percentage >= 90 &&
          !isCompleted &&
          !hasMarkedComplete &&
          !isCompletingRef.current;

        if (now - lastUpdateTimeRef.current >= 5000) {
          updateVideoProgress(content.id, currentTime, duration, shouldComplete, watchedSecondsRef.current);
          lastUpdateTimeRef.current = now;
        }
      } catch (error) {
        console.error("Error in video progress tracking:", error);
      }
    }, 1000);
  }, [content.id, isCompleted, hasMarkedComplete, updateVideoProgress]);

  // Initialize YouTube player
  const initializePlayer = useCallback(() => {
    if (initializedRef.current || playerRef.current) return;
    if (!window.YT || !window.YT.Player) return;

    const container = containerRef.current;
    if (!container) return;

    try {
      const videoId = getVideoId(content.youtube_url);
      if (!videoId) {
        setIsLoading(false);
        return;
      }

      playerRef.current = new window.YT.Player(container, {
        videoId: videoId,
        playerVars: { enablejsapi: 1, autoplay: 0, modestbranding: 1, rel: 0 },
        events: {
          onReady: () => {
            setIsLoading(false);
            initializedRef.current = true;
          },
          onStateChange: (event) => {
            if (event.data === window.YT.PlayerState.PLAYING) {
              startProgressTracking();
            } else {
              if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
              }
            }
          },
          onError: () => setIsLoading(false),
        },
      });
    } catch (error) {
      console.error("Failed to create YouTube player:", error);
      setIsLoading(false);
    }
  }, [content.youtube_url, getVideoId, startProgressTracking]);

  // Effects and Cleanup
  useEffect(() => {
    if (!content.youtube_url) { setIsLoading(false); return; }
    if (initializedRef.current || playerRef.current) return;
    const videoId = getVideoId(content.youtube_url);
    if (!videoId) { setIsLoading(false); return; }

    const loadYouTubeAPI = () => {
      if (window.YT && window.YT.Player) {
        apiReadyRef.current = true;
        setTimeout(() => { if (containerRef.current && !initializedRef.current) initializePlayer(); }, 200);
        return;
      }
      const existingScript = document.querySelector('script[src*="youtube.com/iframe_api"]');
      if (!existingScript) {
        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        tag.async = true;
        document.head.appendChild(tag);
      }
      window.onYouTubeIframeAPIReady = () => {
        if (!apiReadyRef.current) {
          apiReadyRef.current = true;
          setTimeout(() => { if (containerRef.current && !initializedRef.current) initializePlayer(); }, 200);
        }
      };
    };
    loadYouTubeAPI();
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [content.id, content.youtube_url, getVideoId, initializePlayer]);

  useEffect(() => {
    if (isCompleted && hasMarkedComplete) {
      setHasMarkedComplete(false);
      isCompletingRef.current = false;
    }
  }, [isCompleted, hasMarkedComplete]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (playerRef.current && playerRef.current.destroy) playerRef.current.destroy();
    };
  }, []);

  if (!content.youtube_url) {
    return (
      <div className="aspect-video bg-gray-100 rounded-xl flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-[#693C83]/10 rounded-full flex items-center justify-center mx-auto mb-3">
            <PlayCircle className="w-10 h-10 text-[#693C83]" />
          </div>
          <p className="text-gray-500 font-medium">Video Content</p>
          <p className="text-sm text-gray-400">{content.duration || "10:00"} min</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="aspect-video bg-gray-100 rounded-xl overflow-hidden relative h-full max-h-full">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#693C83] mx-auto"></div>
              <p className="mt-3 text-gray-500">Loading video...</p>
            </div>
          </div>
        )}
        <div ref={containerRef} id={playerIdRef.current} className="w-full h-full" />
      </div>

      {!isCompleted && !isSubmitting && actualWatchPercentage >= 20 && (
        <button
          onClick={handleManualComplete}
          disabled={hasMarkedComplete}
          className={`w-full bg-[#10B981] text-white px-4 py-2.5 rounded-xl hover:bg-[#059669] transition-colors font-medium text-sm flex items-center justify-center gap-2 ${
            hasMarkedComplete ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          <CheckCircle className="w-4 h-4" />
          {hasMarkedComplete ? "Completing..." : "Mark as Complete"}
        </button>
      )}

      {isSubmitting && !isCompleted && (
        <button disabled className="w-full bg-gray-400 text-white px-4 py-2.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 cursor-not-allowed">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          Saving...
        </button>
      )}

      {isCompleted && (
        <div className="flex items-center justify-center gap-2 text-green-600 font-medium text-sm bg-green-50 p-3 rounded-xl">
          <CheckCircle className="w-5 h-5" />
          Video Completed
        </div>
      )}

      {content.documents && content.documents.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-[#1E1B4B]">Supporting Documents</h4>
          {content.documents.map((doc, index) => (
            <div key={index} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-[#693C83] flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h5 className="font-medium text-[#1E1B4B]">{doc.title}</h5>
                  <p className="text-sm text-gray-600 mt-1">{doc.description}</p>
                  <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-2 text-sm text-[#693C83] hover:text-[#5a2e6e]">
                    <Download className="w-4 h-4" />
                    Download Document
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VideoContent;