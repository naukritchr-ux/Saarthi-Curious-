import React, { useEffect, useRef } from 'react';
import {
  X,
  Calendar,
  Clock,
  Layers,
  Award,
  CheckCircle,
  AlertCircle,
  Bookmark,
  TrendingUp,
  Trophy,
  Zap,
  Timer,
  Target,
  Sparkles,
  ArrowRight,
  Share2,
  Download
} from 'lucide-react';

export default function PreviewTemplateModal({ isOpen, template, onClose }) {
  const modalRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Handle clicking outside the modal content to close it
  const handleOverlayClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      onClose();
    }
  };

  if (!isOpen || !template) return null;

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const score = 92;
  const strokeDashoffset = 440 - (440 * score) / 100;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm overflow-hidden"
      onClick={handleOverlayClick}
    >
      <div 
        ref={modalRef}
        className="relative w-full max-w-6xl h-[85vh] bg-white rounded-2xl shadow-2xl border border-slate-200/80 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-lg font-bold text-slate-800">
              {template.name || 'Untitled Template'}
            </h2>
            <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 text-xs font-semibold rounded-md border border-slate-200">
              {template.category || 'General'}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              v{template.version || '1.0.0'}
            </span>
            {template.is_default && (
              <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-md border border-indigo-100 flex items-center gap-1">
                <Bookmark className="w-3 h-3 fill-current" /> Default
              </span>
            )}
            <span className={`px-2.5 py-1 text-xs font-medium rounded-full border flex items-center gap-1.5 ${
              template.is_active 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60' 
                : 'bg-rose-50 text-rose-700 border-rose-200/60'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${template.is_active ? 'bg-emerald-500' : 'bg-rose-500'}`} />
              {template.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
          
          <button 
            type="button" 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-0 bg-slate-50/50">
          
          {/* Left Column: Metadata & Spec Info */}
          <div className="lg:col-span-5 p-6 bg-white border-r border-slate-100 flex flex-col justify-between space-y-6 overflow-y-auto">
            <div className="space-y-6">
              {/* Media Preview Section */}
              <div className="w-full">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Template Layout Image</p>
                {template.preview_image ? (
                  <div className="relative aspect-[16/9] rounded-2xl overflow-hidden border border-slate-200 shadow-inner bg-slate-50 group">
                    <img 
                      src={template.preview_image} 
                      alt={template.name} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                ) : (
                  <div className="relative aspect-[16/9] rounded-2xl overflow-hidden border border-dashed border-slate-200 bg-gradient-to-br from-indigo-50/40 via-purple-50/30 to-slate-50 flex flex-col items-center justify-center p-6 text-center">
                    <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-100 text-indigo-500 mb-2.5">
                      <Layers className="w-6 h-6"/>
                    </div>
                    <p className="text-sm font-semibold text-slate-700">Dynamic Card Layout Rendered</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-[240px]">No static preview image uploaded. Using live CSS canvas components.</p>
                  </div>
                )}
              </div>

              {/* Specs & Field Details */}
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Description</label>
                  <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                    {template.description || 'No descriptive guide text generated for this template version.'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                    <span className="text-xs font-medium text-slate-400 block">Total Quiz Usage</span>
                    <span className="text-lg font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
                      <TrendingUp className="w-4 h-4 text-indigo-500"/> {template.usage_count || 0} times
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                    <span className="text-xs font-medium text-slate-400 block">System Component</span>
                    <span className="text-xs font-mono font-semibold text-slate-700 block truncate mt-1 bg-white px-2 py-0.5 border border-slate-200/60 rounded">
                      {template.component_name || 'StandardResultView'}
                    </span>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-4 space-y-2.5">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-slate-400"/> Created On</span>
                    <span className="font-semibold text-slate-700">{formatDate(template.created_at)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-slate-400"/> Last Modified</span>
                    <span className="font-semibold text-slate-700">{formatDate(template.updated_at)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Helper Tips */}
            <div className="bg-indigo-50/40 border border-indigo-100/60 rounded-2xl p-4 mt-auto">
              <div className="flex gap-2">
                <Sparkles className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5"/>
                <div>
                  <h4 className="text-xs font-bold text-indigo-900">Live Simulation Note</h4>
                  <p className="text-[11px] text-indigo-700/80 mt-0.5 leading-normal">
                    The right dashboard presents a live, production-grade template mockup injecting simulated variables dynamically into the view framework.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Live Premium Mock Result Page */}
          <div className="lg:col-span-7 p-6 overflow-y-auto max-h-full">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Live Interactive Preview Sandbox</span>
              </div>
              <span className="text-[11px] bg-slate-200/70 text-slate-600 font-semibold px-2 py-0.5 rounded-full">Student Perspective</span>
            </div>

            {/* Simulated Result Container Frame */}
            <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xl overflow-hidden transition-all duration-300">
              
              {/* Premium Result Hero Header Banner */}
              <div className="relative bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.15),transparent)] pointer-events-none" />
                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded text-[11px] font-semibold tracking-wide border border-emerald-500/30 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3"/> Passed
                      </span>
                      <span className="text-xs text-slate-400">• Verified Certification Tier</span>
                    </div>
                    <h3 className="text-xl font-bold tracking-tight text-white">Java Fundamentals</h3>
                    <p className="text-xs text-slate-300/80 mt-0.5">Candidate Accomplishment Dossier</p>
                  </div>
                  <div className="flex items-center gap-3 bg-white/5 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/10 self-start md:self-auto">
                    <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-400/30 font-bold text-indigo-300 text-sm">
                      JD
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Student Profile</div>
                      <div className="text-sm font-semibold text-white">John Doe</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Metric Presentation Layout */}
              <div className="p-6 space-y-6">
                
                {/* Score Circular Progress Ring & Core Metrics Split Row */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                  
                  {/* Progress Ring Card */}
                  <div className="md:col-span-5 flex flex-col items-center justify-center bg-slate-50/50 border border-slate-100 rounded-xl p-4 text-center">
                    <div className="relative w-32 h-32 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
                        <circle cx="80" cy="80" r="70" className="text-slate-100" strokeWidth="12" stroke="currentColor" fill="transparent" />
                        <circle 
                          cx="80" 
                          cy="80" 
                          r="70" 
                          className="text-indigo-600 transition-all duration-1000 ease-out" 
                          strokeWidth="12" 
                          strokeDasharray="440" 
                          strokeDashoffset={strokeDashoffset} 
                          strokeLinecap="round" 
                          stroke="currentColor" 
                          fill="transparent" 
                        />
                      </svg>
                      <div className="absolute flex flex-col items-center justify-center">
                        <span className="text-3xl font-black text-slate-800 tracking-tight">{score}%</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Final Score</span>
                      </div>
                    </div>
                    <p className="text-xs font-semibold text-indigo-700 mt-3 bg-indigo-50 px-2.5 py-0.5 rounded-full">
                      Exceeded Cutoff by +22%
                    </p>
                  </div>

                  {/* Performance Breakdown Parameters */}
                  <div className="md:col-span-7 space-y-3">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Performance Metrics</h4>
                    
                    <div className="space-y-2.5">
                      <div>
                        <div className="flex justify-between text-xs font-medium text-slate-600 mb-1">
                          <span>Accuracy Level</span>
                          <span className="font-bold text-slate-800">94.5%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: '94.5%' }}></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs font-medium text-slate-600 mb-1">
                          <span>Speed Factor</span>
                          <span className="font-bold text-slate-800">88% Optimal</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500 rounded-full" style={{ width: '88%' }}></div>
                        </div>
                      </div>

                      <div className="pt-2 grid grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center gap-1.5 text-slate-500 bg-slate-50 px-2 py-1.5 rounded-lg border border-slate-100">
                          <Trophy className="w-3.5 h-3.5 text-amber-500"/>
                          <div>
                            <span className="text-[10px] text-slate-400 block leading-none">Rank</span>
                            <span className="font-bold text-slate-700">#12 / 1,420</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-500 bg-slate-50 px-2 py-1.5 rounded-lg border border-slate-100">
                          <Timer className="w-3.5 h-3.5 text-indigo-500"/>
                          <div>
                            <span className="text-[10px] text-slate-400 block leading-none">Time Taken</span>
                            <span className="font-bold text-slate-700">24m 15s</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Simulated Grid Cards Block */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100 text-center transition-transform hover:-translate-y-0.5 duration-200">
                    <Target className="w-4 h-4 text-slate-400 mx-auto mb-1"/>
                    <span className="text-[10px] text-slate-400 uppercase block font-medium">Correct</span>
                    <span className="text-base font-bold text-slate-700">46 / 50</span>
                  </div>
                  <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100 text-center transition-transform hover:-translate-y-0.5 duration-200">
                    <AlertCircle className="w-4 h-4 text-slate-400 mx-auto mb-1"/>
                    <span className="text-[10px] text-slate-400 uppercase block font-medium">Incorrect</span>
                    <span className="text-base font-bold text-slate-700">4</span>
                  </div>
                  <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100 text-center transition-transform hover:-translate-y-0.5 duration-200">
                    <Zap className="w-4 h-4 text-slate-400 mx-auto mb-1"/>
                    <span className="text-[10px] text-slate-400 uppercase block font-medium">Percentile</span>
                    <span className="text-base font-bold text-slate-700">99.1%</span>
                  </div>
                  <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100 text-center transition-transform hover:-translate-y-0.5 duration-200">
                    <Award className="w-4 h-4 text-slate-400 mx-auto mb-1"/>
                    <span className="text-[10px] text-slate-400 uppercase block font-medium">XP Earned</span>
                    <span className="text-base font-bold text-slate-700">+450 XP</span>
                  </div>
                </div>

                {/* Gamification Badges Gathered Segment */}
                <div className="bg-slate-50/40 border border-slate-100 rounded-xl p-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">Accrued Performance Badges</h4>
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-800 text-xs font-medium rounded-full border border-amber-200/50 shadow-sm">
                      <span className="text-sm">⚡</span> Code Warrior
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-50 text-purple-800 text-xs font-medium rounded-full border border-purple-200/50 shadow-sm">
                      <span className="text-sm">🎯</span> Flawless Logic
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-800 text-xs font-medium rounded-full border border-blue-200/50 shadow-sm">
                      <span className="text-sm">⏱️</span> Pace Setter
                    </span>
                  </div>
                </div>

                {/* Automated Evaluation Assessment Feedback Panel */}
                <div className="border-l-4 border-indigo-500 bg-slate-50 p-4 rounded-r-xl">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    Architect Diagnostic Appraisal
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Excellent command over Object-Oriented paradigms, garbage collection vectors, and memory allocation optimization patterns. Minor syntax edge-cases observed in multi-threaded initialization parameters.
                  </p>
                </div>

                {/* Certification & Interactive CTA Action Links Simulation */}
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 border-t border-slate-100">
                  <div className="flex items-center gap-1">
                    <span>Issued and locked securely via Saarthi Engine on</span>
                    <span className="font-semibold text-slate-600">{formatDate(new Date())}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <button type="button" className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors flex items-center gap-1" disabled>
                      <Share2 className="w-3.5 h-3.5"/> Share
                    </button>
                    <button type="button" className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg font-bold transition-colors flex items-center gap-1" disabled>
                      <Download className="w-3.5 h-3.5"/> Certificate
                    </button>
                  </div>
                </div>

              </div>

            </div>

          </div>

        </div>

        {/* Footer Controls */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 border-t border-slate-100 shrink-0">
          <button 
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-all duration-200"
          >
            Close Preview
          </button>
          <button 
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2"
          >
            Use This Template <ArrowRight className="w-4 h-4"/>
          </button>
        </div>

      </div>
    </div>
  );
}