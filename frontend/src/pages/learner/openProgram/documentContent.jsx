import { useState } from "react";
import api from "../../../utils/axios";
import { FileText, Download, CheckCircle, X } from "lucide-react";
import { API_BASE_URL } from "./dummyData";

const DocumentContent = ({
  content,
  userId,
  handleContentComplete,
  isCompleted,
  isSubmitting,
}) => {
  const [hasMarkedComplete, setHasMarkedComplete] = useState(false);
  const [isDocOpen, setIsDocOpen] = useState(false);

  const hasDocuments = content.documents && content.documents.length > 0;

  const handleManualComplete = async () => {
    if (isSubmitting || hasMarkedComplete || isCompleted) return;

    try {
      setHasMarkedComplete(true);

      // Documents ride on the written-lesson completion endpoint, same as
      // ReadingContent — there's no separate "document" progress table.
      await api.post("/learner/written-lesson-progress", {
        user_id: userId,
        lesson_id: content.id,
        scroll_position: 100,
        is_completed: true,
      });

      await handleContentComplete(content.id, "written_lesson");
      setIsDocOpen(false);
    } catch (error) {
      console.error("Failed to mark document as complete:", error);
      setHasMarkedComplete(false);
    }
  };

  return (
    <>
      {/* Main document card */}
      <div className="bg-gray-50 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <FileText className="w-6 h-6 text-[#693C83] flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h3 className="font-semibold text-[#1E1B4B]">Document</h3>
            <p className="text-gray-600 mt-1 text-sm line-clamp-2">
              {hasDocuments
                ? `${content.documents.length} document${content.documents.length > 1 ? "s" : ""} attached`
                : content.description || "No document content available."}
            </p>

            {!isCompleted && (
              <button
                onClick={() => setIsDocOpen(true)}
                className="mt-4 bg-[#693C83] text-white px-6 py-2 rounded-lg hover:bg-[#5a2e6e] transition-colors text-sm"
              >
                {hasDocuments ? "View Documents" : "View Document"}
              </button>
            )}

            {isCompleted && (
              <div className="mt-4 flex items-center gap-2 text-green-600 text-sm font-medium">
                <CheckCircle className="w-4 h-4" />
                Document Completed
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Document Overlay */}
      {isDocOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-start mb-4 sticky top-0 bg-white pb-4 border-b">
              <div>
                <h2 className="text-xl font-semibold text-[#1E1B4B]">
                  {content.title || "Document"}
                </h2>
                <p className="text-sm text-gray-500">
                  Review the document
                  {hasDocuments && content.documents.length > 1 ? "s" : ""} and
                  mark complete when done
                </p>
              </div>
              <button
                onClick={() => setIsDocOpen(false)}
                className="text-gray-400 hover:text-gray-600"
                disabled={isSubmitting}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mt-4">
              {hasDocuments ? (
                <div className="space-y-3">
                  {content.documents.map((doc, index) => (
                    <div
                      key={index}
                      className="bg-gray-50 rounded-xl p-4 border border-gray-200"
                    >
                      <div className="flex items-start gap-3">
                        <FileText className="w-5 h-5 text-[#693C83] flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <h5 className="font-medium text-[#1E1B4B]">
                            {doc.title}
                          </h5>
                          <p className="text-sm text-gray-600 mt-1">
                            {doc.description}
                          </p>
                          <a
                            href={doc.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 mt-2 text-sm text-[#693C83] hover:text-[#5a2e6e]"
                          >
                            <Download className="w-4 h-4" />
                            Download Document
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 text-sm">
                  {content.description || "No document content available."}
                </p>
              )}
            </div>

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

export default DocumentContent;
