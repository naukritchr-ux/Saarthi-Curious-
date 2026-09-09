import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
	Award,
	CheckCircle2,
	Download,
	Eye,
	FileBadge,
	Loader2,
	Search,
	Users,
	XCircle,
} from "lucide-react";
import MainLayout from "../../layout/mainLayout";
import api from "../../utils/axios";

const LEARNER_ROLE_IDS = [3, 4, 5, 6, 7];

const formatDate = (value) => {
	if (!value) return "-";

	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return "-";

	return date.toLocaleDateString("en-GB", {
		day: "2-digit",
		month: "short",
		year: "numeric",
	});
};

const getErrorMessage = (error) =>
	error.response?.data?.detail ||
	"We could not load certificate records. Please try again.";

/*
 * The backend currently has no admin-wide certificate listing endpoint.
 * This uses the existing admin users, learner progress, certificates, and
 * programs endpoints until that aggregate endpoint exists.
 */
const fetchCertificateRecords = async () => {
	const [usersResponse, programsResponse] = await Promise.all([
		api.get("/users"),
		api.get("/programs"),
	]);

	const users = (usersResponse.data || []).filter((user) =>
		LEARNER_ROLE_IDS.includes(Number(user.role_id)),
	);
	const programs = programsResponse.data || [];
	const programNames = new Map(
		programs.map((program) => [String(program.id), program.name]),
	);

	const learnerRecords = await Promise.all(
		users.map(async (user) => {
			const [progressResponse, certificatesResponse] = await Promise.all([
				api.get(`/learner/progress/${user.user_id}`),
				api.get(`/certificates/user/${user.user_id}`),
			]);

			const progress = progressResponse.data || [];
			const certificates = certificatesResponse.data?.certificates || [];
			const rows = [];

			certificates.forEach((certificate) => {
				rows.push({
					id: `issued-${certificate.id}`,
					certificateId: certificate.id,
					learnerName: certificate.recipient_name || user.full_name,
					programName: certificate.program_name || "Unknown program",
					status: "Issued",
					certificateNumber: certificate.certificate_number,
					completionDate: certificate.completion_date,
					issuedDate: certificate.issued_at,
				});
			});

			progress
				.filter((item) => item.status === "Completed" || item.completed)
				.forEach((item) => {
					const hasCertificate = certificates.some(
						(certificate) =>
							String(certificate.program_id) === String(item.program_id),
					);

					if (!hasCertificate) {
						rows.push({
							id: `pending-${user.user_id}-${item.program_id}`,
							learnerName: user.full_name || "Unknown learner",
							programName:
								programNames.get(String(item.program_id)) ||
								`Program ${item.program_id}`,
							status: "Pending",
							certificateNumber: null,
							completionDate: item.completed_at,
							issuedDate: null,
						});
					}
				});

			return rows;
		}),
	);

	return learnerRecords.flat();
};

