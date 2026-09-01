import React, { useState } from 'react';
import { 
  Eye, 
  Edit3, 
  Copy, 
  Trash2, 
  ToggleLeft, 
  ToggleRight, 
  Calendar, 
  Layers, 
  CheckCircle, 
  AlertCircle,
  FileText
} from 'lucide-react';

/**
 * Enterprise-grade TemplateCard component for the Saarthi Curious Admin Dashboard.
 * Designed with modern aesthetic cues from Canva and Notion.
 * Fully accessible, performant, and responsive.
 * 
 * @param {Object} props
 * @param {Object} props.template - The template data object from the backend
 * @param {Function} props.onPreview - Callback function when previewing template
 * @param {Function} props.onEdit - Callback function when editing template
 * @param {Function} props.onDelete - Callback function when deleting template
 * @param {Function} props.onDuplicate - Callback function when duplicating template
 * @param {Function} props.onStatusToggle - Callback function when toggling active status
 */
export default function TemplateCard({
  template,
  onPreview,
  onEdit,
  onDelete,
  onDuplicate,
  onStatusToggle
}) {
  const [isHovered, setIsHovered] = useState(false);

  // Destructure backend fields safely with defaults
  const {
    id,
    name = 'Untitled Template',
    description = 'No description provided for this template.',
    category = 'Classic',
    preview_image,
    usage_count = 0,
    version = '1.0.0',
    is_default = false,
    is_active = false,
    created_at
  } = template || {};

  // Format creation date gracefully
  const formattedDate = created_at 
    ? new Date(created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    : 'Recently';

  // Dynamic colors for category badges mimicking premium SaaS products
  const getCategoryStyles = (cat) => {
    const normalize = cat?.toLowerCase() || '';
    switch (normalize) {
      case 'certificate':
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/50';
      case 'corporate':
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/50';
      case 'gamified':
        return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-900/50';
      case 'leaderboard':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-900/50';
      case 'dashboard':
        return 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-900/50';
      case 'classic':
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
    }
  };

  return (
    <div
      className="group relative flex flex-col h-[440px] w-full bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-300 ease-out transform hover:-translate-y-1 overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      tabIndex={0}
      aria-label={`Template: ${name}`}
    >
      {/* Premium Border Animation Indicator */}
      <div 
        className={`absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 transition-opacity duration-300 ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Top Media Area / Preview Thumbnail */}
      <div className="relative w-full h-48 bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800/60 overflow-hidden flex items-center justify-center">
        {preview_image ? (
          <img
            src={preview_image}
            alt={`Preview of ${name}`}
            className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          /* Premium Placeholder Illustration */
          <div className="relative w-full h-full flex flex-col items-center justify-center p-6 bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-950 dark:to-slate-900">
            <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-70" />
            <div className="relative p-4 rounded-2xl bg-white dark:bg-slate-800 shadow-md border border-slate-100 dark:border-slate-700 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-2">
              <FileText className="w-10 h-10 text-indigo-500 dark:text-indigo-400" />
            </div>
            <span className="relative mt-3 text-xs font-medium text-slate-400 dark:text-slate-500 tracking-wider uppercase">
              Curious Studio Layout
            </span>
          </div>
        )}

        {/* Hover Overlay Mask for quick view */}
        <div 
          className={`absolute inset-0 bg-slate-950/20 backdrop-blur-[2px] flex items-center justify-center transition-opacity duration-200 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <button
            onClick={() => onPreview && onPreview(template)}
            className="px-4 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-semibold rounded-lg shadow-md hover:bg-slate-50 dark:hover:bg-slate-800 transition-all transform scale-95 group-hover:scale-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            aria-label={`Quick preview ${name}`}
          >
            Quick Preview
          </button>
        </div>

        {/* Absolute Badges over Image */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 pointer-events-none">
          {is_default && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider bg-violet-600 text-white shadow-sm ring-1 ring-violet-700/10">
              System Default
            </span>
          )}
        </div>

        {/* Status Badge - Top Right */}
        <div className="absolute top-3 right-3">
          <span 
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold shadow-sm backdrop-blur-md ${
              is_active 
                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-600/20' 
                : 'bg-slate-500/15 text-slate-600 dark:text-slate-400 ring-1 ring-slate-500/20'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${is_active ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
            {is_active ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      {/* Card Body Content */}
      <div className="flex flex-col flex-1 p-5">
        {/* Category Badge Row */}
        <div className="mb-2.5">
          <span className={`inline-flex items-center px-2 py-0.5 rounded border text-xs font-medium tracking-wide ${getCategoryStyles(category)}`}>
            {category}
          </span>
        </div>

        {/* Template Name */}
        <h3 
          className="text-lg font-bold text-slate-900 dark:text-slate-50 tracking-tight truncate mb-1.5 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors"
          title={name}
        >
          {name}
        </h3>

        {/* Description with Line Clamp */}
        <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 min-h-[40px] leading-relaxed mb-4">
          {description}
        </p>

        {/* Divider */}
        <div className="mt-auto border-t border-slate-100 dark:border-slate-800/80 pt-3" />

        {/* Metadata Block */}
        <div className="grid grid-cols-3 gap-2 text-xs font-medium text-slate-400 dark:text-slate-500">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider text-slate-400/80">Version</span>
            <span className="text-slate-700 dark:text-slate-300 mt-0.5 font-mono">{version}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider text-slate-400/80">Total Usage</span>
            <span className="text-slate-700 dark:text-slate-300 mt-0.5">{usage_count.toLocaleString()}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase tracking-wider text-slate-400/80">Created</span>
            <span className="text-slate-700 dark:text-slate-300 mt-0.5 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-400" />
              {formattedDate}
            </span>
          </div>
        </div>
      </div>

      {/* Premium Dashboard Action Bar */}
      <div className="px-4 py-3 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-1">
        
        {/* Left Side: Status Action Toggle */}
        <button
          onClick={() => onStatusToggle && onStatusToggle(id)}
          className={`group/btn flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
            is_active
              ? 'text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/30'
              : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
          }`}
          title={is_active ? "Deactivate Template" : "Activate Template"}
          aria-label={is_active ? "Deactivate Template" : "Activate Template"}
        >
          {is_active ? (
            <ToggleRight className="w-4 h-4 text-emerald-500" />
          ) : (
            <ToggleLeft className="w-4 h-4 text-slate-400" />
          )}
          <span className="hidden sm:inline">{is_active ? 'Enabled' : 'Disabled'}</span>
        </button>

        {/* Right Side: Standard Asset Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPreview && onPreview(template)}
            className="p-2 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors focus:outline-none focus:ring-1 focus:ring-indigo-500 relative"
            title="Preview Template"
            aria-label="Preview Template"
          >
            <Eye className="w-4 h-4" />
          </button>

          <button
            onClick={() => onEdit && onEdit(template)}
            className="p-2 text-slate-500 hover:text-amber-600 dark:text-slate-400 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors focus:outline-none focus:ring-1 focus:ring-indigo-500"
            title="Edit Template"
            aria-label="Edit Template"
          >
            <Edit3 className="w-4 h-4" />
          </button>

          <button
            onClick={() => onDuplicate && onDuplicate(template)}
            className="p-2 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors focus:outline-none focus:ring-1 focus:ring-indigo-500"
            title="Duplicate Template"
            aria-label="Duplicate Template"
          >
            <Copy className="w-4 h-4" />
          </button>

          <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-800 mx-1" />

          <button
            onClick={() => onDelete && onDelete(template)}
            className="p-2 text-slate-400 hover:text-rose-600 dark:text-slate-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors focus:outline-none focus:ring-1 focus:ring-rose-500"
            title="Delete Template"
            aria-label="Delete Template"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}