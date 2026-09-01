import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from "../../layout/mainLayout";
import { Plus, BookOpen, Search, Eye, Pencil } from "lucide-react";

import { API_BASE } from "../../config/api";

const ProgramsPage = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [programs, setPrograms] = useState([]);
  const [allTags, setAllTags] = useState([]);

  useEffect(() => {
    fetchPrograms();
  }, []);

  const fetchPrograms = async () => {
    try {
      const response = await fetch(`${API_BASE}/programs/`);

      const data = await response.json();

      setPrograms(data);

      // Extract all unique tags from programs
      const tagsSet = new Set();
      data.forEach(program => {
        if (program.tags) {
          const tags = program.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
          tags.forEach(tag => tagsSet.add(tag));
        }
      });
      setAllTags(Array.from(tagsSet));
    } catch (error) {
      console.error(error);
    }
  };
console.log("Programs:", programs);
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
              className="flex items-center gap-2 rounded-2xl bg-[#10B981] px-5 py-3 font-semibold text-white"
            >
              <Plus size={18} />
              Create Program
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-3xl bg-white p-5 shadow">
            <p className="text-sm text-gray-500">Total Programs</p>

            <h2 className="mt-2 text-3xl font-bold">{programs.length}</h2>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow">
            <p className="text-sm text-gray-500">Published</p>

            <h2 className="mt-2 text-3xl font-bold text-green-600">8</h2>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow">
            <p className="text-sm text-gray-500">Draft</p>

            <h2 className="mt-2 text-3xl font-bold text-orange-500">4</h2>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow">
            <p className="text-sm text-gray-500">Total Modules</p>

            <h2 className="mt-2 text-3xl font-bold">45</h2>
          </div>
        </div>

        {/* Search */}
        <div className="rounded-3xl bg-white p-5 shadow">
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
                className="w-full rounded-xl border py-3 pl-11 pr-4"
              />
            </div>

            <select
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              className="rounded-xl border px-4"
            >
              <option value="">All Tags</option>
              {allTags.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>

            <select className="rounded-xl border px-4">
              <option>All</option>
              <option>Published</option>
              <option>Draft</option>
            </select>
          </div>
        </div>

        {/* Program Cards */}
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {programs
            .filter((program) => {
              const matchesSearch = program.name?.toLowerCase().includes(search.toLowerCase());
              const matchesTag = !tagFilter || (program.tags && program.tags.split(',').map(tag => tag.trim()).includes(tagFilter));
              return matchesSearch && matchesTag;
            })
            .map((program) => (
              <div
                key={program.id}
                onClick={() => navigate(`/programs/${program.id}`)}
                className="cursor-pointer rounded-3xl bg-white shadow transition hover:-translate-y-1 hover:shadow-xl overflow-hidden"
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
                  </div>

                  <h3 className="mt-4 text-xl font-semibold">{program.name}</h3>

                  <p className="mt-2 text-sm text-gray-500">
                    {program.type || "-"}
                  </p>

                  {program.duration && (
                    <p className="mt-1 text-sm text-gray-500">{program.duration}</p>
                  )}

                  {program.tags && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {program.tags.split(',').slice(0, 3).map((tag, index) => (
                        <span
                          key={index}
                          className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full"
                        >
                          {tag.trim()}
                        </span>
                      ))}
                      {program.tags.split(',').length > 3 && (
                        <span className="text-xs text-slate-400">+{program.tags.split(',').length - 3}</span>
                      )}
                    </div>
                  )}

                  <div className="mt-4 border-t pt-4">
                    <p className="text-sm text-gray-500">Modules</p>

                    <p className="font-semibold">{program.modules?.length || 0}</p>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </MainLayout>
  );
};

export default ProgramsPage;