const CertificateManagement = () => {
	const navigate = useNavigate();
	const [records, setRecords] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [search, setSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState("All");
	const [programFilter, setProgramFilter] = useState("All");
	const [downloadingId, setDownloadingId] = useState(null);

	const loadRecords = async () => {
		try {
			setLoading(true);
			setError("");
			setRecords(await fetchCertificateRecords());
		} catch (loadError) {
			console.error("Failed to load certificate records:", loadError);
			setError(getErrorMessage(loadError));
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadRecords();
	}, []);

	const programs = useMemo(
		() =>
			[...new Set(records.map((record) => record.programName).filter(Boolean))].sort(),
		[records],
	);

	const filteredRecords = useMemo(() => {
		const query = search.trim().toLowerCase();

		return records.filter((record) => {
			const matchesSearch = [
				record.learnerName,
				record.programName,
				record.certificateNumber,
			].some((value) => value?.toLowerCase().includes(query));
			const matchesStatus =
				statusFilter === "All" || record.status === statusFilter;
			const matchesProgram =
				programFilter === "All" || record.programName === programFilter;

			return matchesSearch && matchesStatus && matchesProgram;
		});
	}, [programFilter, records, search, statusFilter]);

	const issuedCount = records.filter((record) => record.status === "Issued").length;
	const pendingCount = records.filter((record) => record.status === "Pending").length;

	const handleDownload = async (record) => {
		setDownloadingId(record.certificateId);

		try {
			const response = await api.get(`/certificates/${record.certificateId}/download`);
			const downloadUrl = response.data?.download_url;

			if (!downloadUrl) throw new Error("Certificate download URL is unavailable.");

			const pdfResponse = await fetch(downloadUrl);
			if (!pdfResponse.ok) throw new Error("Certificate PDF could not be downloaded.");

			const blobUrl = URL.createObjectURL(await pdfResponse.blob());
			const link = document.createElement("a");
			link.href = blobUrl;
			link.download = `certificate-${record.certificateNumber || record.certificateId}.pdf`;
			document.body.appendChild(link);
			link.click();
			link.remove();
			URL.revokeObjectURL(blobUrl);
		} catch (downloadError) {
			console.error("Failed to download certificate:", downloadError);
			setError("Unable to download this certificate. Please try again.");
		} finally {
			setDownloadingId(null);
		}
	};

	if (loading) {
		return (
			<MainLayout>
				<div className="flex min-h-[60vh] items-center justify-center">
					<div className="text-center">
						<Loader2 className="mx-auto h-10 w-10 animate-spin text-[#693C83]" />
						<p className="mt-4 text-sm font-medium text-[#4F4679]">
							Loading certificate records...
						</p>
					</div>
				</div>
			</MainLayout>
		);
	}

	if (error && records.length === 0) {
		return (
			<MainLayout>
				<div className="mx-auto mt-12 max-w-md rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
					<XCircle className="mx-auto h-12 w-12 text-red-500" />
					<h2 className="mt-4 text-xl font-bold text-[#1E1B4B]">
						Unable to load certificates
					</h2>
					<p className="mt-2 text-sm text-[#4F4679]">{error}</p>
					<button
						type="button"
						onClick={loadRecords}
						className="mt-6 rounded-xl bg-[#693C83] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#57306e]"
					>
						Retry
					</button>
				</div>
			</MainLayout>
		);
	}

	return (
		<MainLayout>
			<div className="space-y-6">
				<header className="rounded-3xl bg-gradient-to-r from-[#1E1B4B] via-[#3F2B6D] to-[#693C83] p-6 text-white shadow-sm sm:p-8">
					<div className="flex items-start gap-4">
						<div className="rounded-2xl bg-white/10 p-3">
							<Award size={28} />
						</div>
						<div>
							<h1 className="text-3xl font-bold sm:text-4xl">Certificate Management</h1>
							<p className="mt-2 max-w-2xl text-sm text-white/75">
								Track completed learner programs and certificate issuance.
							</p>
						</div>
					</div>
				</header>

				{error && (
					<div className="flex items-center justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
						<span>{error}</span>
						<button type="button" onClick={() => setError("")} aria-label="Dismiss error">
							<XCircle size={18} />
						</button>
					</div>
				)}

				<div className="grid gap-4 sm:grid-cols-3">
					<SummaryCard icon={<FileBadge size={22} />} title="Total Certificates" value={records.length} tone="purple" />
					<SummaryCard icon={<CheckCircle2 size={22} />} title="Certificates Issued" value={issuedCount} tone="green" />
					<SummaryCard icon={<Users size={22} />} title="Certificates Pending" value={pendingCount} tone="amber" />
				</div>

				<section className="overflow-hidden rounded-2xl border border-[#D9CFE8] bg-white shadow-sm">
					<div className="border-b border-[#E6DDF3] p-4 sm:p-5">
						<div className="flex flex-col gap-3 lg:flex-row lg:items-center">
							<div className="relative min-w-0 flex-1">
								<Search className="absolute left-3 top-3 text-[#8A7AA2]" size={18} />
								<input
									value={search}
									onChange={(event) => setSearch(event.target.value)}
									placeholder="Search learner, program, or certificate number"
									className="w-full rounded-xl border border-[#D9CFE8] py-2.5 pl-10 pr-4 text-sm text-[#1E1B4B] outline-none transition focus:border-[#693C83] focus:ring-2 focus:ring-[#693C83]/10"
								/>
							</div>
							<select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-xl border border-[#D9CFE8] px-3 py-2.5 text-sm text-[#1E1B4B] outline-none focus:border-[#693C83]">
								<option value="All">All statuses</option>
								<option value="Issued">Issued</option>
								<option value="Pending">Pending</option>
							</select>
							<select value={programFilter} onChange={(event) => setProgramFilter(event.target.value)} className="rounded-xl border border-[#D9CFE8] px-3 py-2.5 text-sm text-[#1E1B4B] outline-none focus:border-[#693C83]">
								<option value="All">All programs</option>
								{programs.map((program) => <option key={program} value={program}>{program}</option>)}
							</select>
						</div>
					</div>

					{records.length === 0 ? (
						<EmptyState title="No certificates yet" message="Completed learner programs will appear here when certificate records are available." />
					) : filteredRecords.length === 0 ? (
						<EmptyState title="No matching certificates" message="Try changing the search term or filters." />
					) : (
						<div className="overflow-x-auto">
							<table className="min-w-[920px] w-full text-left text-sm">
								<thead className="bg-[#F7F3FB] text-xs uppercase tracking-wide text-[#4F4679]">
									<tr>
										{[
											"Learner Name",
											"Program",
											"Certificate Status",
											"Certificate Number",
											"Completion Date",
											"Issued Date",
											"Actions",
										].map((heading) => <th key={heading} className="px-5 py-4 font-semibold">{heading}</th>)}
									</tr>
								</thead>
								<tbody className="divide-y divide-[#EEE8F5]">
									{filteredRecords.map((record) => (
										<tr key={record.id} className="text-[#1E1B4B] transition hover:bg-[#FCFAFE]">
											<td className="px-5 py-4 font-semibold">{record.learnerName}</td>
											<td className="px-5 py-4 text-[#4F4679]">{record.programName}</td>
											<td className="px-5 py-4"><StatusBadge status={record.status} /></td>
											<td className="px-5 py-4 font-mono text-xs text-[#4F4679]">{record.certificateNumber || "-"}</td>
											<td className="px-5 py-4 text-[#4F4679]">{formatDate(record.completionDate)}</td>
											<td className="px-5 py-4 text-[#4F4679]">{formatDate(record.issuedDate)}</td>
											<td className="px-5 py-4">
												{record.status === "Issued" ? (
													<div className="flex items-center gap-2">
														<button type="button" onClick={() => navigate(`/learner/certificate/${record.certificateId}`)} className="inline-flex items-center gap-1.5 rounded-lg border border-[#D9CFE8] px-2.5 py-2 text-xs font-semibold text-[#693C83] transition hover:bg-[#F1ECF7]" title="View certificate"><Eye size={15} /> View</button>
														<button type="button" onClick={() => handleDownload(record)} disabled={downloadingId === record.certificateId} className="inline-flex items-center gap-1.5 rounded-lg bg-[#693C83] px-2.5 py-2 text-xs font-semibold text-white transition hover:bg-[#57306e] disabled:cursor-not-allowed disabled:opacity-60" title="Download certificate PDF"><Download size={15} /> {downloadingId === record.certificateId ? "..." : "Download"}</button>
													</div>
												) : <span className="text-[#8A7AA2]">-</span>}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</section>
			</div>
		</MainLayout>
	);
};

const SummaryCard = ({ icon, title, value, tone }) => {
	const tones = {
		purple: "bg-[#F1ECF7] text-[#693C83]",
		green: "bg-emerald-50 text-emerald-600",
		amber: "bg-amber-50 text-amber-600",
	};

	return <div className="rounded-2xl border border-[#D9CFE8] bg-white p-5 shadow-sm"><div className="flex items-center gap-4"><div className={`rounded-xl p-3 ${tones[tone]}`}>{icon}</div><div><p className="text-sm text-[#4F4679]">{title}</p><p className="mt-1 text-3xl font-bold text-[#1E1B4B]">{value}</p></div></div></div>;
};

const StatusBadge = ({ status }) => <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${status === "Issued" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{status}</span>;

const EmptyState = ({ title, message }) => <div className="px-6 py-16 text-center"><Award className="mx-auto h-12 w-12 text-[#B9A8CB]" /><h2 className="mt-4 text-lg font-bold text-[#1E1B4B]">{title}</h2><p className="mx-auto mt-2 max-w-md text-sm text-[#4F4679]">{message}</p></div>;

export default CertificateManagement;
