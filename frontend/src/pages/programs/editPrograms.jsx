import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import MainLayout from "../../layout/mainLayout";
import {
  ArrowLeft,
  Save,
  X,
  Upload,
  Loader2,
  PlayCircle,
  FileQuestion,
  Layers,
  Calendar,
  Lock,
  Target,
} from "lucide-react";
import { API_BASE } from "../../config/api";
import { uploadProgramThumbnail } from "../../services/programService";

const EditPrograms = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [program, setProgram] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "Mandatory",
    duration: "",
    language: "English",
    category: "",
    tags: "",
    status: "Draft",
    unlock_type: "Immediate",
    unlock_days: 0,
    thumbnail: "",
    curos: 0,
  });
  const [isUploading, setIsUploading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [categoryInput, setCategoryInput] = useState("");
  const [tagInput, setTagInput] = useState("");

  useEffect(() => {
    fetchProgram();
  }, [id]);

  const fetchProgram = async () => {
    try {
      const response = await fetch(`${API_BASE}/programs/${id}`);
      const data = await response.json();
      setProgram(data);

      setFormData({
        name: data.name || "",
        description: data.description || "",
        type: data.type || "Mandatory",
        duration: data.duration || "",
        language: data.language || "English",
        category: data.category || "",
        tags: data.tags || "",
        status: data.status || "Draft",
        unlock_type: data.unlock_type || "Immediate",
        unlock_days: data.unlock_days || 0,
        thumbnail: data.thumbnail || "",
        curos: data.curos || 0,
      });

      if (data.tags) {
        setTags(
          data.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
        );
      }
      if (data.category) {
        setCategories(
          data.category
            .split(",")
            .map((c) => c.trim())
            .filter(Boolean),
        );
      }
    } catch (error) {
      console.error("Error fetching program:", error);
      alert("Failed to load program details.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
      setFormData((prev) => ({ ...prev, thumbnail: publicUrl }));
      alert("Thumbnail uploaded successfully!");
    } catch (error) {
      console.error("Error uploading thumbnail:", error.message);
      alert(error.message || "Failed to upload image.");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const handleAddCategory = (e) => {
    if (e.key === "Enter" && categoryInput.trim()) {
      e.preventDefault();
      if (!categories.includes(categoryInput.trim())) {
        const updated = [...categories, categoryInput.trim()];
        setCategories(updated);
        setFormData((prev) => ({ ...prev, category: updated.join(",") }));
      }
      setCategoryInput("");
    }
  };

  const handleRemoveCategory = (categoryToRemove) => {
    const updated = categories.filter((c) => c !== categoryToRemove);
    setCategories(updated);
    setFormData((prev) => ({ ...prev, category: updated.join(",") }));
  };

  const handleAddTag = (e) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        const updated = [...tags, tagInput.trim()];
        setTags(updated);
        setFormData((prev) => ({ ...prev, tags: updated.join(",") }));
      }
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    const updated = tags.filter((t) => t !== tagToRemove);
    setTags(updated);
    setFormData((prev) => ({ ...prev, tags: updated.join(",") }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert("Program name is required.");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`${API_BASE}/programs/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          curos: Number(formData.curos) || 0,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update program");
      }

      alert("Program updated successfully!");
      navigate(`/programs/${id}`);
    } catch (error) {
      console.error("Error updating program:", error);
      alert("Failed to update program. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <MainLayout dark>
        <div className="flex h-[50vh] items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout dark>
      <div className="-m-4 sm:-m-6 p-5 sm:p-7 min-h-[calc(100vh-4rem)] bg-[#04050A] text-slate-100 font-sans space-y-6 relative selection:bg-purple-500 selection:text-white">
        {/* Header */}
        <div className="rounded-3xl bg-[#060414] p-6 border-[2.5px] border-[#B026FF] shadow-[0_0_32px_rgba(176,38,255,0.35),inset_0_0_20px_rgba(176,38,255,0.08)]">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <button
                  onClick={() => navigate(`/programs/${id}`)}
                  className="p-2.5 rounded-xl border-2 border-purple-500/40 bg-purple-950/30 text-purple-200 hover:text-white hover:bg-purple-900/50 hover:border-purple-400 transition cursor-pointer"
                >
                  <ArrowLeft size={18} />
                </button>
                <h1 className="text-2xl font-black text-white tracking-tight drop-shadow-[0_2px_12px_rgba(255,255,255,0.2)]">
                  Edit Program
                </h1>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 font-semibold ml-12">
                Update program information, media, and security settings.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => navigate(`/programs/${id}`)}
                className="flex items-center gap-2 px-5 py-3 bg-indigo-500/20 hover:bg-indigo-500/35 text-indigo-200 rounded-2xl font-bold transition-all border border-indigo-400/50 cursor-pointer text-sm"
              >
                <FileQuestion size={16} />
                <span>Edit Modules & Quizzes</span>
              </button>

              <button
                onClick={handleSubmit}
                disabled={saving || isUploading}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-2xl font-black hover:from-emerald-500 hover:to-emerald-400 disabled:opacity-50 transition-all shadow-[0_4px_16px_rgba(16,185,129,0.4)] border border-emerald-400/40 cursor-pointer text-sm"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="rounded-3xl bg-[#080C1A] p-6 border-[2.5px] border-[#00F5FF] shadow-[0_0_32px_rgba(0,245,255,0.35),inset_0_0_20px_rgba(0,245,255,0.08)]">
            <div className="flex items-center gap-3 mb-6">
              <div className="rounded-xl bg-cyan-950/70 border border-cyan-400/40 p-2.5 text-cyan-300 shadow-sm">
                <FileQuestion size={20} />
              </div>
              <h2 className="text-lg font-black text-white">
                Basic Information
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block mb-2 font-bold text-slate-200 text-xs uppercase tracking-wider">
                  Program Name <span className="text-rose-400">*</span>
                </label>
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full rounded-xl border-2 border-slate-700 bg-[#050814] p-3 text-sm text-white focus:border-[#00F5FF] outline-none transition-all placeholder:text-slate-500"
                  placeholder="Enter program name"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block mb-2 font-bold text-slate-200 text-xs uppercase tracking-wider">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  className="w-full rounded-xl border-2 border-slate-700 bg-[#050814] p-3 text-sm text-white focus:border-[#00F5FF] outline-none transition-all resize-none placeholder:text-slate-500"
                  placeholder="Enter description"
                />
              </div>

              <div>
                <label className="block mb-2 font-bold text-slate-200 text-xs uppercase tracking-wider">
                  Program Type
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full rounded-xl border-2 border-slate-700 bg-[#050814] p-3 text-sm text-white focus:border-[#00F5FF] outline-none transition-all"
                >
                  <option className="bg-[#080C1A] text-white">Mandatory</option>
                  <option className="bg-[#080C1A] text-white">Optional</option>
                </select>
              </div>

              <div>
                <label className="block mb-2 font-bold text-slate-200 text-xs uppercase tracking-wider">
                  Duration
                </label>
                <input
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  className="w-full rounded-xl border-2 border-slate-700 bg-[#050814] p-3 text-sm text-white focus:border-[#00F5FF] outline-none transition-all placeholder:text-slate-500"
                  placeholder="Example: 2 Hours"
                />
              </div>

              <div>
                <label className="block mb-2 font-bold text-slate-200 text-xs uppercase tracking-wider">
                  Language
                </label>
                <select
                  name="language"
                  value={formData.language}
                  onChange={handleChange}
                  className="w-full rounded-xl border-2 border-slate-700 bg-[#050814] p-3 text-sm text-white focus:border-[#00F5FF] outline-none transition-all"
                >
                  <option className="bg-[#080C1A] text-white">English</option>
                  <option className="bg-[#080C1A] text-white">Hindi</option>
                  <option className="bg-[#080C1A] text-white">Marathi</option>
                  <option className="bg-[#080C1A] text-white">Multiple</option>
                </select>
              </div>

              <div>
                <label className="block mb-2 font-bold text-slate-200 text-xs uppercase tracking-wider">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full rounded-xl border-2 border-slate-700 bg-[#050814] p-3 text-sm text-white focus:border-[#00F5FF] outline-none transition-all"
                >
                  <option className="bg-[#080C1A] text-white">Draft</option>
                  <option className="bg-[#080C1A] text-white">Published</option>
                  <option className="bg-[#080C1A] text-white">Archived</option>
                </select>
              </div>

              <div>
                <label className="block mb-2 font-bold text-slate-200 text-xs uppercase tracking-wider">
                  Program Curos
                </label>
                <input
                  name="curos"
                  type="number"
                  value={formData.curos}
                  onChange={handleChange}
                  className="w-full rounded-xl border-2 border-slate-700 bg-[#050814] p-3 text-sm text-white focus:border-[#00F5FF] outline-none transition-all placeholder:text-slate-500"
                  placeholder="Enter Curos"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block mb-2 font-bold text-slate-200 text-xs uppercase tracking-wider">
                  Categories
                </label>
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {categories.map((cat, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-1.5 bg-indigo-950/80 text-indigo-300 border border-indigo-500/50 px-3 py-1 rounded-full text-xs font-bold shadow-sm"
                      >
                        <span>{cat}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveCategory(cat)}
                          className="hover:text-rose-400 transition"
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
                    className="w-full rounded-xl border-2 border-slate-700 bg-[#050814] p-3 text-sm text-white focus:border-[#00F5FF] outline-none transition-all placeholder:text-slate-500"
                    placeholder="Type category and press Enter"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block mb-2 font-bold text-slate-200 text-xs uppercase tracking-wider">
                  Tags
                </label>
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-1.5 bg-emerald-950/80 text-emerald-300 border border-emerald-500/50 px-3 py-1 rounded-full text-xs font-bold shadow-sm"
                      >
                        <span>{tag}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="hover:text-rose-400 transition"
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
                    className="w-full rounded-xl border-2 border-slate-700 bg-[#050814] p-3 text-sm text-white focus:border-[#00F5FF] outline-none transition-all placeholder:text-slate-500"
                    placeholder="Type tag and press Enter"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block mb-2 font-bold text-slate-200 text-xs uppercase tracking-wider">
                  Program Thumbnail
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailUpload}
                    className="w-full rounded-xl border-2 border-dashed border-slate-700 bg-[#050814] p-4 text-sm text-white focus:border-[#00F5FF] outline-none cursor-pointer opacity-0 absolute inset-0 z-10"
                  />
                  <div className="w-full rounded-xl border-2 border-dashed border-cyan-400/50 bg-[#050814] p-4 flex items-center justify-center min-h-[56px] hover:border-cyan-300 transition">
                    {isUploading ? (
                      <Loader2
                        className="text-cyan-400 animate-spin"
                        size={20}
                      />
                    ) : (
                      <div className="flex items-center gap-2 text-cyan-300 font-bold text-xs">
                        <Upload size={18} />
                        <span>
                          Click or drag to upload thumbnail
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                {formData.thumbnail && (
                  <div className="mt-3">
                    <p className="text-xs text-slate-400 mb-2 font-bold">
                      Thumbnail Preview:
                    </p>
                    <img
                      src={formData.thumbnail}
                      alt="Thumbnail preview"
                      className="w-32 h-32 object-cover rounded-xl border-2 border-slate-700 shadow-md"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Access Control */}
          <div className="rounded-3xl bg-[#080C1A] p-6 border-[2.5px] border-[#FFE600] shadow-[0_0_32px_rgba(255,230,0,0.35),inset_0_0_20px_rgba(255,230,0,0.08)]">
            <div className="flex items-center gap-3 mb-6">
              <div className="rounded-xl bg-amber-950/70 border border-amber-400/40 p-2.5 text-amber-300 shadow-sm">
                <Lock size={20} />
              </div>
              <h2 className="text-lg font-black text-white">
                Access Control
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block mb-2 font-bold text-slate-200 text-xs uppercase tracking-wider">
                  Unlock Type
                </label>
                <select
                  name="unlock_type"
                  value={formData.unlock_type}
                  onChange={handleChange}
                  className="w-full rounded-xl border-2 border-slate-700 bg-[#050814] p-3 text-sm text-white focus:border-[#FFE600] outline-none transition-all"
                >
                  <option className="bg-[#080C1A] text-white">Immediate</option>
                  <option className="bg-[#080C1A] text-white">After Days</option>
                </select>
              </div>

              <div>
                <label className="block mb-2 font-bold text-slate-200 text-xs uppercase tracking-wider">
                  Unlock After Days
                </label>
                <input
                  name="unlock_days"
                  type="number"
                  min="0"
                  value={formData.unlock_days}
                  onChange={handleChange}
                  className="w-full rounded-xl border-2 border-slate-700 bg-[#050814] p-3 text-sm text-white focus:border-[#FFE600] outline-none transition-all placeholder:text-slate-500"
                  placeholder="Number of days"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => navigate(`/programs/${id}`)}
              className="px-6 py-2.5 rounded-xl border-2 border-slate-700 bg-[#050814] text-slate-300 font-bold hover:text-white hover:border-slate-500 transition-all cursor-pointer text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || isUploading}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-2xl font-black hover:from-emerald-500 hover:to-emerald-400 disabled:opacity-50 transition-all shadow-[0_4px_16px_rgba(16,185,129,0.4)] border border-emerald-400/40 cursor-pointer text-sm"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
};

export default EditPrograms;
