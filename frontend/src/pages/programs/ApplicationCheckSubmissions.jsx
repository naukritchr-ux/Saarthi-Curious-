import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/axios';
import MainLayout from '../../layout/mainLayout';
import {
  ArrowLeft,
  RefreshCw,
  Search,
  Eye,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  User,
  Mail,
  BookOpen,
  FileText,
  Calendar,
  Check,
  X,
  MessageSquare,
  Award
} from 'lucide-react';

// Safe data extraction helpers matching backend specifications
const getSubmissionId = (sub) => sub?.attempt_id ?? sub?.id;
const getLearnerName = (sub) => sub?.employee_name ?? sub?.candidate_name ?? sub?.learner_name ?? sub?.user_name ?? 'N/A';
const getLearnerEmail = (sub) => sub?.employee_email ?? sub?.candidate_email ?? sub?.learner_email ?? sub?.email ?? 'N/A';
const getProgramName = (sub) => sub?.program_name ?? 'N/A';
const getCheckNumber = (sub) => sub?.check_number ?? sub?.application_check_number ?? 'N/A';
const getStatus = (sub) => sub?.status ?? 'Pending Review';
const getSubmittedAt = (sub) => sub?.attempted_at ?? sub?.submitted_at ?? sub?.created_at ?? 'N/A';

// Helper to treat both "Submitted" and "Pending Review" as pending review
const isStatusPending = (status) => {
  const normalized = (status || '').toLowerCase();
  return normalized === 'pending review' || normalized === 'submitted';
};

