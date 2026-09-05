import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from "../../layout/mainLayout";
import {
  Plus,
  BookOpen,
  Search,
  Eye,
  Pencil,
  Trash2,
  MoreVertical,
  Loader2,
} from "lucide-react";

import { API_BASE } from "../../config/api";

const ProgramsPage = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [programs, setPrograms] = useState([]);
  const [allTags, setAllTags] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [programToDelete, setProgramToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPrograms();
  }, []);

  const fetchPrograms = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/programs/`);
      const data = await response.json();
      setPrograms(data.map((p) => ({ ...p, showMenu: false })));

      const tagsSet = new Set();
      data.forEach((program) => {
        if (program.tags) {
          const tags = program.tags
            .split(",")
            .map((tag) => tag.trim())
            .filter((tag) => tag);
          tags.forEach((tag) => tagsSet.add(tag));
        }
      });
      setAllTags(Array.from(tagsSet));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProgram = async (programId) => {
    setIsDeleting(true);
    try {
      const response = await fetch(`${API_BASE}/programs/${programId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete program");
      }

      setPrograms(programs.filter((p) => p.id !== programId));
      setShowDeleteModal(false);
      setProgramToDelete(null);
      alert("Program deleted successfully.");
    } catch (error) {
      console.error("Error deleting program:", error);
      alert("Failed to delete program. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleMenu = (programId, e) => {
    e.stopPropagation();
    setPrograms(
      programs.map((p) => ({
        ...p,
        showMenu: p.id === programId ? !p.showMenu : false,
      })),
    );
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex h-[50vh] items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="rounded-3xl bg-gradient-to-r from-[#1E1B4B] via-[#3F2B6D] to-[#693C83] p-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold">Programs</h1>
              <p className="mt-2 text-sm text-[#E9DFF7]">
                Manage all learning programs.
              </p>
            </div>
            <button
              onClick={() => navigate("/programs/create")}
              className="flex items-center gap-2 rounded-2xl bg-[#10B981] px-5 py-3 font-semibold text-white hover:bg-[#059669] transition-all shadow-lg shadow-[#10B981]/30"
            >
              <Plus size={18} />
              Create Program
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-3xl bg-white p-5 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">Total Programs</p>
            <h2 className="mt-2 text-3xl font-bold">{programs.length}</h2>
          </div>
          <div className="rounded-3xl bg-white p-5 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">Published</p>
            <h2 className="mt-2 text-3xl font-bold text-green-600">
              {programs.filter((p) => p.status === "Published").length}
            </h2>
          </div>
          <div className="rounded-3xl bg-white p-5 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">Draft</p>
            <h2 className="mt-2 text-3xl font-bold text-orange-500">
              {programs.filter((p) => p.status === "Draft").length}
            </h2>
          </div>
          <div className="rounded-3xl bg-white p-5 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">Total Modules</p>
            <h2 className="mt-2 text-3xl font-bold">
              {programs.reduce((acc, p) => acc + (p.modules?.length || 0), 0)}
            </h2>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="rounded-3xl bg-white p-5 shadow-sm border border-gray-100">
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-4 top-4 text-gray-400"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search Programs..."
                className="w-full rounded-xl border border-gray-200 py-3 pl-11 pr-4 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 outline-none transition-all"
              />
            </div>
            <select
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              className="rounded-xl border border-gray-200 px-4 py-3 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 outline-none transition-all"
            >
              <option value="">All Tags</option>
              {allTags.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Program Cards */}
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {programs
            .filter((program) => {
              const matchesSearch = program.name
                ?.toLowerCase()
                .includes(search.toLowerCase());
              const matchesTag =
                !tagFilter ||
                (program.tags &&
                  program.tags
                    .split(",")
                    .map((tag) => tag.trim())
                    .includes(tagFilter));
              return matchesSearch && matchesTag;
            })
            .map((program) => (
              <div
                key={program.id}
                className="rounded-3xl bg-white shadow-sm border border-gray-100 transition hover:-translate-y-1 hover:shadow-xl overflow-hidden relative"
              >
                <div
                  onClick={() => navigate(`/programs/${program.id}`)}
                  className="cursor-pointer"
                >
                  {program.thumbnail ? (
                    <img
                      src={program.thumbnail}
                      alt={program.name}
                      className="w-full h-48 object-cover"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gradient-to-br from-[#1E1B4B] via-[#3F2B6D] to-[#693C83] flex items-center justify-center">
                      <BookOpen className="text-white/80" size={48} />
                    </div>
                  )}
                </div>

                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        program.status === "Published"
                          ? "bg-green-100 text-green-700"
                          : "bg-orange-100 text-orange-700"
                      }`}
                    >
                      {program.status}
                    </span>
                    <div className="relative">
                      <button
                        onClick={(e) => toggleMenu(program.id, e)}
                        className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <MoreVertical size={18} className="text-gray-500" />
                      </button>
                      {program.showMenu && (
                        <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-xl shadow-lg z-10 min-w-[150px] py-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/programs/edit/${program.id}`);
                            }}
                            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 transition-colors"
                          >
                            <Pencil size={14} /> Edit
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setProgramToDelete(program);
                              setShowDeleteModal(true);
                              setPrograms(
                                programs.map((p) => ({
                                  ...p,
                                  showMenu: false,
                                })),
                              );
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                          >
                            <Trash2 size={14} /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div
                    onClick={() => navigate(`/programs/${program.id}`)}
                    className="cursor-pointer"
                  >
                    <h3 className="mt-4 text-xl font-semibold">
                      {program.name}
                    </h3>
                    <p className="mt-2 text-sm text-gray-500">
                      {program.type || "-"}
                    </p>
                    {program.duration && (
                      <p className="mt-1 text-sm text-gray-500">
                        {program.duration}
                      </p>
                    )}

                    {program.tags && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {program.tags
                          .split(",")
                          .slice(0, 3)
                          .map((tag, index) => (
                            <span
                              key={index}
                              className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full"
                            >
                              {tag.trim()}
                            </span>
                          ))}
                        {program.tags.split(",").length > 3 && (
                          <span className="text-xs text-slate-400">
                            +{program.tags.split(",").length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="mt-4 border-t pt-4">
                      <p className="text-sm text-gray-500">Modules</p>
                      <p className="font-semibold">
                        {program.modules?.length || 0}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <Trash2 className="text-red-600" size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Delete Program?
                </h3>
                <p className="text-sm text-gray-500">
                  This action cannot be undone.
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete "
              <span className="font-semibold">{programToDelete?.name}</span>"?
              All associated modules and content will be permanently removed.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setProgramToDelete(null);
                }}
                className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteProgram(programToDelete?.id)}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete Program"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default ProgramsPage;
