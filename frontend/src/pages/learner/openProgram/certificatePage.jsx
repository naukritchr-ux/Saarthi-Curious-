import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import MainLayout from "../../../layout/mainLayout";
import api from "../../../utils/axios";
import {
    Award,
    ArrowLeft,
    CalendarDays,
    CheckCircle2,
    Download,
    Eye,
    FileBadge,
    Hash,
    UserRound,
} from "lucide-react";

const CertificatePage = () => {
    const navigate = useNavigate();
    const { certificateId } = useParams();

    const [certificates, setCertificates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (certificateId) {
            openCertificate(certificateId);
            return;
        }

        fetchCertificates();
    }, [certificateId]);

    const openCertificate = async (certificateIdToOpen) => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get(
                `/certificates/${certificateIdToOpen}/download`
            );
            const downloadUrl = response.data?.download_url;

            if (!downloadUrl) {
                throw new Error("Certificate URL not available.");
            }

            window.location.assign(downloadUrl);
        } catch (error) {
            console.error("View certificate error:", error);
            setError("Unable to open certificate.");
            setLoading(false);
        }
    };

    const fetchCertificates = async () => {
        try {
            setLoading(true);
            setError("");

            const user = JSON.parse(localStorage.getItem("user"));

            if (!user || !user.user_id) {
                setError("User information not found.");
                return;
            }

            const response = await fetch(
                `http://localhost:8000/certificates/user/${user.user_id}`
            );

            if (!response.ok) {
                throw new Error("Failed to load certificates");
            }

            const data = await response.json();

            setCertificates(data.certificates || []);
        } catch (error) {
            console.error("Error loading certificates:", error);
            setError("Unable to load certificates.");
        } finally {
            setLoading(false);
        }
    };

    // ---------------------------------------------------------
    // DOWNLOAD CERTIFICATE
    // ---------------------------------------------------------

    const handleDownload = async (certificateId, certificateNumber) => {
        try {
            const response = await fetch(
                `http://localhost:8000/certificates/${certificateId}/download`
            );

            if (!response.ok) {
                throw new Error("Failed to get download URL");
            }

            const data = await response.json();

            if (data.download_url) {
                const pdfResponse = await fetch(data.download_url);

                if (!pdfResponse.ok) {
                    throw new Error("Failed to download certificate PDF");
                }

                const pdfBlob = await pdfResponse.blob();
                const blobUrl = window.URL.createObjectURL(pdfBlob);
                const link = document.createElement("a");

                link.href = blobUrl;
                link.download = `certificate-${certificateNumber}.pdf`;
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.URL.revokeObjectURL(blobUrl);
            } else {
                alert("Download URL not available.");
            }
        } catch (error) {
            console.error("Download error:", error);
            alert("Unable to download certificate.");
        }
    };

    // ---------------------------------------------------------
    // VIEW CERTIFICATE
    // ---------------------------------------------------------

    const handleView = async (certificateId) => {
        navigate(`/learner/certificate/${certificateId}`);
    };

    // ---------------------------------------------------------
    // DATE FORMAT
    // ---------------------------------------------------------

    const formatDate = (date) => {
        if (!date) {
            return "N/A";
        }

        return new Date(date).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "long",
            year: "numeric",
        });
    };

    // ---------------------------------------------------------
    // LOADING
    // ---------------------------------------------------------

    if (loading) {
        return (
            <MainLayout>
                <div className="min-h-full bg-[#F1ECF7] px-4 py-5 sm:px-6">
                    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#E8DDF1] text-[#693C83]">
                            <Award size={30} strokeWidth={1.8} />
                        </div>
                        <div
                            className="mt-5 h-8 w-8 animate-spin rounded-full border-4 border-[#D9CFE8] border-t-[#693C83]"
                            role="status"
                            aria-label="Loading certificates"
                        />
                        <p className="mt-4 text-sm font-medium text-[#4F4679]">
                            Loading your certificates...
                        </p>
                    </div>
                </div>
            </MainLayout>
        );
    }

    // ---------------------------------------------------------
    // PAGE
    // ---------------------------------------------------------

    return (
        <MainLayout>
            <div className="min-h-full bg-[#F1ECF7] px-4 py-5 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-7xl">
                <header className="mb-8 rounded-3xl bg-gradient-to-r from-[#693C83] via-[#5B3F92] to-[#3B82F6] p-6 text-white shadow-lg shadow-[#693C83]/15 sm:p-8">
                    <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-start gap-4">
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-white ring-1 ring-white/25">
                                <FileBadge size={29} strokeWidth={1.8} />
                            </div>
                            <div>
                                <p className="mb-2 text-xs font-bold tracking-[0.24em] text-white/75">
                                    CERTIFICATES
                                </p>
                                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                                    My Certificates
                                </h1>
                                <p className="mt-2 max-w-xl text-sm text-white/80 sm:text-base">
                                    View and download your completed program certificates.
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/60 sm:self-center"
                            onClick={() => navigate(-1)}
                        >
                            <ArrowLeft size={17} />
                            Back
                        </button>
                    </div>
                </header>

                {error && (
                    <div className="mb-6 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm font-medium text-red-700 shadow-sm" role="alert">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100">
                            !
                        </span>
                        {error}
                    </div>
                )}

                {!error && certificates.length === 0 && (
                    <div className="rounded-3xl border border-[#E3D9EC] bg-white px-6 py-16 text-center shadow-lg shadow-[#693C83]/8">
                        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#F1ECF7] text-[#693C83]">
                            <Award size={38} strokeWidth={1.7} />
                        </div>
                        <h2 className="mt-6 text-2xl font-bold text-[#1E1B4B]">
                            No certificates yet
                        </h2>
                        <p className="mx-auto mt-2 max-w-md text-[#6B6685]">
                            Complete a program to earn your certificate.
                        </p>
                        <button
                            type="button"
                            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#693C83] px-5 py-3 text-sm font-semibold text-white shadow-md shadow-[#693C83]/20 transition hover:-translate-y-0.5 hover:bg-[#5B3470] focus:outline-none focus:ring-2 focus:ring-[#693C83]/40"
                            onClick={() => navigate(-1)}
                        >
                            <ArrowLeft size={17} />
                            Back to Dashboard
                        </button>
                    </div>
                )}

                {!error && certificates.length > 0 && (
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                        {certificates.map((certificate) => (
                            <article
                                className="group flex h-full flex-col rounded-3xl border border-[#E3D9EC] bg-white p-6 shadow-md shadow-[#693C83]/8 transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-[#693C83]/15"
                                key={certificate.id}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F1ECF7] text-[#693C83] transition group-hover:bg-[#E8DDF1]">
                                        <Award size={25} strokeWidth={1.8} />
                                    </div>
                                    <span className="inline-flex items-center gap-1 rounded-full bg-[#E8F8F1] px-3 py-1.5 text-xs font-bold text-[#109B68]">
                                        <CheckCircle2 size={14} />
                                        Completed
                                    </span>
                                </div>

                                <h2 className="mt-5 min-h-[3.5rem] text-xl font-bold leading-snug text-[#1E1B4B]">
                                    {certificate.program_name}
                                </h2>

                                <div className="my-5 h-px bg-[#EEEAF3]" />

                                <dl className="grid grid-cols-1 gap-4 text-sm">
                                    <div className="flex items-start gap-3">
                                        <UserRound className="mt-0.5 shrink-0 text-[#8A7AA2]" size={17} />
                                        <div className="min-w-0">
                                            <dt className="text-xs font-semibold uppercase tracking-wide text-[#8A7AA2]">
                                                Recipient
                                            </dt>
                                            <dd className="mt-1 break-words font-semibold text-[#302852]">
                                                {certificate.recipient_name}
                                            </dd>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <Hash className="mt-0.5 shrink-0 text-[#8A7AA2]" size={17} />
                                        <div className="min-w-0">
                                            <dt className="text-xs font-semibold uppercase tracking-wide text-[#8A7AA2]">
                                                Certificate Number
                                            </dt>
                                            <dd className="mt-1 break-all font-semibold text-[#302852]">
                                                {certificate.certificate_number}
                                            </dd>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="flex items-start gap-2">
                                            <CalendarDays className="mt-0.5 shrink-0 text-[#8A7AA2]" size={16} />
                                            <div>
                                                <dt className="text-xs font-semibold uppercase tracking-wide text-[#8A7AA2]">
                                                    Completed
                                                </dt>
                                                <dd className="mt-1 font-semibold text-[#302852]">
                                                    {formatDate(certificate.completion_date)}
                                                </dd>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <CalendarDays className="mt-0.5 shrink-0 text-[#8A7AA2]" size={16} />
                                            <div>
                                                <dt className="text-xs font-semibold uppercase tracking-wide text-[#8A7AA2]">
                                                    Issued
                                                </dt>
                                                <dd className="mt-1 font-semibold text-[#302852]">
                                                    {formatDate(certificate.issued_at)}
                                                </dd>
                                            </div>
                                        </div>
                                    </div>
                                </dl>

                                <div className="mt-auto flex gap-3 pt-7">
                                    <button
                                        type="button"
                                        className="inline-flex min-w-0 flex-1 items-center justify-center gap-2 rounded-xl bg-[#693C83] px-3 py-3 text-sm font-semibold text-white shadow-md shadow-[#693C83]/20 transition hover:bg-[#5B3470] focus:outline-none focus:ring-2 focus:ring-[#693C83]/40"
                                        onClick={() => handleView(certificate.id)}
                                    >
                                        <Eye size={17} />
                                        <span className="truncate">View Certificate</span>
                                    </button>
                                    <button
                                        type="button"
                                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#693C83] px-3 py-3 text-sm font-semibold text-[#693C83] transition hover:bg-[#F1ECF7] focus:outline-none focus:ring-2 focus:ring-[#693C83]/30"
                                        onClick={() =>
                                            handleDownload(
                                                certificate.id,
                                                certificate.certificate_number
                                            )
                                        }
                                    >
                                        <Download size={17} />
                                        <span className="hidden sm:inline">Download</span>
                                    </button>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
                </div>
            </div>
        </MainLayout>
    );
};

export default CertificatePage;