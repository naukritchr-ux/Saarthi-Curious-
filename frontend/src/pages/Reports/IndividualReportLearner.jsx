import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    ArrowLeft, Mail, MapPin, Calendar as CalendarIcon, Coins, Flame,
    Award, BookOpen, ClipboardCheck, Trophy, Clock, Loader2,
} from "lucide-react";
import MainLayout from "../../layout/mainLayout";
import { getLearnerReport } from "../../services/reportsService";

const fmtDate = (iso) => {
    if (!iso) return "—";
    try {
        return new Date(iso).toLocaleDateString("en-IN", {
            day: "numeric", month: "short", year: "numeric",
        });
    } catch {
        return iso;
    }
};

const fmtDateTime = (iso) => {
    if (!iso) return "—";
    try {
        return new Date(iso).toLocaleString("en-IN", {
            day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
        });
    } catch {
        return iso;
    }
};

export default function IndividualLearnerReport() {
    const { userId } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError("");
        getLearnerReport(userId)
            .then((result) => {
                if (!cancelled) setData(result);
            })
            .catch((err) => {
                if (!cancelled) setError(err.message || "Failed to load learner report");
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [userId]);

    if (loading) {
        return (
            <MainLayout>
                <div className="flex items-center justify-center h-[70vh]">
                    <Loader2 className="animate-spin text-[#693C83]" size={36} />
                </div>
            </MainLayout>
        );
    }

    if (error || !data) {
        return (
            <MainLayout>
                <div className="p-8 max-w-3xl mx-auto">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-[#693C83] mb-6 hover:underline"
                    >
                        <ArrowLeft size={18} /> Back
                    </button>
                    <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700">
                        {error || "Learner not found"}
                    </div>
                </div>
            </MainLayout>
        );
    }

    const { profile, summary, programs, quizzes, streak, badges, certificates, recent_activity } = data;

    return (
        <MainLayout>
            <div className="p-8 max-w-7xl mx-auto">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-[#693C83] mb-6 hover:underline"
                >
                    <ArrowLeft size={18} /> Back
                </button>

                <div className="bg-white rounded-2xl shadow-sm border border-[#D9CFE8] p-6 mb-6">
                    <div className="flex items-start gap-6">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#693C83] to-[#8B5CF6] flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-2xl font-bold">
                                {profile.full_name?.charAt(0) || "?"}
                            </span>
                        </div>
                        <div className="flex-1">
                            <h1 className="text-2xl font-bold text-[#1E1B4B] mb-1">{profile.full_name}</h1>
                            <p className="text-[#693C83] font-medium mb-3">{profile.role_name}</p>
                            <div className="flex flex-wrap gap-4 text-sm text-[#4F4679]">
                                <span className="flex items-center gap-2"><Mail size={14} /> {profile.email}</span>
                                {profile.city && (
                                    <span className="flex items-center gap-2"><MapPin size={14} /> {profile.city}</span>
                                )}
                                <span className="flex items-center gap-2">
                                    <CalendarIcon size={14} /> Joined {fmtDate(profile.date_of_joining)}
                                </span>
                                <span className="flex items-center gap-2">
                                    <Clock size={14} /> Last login {fmtDateTime(profile.last_login)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
                    <Tile icon={BookOpen} color="#3B82F6" label="Programs"
                        value={`${summary.programs_completed}/${summary.total_programs_enrolled}`}
                        sub="completed / enrolled" />
                    <Tile icon={ClipboardCheck} color="#10B981" label="Avg quiz score"
                        value={`${summary.avg_quiz_score}%`} sub={`${summary.total_quizzes_taken} attempts`} />
                    <Tile icon={Flame} color="#F59E0B" label="Current streak"
                        value={`${summary.current_streak}d`} sub={`Longest: ${streak.longest_streak}d`} />
                    <Tile icon={Coins} color="#8B5CF6" label="Curos"
                        value={summary.total_curos.toLocaleString()} sub="in wallet" />
                    <Tile icon={Award} color="#EC4899" label="Badges"
                        value={summary.total_badges} sub="earned" />
                    <Tile icon={Trophy} color="#F97316" label="Certificates"
                        value={summary.total_certificates} sub="issued" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    <Card title="Programs" icon={BookOpen}>
                        {programs.length === 0 ? (
                            <Empty text="No programs enrolled yet" />
                        ) : (
                            <div className="space-y-3">
                                {programs.map((p) => (
                                    <div key={p.program_id} className="p-3 rounded-lg bg-[#F8F5FC] border border-[#EDE5F7]">
                                        <div className="flex items-center justify-between mb-2">
                                            <p className="font-medium text-[#1E1B4B] text-sm">{p.program_name}</p>
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.completed ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"
                                                }`}>
                                                {p.status}
                                            </span>
                                        </div>
                                        <div className="w-full h-2 bg-[#EDE5F7] rounded-full overflow-hidden">
                                            <div className="h-full rounded-full bg-gradient-to-r from-[#693C83] to-[#8B5CF6]"
                                                style={{ width: `${p.completed_percentage}%` }} />
                                        </div>
                                        <div className="flex justify-between text-xs text-[#4F4679] mt-1">
                                            <span>{p.completed_percentage}% complete</span>
                                            {p.completed_at && <span>Finished {fmtDate(p.completed_at)}</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>

                    <Card title="Quiz performance" icon={ClipboardCheck}>
                        {quizzes.length === 0 ? (
                            <Empty text="No quiz attempts yet" />
                        ) : (
                            <div className="space-y-2 max-h-[400px] overflow-y-auto">
                                {quizzes.map((q, i) => (
                                    <div key={`${q.quiz_id}-${i}`}
                                        className="flex items-center justify-between p-3 rounded-lg bg-[#F8F5FC] border border-[#EDE5F7]">
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-[#1E1B4B] text-sm truncate">{q.quiz_name}</p>
                                            <p className="text-xs text-[#4F4679]">
                                                Attempt #{q.attempt_number} · {fmtDate(q.attempted_at)}
                                            </p>
                                        </div>
                                        <span className={`ml-3 text-lg font-bold ${q.passed ? "text-emerald-600" : "text-rose-500"
                                            }`}>{q.score}%</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    <Card title="Badges" icon={Award}>
                        {badges.length === 0 ? (
                            <Empty text="No badges earned yet" />
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {badges.map((b) => (
                                    <div key={b.badge_id}
                                        className="px-3 py-2 rounded-lg bg-gradient-to-br from-[#FEF3C7] to-[#FDE68A] border border-[#F59E0B]/30">
                                        <p className="text-xs font-semibold text-[#92400E]">{b.badge_name}</p>
                                        <p className="text-[10px] text-[#B45309]">{b.tier} · {fmtDate(b.earned_at)}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>

                    <Card title="Certificates" icon={Trophy}>
                        {certificates.length === 0 ? (
                            <Empty text="No certificates issued yet" />
                        ) : (
                            <div className="space-y-2">
                                {certificates.map((c) => (
                                    <div key={c.certificate_id} className="p-3 rounded-lg bg-[#F8F5FC] border border-[#EDE5F7]">
                                        <p className="font-medium text-[#1E1B4B] text-sm">{c.program_name}</p>
                                        <p className="text-xs text-[#4F4679]">
                                            #{c.certificate_number} · {fmtDate(c.completion_date)}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                </div>

                <Card title="Recent activity" icon={Clock}>
                    {recent_activity.length === 0 ? (
                        <Empty text="No activity recorded" />
                    ) : (
                        <div className="space-y-2 max-h-[400px] overflow-y-auto">
                            {recent_activity.map((a, i) => (
                                <div key={i} className="flex items-start gap-3 p-2 rounded-lg hover:bg-[#F8F5FC]">
                                    <span className="w-2 h-2 rounded-full bg-[#8B5CF6] mt-2 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-[#1E1B4B]">{a.message || a.action}</p>
                                        <p className="text-xs text-[#4F4679]">{fmtDateTime(a.created_at)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            </div>
        </MainLayout>
    );
}

function Tile({ icon: Icon, color, label, value, sub }) {
    return (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-[#D9CFE8]">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3" style={{ background: `${color}20` }}>
                <Icon size={18} style={{ color }} />
            </div>
            <p className="text-xs text-[#4F4679] mb-1">{label}</p>
            <p className="text-2xl font-bold text-[#1E1B4B]">{value}</p>
            <p className="text-[10px] text-[#9D8FB8] mt-0.5">{sub}</p>
        </div>
    );
}

function Card({ title, icon: Icon, children }) {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-[#D9CFE8] p-5">
            <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-[#693C83]/10 flex items-center justify-center">
                    <Icon size={16} className="text-[#693C83]" />
                </div>
                <h3 className="font-semibold text-[#1E1B4B]">{title}</h3>
            </div>
            {children}
        </div>
    );
}

function Empty({ text }) {
    return <p className="text-sm text-[#9D8FB8] py-4 text-center">{text}</p>;
}