export default function ApplicationCheckSubmissions() {
  const navigate = useNavigate();

  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filterStatus, setFilterStatus] = useState('Pending Review');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal / Detail state
  const [selectedSubmissionId, setSelectedSubmissionId] = useState(null);
  const [submissionDetail, setSubmissionDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Review state
  const [reviewComment, setReviewComment] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [actionError, setActionError] = useState(null);

  
const [automationEnabled, setAutomationEnabled] = useState(false);
  const [automationLoading, setAutomationLoading] = useState(true);
  const [automationUpdating, setAutomationUpdating] = useState(false);
  
  const fetchSubmissions = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/programs/application-check-submissions');
      const data = Array.isArray(response.data)
        ? response.data
        : response.data?.submissions || response.data?.data || [];
      setSubmissions(data);
    } catch (err) {
      const errorMsg =
        err.response?.data?.detail ||
        'Failed to load application check submissions.';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

const fetchAutomationStatus = async () => {
  setAutomationLoading(true);

  try {
    const response = await api.get(
      "/programs/application-check-automation"
    );

    setAutomationEnabled(
      response.data?.is_enabled === true
    );
  } catch (err) {
    console.error(
      "Failed to load Application Check automation status:",
      err
    );
  } finally {
    setAutomationLoading(false);
  }
};

const handleAutomationToggle = async () => {
  const newValue = !automationEnabled;

  setAutomationUpdating(true);

  try {
    const response = await api.put(
      "/programs/application-check-automation",
      {
        is_enabled: newValue,
      }
    );

    setAutomationEnabled(
      response.data?.is_enabled === true
    );

    await fetchSubmissions();
  } catch (err) {
    const errorMsg =
      err.response?.data?.detail ||
      "Failed to update Application Check automation.";

    setError(errorMsg);
  } finally {
    setAutomationUpdating(false);
  }
};

  useEffect(() => {
    fetchSubmissions();
    fetchAutomationStatus();
  }, []);

  const fetchDetail = async (id) => {
    setDetailLoading(true);
    setDetailError(null);
    setSubmissionDetail(null);
    try {
      const response = await api.get(`/programs/application-check-submissions/${id}`);
      setSubmissionDetail(response.data);
    } catch (err) {
      const errorMsg =
        err.response?.data?.detail ||
        'Failed to load submission details.';
      setDetailError(errorMsg);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleOpenModal = (sub) => {
    const id = getSubmissionId(sub);
    if (!id) return;
    setSelectedSubmissionId(id);
    setIsModalOpen(true);
    setReviewComment('');
    setSuccessMessage(null);
    setActionError(null);
    fetchDetail(id);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedSubmissionId(null);
    setSubmissionDetail(null);
    setReviewComment('');
    setSuccessMessage(null);
    setActionError(null);
  };

  const handleReviewAction = async (statusType) => {
    const confirmMsg =
      statusType === 'Approved'
        ? 'Are you sure you want to approve this Application Check?'
        : 'Are you sure you want to reject this Application Check?';

    if (!window.confirm(confirmMsg)) {
      return;
    }

    if (!selectedSubmissionId) return;

    setReviewLoading(true);
    setActionError(null);
    setSuccessMessage(null);

    try {
      await api.put(`/programs/application-check-submissions/${selectedSubmissionId}/review`, {
        status: statusType,
        review_comment: reviewComment,
      });

      const successText =
        statusType === 'Approved'
          ? 'Application Check approved successfully.'
          : 'Application Check rejected successfully.';

      setSuccessMessage(successText);

      // Refresh list and detail data
      await fetchSubmissions();
      await fetchDetail(selectedSubmissionId);
      setReviewComment('');
    } catch (err) {
      const errorMsg =
        err.response?.data?.detail ||
        'Failed to update application check review.';
      setActionError(errorMsg);
    } finally {
      setReviewLoading(false);
    }
  };

  // Frontend filtering and search
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((sub) => {
      const status = getStatus(sub);
      
      if (filterStatus !== 'All') {
        if (filterStatus.toLowerCase() === 'pending review') {
          if (!isStatusPending(status)) {
            return false;
          }
        } else {
          if (status.toLowerCase() !== filterStatus.toLowerCase()) {
            return false;
          }
        }
      }

      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const name = getLearnerName(sub).toLowerCase();
        const email = getLearnerEmail(sub).toLowerCase();
        const program = getProgramName(sub).toLowerCase();

        if (
          !name.includes(query) &&
          !email.includes(query) &&
          !program.includes(query)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [submissions, filterStatus, searchQuery]);

  const renderStatusBadge = (status) => {
    const normalized = (status || '').toLowerCase();
    if (normalized === 'approved') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-[#10B981] border border-[#10B981]/30">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Approved
        </span>
      );
    }
    if (normalized === 'rejected') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-600 border border-rose-200">
          <XCircle className="w-3.5 h-3.5" />
          Rejected
        </span>
      );
    }
    // "Submitted" or "Pending Review"
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 text-[#693C83] border border-[#D9CFE8]">
        <AlertCircle className="w-3.5 h-3.5" />
        {status || 'Pending Review'}
      </span>
    );
  };

  return (
    <MainLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* SECTION 1 — PAGE HEADER */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[#D9CFE8] pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="p-2 rounded-lg border border-[#D9CFE8] text-[#4F4679] hover:bg-[#D9CFE8]/20 transition-colors"
                title="Go back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-2xl font-bold text-[#1E1B4B]">
                Application Check Submissions
              </h1>
            </div>
            <p className="text-sm text-[#4F4679] pl-11">
              Review learner application check submissions and approve or reject them.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3">

  {/* Automation Toggle */}
  <div className="flex items-center gap-3 bg-white border border-[#D9CFE8] rounded-lg px-4 py-2 shadow-sm">
    <div className="flex flex-col">
      <span className="text-sm font-semibold text-[#1E1B4B]">
        Automate Application Checks
      </span>

      <span className="text-xs text-[#4F4679]">
        {automationEnabled ? "Automation ON" : "Automation OFF"}
      </span>
    </div>

    <button
      type="button"
      onClick={handleAutomationToggle}
      disabled={automationLoading || automationUpdating}
      className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
        automationEnabled
          ? "bg-[#10B981]"
          : "bg-gray-300"
      } ${
        automationLoading || automationUpdating
          ? "opacity-50 cursor-not-allowed"
          : "cursor-pointer"
      }`}
      aria-label="Toggle Application Check Automation"
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
          automationEnabled
            ? "translate-x-6"
            : "translate-x-1"
        }`}
      />
    </button>
  </div>

  {/* Refresh Button */}
  <button
    onClick={fetchSubmissions}
    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#D9CFE8] text-[#1E1B4B] bg-white hover:bg-[#D9CFE8]/20 transition-colors text-sm font-medium shadow-sm"
  >
    <RefreshCw
      className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
    />
    Refresh
  </button>

</div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* FILTER & SEARCH SECTION */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl border border-[#D9CFE8] shadow-sm">
          {/* Status Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {['Pending Review', 'Approved', 'Rejected', 'All'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                  filterStatus === status
                    ? 'bg-[#693C83] text-white shadow-sm'
                    : 'bg-[#D9CFE8]/20 text-[#4F4679] hover:bg-[#D9CFE8]/40 border border-[#D9CFE8]'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4F4679]" />
            <input
              type="text"
              placeholder="Search by name, email, or program..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-[#D9CFE8] text-sm text-[#1E1B4B] placeholder-[#4F4679]/60 focus:outline-none focus:ring-2 focus:ring-[#693C83] bg-white"
            />
          </div>
        </div>

        {/* SECTION 2 — SUBMISSION LIST */}
        <div className="bg-white rounded-xl border border-[#D9CFE8] shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-16 space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-[#693C83]" />
              <p className="text-sm text-[#4F4679]">Loading application check submissions...</p>
            </div>
          ) : filteredSubmissions.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-16 space-y-3 text-center">
              <FileText className="w-12 h-12 text-[#D9CFE8]" />
              <p className="text-sm font-medium text-[#1E1B4B]">
                {submissions.length === 0
                  ? 'No application check submissions found.'
                  : `No ${filterStatus.toLowerCase()} application check submissions.`}
              </p>
              <p className="text-xs text-[#4F4679]">
                Try adjusting your filters or search query.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#D9CFE8]/20 border-b border-[#D9CFE8] text-xs font-semibold text-[#1E1B4B]">
                    <th className="p-4">Learner</th>
                    <th className="p-4">Program</th>
                    <th className="p-4">Check #</th>
                    <th className="p-4">Submitted At</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D9CFE8] text-sm">
                  {filteredSubmissions.map((sub) => {
                    const subId = getSubmissionId(sub);
                    return (
                      <tr key={subId} className="hover:bg-[#D9CFE8]/10 transition-colors">
                        <td className="p-4">
                          <div className="font-semibold text-[#1E1B4B]">
                            {getLearnerName(sub)}
                          </div>
                          <div className="text-xs text-[#4F4679]">
                            {getLearnerEmail(sub)}
                          </div>
                        </td>
                        <td className="p-4 font-medium text-[#1E1B4B]">
                          {getProgramName(sub)}
                        </td>
                        <td className="p-4 text-[#4F4679]">
                          #{getCheckNumber(sub)}
                        </td>
                        <td className="p-4 text-[#4F4679] text-xs">
                          {getSubmittedAt(sub)}
                        </td>
                        <td className="p-4">
                          {renderStatusBadge(getStatus(sub))}
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleOpenModal(sub)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#693C83] text-white text-xs font-medium hover:bg-[#693C83]/90 transition-colors shadow-sm"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* SECTION 3 — VIEW SUBMISSION MODAL */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-[#D9CFE8] overflow-hidden">
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#D9CFE8] bg-[#693C83] text-white">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  <h2 className="text-lg font-bold">
                    Application Check Submission Details
                  </h2>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="p-1 rounded-lg hover:bg-white/10 transition-colors text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto flex-1 space-y-6">
                {detailLoading ? (
                  <div className="flex flex-col items-center justify-center p-12 space-y-3">
                    <Loader2 className="w-8 h-8 animate-spin text-[#693C83]" />
                    <p className="text-sm text-[#4F4679]">Loading submission details...</p>
                  </div>
                ) : detailError ? (
                  <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm">{detailError}</span>
                  </div>
                ) : submissionDetail ? (
                  <>
                    {/* Success / Action Errors */}
                    {successMessage && (
                      <div className="p-4 rounded-lg bg-emerald-50 border border-[#10B981]/30 text-[#10B981] flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                        <span className="text-sm font-medium">{successMessage}</span>
                      </div>
                    )}
                    {actionError && (
                      <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <span className="text-sm">{actionError}</span>
                      </div>
                    )}

                    {/* Summary Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#D9CFE8]/10 p-4 rounded-xl border border-[#D9CFE8]">
                      <div className="space-y-2">
                        <div className="text-xs font-semibold text-[#4F4679] uppercase tracking-wider">
                          Learner Information
                        </div>
                        <div className="flex items-center gap-2 text-sm text-[#1E1B4B]">
                          <User className="w-4 h-4 text-[#693C83]" />
                          <span className="font-semibold">
                            {submissionDetail.candidate_name || submissionDetail.employee_name || submissionDetail.learner_name || 'N/A'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-[#4F4679]">
                          <Mail className="w-4 h-4 text-[#693C83]" />
                          <span>{submissionDetail.candidate_email || submissionDetail.employee_email || submissionDetail.learner_email || 'N/A'}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="text-xs font-semibold text-[#4F4679] uppercase tracking-wider">
                          Program & Submission Info
                        </div>
                        <div className="flex items-center gap-2 text-sm text-[#1E1B4B]">
                          <BookOpen className="w-4 h-4 text-[#693C83]" />
                          <span className="font-semibold">
                            {submissionDetail.program_name || 'N/A'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-[#4F4679]">
                          <FileText className="w-4 h-4 text-[#693C83]" />
                          <span>Check #{submissionDetail.check_number ?? 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-[#4F4679]">
                          <Calendar className="w-4 h-4 text-[#693C83]" />
                          <span>Submitted: {submissionDetail.submitted_at ?? submissionDetail.attempted_at ?? 'N/A'}</span>
                        </div>
                      </div>

                      {/* Extra metrics grid */}
                      <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 border-t border-[#D9CFE8]">
                        <div>
                          <div className="text-xs text-[#4F4679]">Score</div>
                          <div className="text-sm font-semibold text-[#1E1B4B]">
                            {submissionDetail.score !== undefined && submissionDetail.total_questions !== undefined
                              ? `${submissionDetail.score} / ${submissionDetail.total_questions}`
                              : submissionDetail.score ?? 'N/A'}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-[#4F4679]">Percentage</div>
                          <div className="text-sm font-semibold text-[#1E1B4B]">
                            {submissionDetail.percentage !== undefined && submissionDetail.percentage !== null
                              ? `${submissionDetail.percentage}%`
                              : 'N/A'}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-[#4F4679]">Passed</div>
                          <div className="text-sm font-semibold text-[#1E1B4B]">
                            {submissionDetail.passed === true ? 'Yes' : submissionDetail.passed === false ? 'No' : 'N/A'}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-[#4F4679]">Status</div>
                          <div className="mt-1">
                            {renderStatusBadge(submissionDetail.status)}
                          </div>
                        </div>
                      </div>

                      {/* Previous review info if available */}
                      {submissionDetail.reviewed_at && (
                        <div className="md:col-span-2 pt-2 border-t border-[#D9CFE8] text-xs text-[#4F4679] space-y-1">
                          <div>Reviewed by: <span className="font-semibold text-[#1E1B4B]">{submissionDetail.reviewed_by || 'Admin'}</span> on {submissionDetail.reviewed_at}</div>
                          {submissionDetail.review_comment && (
                            <div className="italic bg-white p-2 rounded border border-[#D9CFE8]">
                              "{submissionDetail.review_comment}"
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* QUESTIONS AND ANSWERS (Matched by question_id) */}
                    <div className="space-y-4">
                      <h3 className="text-base font-bold text-[#1E1B4B] flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-[#693C83]" />
                        Questions & Learner Answers
                      </h3>

                      {Array.isArray(submissionDetail.questions) && submissionDetail.questions.length > 0 ? (
                        <div className="space-y-4">
                          {submissionDetail.questions
                            .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
                            .map((q, idx) => {
                              const qText = q.question || q.question_text || `Question ${idx + 1}`;
                              const matchingAnswer = Array.isArray(submissionDetail.answers)
  ? submissionDetail.answers.find(
      (a) => Number(a.question_id) === Number(q.id)
    )
  : null;

const ansText =
  matchingAnswer?.answer !== undefined &&
  matchingAnswer?.answer !== null &&
  String(matchingAnswer.answer).trim() !== ''
    ? String(matchingAnswer.answer)
    : matchingAnswer?.selected_option !== undefined &&
      matchingAnswer?.selected_option !== null
      ? `Selected Option: ${matchingAnswer.selected_option}`
      : 'No answer provided.';
                              
                              return (
                                <div
                                  key={q.id || idx}
                                  className="p-4 rounded-xl border border-[#D9CFE8] bg-white space-y-2 shadow-sm"
                                >
                                  <div className="text-xs font-bold text-[#693C83] uppercase tracking-wider">
                                    Question {q.display_order ?? idx + 1}
                                  </div>
                                  <div className="text-sm font-semibold text-[#1E1B4B]">
                                    {qText}
                                  </div>
                                  <div className="pt-2 border-t border-[#D9CFE8]/50 space-y-1">
                                    <div className="text-xs font-semibold text-[#4F4679]">
                                      Learner Answer:
                                    </div>
                                    <div className="text-sm text-[#1E1B4B] bg-[#D9CFE8]/10 p-3 rounded-lg border border-[#D9CFE8]/40 whitespace-pre-wrap">
                                      {ansText}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      ) : (
                        <div className="p-6 rounded-xl border border-[#D9CFE8] bg-[#D9CFE8]/10 text-center text-sm text-[#4F4679]">
                          No questions found for this submission.
                        </div>
                      )}
                    </div>

                    {/* REVIEW SECTION */}
                    <div className="pt-4 border-t border-[#D9CFE8] space-y-4">
                      <h3 className="text-base font-bold text-[#1E1B4B]">
                        Review Application Check
                      </h3>

                      {isStatusPending(submissionDetail.status) ? (
                        <div className="space-y-4">
                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-[#4F4679]">
                              Review Comment (Optional)
                            </label>
                            <textarea
                              rows={3}
                              placeholder="Enter feedback or review comments for the learner..."
                              value={reviewComment}
                              onChange={(e) => setReviewComment(e.target.value)}
                              className="w-full p-3 rounded-xl border border-[#D9CFE8] text-sm text-[#1E1B4B] placeholder-[#4F4679]/60 focus:outline-none focus:ring-2 focus:ring-[#693C83] bg-white"
                            />
                          </div>

                          <div className="flex items-center justify-end gap-3 pt-2">
                            <button
                              type="button"
                              disabled={reviewLoading}
                              onClick={() => handleReviewAction('Rejected')}
                              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 font-semibold text-sm transition-colors disabled:opacity-50"
                            >
                              {reviewLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <X className="w-4 h-4" />
                              )}
                              Reject
                            </button>

                            <button
                              type="button"
                              disabled={reviewLoading}
                              onClick={() => handleReviewAction('Approved')}
                              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#10B981] text-white hover:bg-[#10B981]/90 font-semibold text-sm transition-colors shadow-sm disabled:opacity-50"
                            >
                              {reviewLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Check className="w-4 h-4" />
                              )}
                              Approve
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 rounded-xl bg-[#D9CFE8]/20 border border-[#D9CFE8] text-center text-sm font-semibold text-[#1E1B4B]">
                          {(submissionDetail.status || '').toLowerCase() === 'approved'
                            ? 'Already Approved'
                            : 'Already Rejected'}
                        </div>
                      )}
                    </div>
                  </>
                ) : null}
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end px-6 py-3 border-t border-[#D9CFE8] bg-[#D9CFE8]/10">
                <button
                  onClick={handleCloseModal}
                  className="px-4 py-2 rounded-lg border border-[#D9CFE8] text-sm font-semibold text-[#4F4679] hover:bg-white transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}