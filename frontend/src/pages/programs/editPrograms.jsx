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
        <div className="rounded-3xl bg-white p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <button
                  onClick={() => navigate(`/programs/${id}`)}
                  className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <ArrowLeft size={18} />
                </button>
                <h1 className="text-2xl font-bold text-gray-900">
                  Edit Program
                </h1>
              </div>
              <p className="text-sm text-gray-500 ml-11">
                Update program information and settings.
              </p>
            </div>
            <button
              onClick={handleSubmit}
              disabled={saving || isUploading}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#10B981] text-white rounded-xl font-semibold hover:bg-[#059669] disabled:opacity-50 transition-all shadow-md shadow-[#10B981]/20"
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="rounded-3xl bg-white p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="rounded-lg bg-blue-50 p-2">
                <FileQuestion className="text-blue-600" size={20} />
              </div>
              <h2 className="text-lg font-bold text-gray-900">
                Basic Information
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block mb-2 font-medium text-gray-700 text-sm">
                  Program Name <span className="text-red-500">*</span>
                </label>
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-900 focus:border-purple-500 focus:bg-white focus:ring-2 focus:ring-purple-500/10 outline-none transition-all"
                  placeholder="Enter program name"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block mb-2 font-medium text-gray-700 text-sm">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-900 focus:border-purple-500 focus:bg-white focus:ring-2 focus:ring-purple-500/10 outline-none transition-all resize-none"
                  placeholder="Enter description"
                />
              </div>

              <div>
                <label className="block mb-2 font-medium text-gray-700 text-sm">
                  Program Type
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-900 focus:border-purple-500 focus:bg-white focus:ring-2 focus:ring-purple-500/10 outline-none transition-all"
                >
                  <option>Mandatory</option>
                  <option>Optional</option>
                </select>
              </div>

              <div>
                <label className="block mb-2 font-medium text-gray-700 text-sm">
                  Duration
                </label>
                <input
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-900 focus:border-purple-500 focus:bg-white focus:ring-2 focus:ring-purple-500/10 outline-none transition-all"
                  placeholder="Example: 2 Hours"
                />
              </div>

              <div>
                <label className="block mb-2 font-medium text-gray-700 text-sm">
                  Language
                </label>
                <select
                  name="language"
                  value={formData.language}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-900 focus:border-purple-500 focus:bg-white focus:ring-2 focus:ring-purple-500/10 outline-none transition-all"
                >
                  <option>English</option>
                  <option>Hindi</option>
                  <option>Marathi</option>
                  <option>Multiple</option>
                </select>
              </div>

              <div>
                <label className="block mb-2 font-medium text-gray-700 text-sm">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-900 focus:border-purple-500 focus:bg-white focus:ring-2 focus:ring-purple-500/10 outline-none transition-all"
                >
                  <option>Draft</option>
                  <option>Published</option>
                  <option>Archived</option>
                </select>
              </div>

              <div>
                <label className="block mb-2 font-medium text-gray-700 text-sm">
                  Program Curos
                </label>
                <input
                  name="curos"
                  type="number"
                  value={formData.curos}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-900 focus:border-purple-500 focus:bg-white focus:ring-2 focus:ring-purple-500/10 outline-none transition-all"
                  placeholder="Enter Curos"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block mb-2 font-medium text-gray-700 text-sm">
                  Categories
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
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-900 focus:border-purple-500 focus:bg-white focus:ring-2 focus:ring-purple-500/10 outline-none transition-all"
                    placeholder="Type category and press Enter"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block mb-2 font-medium text-gray-700 text-sm">
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
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-900 focus:border-purple-500 focus:bg-white focus:ring-2 focus:ring-purple-500/10 outline-none transition-all"
                    placeholder="Type tag and press Enter"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block mb-2 font-medium text-gray-700 text-sm">
                  Program Thumbnail
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailUpload}
                    className="w-full rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-900 focus:border-purple-500 focus:bg-white focus:ring-2 focus:ring-purple-500/10 outline-none cursor-pointer hover:border-purple-300 opacity-0 absolute inset-0 z-10"
                  />
                  <div className="w-full rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 p-4 flex items-center justify-center min-h-[56px]">
                    {isUploading ? (
                      <Loader2
                        className="text-purple-500 animate-spin"
                        size={20}
                      />
                    ) : (
                      <div className="flex items-center gap-2 text-gray-400">
                        <Upload size={20} />
                        <span className="text-sm">
                          Click or drag to upload thumbnail
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                {formData.thumbnail && (
                  <div className="mt-3">
                    <p className="text-xs text-gray-500 mb-2">
                      Thumbnail Preview:
                    </p>
                    <img
                      src={formData.thumbnail}
                      alt="Thumbnail preview"
                      className="w-32 h-32 object-cover rounded-xl border border-gray-200"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Access Control */}
          <div className="rounded-3xl bg-white p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="rounded-lg bg-amber-50 p-2">
                <Lock className="text-amber-600" size={20} />
              </div>
              <h2 className="text-lg font-bold text-gray-900">
                Access Control
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block mb-2 font-medium text-gray-700 text-sm">
                  Unlock Type
                </label>
                <select
                  name="unlock_type"
                  value={formData.unlock_type}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-900 focus:border-purple-500 focus:bg-white focus:ring-2 focus:ring-purple-500/10 outline-none transition-all"
                >
                  <option>Immediate</option>
                  <option>After Days</option>
                </select>
              </div>

              <div>
                <label className="block mb-2 font-medium text-gray-700 text-sm">
                  Unlock After Days
                </label>
                <input
                  name="unlock_days"
                  type="number"
                  min="0"
                  value={formData.unlock_days}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-900 focus:border-purple-500 focus:bg-white focus:ring-2 focus:ring-purple-500/10 outline-none transition-all"
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
              className="px-6 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || isUploading}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#10B981] text-white rounded-xl font-semibold hover:bg-[#059669] disabled:opacity-50 transition-all shadow-md shadow-[#10B981]/20"
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
