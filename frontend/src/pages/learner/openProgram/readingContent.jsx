import { useState, useEffect } from "react";
import api from "../../../utils/axios";
import { BookOpen, Download, CheckCircle, X } from "lucide-react";
import { API_BASE_URL } from "./dummyData";

const ReadingContent = ({
  content,
  userId,
  handleContentComplete,
  isCompleted,
  isSubmitting,
}) => {
  const [hasMarkedComplete, setHasMarkedComplete] = useState(false);
  const [isReadingOpen, setIsReadingOpen] = useState(false);

  // Reset hasMarkedComplete when isCompleted changes to true
  useEffect(() => {
    if (isCompleted && hasMarkedComplete) {
      setHasMarkedComplete(false);
    }
  }, [isCompleted, hasMarkedComplete]);

  const handleManualComplete = async () => {
    if (isSubmitting || hasMarkedComplete || isCompleted) return;

    try {
      setHasMarkedComplete(true);

      await api.post("/learner/written-lesson-progress", {
        user_id: userId,
        lesson_id: content.id,
        scroll_position: 100,
        is_completed: true,
      });

      await handleContentComplete(content.id, "written_lesson");
      setIsReadingOpen(false);
    } catch (error) {
      console.error("Failed to mark as complete:", error);
      setHasMarkedComplete(false);
    }
  };

  const handlePDFAccess = (contentId) => {
    console.log("PDF accessed for lesson:", contentId);
  };

  return (
    <>
      {/* Main reading card */}
      <div className="bg-gray-50 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <BookOpen className="w-6 h-6 text-[#693C83] flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h3 className="font-semibold text-[#1E1B4B]">Reading Material</h3>
            <p className="text-gray-600 mt-1 text-sm line-clamp-2">
              {content.description || "No reading content available."}
            </p>

            {!isCompleted && (
              <button
                onClick={() => setIsReadingOpen(true)}
                className="mt-4 bg-[#693C83] text-white px-6 py-2 rounded-lg hover:bg-[#5a2e6e] transition-colors text-sm"
              >
                Start Reading
              </button>
            )}

            {isCompleted && (
              <div className="mt-4 flex items-center gap-2 text-green-600 text-sm font-medium">
                <CheckCircle className="w-4 h-4" />
                Reading Completed
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reading Overlay */}
      {isReadingOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-start mb-4 sticky top-0 bg-white pb-4 border-b">
              <div>
                <h2 className="text-xl font-semibold text-[#1E1B4B]">
                  {content.title || "Reading Material"}
                </h2>
                <p className="text-sm text-gray-500">
                  Read through the material and mark it complete when done
                </p>
              </div>
              <button
                onClick={() => setIsReadingOpen(false)}
                className="text-gray-400 hover:text-gray-600"
                disabled={isSubmitting}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Toolbar */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-[#1E1B4B]">
                  {content.title}
                </h3>

                <p className="text-sm text-gray-500">{content.description}</p>
              </div>

              {content.pdf_url && (
                <a
                  href={content.pdf_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => handlePDFAccess(content.id)}
                  className="inline-flex items-center gap-2 bg-[#693C83] text-white px-4 py-2 rounded-lg hover:bg-[#5a2e6e] transition"
                >
                  <Download className="w-4 h-4" />
                  Download PDF
                </a>
              )}
            </div>

            {/* PDF Viewer */}
            {content.pdf_url ? (
              <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm h-[65vh]">
                <iframe
                  src={content.pdf_url}
                  title={content.title}
                  className="w-full h-full"
                />
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-10 text-center text-gray-500">
                No PDF available for this lesson.
              </div>
            )}

            <div className="mt-6 pt-4 border-t sticky bottom-0 bg-white">
              <button
                onClick={handleManualComplete}
                disabled={hasMarkedComplete || isSubmitting || isCompleted}
                className={`w-full bg-[#693C83] text-white px-4 py-3 rounded-lg hover:bg-[#5a2e6e] transition-colors text-sm font-medium ${
                  hasMarkedComplete || isSubmitting || isCompleted
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
              >
                {hasMarkedComplete
                  ? "Completing..."
                  : isSubmitting
                    ? "Saving..."
                    : isCompleted
                      ? "Completed"
                      : "Mark as Complete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ReadingContent;
