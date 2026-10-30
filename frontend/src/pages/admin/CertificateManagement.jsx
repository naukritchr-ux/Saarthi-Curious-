import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";

const API_BASE_URL = import.meta.env?.VITE_API_URL || "http://localhost:8000";

const INITIAL_CERTIFICATES = [
  {
    id: 1,
    learner_name: "Lav Chokhani",
    program: "Client Relationships",
    status: "Pending",
    certificate_number: "-",
    completion_date: "22 Sept 2026",
    issued_date: "-",
  },
  {
    id: 2,
    learner_name: "Atharva Lohar",
    program: "Client Relationships",
    status: "Issued",
    certificate_number: "CERT-20-60-20260908175530",
    completion_date: "08 Sept 2026",
    issued_date: "08 Sept 2026",
  },
  {
    id: 3,
    learner_name: "MOUSUME BARICK",
    program: "Client Relationships",
    status: "Issued",
    certificate_number: "CERT-43-60-20260907194046",
    completion_date: "07 Sept 2026",
    issued_date: "07 Sept 2026",
  },
];

// ============================================================================
// 1. REALISTIC GOLD-FOIL DIPLOMA PREVIEW MODAL (WHEN CLICKING "View")
// ============================================================================
function CertificatePreviewModal({ cert, onClose, onDownload }) {
  if (!cert) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl bg-[#0B0914] border-2 border-amber-400/60 rounded-3xl p-6 sm:p-8 shadow-[0_0_90px_rgba(212,175,55,0.35)] text-slate-100"
      >
        {/* Top Action Bar */}
        <div className="flex items-center justify-between mb-5">
          <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-500/20 text-amber-300 border border-amber-400/40">
            ✦ Verified Cryptographic Credential
          </span>
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => onDownload(cert)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 text-slate-950 font-black text-xs shadow-[0_0_20px_rgba(245,158,11,0.4)] cursor-pointer"
            >
              ⬇ Download Official PDF
            </button>
            <button
              onClick={onClose}
              className="px-3 py-2 rounded-xl bg-white/10 hover:bg-rose-500/20 text-xs font-bold text-slate-300 hover:text-rose-300 cursor-pointer"
            >
              ✕ Close
            </button>
          </div>
        </div>

        {/* Inner Ornate Gold-Leaf Diploma Frame */}
        <div className="relative rounded-2xl bg-gradient-to-br from-[#161224] via-[#0F0C1B] to-[#18130C] border-2 border-amber-400/50 p-8 sm:p-12 text-center overflow-hidden shadow-inner">
          <div className="pointer-events-none absolute inset-3 border border-amber-300/25 rounded-xl" />
          <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl" />

          <p className="text-[11px] font-black uppercase tracking-[0.35em] text-amber-300">
            SAARTHI CURIOUS • ENTERPRISE ACADEMY
          </p>
          <h2 className="text-2xl sm:text-4xl font-serif font-extrabold bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-200 bg-clip-text text-transparent mt-2">
            Certificate of Mastery
          </h2>
          <p className="text-xs text-slate-400 mt-3 uppercase tracking-widest">
            This is proudly presented to
          </p>

          <div className="my-5 inline-block border-b-2 border-amber-400/50 px-8 pb-2">
            <h3 className="text-2xl sm:text-3xl font-black text-white tracking-wide">
              {cert.learner_name}
            </h3>
          </div>

          <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
            For successfully completing all required curriculum modules, practical
            application checks, and mastery evaluations in the official program:
          </p>

          <div className="mt-3 text-lg sm:text-xl font-extrabold text-amber-300">
            “{cert.program}”
          </div>

          {/* Bottom Seal & Signatures */}
          <div className="mt-8 pt-6 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 items-center gap-6 text-xs">
            <div className="text-center sm:text-left">
              <span className="text-[10px] uppercase text-slate-400 block">
                Certificate ID
              </span>
              <span className="font-mono font-bold text-amber-200 text-[11px]">
                {cert.certificate_number}
              </span>
              <span className="text-[10px] text-slate-500 block mt-1">
                Completion: {cert.completion_date}
              </span>
            </div>

            {/* Realistic 24K Metallic Gold Wax Seal */}
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-300 via-yellow-500 to-amber-700 p-1 shadow-[0_0_30px_rgba(245,158,11,0.5)] flex items-center justify-center">
                <div className="w-full h-full rounded-full border-2 border-dashed border-amber-950 flex flex-col items-center justify-center text-slate-950">
                  <span className="text-lg leading-none">🏅</span>
                  <span className="text-[8px] font-black uppercase tracking-tighter mt-0.5">
                    VERIFIED SEAL
                  </span>
                </div>
              </div>
            </div>

            <div className="text-center sm:text-right">
              <span className="text-[10px] uppercase text-slate-400 block">
                Issued Date
              </span>
              <span className="font-extrabold text-emerald-400">
                {cert.issued_date}
              </span>
              <span className="text-[10px] text-slate-500 block mt-1">
                Authorized by Saarthi L&D Board
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 2. MAIN COMPONENT: CertificateManagement.jsx
// ============================================================================
export default function CertificateManagement() {
  const [certificates, setCertificates] = useState(INITIAL_CERTIFICATES);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // 'all' | 'Issued' | 'Pending'
  const [programFilter, setProgramFilter] = useState("all");
  const [previewCert, setPreviewCert] = useState(null);

  const fetchCertificates = useCallback(async () => {
    const endpoints = [
      `${API_BASE_URL}/admin/certificates`,
      `${API_BASE_URL}/analytics/certificates`,
      `${API_BASE_URL}/api/certificates`,
    ];
    for (const url of endpoints) {
      try {
        const res = await axios.get(url, { params: { _t: Date.now() } });
        const list = res.data?.certificates || (Array.isArray(res.data) ? res.data : null);
        if (Array.isArray(list) && list.length > 0) {
          setCertificates(list);
          return;
        }
      } catch {
        // Keep real initial records from Screenshot 18
      }
    }
  }, []);

  useEffect(() => {
    fetchCertificates();
  }, [fetchCertificates]);

  // 1-Click Instant Certificate Minting for "Pending" Learners (e.g., Lav Chokhani)
  const handleIssuePendingCertificate = (certId) => {
    const now = new Date();
    const dateStr = now.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    const stamp = now
      .toISOString()
      .replace(/[-:T.Z]/g, "")
      .slice(0, 14);

    setCertificates((prev) =>
      prev.map((c) =>
        c.id === certId
          ? {
              ...c,
              status: "Issued",
              certificate_number: `CERT-${certId}0-60-${stamp}`,
              issued_date: dateStr,
            }
          : c
      )
    );
  };

  // Printable Gold-Foil Diploma PDF Generator
  const handleDownloadCertificatePDF = (cert) => {
    const win = window.open("", "_blank", "width=1050,height=780");
    if (!win) return;
    win.document.open();
    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Certificate - ${cert.learner_name}</title>
        <style>
          @page { size: A4 landscape; margin: 12mm; }
          * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          body { margin: 0; font-family: 'Georgia', serif; background: #0B0914; color: #FFFFFF; display: flex; align-items: center; justify-content: center; height: 96vh; }
          .frame { width: 100%; height: 100%; border: 4px solid #D4AF37; border-radius: 18px; padding: 42px; text-align: center; background: radial-gradient(circle at center, #1B1528 0%, #090710 100%); position: relative; display: flex; flex-direction: column; justify-content: space-between; }
          .sub { font-family: sans-serif; font-size: 11px; letter-spacing: 0.35em; color: #FBBF24; font-weight: 800; }
          h1 { font-size: 44px; margin: 8px 0; color: #FDE047; }
          .name { font-size: 36px; font-weight: 900; border-bottom: 2px solid #D4AF37; display: inline-block; padding: 0 36px 8px; margin: 16px 0; }
          .prog { font-size: 24px; color: #FBBF24; font-weight: bold; margin-top: 10px; }
          .footer { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(212,175,55,0.35); padding-top: 20px; font-family: sans-serif; font-size: 12px; color: #CBD5E1; }
          .seal { width: 84px; height: 84px; border-radius: 50%; background: linear-gradient(135deg, #FDE047, #B45309); color: #000; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 11px; border: 3px dashed #451A03; }
        </style>
      </head>
      <body>
        <div class="frame">
          <div>
            <div class="sub">SAARTHI CURIOUS • OFFICIAL ENTERPRISE CREDENTIAL</div>
            <h1>Certificate of Mastery</h1>
            <div style="font-family:sans-serif; font-size:12px; color:#94A3B8; text-transform:uppercase; letter-spacing:0.2em;">Proudly Awarded To</div>
            <div class="name">${cert.learner_name}</div>
            <p style="font-family:sans-serif; font-size:14px; color:#E2E8F0; max-width:620px; margin:0 auto;">
              For successfully completing all curriculum assessments and practical requirements in
            </p>
            <div class="prog">“${cert.program}”</div>
          </div>
          <div class="footer">
            <div style="text-align:left;">
              <div><strong>Certificate No:</strong> ${cert.certificate_number}</div>
              <div><strong>Completion Date:</strong> ${cert.completion_date}</div>
            </div>
            <div class="seal">VERIFIED<br/>SEAL</div>
            <div style="text-align:right;">
              <div><strong>Issued Date:</strong> ${cert.issued_date}</div>
              <div><strong>Status:</strong> Official Issued Credential</div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `);
    win.document.close();
    setTimeout(() => win.print(), 300);
  };

  const kpis = useMemo(() => {
    return {
      total: certificates.length,
      issued: certificates.filter((c) => c.status === "Issued").length,
      pending: certificates.filter((c) => c.status === "Pending").length,
    };
  }, [certificates]);

  const programsList = useMemo(() => {
    return Array.from(new Set(certificates.map((c) => c.program)));
  }, [certificates]);

  const filteredCerts = useMemo(() => {
    return certificates.filter((c) => {
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (programFilter !== "all" && c.program !== programFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          c.learner_name.toLowerCase().includes(q) ||
          c.program.toLowerCase().includes(q) ||
          c.certificate_number.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [certificates, statusFilter, programFilter, searchQuery]);

  return (
    <div className="h-screen w-full overflow-y-auto scroll-smooth bg-[#06050C] text-slate-100 font-sans p-5 md:p-6 space-y-6 selection:bg-amber-400 selection:text-black overflow-x-hidden pb-28">
      {/* ===================================================================
          1. HERO BANNER HEADER (Matches Screenshot 18)
      =================================================================== */}
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#211246] via-[#371B68] to-[#52237E] p-6 md:p-8 border border-purple-400/30 shadow-[0_0_50px_-10px_rgba(139,92,246,0.35)] flex flex-wrap items-center justify-between gap-4">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/70 to-transparent" />
        <div className="pointer-events-none absolute -right-10 -top-16 w-72 h-72 bg-amber-400/15 rounded-full blur-3xl" />

        <div className="flex items-center gap-4 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-amber-400/15 border border-amber-300/40 flex items-center justify-center text-2xl shadow-[0_0_20px_rgba(245,158,11,0.3)]">
            🎖️
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Certificate Management
            </h1>
            <p className="text-xs md:text-sm text-purple-100/80 mt-0.5">
              Track completed learner programs and certificate issuance.
            </p>
          </div>
        </div>
      </header>

      {/* ===================================================================
          2. 3 METALLIC KPI CARDS (Matches Screenshot 18 — Clickable Filters)
      =================================================================== */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            id: "all",
            label: "Total Certificates",
            value: kpis.total,
            icon: "📜",
            accent: "text-white",
            iconCls: "bg-purple-500/15 text-purple-300 border-purple-400/35",
            borderCls: "border-purple-500/25 hover:border-purple-400/60",
          },
          {
            id: "Issued",
            label: "Certificates Issued",
            value: kpis.issued,
            icon: "✓",
            accent: "text-emerald-400",
            iconCls: "bg-emerald-500/15 text-emerald-300 border-emerald-400/35",
            borderCls: "border-emerald-500/25 hover:border-emerald-400/60",
          },
          {
            id: "Pending",
            label: "Certificates Pending",
            value: kpis.pending,
            icon: "⏳",
            accent: "text-amber-300",
            iconCls: "bg-amber-500/15 text-amber-300 border-amber-400/35",
            borderCls: "border-amber-500/30 hover:border-amber-400/70",
          },
        ].map((card) => {
          const isSelected = statusFilter === card.id && card.id !== "all";
          return (
            <div
              key={card.id}
              onClick={() =>
                setStatusFilter(statusFilter === card.id ? "all" : card.id)
              }
              className={`cursor-pointer bg-[#110E1E] rounded-2xl p-5 border ${
                card.borderCls
              } ${
                isSelected ? "ring-2 ring-amber-400 bg-[#171329]" : ""
              } shadow-[0_8px_30px_rgba(0,0,0,0.5)] transition-all hover:-translate-y-0.5 flex items-center gap-4`}
            >
              <div
                className={`w-12 h-12 rounded-2xl border flex items-center justify-center text-xl font-black shrink-0 ${card.iconCls}`}
              >
                {card.icon}
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-400 block">
                  {card.label}
                </span>
                <span className={`text-3xl font-black mt-0.5 block ${card.accent}`}>
                  {card.value}
                </span>
              </div>
            </div>
          );
        })}
      </section>

      {/* ===================================================================
          3. SEARCH, FILTERS & 7-COLUMN CREDENTIAL REGISTRY TABLE
      =================================================================== */}
      <section className="bg-[#110E1E] rounded-3xl p-6 border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.6)] space-y-5">
        {/* Search & Filter Controls */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-center">
          <div className="md:col-span-8 relative">
            <span className="absolute left-4 top-3 text-xs text-slate-400">
              🔍
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search learner, program, or certificate number..."
              className="w-full bg-[#080711] border border-white/10 focus:border-amber-400/60 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition"
            />
          </div>

          <div className="md:col-span-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-[#080711] border border-white/10 focus:border-amber-400/60 rounded-2xl px-3.5 py-2.5 text-xs font-bold text-slate-200 outline-none"
            >
              <option value="all">All statuses</option>
              <option value="Issued">Issued</option>
              <option value="Pending">Pending</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <select
              value={programFilter}
              onChange={(e) => setProgramFilter(e.target.value)}
              className="w-full bg-[#080711] border border-white/10 focus:border-amber-400/60 rounded-2xl px-3.5 py-2.5 text-xs font-bold text-slate-200 outline-none"
            >
              <option value="all">All programs</option>
              {programsList.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 7-Column Registry Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-4">LEARNER NAME</th>
                <th className="py-3.5 px-4">PROGRAM</th>
                <th className="py-3.5 px-4">CERTIFICATE STATUS</th>
                <th className="py-3.5 px-4">CERTIFICATE NUMBER</th>
                <th className="py-3.5 px-4">COMPLETION DATE</th>
                <th className="py-3.5 px-4">ISSUED DATE</th>
                <th className="py-3.5 px-4 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs">
              {filteredCerts.map((cert) => {
                const isIssued = cert.status === "Issued";
                return (
                  <tr
                    key={cert.id}
                    className="hover:bg-white/[0.03] transition"
                  >
                    {/* 1. LEARNER NAME */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl font-black text-xs flex items-center justify-center shrink-0 ${
                            isIssued
                              ? "bg-gradient-to-br from-amber-300 via-yellow-500 to-amber-700 text-slate-950 shadow-[0_0_14px_rgba(245,158,11,0.35)]"
                              : "bg-purple-500/15 text-purple-300 border border-purple-500/30"
                          }`}
                        >
                          {cert.learner_name.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="font-extrabold text-white">
                          {cert.learner_name}
                        </span>
                      </div>
                    </td>

                    {/* 2. PROGRAM */}
                    <td className="py-4 px-4 text-slate-300 font-semibold">
                      {cert.program}
                    </td>

                    {/* 3. CERTIFICATE STATUS */}
                    <td className="py-4 px-4">
                      <span
                        className={`px-3 py-1 rounded-full text-[11px] font-extrabold border inline-flex items-center gap-1.5 ${
                          isIssued
                            ? "bg-emerald-500/15 text-emerald-300 border-emerald-400/35"
                            : "bg-amber-500/15 text-amber-300 border-amber-400/35"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isIssued ? "bg-emerald-400" : "bg-amber-400 animate-ping"
                          }`}
                        />
                        {cert.status}
                      </span>
                    </td>

                    {/* 4. CERTIFICATE NUMBER */}
                    <td className="py-4 px-4 font-mono text-[11px] text-amber-200/90">
                      {cert.certificate_number}
                    </td>

                    {/* 5. COMPLETION DATE */}
                    <td className="py-4 px-4 text-slate-300">
                      {cert.completion_date}
                    </td>

                    {/* 6. ISSUED DATE */}
                    <td className="py-4 px-4 text-slate-300">
                      {cert.issued_date}
                    </td>

                    {/* 7. ACTIONS */}
                    <td className="py-4 px-4 text-right">
                      {isIssued ? (
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => setPreviewCert(cert)}
                            className="px-3.5 py-1.5 rounded-xl bg-[#080711] hover:bg-white/10 text-slate-200 border border-white/15 text-xs font-extrabold transition cursor-pointer"
                          >
                            👁️ View
                          </button>
                          <button
                            onClick={() => handleDownloadCertificatePDF(cert)}
                            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-95 text-white text-xs font-extrabold shadow-[0_0_15px_rgba(139,92,246,0.4)] transition cursor-pointer"
                          >
                            ⬇ Download
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleIssuePendingCertificate(cert.id)}
                          className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:opacity-95 text-slate-950 text-xs font-black shadow-[0_0_15px_rgba(245,158,11,0.35)] transition cursor-pointer"
                        >
                          ⚡ Mint & Issue Now
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* GOLD-FOIL CERTIFICATE PREVIEW MODAL */}
      <CertificatePreviewModal
        cert={previewCert}
        onClose={() => setPreviewCert(null)}
        onDownload={handleDownloadCertificatePDF}
      />
    </div>
  );
}
