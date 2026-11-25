import { Radio, Sparkles, RefreshCw } from "lucide-react";

export default function AgentSyncStrip({
  syncData,
  syncLoading,
  onRefresh,
  onQuickAction,
}) {
  if (!syncData) return null;

  return (
    <div className="rounded-2xl px-4 py-3 bg-[#0C0B17]/95 border border-amber-400/40 shadow-[0_8px_24px_rgba(0,0,0,0.6)] flex flex-wrap items-center justify-between gap-3 text-xs">
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-400/45 text-[10px] font-black uppercase tracking-wider text-emerald-300 inline-flex items-center gap-1.5 shrink-0">
          <Radio className="w-3 h-3 animate-pulse" />
          <span>Tab-Entry Sync</span>
        </span>
        <p className="text-slate-100 font-semibold truncate">
          {syncData.briefing}
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {onQuickAction && syncData.recommended_action && (
          <button
            type="button"
            onClick={() => onQuickAction(syncData.recommended_action)}
            className="px-3 py-1.5 rounded-xl bg-amber-400/18 hover:bg-amber-400/30 border border-amber-300/55 text-amber-200 font-extrabold inline-flex items-center gap-1.5 cursor-pointer transition"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{syncData.recommended_action}</span>
          </button>
        )}
        <button
          type="button"
          onClick={onRefresh}
          title="Re-sync tab telemetry"
          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 border border-white/15 text-slate-300 cursor-pointer transition"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${syncLoading ? "animate-spin" : ""}`}
          />
        </button>
      </div>
    </div>
  );
}

